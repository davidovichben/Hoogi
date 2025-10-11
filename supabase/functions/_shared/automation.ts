// Deno-compatible automation service + lightweight providers

export type AutoTask = {
  id: string;
  type: "email_reply" | "whatsapp_reply" | "analysis";
  status: "queued" | "processing" | "done" | "error";
  payload: any;
};

type DbAdapter = {
  listQueued: () => Promise<AutoTask[]>;
  markProcessing: (id: string) => Promise<void>;
  markDone: (id: string, payload?: any) => Promise<void>;
  markError: (id: string, error: string) => Promise<void>;
};

async function sendEmail(args: { to: string; subject: string; html?: string; text?: string }) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@example.com";
  if (!RESEND_API_KEY) {
    return { simulated: true, provider: "resend", args } as const;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: EMAIL_FROM, to: args.to, subject: args.subject, html: args.html, text: args.text })
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function sendWhatsApp(args: { toPhone: string; body: string }) {
  const token = Deno.env.get("META_WA_TOKEN");
  const phoneId = Deno.env.get("META_WA_PHONE_ID");
  if (!token || !phoneId) {
    return { simulated: true, provider: "meta_whatsapp", args } as const;
  }
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to: args.toPhone, type: "text", text: { body: args.body } })
  });
  if (!res.ok) throw new Error(`Meta WA error ${res.status}: ${await res.text()}`);
  return await res.json();
}

export function createAutomationService(db: DbAdapter) {
  return {
    async processQueue() {
      const jobs = await db.listQueued();
      for (const job of jobs) {
        try {
          await db.markProcessing(job.id);
          if (job.type === "email_reply") {
            const { to, subject, html, text } = job.payload ?? {};
            const r = await sendEmail({ to, subject, html, text });
            await db.markDone(job.id, r);
          } else if (job.type === "whatsapp_reply") {
            const { toPhone, body } = job.payload ?? {};
            const r = await sendWhatsApp({ toPhone, body });
            await db.markDone(job.id, r);
          } else if (job.type === "analysis") {
            const r = { summary: "ok", ts: Date.now() };
            await db.markDone(job.id, r);
          } else {
            throw new Error(`Unknown task type: ${job.type}`);
          }
        } catch (e: any) {
          await db.markError(job.id, e?.message || String(e));
        }
      }
    }
  };
}