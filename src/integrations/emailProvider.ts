// Email provider – Resend first, fallback to Simulation
export type SendEmailArgs = { to: string; subject: string; html?: string; text?: string };

const RESEND_API_KEY = import.meta.env?.VITE_RESEND_API_KEY || process.env?.RESEND_API_KEY;
const EMAIL_FROM = import.meta.env?.VITE_EMAIL_FROM || process.env?.EMAIL_FROM || "no-reply@example.com";

async function sendViaResend({ to, subject, html, text }: SendEmailArgs) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function sendEmail(args: SendEmailArgs) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY missing – Simulation mode");
    return { simulated: true, provider: "resend", args } as const;
  }
  return sendViaResend(args);
}

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}
