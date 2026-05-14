import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api, { getToken } from "../lib/api";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";

interface Poll {
  id: string;
  title: string;
  shareId: string;
  status?: "draft" | "live" | "ended" | "scheduled";
  isPublished: boolean;
  createdAt: string;
  scheduledAt?: string | null;
  endedAt?: string | null;
  expiresAt: string | null;
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/login" });
  },
});

function Dashboard() {
  const [polls, setPolls] = useState<Poll[]>([]);
  useEffect(() => {
    api.get("/api/polls").then((r) => setPolls(r.data));
  }, []);

  async function togglePublish(p: Poll) {
    const nextLive = p.status !== "live";
    await api.patch(`/api/polls/${p.id}`, {
      status: nextLive ? "live" : "draft",
      isPublished: nextLive,
    });
    setPolls((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, status: nextLive ? "live" : "draft", isPublished: nextLive }
          : x,
      ),
    );
  }

  async function endPoll(p: Poll) {
    await api.patch(`/api/polls/${p.id}`, {
      status: "ended",
      isPublished: false,
    });
    setPolls((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, status: "ended", isPublished: false } : x,
      ),
    );
  }

  async function deletePoll(id: string) {
    await api.delete(`/api/polls/${id}`);
    setPolls((prev) => prev.filter((x) => x.id !== id));
  }

  function copyLink(shareId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${shareId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black text-foreground">My Polls</h1>
        </div>
        <Button asChild size="lg">
          <Link to="/polls/new">+ New Poll</Link>
        </Button>
      </div>

      {polls.length === 0 && (
        <Card className="border-white/10 bg-card/90">
          <CardContent className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">
                No polls yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first poll to get started.
              </p>
              <Button asChild className="mt-6">
                <Link to="/polls/new">Create poll</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {polls.map((poll) => (
          <Card
            key={poll.id}
            className="border-white/10 bg-card/90 transition-colors hover:border-primary/35"
          >
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
              <div
                className={`h-10 w-1.5 shrink-0 rounded-full ${poll.isPublished ? "bg-emerald-400" : "bg-white/20"}`}
              />
              <div className="min-w-0 flex-1">
                <Link
                  to="/polls/$id"
                  params={{ id: poll.id }}
                  className="block truncate font-semibold text-foreground hover:text-primary"
                >
                  {poll.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge
                    variant={poll.status === "live" ? "default" : "outline"}
                  >
                    {poll.status || (poll.isPublished ? "live" : "draft")}
                  </Badge>
                  {poll.status === "live" && (
                    <button
                      onClick={() => copyLink(poll.shareId)}
                      className="text-xs text-primary hover:underline"
                      title="Copy share link"
                    >
                      /p/{poll.shareId}
                    </button>
                  )}
                  {poll.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expires {new Date(poll.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {poll.scheduledAt && (
                    <span className="text-xs text-muted-foreground">
                      Starts {new Date(poll.scheduledAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(poll)}
                  disabled={poll.status === "ended"}
                >
                  {poll.status === "live" ? "Set Draft" : "Go Live"}
                </Button>
                {poll.status === "live" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => endPoll(poll)}
                  >
                    End Poll
                  </Button>
                )}
                <Button asChild variant="secondary" size="sm">
                  <Link to="/polls/$id/results" params={{ id: poll.id }}>
                    Live Results
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/polls/$id/analytics" params={{ id: poll.id }}>
                    Analytics
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePoll(poll.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
