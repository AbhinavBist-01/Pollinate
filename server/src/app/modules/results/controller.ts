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

//  Get all results for a poll
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

  const totalResponses = Number(
    (
      await db
        .select({ count: sql<number>`count(*)` })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id))
    )[0]?.count ?? 0,
  );

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
          totalVotes: textAnswers.filter((a) => Boolean(a.value)).length,
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
      const opts = allOptions
        .filter((o) => o.questionId === q.id)
        .map((o) => ({
          optionId: o.id,
          text: o.text,
          count: Number(countMap.get(o.id) ?? 0),
        }));

      const sorted = [...opts].sort((a, b) => b.count - a.count);
      const topCount = sorted[0]?.count ?? 0;

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        totalVotes: opts.reduce((s, o) => s + o.count, 0),
        options: opts,
        topOption:
          topCount > 0 ? { text: sorted[0]!.text, count: topCount } : null,
        ranking: sorted.filter((o) => o.count > 0),
      };
    }),
  );

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
        const correct = correctOptionIdsByQuestion.get(questionId) ?? new Set<string>();
        const selected = answersByResponseQuestion.get(`${response.id}:${questionId}`) ?? new Set<string>();
        if (selected.size > 0) answeredQuestions += 1;
        const isCorrect =
          correct.size > 0 &&
          selected.size === correct.size &&
          [...correct].every((optionId) => selected.has(optionId));
        if (isCorrect) correctAnswers += 1;
      }

      return {
        responseId: response.id,
        respondentName: response.respondentName || `Responder ${responses.length - index}`,
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
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return res
    .status(200)
    .json({
      pollId: poll.id,
      title: poll.title,
      shareId: poll.shareId,
      totalResponses,
      scoredQuestionCount: scoredQuestionIds.length,
      leaderboard,
      results,
    });
}

// Get analytics data for a poll (response trends, completion rates, etc.)`
export async function getAnalytics(req: Request, res: Response) {
  const id = req.params.id as string | undefined;
  if (!id) return res.status(400).json({ message: "Poll ID required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(and(eq(pollsTable.id, id), eq(pollsTable.ownerId, req.user!.id)));
  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const totalResponses = Number(
    (
      await db
        .select({ count: sql<number>`count(*)` })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id))
    )[0]?.count ?? 0,
  );

  const responsesOverTime = await db
    .select({
      date: sql<string>`DATE(${responsesTable.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, poll.id))
    .groupBy(sql`DATE(${responsesTable.createdAt})`)
    .orderBy(sql`DATE(${responsesTable.createdAt})`);

  const completionRate = await db
    .select({
      complete: sql<number>`COUNT(DISTINCT CASE WHEN ${answersTable.id} IS NOT NULL THEN ${responsesTable.id} END)`,
      total: sql<number>`COUNT(DISTINCT ${responsesTable.id})`,
    })
    .from(responsesTable)
    .leftJoin(answersTable, eq(answersTable.responseId, responsesTable.id))
    .where(eq(responsesTable.pollId, poll.id));

  return res.status(200).json({
    pollId: poll.id,
    title: poll.title,
    totalResponses,
    completionRate: completionRate[0]?.total
      ? Math.round(
          (Number(completionRate[0].complete) /
            Number(completionRate[0].total)) *
            100,
        )
      : 0,
    responsesOverTime: responsesOverTime.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
  });
}
