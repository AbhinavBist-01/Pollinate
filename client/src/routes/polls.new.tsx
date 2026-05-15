import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import api from "../lib/api";

interface Option {
  text: string;
  order: number;
  isCorrect: boolean;
}

interface Question {
  text: string;
  type: "radio" | "checkbox" | "text";
  order: number;
  isRequired: boolean;
  timeLimit?: number;
  options: Option[];
}

const emptyOption = (order: number): Option => ({
  text: "",
  order,
  isCorrect: false,
});

export const Route = createFileRoute("/polls/new")({
  component: PollBuilder,
  beforeLoad: () => {
    if (!localStorage.getItem("token")) throw redirect({ to: "/login" });
  },
});

function PollBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: "",
      type: "radio",
      order: 0,
      isRequired: true,
      options: [emptyOption(0)],
    },
  ]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        type: "radio",
        order: prev.length,
        isRequired: true,
        options: [emptyOption(0)],
      },
    ]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQuestion(i: number, field: keyof Question, value: any) {
    setQuestions((prev) => {
      const qs = [...prev];
      const current = qs[i];

      if (field === "type" && (value === "radio" || value === "checkbox")) {
        const options = current.options.length
          ? current.options
          : [emptyOption(0)];
        const firstCorrectIndex = options.findIndex(
          (option) => option.isCorrect,
        );
        qs[i] = {
          ...current,
          type: value,
          options: options.map((option, index) => ({
            ...option,
            isCorrect:
              value === "radio"
                ? index === firstCorrectIndex
                : option.isCorrect,
          })),
        };
      } else if (field === "type" && value === "text") {
        qs[i] = { ...current, type: value, options: [] };
      } else {
        qs[i] = { ...current, [field]: value };
      }
      return qs;
    });
  }

  function addOption(qi: number) {
    setQuestions((prev) => {
      const qs = [...prev];
      qs[qi] = {
        ...qs[qi],
        options: [...qs[qi].options, emptyOption(qs[qi].options.length)],
      };
      return qs;
    });
  }

  function updateOption(qi: number, oi: number, text: string) {
    setQuestions((prev) => {
      const qs = [...prev];
      qs[qi] = {
        ...qs[qi],
        options: qs[qi].options.map((o, idx) =>
          idx === oi ? { ...o, text } : o,
        ),
      };
      return qs;
    });
  }

  function toggleCorrectOption(qi: number, oi: number) {
    setQuestions((prev) => {
      const qs = [...prev];
      const question = qs[qi];
      qs[qi] = {
        ...question,
        options: question.options.map((option, idx) => ({
          ...option,
          isCorrect:
            question.type === "radio"
              ? idx === oi
              : idx === oi
                ? !option.isCorrect
                : option.isCorrect,
        })),
      };
      return qs;
    });
  }

  function removeOption(qi: number, oi: number) {
    setQuestions((prev) => {
      const qs = [...prev];
      qs[qi] = {
        ...qs[qi],
        options: qs[qi].options.filter((_, idx) => idx !== oi),
      };
      return qs;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await api.post("/api/polls", {
      title,
      description,
      allowAnonymous,
      questions,
    });
    navigate({ to: "/polls/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Create Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70">
              Poll title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-lg text-white placeholder-white/30 focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
              placeholder="What's your poll about?"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
              rows={2}
              placeholder="Add some context..."
            />
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={allowAnonymous}
              onChange={(e) => setAllowAnonymous(e.target.checked)}
              className="mt-1 rounded border-white/20 bg-white/5 text-honey focus:ring-honey"
            />
            <span>
              <span className="block text-sm font-medium text-white/80">
                Allow anonymous responses
              </span>
              <span className="mt-1 block text-xs text-white/40">
                Turn this off when voters must enter a name for the leaderboard.
              </span>
            </span>
          </label>
        </div>

        {questions.map((q, qi) => (
          <div
            key={qi}
            className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_96px_112px_auto] lg:items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">
                  Question {qi + 1}
                </label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
                  placeholder="Enter your question"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Type</label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, "type", e.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-honey focus:outline-none"
                >
                  <option value="radio">Single choice</option>
                  <option value="checkbox">Multiple choice</option>
                  <option value="text">Free text</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Timer</label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={q.timeLimit ?? ""}
                  onChange={(e) =>
                    updateQuestion(
                      qi,
                      "timeLimit",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-honey focus:outline-none"
                  placeholder="Off"
                />
              </div>
              <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={q.isRequired}
                  onChange={(e) =>
                    updateQuestion(qi, "isRequired", e.target.checked)
                  }
                  className="rounded border-white/20 bg-white/5 text-honey focus:ring-honey"
                />
                Required
              </label>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="h-10 rounded-lg border border-red-400/20 px-3 text-sm text-red-400/70 transition-colors hover:bg-red-400/10 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>

            {(q.type === "radio" || q.type === "checkbox") && (
              <div className="space-y-2">
                <div className="hidden grid-cols-[92px_minmax(0,1fr)_40px] gap-2 px-1 text-xs uppercase tracking-[0.16em] text-white/30 sm:grid">
                  <span>Answer</span>
                  <span>Option text</span>
                  <span />
                </div>
                {q.options.map((o, oi) => (
                  <div
                    key={oi}
                    className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)_40px] sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCorrectOption(qi, oi)}
                      className={`h-10 rounded-lg border px-3 text-xs font-medium transition-colors ${
                        o.isCorrect
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-black/20 text-white/40 hover:text-white/70"
                      }`}
                    >
                      Correct
                    </button>
                    <input
                      type="text"
                      value={o.text}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none"
                      placeholder={`Option ${oi + 1}`}
                      required
                    />
                    {q.options.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="h-10 rounded-lg border border-white/10 text-sm text-white/30 transition-colors hover:border-red-400/30 hover:text-red-400"
                      >
                        X
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="text-sm text-honey/70 transition-colors hover:text-honey"
                >
                  + Add option
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full rounded-xl border-2 border-dashed border-white/10 py-4 text-sm font-medium text-white/40 transition-colors hover:border-honey/30 hover:text-honey"
        >
          + Add question
        </button>
        <button
          type="submit"
          className="w-full rounded-xl bg-honey py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-honey/90"
        >
          Create Poll
        </button>
      </form>
    </div>
  );
}
