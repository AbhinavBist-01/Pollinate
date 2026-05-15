import type { Request, Response } from "express";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  pollsTable,
  questionsTable,
  optionsTable,
  responsesTable,
  answersTable,
} from "../../../db/schema.js";
import { SubmitResponseSchema } from "./models.js";
import { emitResponseNew, getPollLiveState } from "../socket/index.js";

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
  if (
    poll.status === "scheduled" &&
    poll.scheduledAt &&
    poll.scheduledAt <= now
  )
    return "live";
  if (poll.status === "live" || poll.isPublished) return "live";
  return "draft";
}

function normalizeParticipantName(name?: string) {
  const normalized = name?.trim().replace(/\s+/g, " ").toLowerCase();
  return normalized || null;
}

function voterKeyFor(
  req: Request,
  sessionId?: string,
  respondentName?: string,
) {
  const participantName = normalizeParticipantName(respondentName);
  if (participantName && sessionId)
    return `participant:${sessionId}:${participantName}`;
  if (participantName) return `name:${participantName}`;

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
  if (status !== "live" && status !== "ended") {
    return res.status(status === "scheduled" ? 425 : 410).json({
      message:
        status === "scheduled"
          ? "This poll is scheduled and not live yet"
          : "This poll is not accepting responses",
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
    allowAnonymous: poll.allowAnonymous,
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

export async function getPublicLeaderboard(req: Request, res: Response) {
  const shareId = req.params.shareId as string | undefined;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.shareId, shareId));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const liveState = getPollLiveState(poll.id);
  const status = getEffectiveStatus(poll);
  if (status !== "ended" && !liveState?.isCompleted) {
    return res.status(409).json({
      message: "Leaderboard is available after the quiz is completed",
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

  const scoreableQuestions = questions.filter((q) => q.type !== "text");
  const correctOptionIdsByQuestion = new Map<string, Set<string>>();
  for (const q of scoreableQuestions) {
    correctOptionIdsByQuestion.set(
      q.id,
      new Set(
        allOptions
          .filter((o) => o.questionId === q.id && o.isCorrect)
          .map((o) => o.id),
      ),
    );
  }

  const scoredQuestionIds = scoreableQuestions
    .filter((q) => (correctOptionIdsByQuestion.get(q.id)?.size ?? 0) > 0)
    .map((q) => q.id);

  const responses = await db
    .select({
      id: responsesTable.id,
      respondentName: responsesTable.respondentName,
      createdAt: responsesTable.createdAt,
    })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, poll.id))
    .orderBy(desc(responsesTable.createdAt));

  const responseIds = responses.map((response) => response.id);
  const allAnswers = responseIds.length
    ? await db
        .select({
          responseId: answersTable.responseId,
          questionId: answersTable.questionId,
          optionId: answersTable.optionId,
        })
        .from(answersTable)
        .where(inArray(answersTable.responseId, responseIds))
    : [];

  const answersByResponseQuestion = new Map<string, Set<string>>();
  for (const answer of allAnswers) {
    if (!answer.optionId) continue;
    const key = `${answer.responseId}:${answer.questionId}`;
    const selected = answersByResponseQuestion.get(key) ?? new Set<string>();
    selected.add(answer.optionId);
    answersByResponseQuestion.set(key, selected);
  }

  const leaderboard = responses
    .map((response, index) => {
      let correctAnswers = 0;
      let answeredQuestions = 0;

      for (const questionId of scoredQuestionIds) {
        const correct =
          correctOptionIdsByQuestion.get(questionId) ?? new Set<string>();
        const selected =
          answersByResponseQuestion.get(`${response.id}:${questionId}`) ??
          new Set<string>();
        if (selected.size > 0) answeredQuestions += 1;
        const isCorrect =
          correct.size > 0 &&
          selected.size === correct.size &&
          [...correct].every((optionId) => selected.has(optionId));
        if (isCorrect) correctAnswers += 1;
      }

      return {
        responseId: response.id,
        respondentName:
          response.respondentName || `Responder ${responses.length - index}`,
        score: correctAnswers,
        totalQuestions: scoredQuestionIds.length,
        correctAnswers,
        answeredQuestions,
        totalScoreableQuestions: scoredQuestionIds.length,
        scorePercent: scoredQuestionIds.length
          ? Math.round((correctAnswers / scoredQuestionIds.length) * 100)
          : 0,
        submittedAt: response.createdAt,
      };
    })
    .sort((a, b) => {
      if (b.correctAnswers !== a.correctAnswers)
        return b.correctAnswers - a.correctAnswers;
      if (b.scorePercent !== a.scorePercent)
        return b.scorePercent - a.scorePercent;
      return (
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const totalResponses = Number(
    (
      await db
        .select({ count: sql<number>`count(*)` })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id))
    )[0]?.count ?? 0,
  );

  return res.status(200).json({
    pollId: poll.id,
    title: poll.title,
    shareId: poll.shareId,
    totalResponses,
    scoredQuestionCount: scoredQuestionIds.length,
    leaderboard,
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

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const status = getEffectiveStatus(poll);
  if (status !== "live") {
    return res.status(status === "scheduled" ? 425 : 410).json({
      message:
        status === "scheduled"
          ? "This poll is scheduled and not live yet"
          : "This poll is not accepting responses",
      status,
    });
  }

  if (!poll.allowAnonymous && !parsed.data.respondentName?.trim()) {
    return res.status(400).json({ message: "Name is required for this poll" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id));

  const validQuestionIds = new Set(questions.map((q) => q.id));
  const liveState = getPollLiveState(poll.id);

  if (liveState?.isCompleted) {
    return res.status(409).json({ message: "This quiz is completed" });
  }

  if (liveState && !liveState.isActive) {
    return res.status(409).json({ message: "The host has not started voting" });
  }

  if (liveState) {
    const endsAt = liveState.endsAt ? new Date(liveState.endsAt).getTime() : 0;
    if (!liveState.acceptingResponses || endsAt <= Date.now()) {
      return res
        .status(409)
        .json({ message: "This question is closed for responses" });
    }

    const answersCurrentQuestionOnly = parsed.data.answers.every(
      (answer) => answer.questionId === liveState.currentQuestionId,
    );
    if (!answersCurrentQuestionOnly) {
      return res.status(400).json({
        message: "Responses are only accepted for the active question",
      });
    }
  }

  const voterKey = voterKeyFor(
    req,
    parsed.data.voterSessionId,
    parsed.data.respondentName,
  );
  const existingResponses = await db
    .select({ id: responsesTable.id })
    .from(responsesTable)
    .where(
      and(
        eq(responsesTable.pollId, poll.id),
        eq(responsesTable.voterKey, voterKey),
      ),
    );
  if (
    !existingResponses[0] &&
    existingResponses.length >= poll.voteLimitPerSession
  ) {
    return res.status(429).json({
      message: `Vote limit reached for this device/session (${poll.voteLimitPerSession})`,
    });
  }

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
    let resp = existingResponses[0];
    if (!resp) {
      [resp] = await tx
        .insert(responsesTable)
        .values({
          pollId: poll.id,
          respondentName: parsed.data.respondentName ?? null,
          voterKey,
        })
        .returning();
    } else if (parsed.data.respondentName?.trim()) {
      await tx
        .update(responsesTable)
        .set({ respondentName: parsed.data.respondentName.trim() })
        .where(eq(responsesTable.id, resp.id));
    }

    if (!resp) throw new Error("Failed to create response");

    const answeredQuestionIds = [
      ...new Set(parsed.data.answers.map((a) => a.questionId)),
    ];
    if (answeredQuestionIds.length) {
      await tx
        .delete(answersTable)
        .where(
          and(
            eq(answersTable.responseId, resp.id),
            inArray(answersTable.questionId, answeredQuestionIds),
          ),
        );
    }

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
