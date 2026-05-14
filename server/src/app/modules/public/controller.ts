import type { Request, Response } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  pollsTable,
  questionsTable,
  optionsTable,
  responsesTable,
  answersTable,
} from "../../../db/schema.js";
import { SubmitResponseSchema } from "./models.js";
import { emitResponseNew } from "../socket/index.js";

function getEffectiveStatus(poll: {
  status?: string;
  isPublished: boolean;
  scheduledAt?: Date | null;
  expiresAt?: Date | null;
  endedAt?: Date | null;
}) {
  const now = new Date();
  if (poll.endedAt || poll.status === "ended") return "ended";
  if (poll.expiresAt && poll.expiresAt < now) return "ended";
  if (poll.scheduledAt && poll.scheduledAt > now) return "scheduled";
  if (poll.status === "scheduled" && poll.scheduledAt && poll.scheduledAt <= now) return "live";
  if (poll.status === "live" || poll.isPublished) return "live";
  return "draft";
}

function voterKeyFor(req: Request, sessionId?: string) {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const ua = req.get("user-agent") || "unknown-agent";
  return sessionId ? `session:${sessionId}` : `ip:${ip}:${ua.slice(0, 80)}`;
}

// Get access to Poll with the shared ID
export async function getPublicPoll(req: Request, res: Response) {
  const shareId = req.params.shareId as string | undefined;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.shareId, shareId));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const status = getEffectiveStatus(poll);
  if (status !== "live") {
    return res.status(status === "scheduled" ? 425 : 410).json({
      message: status === "scheduled" ? "This poll is scheduled and not live yet" : "This poll is not accepting responses",
      status,
      scheduledAt: poll.scheduledAt,
      endedAt: poll.endedAt,
    });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id))
    .orderBy(questionsTable.order);

  const questionIds = questions.map((q) => q.id);

  const allOptions = questionIds.length
    ? await db
        .select()
        .from(optionsTable)
        .where(inArray(optionsTable.questionId, questionIds))
        .orderBy(optionsTable.order)
    : [];

  return res.status(200).json({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    shareId: poll.shareId,
    status,
    expiresAt: poll.expiresAt,
    scheduledAt: poll.scheduledAt,
    voteLimitPerSession: poll.voteLimitPerSession,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      isRequired: q.isRequired,
      options: allOptions
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, text: o.text, order: o.order })),
      timeLimit: q.timeLimit,
    })),
  });
}

// Submit a response to a poll using the shared ID
export async function submitResponse(req: Request, res: Response) {
  const shareId = req.params.shareId as string | undefined;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const parsed = SubmitResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.shareId, shareId));

  if (!poll)
    return res.status(404).json({ message: "Poll not found" });

  const status = getEffectiveStatus(poll);
  if (status !== "live") {
    return res.status(status === "scheduled" ? 425 : 410).json({
      message: status === "scheduled" ? "This poll is scheduled and not live yet" : "This poll is not accepting responses",
      status,
    });
  }

  const voterKey = voterKeyFor(req, parsed.data.voterSessionId);
  const existingResponses = await db
    .select({ id: responsesTable.id })
    .from(responsesTable)
    .where(and(eq(responsesTable.pollId, poll.id), eq(responsesTable.voterKey, voterKey)));
  if (existingResponses.length >= poll.voteLimitPerSession) {
    return res.status(429).json({
      message: `Vote limit reached for this device/session (${poll.voteLimitPerSession})`,
    });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id));

  const validQuestionIds = new Set(questions.map((q) => q.id));

  // Reject questionIds not belonging to this poll
  for (const a of parsed.data.answers) {
    if (!validQuestionIds.has(a.questionId)) {
      return res
        .status(400)
        .json({ message: `Question ${a.questionId} is not part of this poll` });
    }
  }

  // Group answers by questionId (supports checkbox with multiple options)
  const answersByQuestion = new Map<string, typeof parsed.data.answers>();
  for (const a of parsed.data.answers) {
    const existing = answersByQuestion.get(a.questionId) ?? [];
    existing.push(a);
    answersByQuestion.set(a.questionId, existing);
  }

  for (const q of questions) {
    const answers = answersByQuestion.get(q.id) ?? [];

    if (q.isRequired && answers.length === 0) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" is required` });
    }

    if (answers.length === 0) continue;

    if (q.type === "radio" && answers.length > 1) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" accepts only one answer` });
    }

    if (q.type !== "text") {
      const hasOption = answers.some((a) => a.optionId);
      if (!hasOption) {
        return res.status(400).json({
          message: `Question "${q.text}" requires an option selection`,
        });
      }
    }

    if (q.type === "text" && !answers[0]!.value) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" requires a text answer` });
    }
  }

  // Build per-question valid option sets to prevent cross-question option injection
  const questionOptionMap = new Map<string, Set<string>>();
  for (const q of questions) {
    const opts = await db
      .select({ id: optionsTable.id })
      .from(optionsTable)
      .where(eq(optionsTable.questionId, q.id));
    questionOptionMap.set(q.id, new Set(opts.map((o) => o.id)));
  }

  for (const a of parsed.data.answers) {
    if (a.optionId) {
      const validOpts = questionOptionMap.get(a.questionId);
      if (!validOpts?.has(a.optionId)) {
        return res.status(400).json({
          message: `Option ${a.optionId} is not valid for question ${a.questionId}`,
        });
      }
    }
  }

  // Transactional write
  const [newResponse] = await db.transaction(async (tx) => {
    const [resp] = await tx
      .insert(responsesTable)
      .values({
        pollId: poll.id,
        respondentName: parsed.data.respondentName ?? null,
        voterKey,
      })
      .returning();
    if (!resp) throw new Error("Failed to create response");

    for (const a of parsed.data.answers) {
      await tx.insert(answersTable).values({
        responseId: resp.id,
        questionId: a.questionId,
        optionId: a.optionId ?? null,
        value: a.value ?? null,
      });
    }

    return [resp];
  });

  emitResponseNew(poll.id);

  return res
    .status(201)
    .json({ message: "Response submitted", responseId: newResponse.id });
}
