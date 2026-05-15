import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  initializeTheme: () => void;
  toggleTheme: () => void;
}

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function applyTheme(theme: Theme) {
  if (!canUseDom()) return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  window.localStorage.setItem("pollinate:theme", theme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  initializeTheme: () => {
    if (!canUseDom()) return;
    const stored = window.localStorage.getItem("pollinate:theme");
    const nextTheme: Theme = stored === "light" ? "light" : "dark";
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
  toggleTheme: () => {
    const nextTheme: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
