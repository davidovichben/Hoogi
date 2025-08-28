export type Channel = "whatsapp" | "facebook" | "linkedin" | "instagram" | "direct" | "email";

export function buildPublicBase(): string {
  const env = (import.meta as any).env;
  // אפשר להגדיר VITE_PUBLIC_SITE_URL ב-.env.local; אחרת מקור ה-URL מהדפדפן.
  return (env && env.VITE_PUBLIC_SITE_URL) || window.location.origin;
}

export function buildDistributeUrl(token: string, opts: { lang?: string; partnerId?: string|null; channel?: string|null } = {}) {
  const base = buildPublicBase();
  const params = new URLSearchParams();
  if (opts.lang) params.set("lang", opts.lang);
  if (opts.partnerId) params.set("ref", String(opts.partnerId));
  if (opts.channel) params.set("channel", String(opts.channel));
  return `${base}/q/${token}${params.toString() ? "?" + params.toString() : ""}`;
}

export function openShare(channel: Channel, url: string) {
  const text = url;
  // Web Share API כשזמין
  if (navigator.share && (channel === "direct" || channel === "email")) {
    navigator.share({ title: "שאלון", text, url }).catch(() => {});
    return;
  }
  if (channel === "whatsapp") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  } else if (channel === "facebook") {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  } else if (channel === "linkedin") {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  } else if (channel === "instagram") {
    // אין API לשיתוף קישור ישיר באינסטגרם; נפתח העתקה ללוח.
    navigator.clipboard?.writeText(url);
    alert("הקישור הועתק. הדביקי אותו ב-Instagram Stories/ביוגרפיה.");
  } else if (channel === "email") {
    window.location.href = `mailto:?subject=${encodeURIComponent("שאלון חדש")}&body=${encodeURIComponent(url)}`;
  } else {
    navigator.clipboard?.writeText(url);
    alert("הקישור הועתק.");
  }
}
