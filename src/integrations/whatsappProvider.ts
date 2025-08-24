// WhatsApp provider – Meta Cloud API, fallback to Simulation
export type SendWAArgs = { toPhone: string; body: string };

const META_WA_TOKEN = import.meta.env?.VITE_META_WA_TOKEN;
const META_WA_PHONE_ID = import.meta.env?.VITE_META_WA_PHONE_ID; // numeric ID

async function sendViaMeta({ toPhone, body }: SendWAArgs) {
  if (!META_WA_TOKEN || !META_WA_PHONE_ID) throw new Error("Missing Meta WA env");
  const url = `https://graph.facebook.com/v20.0/${META_WA_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${META_WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta WA error ${res.status}: ${t}`);
  }
  return res.json();
}

export async function sendWhatsApp(args: SendWAArgs) {
  if (!META_WA_TOKEN || !META_WA_PHONE_ID) {
    console.warn("[WhatsApp] META env missing – Simulation mode");
    return { simulated: true, provider: "meta_whatsapp", args } as const;
  }
  return sendViaMeta(args);
}

export function isWhatsAppConfigured(): boolean {
  return !!(META_WA_TOKEN && META_WA_PHONE_ID);
}
