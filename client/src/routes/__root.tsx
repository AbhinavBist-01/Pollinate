import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../lib/auth";
import { useThemeStore } from "#/state/theme-store";

export const Route = createRootRoute({ component: RootLayout });

function Logo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#FB923C" />
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="6"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="12"
        x2="6"
        y2="12"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="12"
        x2="22"
        y2="12"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Nav() {
  const { user, logout } = useAuth();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const navItemClass =
    "inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white";
  const iconLinkClass =
    "grid size-9 place-items-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-honey/30 hover:bg-white/5 hover:text-honey";

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-card/90 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-center md:justify-start">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2.5 rounded-full pr-3 text-lg font-black tracking-tight text-honey"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-honey/20 bg-honey/10">
              <Logo />
            </span>
            Pollinate
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {!user && (
            <>
              <Link to="/login" className={navItemClass}>
                Login
              </Link>
              <Link to="/register" className={navItemClass}>
                Register
              </Link>
            </>
          )}
          <Link to="/polls/new" className={navItemClass}>
            Create Poll
          </Link>
          <Link to="/dashboard" className={navItemClass}>
            Results
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className={iconLinkClass}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          {user ? (
            <>
              <span className="inline-flex h-9 max-w-32 items-center truncate rounded-full border border-honey/20 bg-honey/10 px-3 text-sm font-semibold text-orange/80">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="inline-flex h-9 items-center rounded-full border border-white/10 px-4 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/register"
              className="inline-flex h-10 items-center rounded-xl bg-honey px-5 text-sm font-black text-white shadow-lg shadow-honey/15 transition-colors hover:bg-honey/90"
            >
              Get started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-secondary/20 px-5 py-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Copyright 2026 Pollinate. Live polling, quizzes, and real-time
          results.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AbhinavBist-01"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-honey"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/abhinavsingh015"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-honey"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

function RootLayout() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
