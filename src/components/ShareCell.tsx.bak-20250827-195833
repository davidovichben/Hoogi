import { useMemo } from "react";
const siteUrl = (import.meta as any).env.VITE_SITE_URL || window.location.origin;

export function ShareCell({ row }: { row: any }) {
  const link = useMemo(() => `${siteUrl}/q/${row.id}?t=${row.form_token}`, [row?.id, row?.form_token]);

  const waText = encodeURIComponent(`היי! מוזמנ/ת למלא שאלון קצר: ${row.title || ""}\nהקישור: ${link}\n\nתודה, AI-4biz`);
  const waUrl = `https://wa.me/?text=${waText}`;

  const mailSubject = encodeURIComponent(`שאלון: ${row.title || "AI-4biz"}`);
  const mailBody = encodeURIComponent(`היי,\n\nנשמח למלא שאלון קצר:\n${link}\n\nתודה רבה,\nAI-4biz`);
  const mailtoUrl = `mailto:?subject=${mailSubject}&body=${mailBody}`;

  const embedCode = `<iframe src="${link}" width="100%" height="900" style="border:0;max-width:750px;" allow="clipboard-write"></iframe>`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;

  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); alert("הועתק ✓"); } catch {} };

  return (
    <div className="flex flex-wrap gap-2">
      <input className="border rounded px-2 py-1 w-64" value={link} readOnly />
      <button className="border rounded px-3 py-1" onClick={() => copy(link)}>העתק קישור</button>
      <button className="border rounded px-3 py-1" onClick={() => window.open(waUrl, "_blank")}>שלח ב-WhatsApp</button>
      <button className="border rounded px-3 py-1" onClick={() => (window.location.href = mailtoUrl)}>שלח במייל</button>
      <button className="border rounded px-3 py-1" onClick={() => copy(embedCode)}>העתק קוד הטמעה</button>
      <button className="border rounded px-3 py-1" onClick={() => window.open(qrUrl, "_blank")}>QR להדפסה</button>
    </div>
  );
}
