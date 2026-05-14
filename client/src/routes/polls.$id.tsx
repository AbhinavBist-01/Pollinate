import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api, { getToken } from "../lib/api";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/polls/$id")({
  component: PollDetail,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/login" });
  },
});

function PollDetail() {
  const { id } = Route.useParams();
  const [poll, setPoll] = useState<any>(null);
  useEffect(() => {
    api.get(`/api/polls/${id}`).then((r) => setPoll(r.data));
  }, [id]);

  async function togglePublish() {
    const nextLive = poll?.status !== "live";
    setPoll((prev: any) =>
      prev
        ? {
            ...prev,
            status: nextLive ? "live" : "draft",
            isPublished: nextLive,
          }
        : prev,
    );
    try {
      await api.patch(`/api/polls/${id}`, {
        status: nextLive ? "live" : "draft",
        isPublished: nextLive,
      });
    } catch {
      setPoll((prev: any) =>
        prev
          ? { ...prev, status: poll?.status, isPublished: poll?.isPublished }
          : prev,
      );
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/p/${poll.shareId}`,
    );
  }
  function copyJoinCode() {
    navigator.clipboard.writeText(poll.shareId);
  }
  async function endPoll() {
    await api.patch(`/api/polls/${id}`, {
      status: "ended",
      isPublished: false,
    });
    setPoll((prev: any) =>
      prev
        ? {
            ...prev,
            status: "ended",
            isPublished: false,
            endedAt: new Date().toISOString(),
          }
        : prev,
    );
  }

  if (!poll)
    return (
      <p className="py-20 text-center text-muted-foreground">Loading...</p>
    );

  const questionCount = poll.questions?.length ?? 0;
  const radioCount =
    poll.questions?.filter(
      (q: any) => q.type === "radio" || q.type === "checkbox",
    ).length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-foreground">
              {poll.title}
            </h1>
            <Badge variant={poll.status === "live" ? "default" : "outline"}>
              {poll.status || (poll.isPublished ? "live" : "draft")}
            </Badge>
          </div>
          {poll.description && (
            <p className="mt-2 text-primary/80">{poll.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </span>
            <span>{radioCount} with options</span>
            {poll.createdAt && (
              <span>
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(poll.status === "live" || poll.isPublished) && (
            <Button variant="outline" onClick={copyLink}>
              Copy Link
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link to="/polls/$id/results" params={{ id }}>
              View Live Results
            </Link>
          </Button>
          {poll.status === "live" && (
            <Button onClick={endPoll} variant="destructive">
              End Poll
            </Button>
          )}
          <Button
            onClick={togglePublish}
            variant={poll.status === "live" ? "outline" : "default"}
            disabled={poll.status === "ended"}
          >
            {poll.status === "live" ? "Set Draft" : "Go Live"}
          </Button>
        </div>
      </div>

      {(poll.status === "live" || poll.isPublished) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="grid gap-4 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Share link:</span>
                <a
                  href={`/p/${poll.shareId}`}
                  className="font-medium text-primary hover:underline"
                >
                  /p/{poll.shareId}
                </a>
                <Button variant="ghost" size="sm" onClick={copyLink}>
                  Copy
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Join code:</span>
                <span className="rounded-md border border-white/10 bg-secondary px-2 py-1 font-mono text-foreground">
                  {poll.shareId}
                </span>
                <Button variant="ghost" size="sm" onClick={copyJoinCode}>
                  Copy code
                </Button>
              </div>
            </div>
            <img
              className="size-28 rounded-xl border border-white/10 bg-white p-2"
              alt="Poll QR code"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/p/${poll.shareId}`)}`}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link
            to="/polls/$id/results"
            params={{ id }}
            className="block p-5 text-center"
          >
            <p className="font-semibold text-foreground">Live Results</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Watch responses update
            </p>
          </Link>
        </Card>
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link
            to="/polls/$id/analytics"
            params={{ id }}
            className="block p-5 text-center"
          >
            <p className="font-semibold text-foreground">Analytics</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Track performance
            </p>
          </Link>
        </Card>
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link
            to="/polls/$id/edit"
            params={{ id }}
            className="block p-5 text-center"
          >
            <p className="font-semibold text-foreground">Edit</p>
            <p className="mt-1 text-sm text-muted-foreground">Modify poll</p>
          </Link>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Questions</h2>
        {poll.questions?.map((q: any, i: number) => (
          <Card key={i} className="border-white/10 bg-card/90">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>
                  {q.text}{" "}
                  {q.isRequired && <span className="text-primary">*</span>}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="uppercase">
                    {q.type}
                  </Badge>
                  {q.timeLimit && (
                    <Badge variant="outline">{q.timeLimit}s</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {q.type === "text" ? (
                <p className="rounded-lg border border-white/10 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground italic">
                  Free text answer
                </p>
              ) : (
                <div className="space-y-2">
                  {q.options?.map((o: any, j: number) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground"
                    >
                      <span
                        className={`size-3 border border-white/25 ${q.type === "radio" ? "rounded-full" : "rounded"}`}
                      />
                      {o.text}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
