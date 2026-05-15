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
  const linkClass =
    "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white";

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-charcoal/95 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex h-9 items-center gap-2.5 rounded-lg pr-2 text-lg font-bold tracking-tight text-honey"
        >
          <Logo /> Pollinate
        </Link>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-9 place-items-center rounded-lg border border-white/10 bg-transparent text-white/70 transition-colors hover:border-honey/30 hover:bg-white/5 hover:text-honey"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          {user ? (
            <>
              <Link to="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <Link to="/polls/new" className={linkClass}>
                Create
              </Link>
              <span className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-orange/80">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-9 items-center rounded-lg bg-honey px-4 text-sm font-semibold text-white transition-colors hover:bg-honey/90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-secondary/20 px-5 py-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-semibold text-foreground">Pollinate</span>
        </div>
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4">
          <span>Live polls, timed quizzes, and real-time results.</span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
          <span>Built for fast classroom and event feedback.</span>
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
