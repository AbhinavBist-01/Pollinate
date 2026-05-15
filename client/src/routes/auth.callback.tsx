import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { setToken } from "../lib/api";
import { consumeReturnTo } from "../lib/return-to";
import { useAuthStore } from "#/state/auth-store";

export const Route = createFileRoute("/auth/callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const done = useRef(false);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");
    if (token) {
      setToken(token);
      hydrate()
        .then(() => {
          const returnTo = consumeReturnTo();
          if (returnTo) {
            window.location.replace(returnTo);
            return;
          }
          navigate({ to: "/dashboard", replace: true });
        })
        .catch(() => navigate({ to: "/login", replace: true }));
    } else if (error) {
      navigate({
        to: "/login",
        search: { oauthError: error },
        replace: true,
      });
    } else {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrate, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-charcoal">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-honey border-t-transparent animate-spin" />
        <p className="text-white/50">Completing sign in...</p>
      </div>
    </div>
  );
}
