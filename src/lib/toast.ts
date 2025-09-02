export function safeToast(msg: { title?: string; description?: string } | string) {
  try {
    const t = (window as any).toast || (window as any).__toast || null;
    if (t && typeof t === "function") {
      if (typeof msg === "string") t(msg); else t(`${msg.title ?? ""} ${msg.description ?? ""}`.trim());
    } else {
      if (typeof msg === "string") console.info("[toast]", msg);
      else console.info("[toast]", msg.title ?? "", msg.description ?? "");
    }
  } catch { /* no-op */ }
}
