import type { Request, Response } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../../db/index.js";
import {
  pollsTable,
  questionsTable,
  optionsTable,
} from "../../../db/schema.js";
import { CreatePollSchema, UpdatePollSchema } from "./models.js";

// Create a new poll
export async function createPoll(req: Request, res: Response) {
  const parsed = CreatePollSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { title, description, expiresAt, isPublished, questions } = parsed.data;
  const shareId = nanoid(12);

  const [poll] = await db
    .insert(pollsTable)
    .values({
      ownerId: req.user!.id,
      title,
      description,
      shareId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isPublished,
    })
    .returning();

  if (!poll) return res.status(500).json({ message: "Failed to create poll" });

  for (const q of questions) {
    const [question] = await db
      .insert(questionsTable)
      .values({
        pollId: poll.id,
        text: q.text,
        type: q.type,
        order: q.order ?? 0,
        isRequired: q.isRequired,
      })
      .returning();

    if (!question) continue;

    if (q.options) {
      for (const o of q.options) {
        await db.insert(optionsTable).values({
          questionId: question.id,
          text: o.text,
          order: o.order ?? 0,
        });
      }
    }
  }

  return res.status(201).json(poll);
}

// List all polls for the authenticated user
export async function listPolls(req: Request, res: Response) {
  const polls = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.ownerId, req.user!.id))
    .orderBy(pollsTable.createdAt);

  return res.status(200).json(polls);
}

// Get poll by ID
export async function getPoll(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.pollId, poll.id))
    .orderBy(questionsTable.order);

  const allOptions = questions.length
    ? await db
        .select()
        .from(optionsTable)
        .where(
          inArray(
            optionsTable.questionId,
            questions.map((q) => q.id),
          ),
        )
    : [];

  const result = {
    ...poll,
    questions: questions.map((q) => ({
      ...q,
      options: allOptions
        .filter((o) => o.questionId === q.id)
        .sort((a, b) => a.order - b.order),
    })),
  };

  return res.status(200).json(result);
}

// Update a poll by ID
export async function updatePoll(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const parsed = UpdatePollSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const { questions, ...pollFields } = parsed.data;

  if (Object.keys(pollFields).length > 0) {
    const updateData: Record<string, unknown> = {};
    if (pollFields.title !== undefined) updateData.title = pollFields.title;
    if (pollFields.description !== undefined)
      updateData.description = pollFields.description;
    if (pollFields.expiresAt !== undefined)
      updateData.expiresAt = pollFields.expiresAt
        ? new Date(pollFields.expiresAt)
        : null;
    if (pollFields.isPublished !== undefined)
      updateData.isPublished = pollFields.isPublished;

    await db
      .update(pollsTable)
      .set(updateData)
      .where(eq(pollsTable.id, poll.id));
  }

  if (questions) {
    const existingQuestions = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(eq(questionsTable.pollId, poll.id));

    for (const q of existingQuestions) {
      await db.delete(optionsTable).where(eq(optionsTable.questionId, q.id));
    }
    await db.delete(questionsTable).where(eq(questionsTable.pollId, poll.id));

    for (const q of questions) {
      const [question] = await db
        .insert(questionsTable)
        .values({
          pollId: poll.id,
          text: q.text,
          type: q.type,
          order: q.order ?? 0,
          isRequired: q.isRequired,
        })
        .returning();

      if (!question) continue;

      if (q.options) {
        for (const o of q.options) {
          await db.insert(optionsTable).values({
            questionId: question.id,
            text: o.text,
            order: o.order ?? 0,
          });
        }
      }
    }
  }

  return res.status(200).json({ message: "Poll updated" });
}

// Delete a poll by ID
export async function deletePoll(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  await db.delete(pollsTable).where(eq(pollsTable.id, poll.id));

  return res.status(200).json({ message: "Poll deleted" });
}
