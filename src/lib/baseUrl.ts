// src/lib/baseUrl.ts
export function getBaseUrl() {
  const env = import.meta.env.VITE_APP_BASE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:8080";
}
