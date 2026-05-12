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

export async function getPublicPoll(req: Request, res: Response) {
  const shareIdRaw = req.params.shareId;
  const shareId = Array.isArray(shareIdRaw) ? shareIdRaw[0] : shareIdRaw;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.shareId, shareId), eq(pollsTable.isPublished, true)));

  if (!poll) return res.status(404).json({ message: "Poll not found or not published" });

  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    return res.status(410).json({ message: "This poll has expired" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id))
    .orderBy(questionsTable.order);

  const questionIds = questions.map((q) => q.id);

  const allOptions = questionIds.length
    ? await db.select().from(optionsTable).where(inArray(optionsTable.questionId, questionIds)).orderBy(optionsTable.order)
    : [];

  return res.status(200).json({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    shareId: poll.shareId,
    expiresAt: poll.expiresAt,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      isRequired: q.isRequired,
      options: allOptions.filter((o) => o.questionId === q.id).map((o) => ({ id: o.id, text: o.text, order: o.order })),
    })),
  });
}

export async function submitResponse(req: Request, res: Response) {
  const shareIdRaw = req.params.shareId;
  const shareId = Array.isArray(shareIdRaw) ? shareIdRaw[0] : shareIdRaw;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const parsed = SubmitResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.shareId, shareId), eq(pollsTable.isPublished, true)));

  if (!poll) return res.status(404).json({ message: "Poll not found or not published" });

  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    return res.status(410).json({ message: "This poll has expired" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id));

  const validQuestionIds = new Set(questions.map((q) => q.id));

  // Reject questionIds not belonging to this poll
  for (const a of parsed.data.answers) {
    if (!validQuestionIds.has(a.questionId)) {
      return res.status(400).json({ message: `Question ${a.questionId} is not part of this poll` });
    }
  }

  const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a]));

  for (const q of questions) {
    const answer = answerMap.get(q.id);
    if (q.isRequired && !answer) {
      return res.status(400).json({ message: `Question "${q.text}" is required` });
    }
    if (q.type !== "text" && answer && !answer.optionId) {
      return res.status(400).json({ message: `Question "${q.text}" requires an option selection` });
    }
    if (q.type === "text" && answer && !answer.value) {
      return res.status(400).json({ message: `Question "${q.text}" requires a text answer` });
    }
  }

  // Build per-question valid option sets to prevent cross-question option injection
  const questionOptionMap = new Map<string, Set<string>>();
  for (const q of questions) {
    const opts = await db.select({ id: optionsTable.id }).from(optionsTable).where(eq(optionsTable.questionId, q.id));
    questionOptionMap.set(q.id, new Set(opts.map((o) => o.id)));
  }

  for (const a of parsed.data.answers) {
    if (a.optionId) {
      const validOpts = questionOptionMap.get(a.questionId);
      if (!validOpts?.has(a.optionId)) {
        return res.status(400).json({ message: `Option ${a.optionId} is not valid for question ${a.questionId}` });
      }
    }
  }

  // Transactional write
  const [newResponse] = await db.transaction(async (tx) => {
    const [resp] = await tx.insert(responsesTable).values({ pollId: poll.id }).returning();
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

  return res.status(201).json({ message: "Response submitted", responseId: newResponse.id });
}
