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

function normalizeStatus(input: {
  status?: string | undefined;
  isPublished?: boolean | undefined;
  scheduledAt?: string | Date | null | undefined;
}) {
  if (input.status) return input.status;
  if (input.scheduledAt) return "scheduled";
  return input.isPublished ? "live" : "draft";
}

function withEffectiveStatus<
  T extends {
    status: string;
    isPublished: boolean;
    scheduledAt: Date | null;
    expiresAt: Date | null;
    endedAt: Date | null;
  },
>(poll: T): T {
  const now = new Date();
  if (
    poll.endedAt ||
    poll.status === "ended" ||
    (poll.expiresAt && poll.expiresAt < now)
  ) {
    return { ...poll, status: "ended", isPublished: false };
  }
  if (
    poll.status === "scheduled" &&
    poll.scheduledAt &&
    poll.scheduledAt <= now
  ) {
    return { ...poll, status: "live", isPublished: true };
  }
  return poll;
}

// Create a new poll with questions and options
export async function createPoll(req: Request, res: Response) {
  const parsed = CreatePollSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const {
    title,
    description,
    expiresAt,
    scheduledAt,
    isPublished,
    voteLimitPerSession,
    allowAnonymous,
    questions,
  } = parsed.data;
  const status = normalizeStatus(parsed.data);
  const shareId = nanoid(12);

  const [poll] = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(pollsTable)
      .values({
        ownerId: req.user!.id,
        title,
        description,
        shareId,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        voteLimitPerSession,
        allowAnonymous,
        isPublished: status === "live" || isPublished,
      })
      .returning();
    if (!p) throw new Error("Failed to create poll");

    for (const q of questions) {
      const [question] = await tx
        .insert(questionsTable)
        .values({
          pollId: p.id,
          text: q.text,
          type: q.type,
          order: q.order ?? 0,
          isRequired: q.isRequired,
          timeLimit: q.timeLimit ?? null,
        })
        .returning();
      if (!question) throw new Error("Failed to create question");

      if (q.options) {
        for (const o of q.options) {
          const inserted = await tx
            .insert(optionsTable)
            .values({
              questionId: question.id,
              text: o.text,
              order: o.order ?? 0,
              isCorrect: o.isCorrect ?? false,
            })
            .returning();
          if (!inserted.length) throw new Error("Failed to create option");
        }
      }
    }
    return [p];
  });

  return res.status(201).json(poll);
}

// List all polls for the authenticated user
export async function listPolls(req: Request, res: Response) {
  const polls = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.ownerId, req.user!.id))
    .orderBy(pollsTable.createdAt);
  return res.status(200).json(polls.map(withEffectiveStatus));
}

// Get a single poll with its questions and options
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

  return res.status(200).json({
    ...withEffectiveStatus(poll),
    questions: questions.map((q) => ({
      ...q,
      options: allOptions
        .filter((o) => o.questionId === q.id)
        .sort((a, b) => a.order - b.order),
    })),
  });
}

// Update a poll and its questions/options
export async function updatePoll(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const parsed = UpdatePollSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));
  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const { questions, ...pollFields } = parsed.data;

  await db.transaction(async (tx) => {
    if (Object.keys(pollFields).length > 0) {
      const updateData: Record<string, unknown> = {};
      if (pollFields.title !== undefined) updateData.title = pollFields.title;
      if (pollFields.description !== undefined)
        updateData.description = pollFields.description;
      if (pollFields.expiresAt !== undefined)
        updateData.expiresAt = pollFields.expiresAt
          ? new Date(pollFields.expiresAt)
          : null;
      if (pollFields.scheduledAt !== undefined)
        updateData.scheduledAt = pollFields.scheduledAt
          ? new Date(pollFields.scheduledAt)
          : null;
      if (pollFields.voteLimitPerSession !== undefined)
        updateData.voteLimitPerSession = pollFields.voteLimitPerSession;
      if (pollFields.allowAnonymous !== undefined)
        updateData.allowAnonymous = pollFields.allowAnonymous;
      if (pollFields.status !== undefined) {
        updateData.status = pollFields.status;
        updateData.isPublished = pollFields.status === "live";
        updateData.endedAt = pollFields.status === "ended" ? new Date() : null;
      } else if (pollFields.isPublished !== undefined) {
        updateData.isPublished = pollFields.isPublished;
        updateData.status = pollFields.isPublished ? "live" : "draft";
        updateData.endedAt = pollFields.isPublished ? null : poll.endedAt;
      }
      await tx
        .update(pollsTable)
        .set(updateData)
        .where(eq(pollsTable.id, poll.id));
    }

    if (questions) {
      const existingQ = await tx
        .select({ id: questionsTable.id })
        .from(questionsTable)
        .where(eq(questionsTable.pollId, poll.id));
      for (const q of existingQ)
        await tx.delete(optionsTable).where(eq(optionsTable.questionId, q.id));
      await tx.delete(questionsTable).where(eq(questionsTable.pollId, poll.id));

      for (const q of questions) {
        const [question] = await tx
          .insert(questionsTable)
          .values({
            pollId: poll.id,
            text: q.text,
            type: q.type,
            order: q.order ?? 0,
            isRequired: q.isRequired,
            timeLimit: q.timeLimit ?? null,
          })
          .returning();
        if (!question) throw new Error("Failed to create question");
        if (q.options) {
          for (const o of q.options) {
            await tx.insert(optionsTable).values({
              questionId: question.id,
              text: o.text,
              order: o.order ?? 0,
              isCorrect: o.isCorrect ?? false,
            });
          }
        }
      }
    }
  });

  return res.status(200).json({ message: "Poll updated" });
}

// Delete a poll
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
