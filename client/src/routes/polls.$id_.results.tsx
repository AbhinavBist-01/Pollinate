import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api, { getToken } from "../lib/api";

export const Route = createFileRoute("/polls/$id_/results")({
  component: Results,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/login" });
  },
});

function Results() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/polls/${id}/results`).then((r) => setData(r.data));
  }, [id]);

  if (!data)
    return <p className="py-20 text-center text-white/30">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {data.title || "Results"}
          </h1>
          <p className="mt-1 text-sm text-orange/70">
            {data.totalResponses} total response
            {data.totalResponses !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="rounded-full border border-honey/20 bg-honey/15 px-5 py-2 text-sm font-semibold text-honey">
          {data.totalResponses}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-honey">
              Leaderboard
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Top performers
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
            {data.scoredQuestionCount ?? 0} scored
          </span>
        </div>

        {data.leaderboard?.length ? (
          <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
            {data.leaderboard.map((entry: any) => (
              <div
                key={entry.responseId}
                className="grid grid-cols-[52px_1fr_auto] items-center gap-3 p-4"
              >
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-black ${
                    entry.rank <= 3
                      ? "bg-honey/15 text-honey"
                      : "bg-white/5 text-white/60"
                  }`}
                >
                  #{entry.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {entry.respondentName}
                  </p>
                  <p className="text-xs text-white/45">
                    {entry.correctAnswers} /{" "}
                    {entry.totalScoreableQuestions ?? data.scoredQuestionCount}{" "}
                    correct - {entry.answeredQuestions} answered
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                  {entry.scorePercent}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/45">
            No scored responses yet.
          </p>
        )}
      </div>

      {data.results?.map((r: any) => {
        const winner = r.topOption;
        return (
          <div
            key={r.questionId}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">{r.questionText}</h3>
              <span className="text-xs text-white/40">
                {r.totalVotes} vote{r.totalVotes !== 1 ? "s" : ""}
              </span>
            </div>

            {r.type === "text" ? (
              <div className="space-y-2">
                {r.answers?.length ? (
                  r.answers.map((a: string, i: number) => (
                    <p
                      key={i}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                    >
                      - {a}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-white/30 italic">
                    No text responses yet
                  </p>
                )}
              </div>
            ) : (
              <>
                {winner && (
                  <div className="mb-4 rounded-lg border border-honey/20 bg-honey/10 p-3">
                    <p className="text-xs font-semibold text-honey">
                      TOP OPTION
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {winner.text} - {winner.count} vote
                      {winner.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {(r.ranking?.length ? r.ranking : r.options)?.map(
                    (o: any, i: number) => {
                      const total = r.totalVotes || 1;
                      const pct = Math.round((o.count / total) * 100);
                      const isTop = i === 0 && o.count > 0;
                      return (
                        <div key={o.optionId}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {isTop && (
                                <span className="text-xs font-semibold text-honey">
                                  *
                                </span>
                              )}
                              <span
                                className={
                                  isTop
                                    ? "font-semibold text-white"
                                    : "text-white/70"
                                }
                              >
                                {o.text}
                              </span>
                            </span>
                            <span className="font-medium text-white">
                              {o.count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isTop ? "bg-honey" : "bg-orange/50"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
