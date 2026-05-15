import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

const api = axios.create({
  baseURL: API_URL,
});

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;

export function setToken(token: string) {
  if (canUseStorage()) {
    window.localStorage.setItem("token", token);
  }
}

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem("token");
}

export function clearAuth() {
  if (canUseStorage()) {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
  }
}
