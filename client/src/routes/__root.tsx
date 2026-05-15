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

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.6 2.8 4 2 .1-.8.4-1.4.8-1.7-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.6 6.3 18.6 6.6 18.6 6.6c.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.38 8.25h4.2V24H.38V8.25ZM8.1 8.25h4.03v2.15h.06c.56-1.06 1.94-2.18 3.99-2.18 4.27 0 5.06 2.8 5.06 6.45V24h-4.2v-8.27c0-1.97-.03-4.5-2.74-4.5-2.75 0-3.17 2.14-3.17 4.36V24H8.1V8.25Z" />
    </svg>
  );
}

function Nav() {
  const { user, logout } = useAuth();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const navItemClass =
    "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white";
  const iconLinkClass =
    "grid size-9 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-honey/30 hover:bg-white/5 hover:text-honey";

  return (
    <nav className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 rounded-[1.75rem] border border-white/10 bg-card/90 px-4 py-3 shadow-2xl shadow-black/20 md:grid-cols-[1fr_auto_1fr]">
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
          <a
            href="https://github.com/AbhinavBist-01"
            target="_blank"
            rel="noreferrer"
            className={iconLinkClass}
            aria-label="GitHub"
            title="GitHub"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://www.linkedin.com/in/abhinavsingh015"
            target="_blank"
            rel="noreferrer"
            className={iconLinkClass}
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <LinkedInIcon />
          </a>
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
              className="inline-flex h-10 items-center rounded-full bg-honey px-5 text-sm font-black text-white shadow-lg shadow-honey/15 transition-colors hover:bg-honey/90"
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
        <p>© 2026 Pollinate. Live polling, quizzes, and real-time results.</p>
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
