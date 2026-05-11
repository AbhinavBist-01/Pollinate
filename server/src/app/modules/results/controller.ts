import type { Request, Response } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  pollsTable,
  questionsTable,
  optionsTable,
  responsesTable,
  answersTable,
} from "../../../db/schema.js";

// Get Poll Results by ID - Only for Poll Owner
export async function getResults(req: Request, res: Response) {
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

  const questionIds = questions.map((q) => q.id);

  const allOptions = questionIds.length
    ? await db
        .select()
        .from(optionsTable)
        .where(inArray(optionsTable.questionId, questionIds))
        .orderBy(optionsTable.order)
    : [];

  const totalResponses = await db
    .select({ count: sql<number>`count(*)` })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, poll.id));

  const totalCount = Number(totalResponses[0]?.count ?? 0);

  const results = await Promise.all(
    questions.map(async (q) => {
      if (q.type === "text") {
        const textAnswers = await db
          .select({ value: answersTable.value })
          .from(answersTable)
          .where(eq(answersTable.questionId, q.id));

        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          answers: textAnswers.map((a) => a.value).filter(Boolean),
        };
      }

      const optionCounts = await db
        .select({
          optionId: answersTable.optionId,
          count: sql<number>`count(*)`,
        })
        .from(answersTable)
        .where(eq(answersTable.questionId, q.id))
        .groupBy(answersTable.optionId);

      const countMap = new Map(optionCounts.map((o) => [o.optionId, o.count]));

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        options: allOptions
          .filter((o) => o.questionId === q.id)
          .map((o) => ({
            optionId: o.id,
            text: o.text,
            count: countMap.get(o.id) ?? 0,
          })),
      };
    }),
  );

  return res
    .status(200)
    .json({ pollId: poll.id, totalResponses: totalCount, results });
}

// Get Poll Analytics by ID - Only for Poll Owner
export async function getAnalytics(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const totalResponses = await db
    .select({ count: sql<number>`count(*)` })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, poll.id));

  const responsesOverTime = await db
    .select({
      date: sql<string>`DATE(${responsesTable.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, poll.id))
    .groupBy(sql`DATE(${responsesTable.createdAt})`)
    .orderBy(sql`DATE(${responsesTable.createdAt})`);

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

  const questionBreakdown = await Promise.all(
    questions.map(async (q) => {
      if (q.type === "text") {
        const textAnswers = await db
          .select({ value: answersTable.value })
          .from(answersTable)
          .where(eq(answersTable.questionId, q.id));

        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          responseCount: textAnswers.length,
          answers: textAnswers.map((a) => a.value).filter(Boolean),
        };
      }

      const optionCounts = await db
        .select({
          optionId: answersTable.optionId,
          count: sql<number>`count(*)`,
        })
        .from(answersTable)
        .where(eq(answersTable.questionId, q.id))
        .groupBy(answersTable.optionId);

      const countMap = new Map(optionCounts.map((o) => [o.optionId, o.count]));

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        options: allOptions
          .filter((o) => o.questionId === q.id)
          .map((o) => ({
            optionId: o.id,
            text: o.text,
            count: countMap.get(o.id) ?? 0,
          })),
      };
    }),
  );

  return res.status(200).json({
    pollId: poll.id,
    totalResponses: Number(totalResponses[0]?.count ?? 0),
    responsesOverTime: responsesOverTime.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
    questionBreakdown,
  });
}
