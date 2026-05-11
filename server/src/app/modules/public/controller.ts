import type { Request, Response } from "express";
import { eq, and, inArray } from "pg-core";
import { db } from "../../../db/index.js";
import {
  pollsTable,
  questionsTable,
  optionsTable,
  responsesTable,
  answersTable,
} from "../../../db/schema.js";
import { SubmitResponseSchema } from "./models.js";

export async function getPublicPoll(req: Request, res: Response) {
  const { shareId } = req.params;
  if (!shareId) return res.status(400).json({ message: "Share ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(
      and(eq(pollsTable.shareId, shareId), eq(pollsTable.isPublished, true)),
    );

  if (!poll)
    return res.status(404).json({ message: "Poll not found or not published" });

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
    expiresAt: poll.expiresAt,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      isRequired: q.isRequired,
      options: allOptions
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, text: o.text, order: o.order })),
    })),
  });
}

export async function submitResponse(req: Request, res: Response) {
  const { shareId } = req.params;
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
    .where(
      and(eq(pollsTable.shareId, shareId), eq(pollsTable.isPublished, true)),
    );

  if (!poll)
    return res.status(404).json({ message: "Poll not found or not published" });

  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    return res.status(410).json({ message: "This poll has expired" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id));

  const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a]));

  for (const q of questions) {
    const answer = answerMap.get(q.id);
    if (q.isRequired && !answer) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" is required` });
    }
    if (q.type !== "text" && answer && !answer.optionId) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" requires an option selection` });
    }
    if (q.type === "text" && answer && !answer.value) {
      return res
        .status(400)
        .json({ message: `Question "${q.text}" requires a text answer` });
    }
  }

  const allOptionIds = new Set(
    (
      await db
        .select({ id: optionsTable.id })
        .from(optionsTable)
        .where(
          inArray(
            optionsTable.questionId,
            questions.map((q) => q.id),
          ),
        )
    ).map((o) => o.id),
  );

  for (const a of parsed.data.answers) {
    if (a.optionId && !allOptionIds.has(a.optionId)) {
      return res
        .status(400)
        .json({ message: `Invalid option ID: ${a.optionId}` });
    }
  }

  const [response] = await db
    .insert(responsesTable)
    .values({ pollId: poll.id })
    .returning();

  if (!response) {
    return res.status(500).json({ message: "Failed to submit response" });
  }
  for (const a of parsed.data.answers) {
    await db.insert(answersTable).values({
      responseId: response.id,
      questionId: a.questionId,
      optionId: a.optionId ?? null,
      value: a.value ?? null,
    });
  }

  return res
    .status(201)
    .json({ message: "Response submitted", responseId: response.id });
}
