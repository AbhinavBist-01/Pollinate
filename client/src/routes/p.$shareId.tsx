import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import api from "../lib/api";
import {
  joinPollRoom,
  leavePollRoom,
  offParticipantCount,
  onParticipantCount,
  socket,
} from "../lib/socket";

export const Route = createFileRoute("/p/$shareId")({
  component: PublicResponse,
});

function PublicResponse() {
  const { shareId } = Route.useParams();
  const [poll, setPoll] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api
      .get(`/api/public/polls/${shareId}`)
      .then((r) => setPoll(r.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Poll not found or expired"),
      );
  }, [shareId]);

  useEffect(() => {
    if (!poll?.id) return;
    if (!socket.connected) socket.connect();
    joinPollRoom(poll.id);
    const handler = (event: { pollId: string; count: number }) => {
      if (event.pollId === poll.id) setParticipantCount(event.count);
    };
    onParticipantCount(handler);
    return () => {
      offParticipantCount(handler);
      leavePollRoom(poll.id);
    };
  }, [poll?.id]);

  const questions = poll?.questions ?? [];
  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const startTimer = useCallback((seconds: number | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!seconds) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (current) startTimer(current.timeLimit ?? null);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, startTimer]);

  useEffect(() => {
    if (timeLeft === 0 && current) handleNext();
    // Timer completion intentionally reacts only when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function setOption(qId: string, optId: string) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: [{ questionId: qId, optionId: optId }],
    }));
  }

  function toggleOption(qId: string, optId: string) {
    setAnswers((prev) => {
      const selected = prev[qId] ?? [];
      const exists = selected.some((a) => a.optionId === optId);
      return {
        ...prev,
        [qId]: exists
          ? selected.filter((a) => a.optionId !== optId)
          : [...selected, { questionId: qId, optionId: optId }],
      };
    });
  }

  function setText(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: [{ questionId: qId, value }] }));
  }

  function handleNext() {
    if (isLast) handleSubmit();
    else setCurrentIdx((prev) => prev + 1);
  }

  async function handleSubmit() {
    const allAnswers = Object.values(answers).flat().filter(Boolean);
    try {
      await api.post(`/api/public/polls/${shareId}/respond`, {
        respondentName: respondentName.trim() || undefined,
        voterSessionId: getVoterSessionId(),
        answers: allAnswers,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit");
    }
  }

  function getVoterSessionId() {
    const key = `pollinate:voter:${shareId}`;
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    return next;
  }

  if (error)
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-primary">{error}</p>
      </div>
    );
  if (submitted)
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <Card className="max-w-md border-white/10 bg-card/90 text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-3xl text-emerald-400">
              ✓
            </div>
            <h1 className="text-3xl font-black text-foreground">
              You're done!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your responses have been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  if (!poll)
    return (
      <p className="py-20 text-center text-muted-foreground">Loading...</p>
    );

  if (!hasStarted) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <Card className="w-full max-w-md border-white/10 bg-card/90">
          <CardContent className="space-y-5 p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Pollinate response
              </p>
              <h1 className="mt-2 text-2xl font-black text-foreground">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {poll.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {participantCount} participant
                {participantCount !== 1 ? "s" : ""} online
              </p>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">
                {poll.allowAnonymous ? "Display name (optional)" : "Your name"}
              </span>
              <Input
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder={
                  poll.allowAnonymous
                    ? "Leave blank to vote anonymously"
                    : "Enter your name for the leaderboard"
                }
                required={!poll.allowAnonymous}
              />
            </label>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setHasStarted(true)}
              disabled={!poll.allowAnonymous && !respondentName.trim()}
            >
              Start poll
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-card/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="truncate text-lg font-black text-foreground">
            {poll.title}
          </h1>
          <span className="text-sm text-primary">
            {participantCount} online · {currentIdx + 1}/{questions.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">
          {current?.timeLimit && (
            <div className="text-center">
              <div
                className={`mx-auto grid size-16 place-items-center rounded-full text-2xl font-black ${timeLeft !== null && timeLeft <= 5 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}
              >
                {timeLeft ?? current.timeLimit}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">seconds left</p>
            </div>
          )}

          <Card className="border-white/10 bg-card/90">
            <CardContent className="p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Question {currentIdx + 1}
              </p>
              <h2 className="mb-6 text-xl font-black text-foreground">
                {current.text}
              </h2>

              {current.type === "text" ? (
                <Textarea
                  onChange={(e) => setText(current.id, e.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  autoFocus
                />
              ) : current.type === "checkbox" ? (
                <div className="space-y-3">
                  {current.options?.map((o: any) => {
                    const checked =
                      answers[current.id]?.some(
                        (a: any) => a.optionId === o.id,
                      ) ?? false;
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-sm transition-all hover:bg-secondary/60 ${checked ? "border-primary/40 bg-primary/5" : "border-white/10 bg-secondary/30"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOption(current.id, o.id)}
                        />
                        <span className="text-foreground/80">{o.text}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {current.options?.map((o: any) => {
                    const checked = answers[current.id]?.[0]?.optionId === o.id;
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-sm transition-all hover:bg-secondary/60 ${checked ? "border-primary/40 bg-primary/5" : "border-white/10 bg-secondary/30"}`}
                      >
                        <input
                          type="radio"
                          name={current.id}
                          checked={checked}
                          onChange={() => setOption(current.id, o.id)}
                        />
                        <span className="text-foreground/80">{o.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={handleNext} size="lg" className="min-w-40">
              {isLast ? "Submit" : timeLeft === 0 ? "Next ->" : "Skip ->"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
