export function getBaseUrl(): string {
  const env = (import.meta.env.VITE_APP_BASE_URL ?? "").trim();
  if (typeof window === 'undefined') {
    // Fallback for server-side rendering or build environments
    return env || 'http://localhost:8080';
  }
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.") ||
    window.location.protocol === "http:";
  if (isLocal || !env) return window.location.origin;
  try { new URL(env); return env; } catch { return window.location.origin; }
}
