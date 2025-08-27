import React, { useEffect, useRef } from "react";
import { toast } from "./ui/Toaster";
import { Mail, Share2, Copy, Send, MessageSquare } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title?: string;
  subject?: string;
  body?: string; // appended to link
  whatsappTemplate?: string; // e.g. "היי! מוזמן/ת למלא: {link}"
};

export default function ShareDialog({ open, onOpenChange, url, title = "iHoogi Link", subject, body, whatsappTemplate = "{link}" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Focus trap within modal
  useEffect(() => {
    if (!open || !ref.current) return;
    const container = ref.current;
    const selectors = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(el => !el.hasAttribute('disabled'));
    const focusables = getFocusable();
    if (focusables.length) focusables[0].focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedSubject = encodeURIComponent(subject ?? title);
  const fullBody = `${body ? body + "\n\n" : ""}${url}`;
  const encodedBody = encodeURIComponent(fullBody);

  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
  const outlook = `https://outlook.office.com/mail/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}`;
  const waText = encodeURIComponent((whatsappTemplate || "{link}").replace("{link}", url));
  const whatsapp = `https://wa.me/?text=${waText}`;

  async function doCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast?.success?.("קישור הועתק", { description: "הדבק בכל מקום שתרצי" });
    } catch {
      toast?.error?.("אי אפשר להעתיק", { description: "נסי לסמן ולהעתיק ידנית" });
    }
  }

  async function doNativeShare() {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: body, url });
        toast?.success?.("שיתוף נשלח");
      } catch {
        toast?.info?.("שיתוף בוטל");
      }
    } else {
      toast?.info?.("דפדפן לא תומך בשיתוף מקומי");
    }
  }

  function openCentered(href: string) {
    try {
      const w = 880, h = 600;
      const topWin: any = window.top || window;
      const y = (topWin.outerHeight / 2) + topWin.screenY - (h / 2);
      const x = (topWin.outerWidth / 2) + topWin.screenX - (w / 2);
      const popup = window.open(href, "_blank", `popup=yes,width=${w},height=${h},left=${x},top=${y}`);
      if (!popup || popup.closed) {
        // fallback: copy link
        doCopy();
      }
    } catch {
      // fallback: copy link
      doCopy();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100]"
      aria-labelledby="share-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div
        ref={ref}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 w-[94vw] max-w-md rounded-2xl shadow-xl border p-4 focus:outline-none"
      >
        <div className="mb-3">
          <h2 id="share-title" className="text-lg font-semibold">שיתוף קישור</h2>
          <p className="text-sm text-muted-foreground">בחרי יעד לשיתוף או העתיקי את הקישור</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={doCopy} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="העתק קישור">
            <Copy className="w-4 h-4" /> העתק קישור
          </button>

          <button onClick={() => openCentered(gmail)} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="Gmail">
            <Mail className="w-4 h-4" /> Gmail
          </button>

          <button onClick={() => openCentered(outlook)} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="Outlook">
            <Send className="w-4 h-4" /> Outlook
          </button>

          <button onClick={() => openCentered(whatsapp)} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="WhatsApp">
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </button>

          <button onClick={doNativeShare} className="col-span-2 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="שיתוף מקומי">
            <Share2 className="w-4 h-4" /> שיתוף…
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <code className="text-xs bg-muted rounded px-2 py-1 overflow-x-auto" aria-label="קישור לשיתוף">{url}</code>
          <button onClick={() => onOpenChange(false)} className="text-sm px-3 py-1 rounded-md border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" aria-label="סגור">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}


