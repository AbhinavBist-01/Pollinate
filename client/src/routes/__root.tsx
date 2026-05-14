import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "../lib/auth";

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
  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-charcoal/95 backdrop-blur-xl px-6 py-3.5">
      <div className="mx-auto flex max-w-5xl items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold text-honey tracking-tight"
        >
          <Logo /> Pollinate
        </Link>
        <div className="flex-1" />
        {user ? (
          <div className="flex items-center gap-5">
            <Link
              to="/dashboard"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/polls/new"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Create
            </Link>
            <span className="text-sm text-orange/80">{user.name}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-white/10 px-3.5 py-1.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-honey px-4 py-1.5 text-sm font-medium text-white hover:bg-honey/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function RootLayout() {
  return (
    <AuthProvider>
      <Nav />
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </AuthProvider>
  );
}
