export function buildPublicUrl(
  token: string,
  lang?: "he" | "en",
  ref?: string
): string {
  // Prefer explicit base URL if set; otherwise current origin (browser)
  const explicit = (import.meta as ImportMeta).env?.VITE_PUBLIC_BASE_URL as string | undefined;
  const origin = (explicit && explicit.trim().length > 0
    ? explicit
    : (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");

  const url = new URL(`/q/${token}`, origin);
  if (lang) url.searchParams.set("lang", lang);
  if (ref) url.searchParams.set("ref", ref);
  return url.toString();
}