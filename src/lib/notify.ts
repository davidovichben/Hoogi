type Kind = "info" | "success" | "error";

function ensureRoot() {
  let el = document.getElementById("app-toast-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast-root";
    Object.assign(el.style, {
      position: "fixed",
      zIndex: "2147473647",
      right: "16px",
      bottom: "16px",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
    });
    document.body.appendChild(el);
    const style = document.createElement("style");
    style.textContent = `
      .toast {
        min-width: 240px; max-width: 420px;
        padding: 10px 12px; border-radius: 10px;
        background: #111827; color: white; box-shadow: 0 10px 30px rgba(0,0,0,.2);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .toast.success { background:#065f46; } /* green-800 */
      .toast.error   { background:#7f1d1d; } /* red-900 */
    `;
    document.head.appendChild(style);
  }
  return el!;
}

export function notify(msg: string, kind: Kind = "info", ms = 2200) {
  try {
    const root = ensureRoot();
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = msg;
    root.appendChild(el);
    const t = setTimeout(() => {
      el.remove();
      clearTimeout(t);
    }, ms);
  } catch (e) {
    // For server-side rendering or environments without document
    console.log(`[notify-${kind}] ${msg}`);
  }
}

export const toastInfo = (m: string) => notify(m, "info");
export const toastSuccess = (m: string) => notify(m, "success");
export const toastError = (m: string) => notify(m, "error");
