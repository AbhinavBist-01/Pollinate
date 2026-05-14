import { create } from "zustand";
import api, { clearAuth, getToken, setToken } from "#/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  hydrate: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    try {
      const { data } = await api.get<User>("/api/auth/me");
      set({ user: data, loading: false });
    } catch {
      clearAuth();
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/api/auth/login",
      { email, password },
    );
    setToken(data.token);
    set({ user: data.user, loading: false });
  },
  register: async (name, email, password) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/api/auth/register",
      { name, email, password },
    );
    setToken(data.token);
    set({ user: data.user, loading: false });
  },
  logout: () => {
    clearAuth();
    set({ user: null, loading: false });
  },
}));
