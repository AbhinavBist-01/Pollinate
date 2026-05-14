import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-honey/20 bg-honey/5 px-4 py-1.5 text-sm text-honey mb-8">
        <span className="w-2 h-2 rounded-full bg-honey animate-pulse" />
        Live polling platform
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-[1.05] max-w-3xl">
        Polls that feel like{" "}
        <span className="text-honey">they're happening live</span>
      </h1>
      <p className="mt-5 text-lg text-white/50 max-w-lg">
        Create timed quizzes, collect responses, and watch results update in
        real-time.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          to="/polls/new"
          className="rounded-xl bg-honey px-8 py-3 text-sm font-semibold text-white hover:bg-honey/90 transition-colors shadow-lg shadow-honey/20"
        >
          Create a poll
        </Link>
        {!user ? (
          <Link
            to="/register"
            className="rounded-xl border border-white/15 px-8 py-3 text-sm font-medium text-white/70 hover:text-white hover:border-white/30 transition-colors"
          >
            Create account
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="rounded-xl border border-white/15 px-8 py-3 text-sm font-medium text-white/70 hover:text-white hover:border-white/30 transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>
      {!user && (
        <p className="mt-8 text-sm text-white/30">
          Already have an account?{" "}
          <Link to="/login" className="text-orange hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
