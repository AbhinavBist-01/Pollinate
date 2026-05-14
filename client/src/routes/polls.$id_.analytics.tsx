import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api, { getToken } from "../lib/api";
import {
  socket,
  joinPollRoom,
  onResponseNew,
  offResponseNew,
} from "../lib/socket";

export const Route = createFileRoute("/polls/$id_/analytics")({
  component: Analytics,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/login" });
  },
});

function Analytics() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/polls/${id}/analytics`).then((r) => setData(r.data));
    if (!socket.connected) socket.connect();
    joinPollRoom(id);
    const handler = () => {
      api.get(`/api/polls/${id}/analytics`).then((r) => setData(r.data));
    };
    onResponseNew(handler);
    return () => {
      offResponseNew(handler);
    };
  }, [id]);

  if (!data)
    return <p className="text-center py-20 text-white/30">Loading...</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {data.title || "Analytics"}
        </h1>
        <p className="text-sm text-orange/70 mt-1">Real-time performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-3xl font-bold text-honey">{data.totalResponses}</p>
          <p className="text-xs text-white/40 mt-1">Total Responses</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-3xl font-bold text-orange">
            {data.completionRate ?? 100}%
          </p>
          <p className="text-xs text-white/40 mt-1">Completion Rate</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-3xl font-bold text-white">
            {data.responsesOverTime?.length ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Active Days</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4">Responses Over Time</h2>
        {data.responsesOverTime?.length === 0 ? (
          <p className="text-sm text-white/30 italic">No responses yet.</p>
        ) : (
          <div className="space-y-2">
            {data.responsesOverTime?.map((r: any) => {
              const maxCount = Math.max(
                ...data.responsesOverTime.map((x: any) => x.count),
                1,
              );
              return (
                <div key={r.date}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-white/60">{r.date}</span>
                    <span className="font-medium text-white">{r.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange transition-all"
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
