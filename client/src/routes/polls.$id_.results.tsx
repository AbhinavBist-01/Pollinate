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
    return <p className="text-center py-20 text-white/30">Loading...</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {data.title || "Results"}
          </h1>
          <p className="text-sm text-orange/70 mt-1">
            {data.totalResponses} total response
            {data.totalResponses !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="rounded-full bg-honey/15 border border-honey/20 px-5 py-2 text-sm font-semibold text-honey">
          {data.totalResponses}
        </span>
      </div>

      {data.results?.map((r: any) => {
        const winner = r.topOption;
        return (
          <div
            key={r.questionId}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-center justify-between mb-4">
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
                      className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/70"
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
                    <p className="text-xs text-honey font-semibold">
                      TOP PERFORMER
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {winner.text} — {winner.count} vote
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
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2">
                              {isTop && (
                                <span className="text-xs text-honey font-semibold">
                                  ★
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
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isTop ? "bg-honey" : "bg-orange/50"}`}
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
