// Generic queue processors calling providers – framework-agnostic
import { sendEmail } from "../integrations/emailProvider";
import { sendWhatsApp } from "../integrations/whatsappProvider";

export type AutoTask = {
  id: string;
  type: "email_reply" | "whatsapp_reply" | "analysis";
  status: "queued" | "processing" | "done" | "error";
  payload: any;
};

// Inject DB adapters (Supabase client wrapper)
export function createAutomationService(db: {
  listQueued: () => Promise<AutoTask[]>;
  markProcessing: (id: string) => Promise<void>;
  markDone: (id: string, payload?: any) => Promise<void>;
  markError: (id: string, error: string) => Promise<void>;
}) {
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
            // Optional: add sentiment/keywords here or call your AI endpoint
            const r = { summary: "ok", ts: Date.now() };
            await db.markDone(job.id, r);
          } else {
            throw new Error(`Unknown task type: ${job.type}`);
          }
        } catch (e: any) {
          await db.markError(job.id, e?.message || String(e));
        }
      }
    },
  };
}
