// supabase/functions/on-new-lead/index.ts
// Deno Edge Function – מופעלת ע"י טריגר DB (HTTP POST) עם חתימה בכותרת.
// לא לגעת בעיצוב/פרונט—זה צד-שרת בלבד.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type LeadRecord = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  questionnaire_id?: string | null;
  created_at?: string;
  [k: string]: unknown;
};

type TriggerPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: LeadRecord;
};

const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") ?? ""; // אופציונלי
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""; // אופציונלי
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com"; // אופציונלי
const TO_EMAIL = Deno.env.get("TO_EMAIL") ?? ""; // אם רוצים אימייל לכל ליד
const INCOMING_SECRET = Deno.env.get("INCOMING_WEBHOOK_SECRET") ?? ""; // חובה אם מוודאים חתימה

function assertSignature(req: Request) {
  if (!INCOMING_SECRET) return true; // אם לא הוגדר, מדלגים על בדיקה (DEV)
  const sig = req.headers.get("x-webhook-secret") || "";
  return sig === INCOMING_SECRET;
}

async function sendWebhook(record: LeadRecord) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "lead.created", data: record }),
    });
  } catch (err) {
    console.error("Webhook error:", err);
  }
}

async function sendEmail(record: LeadRecord) {
  if (!RESEND_API_KEY || !TO_EMAIL) return;
  try {
    const subject = `ליד חדש: ${record.email ?? record.phone ?? record.name ?? record.id}`;
    const text = [
      `Lead ID: ${record.id}`,
      `Name: ${record.name ?? "-"}`,
      `Email: ${record.email ?? "-"}`,
      `Phone: ${record.phone ?? "-"}`,
      `Questionnaire: ${record.questionnaire_id ?? "-"}`,
      `Created at: ${record.created_at ?? "-"}`,
    ].join("\n");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject,
        text,
      }),
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!assertSignature(req)) {
      return new Response("Forbidden", { status: 403 });
    }

    const payload = (await req.json()) as TriggerPayload;
    if (payload?.type !== "INSERT" || payload?.table !== "leads") {
      return new Response("Ignored", { status: 200 });
    }

    const lead = payload.record;
    // הרצה במקביל: webhook + email
    await Promise.all([sendWebhook(lead), sendEmail(lead)]);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Error", { status: 500 });
  }
});
