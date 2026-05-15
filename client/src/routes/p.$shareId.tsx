import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import api from "../lib/api";
import {
  joinPollRoom,
  leavePollRoom,
  offPollLiveState,
  offParticipantCount,
  onPollLiveState,
  onParticipantCount,
  socket,
  type PollLiveState,
} from "../lib/socket";

export const Route = createFileRoute("/p/$shareId")({
  component: PublicResponse,
});

interface LeaderboardEntry {
  rank: number;
  respondentName: string;
  correctAnswers: number;
  totalScoreableQuestions: number;
  scorePercent: number;
}

function PublicResponse() {
  const { shareId } = Route.useParams();
  const [poll, setPoll] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any[]>>({});
  const [error, setError] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [liveState, setLiveState] = useState<PollLiveState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoredQuestionCount, setScoredQuestionCount] = useState(0);
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );

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

    const participantHandler = (event: { pollId: string; count: number }) => {
      if (event.pollId === poll.id) setParticipantCount(event.count);
    };
    const liveHandler = (event: {
      pollId: string;
      state: PollLiveState | null;
    }) => {
      if (event.pollId !== poll.id) return;
      setLiveState(event.state);
      if (event.state?.isActive) {
        setCurrentIdx(event.state.currentQuestionIndex);
      }
    };

    onParticipantCount(participantHandler);
    onPollLiveState(liveHandler);
    return () => {
      offParticipantCount(participantHandler);
      offPollLiveState(liveHandler);
      leavePollRoom(poll.id);
    };
  }, [poll?.id]);

  useEffect(() => {
    if (!liveState?.isActive || !liveState.endsAt) {
      setTimeLeft(null);
      return;
    }

    const endsAt = liveState.endsAt;

    function syncTimeLeft() {
      setTimeLeft(
        Math.max(
          0,
          Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000),
        ),
      );
    }

    syncTimeLeft();
    const timer = setInterval(syncTimeLeft, 500);
    return () => clearInterval(timer);
  }, [liveState]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const { data } = await api.get(
        `/api/public/polls/${shareId}/leaderboard`,
      );
      setLeaderboard(data.leaderboard ?? []);
      setScoredQuestionCount(data.scoredQuestionCount ?? 0);
    } catch {
      setLeaderboard([]);
      setScoredQuestionCount(0);
    }
  }, [shareId]);

  useEffect(() => {
    if (poll?.status === "ended" || liveState?.isCompleted) {
      void loadLeaderboard();
    }
  }, [loadLeaderboard, poll?.status, liveState?.isCompleted]);

  const questions = poll?.questions ?? [];
  const current = questions[currentIdx];
  const isQuestionOpen = Boolean(
    liveState?.isActive &&
    liveState.acceptingResponses &&
    liveState.currentQuestionId === current?.id &&
    timeLeft !== null &&
    timeLeft > 0,
  );
  const hasSubmittedCurrent = current
    ? submittedQuestionIds.has(current.id)
    : false;

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

  async function handleSubmitCurrent() {
    if (!current) return;
    const currentAnswers = (answers[current.id] ?? []).filter(Boolean);

    if (current.isRequired && currentAnswers.length === 0) {
      setError("Please answer the current question before submitting");
      return;
    }

    try {
      await api.post(`/api/public/polls/${shareId}/respond`, {
        respondentName: respondentName.trim() || undefined,
        voterSessionId: getVoterSessionId(),
        answers: currentAnswers,
      });
      setSubmittedQuestionIds((prev) => new Set(prev).add(current.id));
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
      <div className="grid min-h-screen place-items-center px-6">
        <Card className="max-w-md border-white/10 bg-card/90 text-center">
          <CardContent className="p-8">
            <p className="text-primary">{error}</p>
            <Button className="mt-5" onClick={() => setError("")}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  if (!poll)
    return (
      <p className="py-20 text-center text-muted-foreground">Loading...</p>
    );

  const isCompleted = poll.status === "ended" || liveState?.isCompleted;

  if (isCompleted) {
    return (
      <div className="grid min-h-screen place-items-center px-6 py-10">
        <Card className="w-full max-w-2xl border-white/10 bg-card/90">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Quiz completed
              </p>
              <h1 className="mt-2 text-3xl font-black text-foreground">
                Leaderboard
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Read-only results. Answers are closed.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No responses yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className="grid grid-cols-[52px_1fr_auto] items-center gap-3 p-4"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        #{entry.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {entry.respondentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.correctAnswers} /{" "}
                          {entry.totalScoreableQuestions || scoredQuestionCount}{" "}
                          correct
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
                        {entry.scorePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Join live poll
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!liveState?.isActive || !current) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <Card className="w-full max-w-md border-white/10 bg-card/90 text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full border border-red-400/20 bg-red-400/10">
              <span className="size-3 rounded-full bg-red-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground">
              Waiting for the host
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The next question will appear here when the poll owner opens it.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              {participantCount} participant
              {participantCount !== 1 ? "s" : ""} online
            </p>
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
            {participantCount} online / {currentIdx + 1}/{questions.length}
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
          <div className="text-center">
            <div
              className={`mx-auto grid size-16 place-items-center rounded-full text-2xl font-black ${
                !isQuestionOpen || (timeLeft !== null && timeLeft <= 5)
                  ? "bg-destructive/10 text-destructive animate-pulse"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {timeLeft ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isQuestionOpen ? "seconds left" : "responses closed"}
            </p>
          </div>

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
                  disabled={!isQuestionOpen || hasSubmittedCurrent}
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
                          disabled={!isQuestionOpen || hasSubmittedCurrent}
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
                          disabled={!isQuestionOpen || hasSubmittedCurrent}
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
            <Button
              onClick={handleSubmitCurrent}
              size="lg"
              className="min-w-40"
              disabled={!isQuestionOpen || hasSubmittedCurrent}
            >
              {hasSubmittedCurrent
                ? "Answer submitted"
                : isQuestionOpen
                  ? "Submit answer"
                  : "Waiting for host"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
