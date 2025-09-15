import { supabase } from "@/integrations/supabase/client";

// סניטציה לצבעים כדי לא לשבור CHECK CONSTRAINT במסד
function toHexOrNull(v: unknown, fb?: string): string | null {
  try {
    const raw = String(v ?? "").trim().toLowerCase();
    if (!raw) return fb ? fb.toLowerCase() : null;
    // מסירים כל תו שאינו הקס, ואז נגזור 6 תווים
    const only = raw.replace(/[^0-9a-f#]/g, "");
    let h = only.startsWith("#") ? only.slice(1) : only;
    // מקרים של 3 ספרות – נכפיל
    if (/^[0-9a-f]{3}$/.test(h)) h = h.split("").map(c => c + c).join("");
    h = h.slice(0, 6);
    if (/^[0-9a-f]{6}$/.test(h)) return `#${h}`;
    return fb ? fb.toLowerCase() : null;
  } catch {
    return fb ? fb.toLowerCase() : null;
  }
}

export async function rpcCreateQuestionnaire(p_title: string, p_lang?: string) {
  const { data, error } = await supabase.rpc("create_questionnaire", { p_title, p_lang });
  if (error) throw error;
  return data;
}

export async function rpcPublishQuestionnaire(p_id: string) {
  const { data, error } = await supabase.rpc("publish_questionnaire", { p_id });
  if (error) throw error;
  return data; // { token?, is_published? }
}

export async function rpcGetDistributionLinks(p_id: string, baseUrl: string) {
  const { data, error } = await supabase.rpc("get_distribution_links", {
    p_id,
    p_base_url: baseUrl, // שם פרמטר נכון
  });
  if (error) throw error;
  return data as { web_url: string; whatsapp_url: string; mailto_url: string };
}

export async function rpcGetPublicQuestionnaire(token: string) {
  const { data, error } = await supabase.rpc("get_public_questionnaire", { p_token: token });
  if (error) throw error;
  return data;
}

export async function rpcGetPublicBranding(token: string) {
  const { data, error } = await supabase.rpc("get_public_branding", { p_token: token });
  if (error) throw error;
  return data;
}

export async function rpcSubmitResponse(
  tokenOrUuid: string,
  answers: any,
  email?: string,
  phone?: string,
  lang?: string,
  channel?: string
) {
  return supabase.rpc("submit_response", {
    p_token_or_uuid: tokenOrUuid,
    p_answers: answers,
    p_email: email ?? null,
    p_phone: phone ?? null,
    p_lang: lang ?? "he",
    p_channel: channel ?? "landing",
  });
}

// QA helpers
export async function rpcQaQuestionnaires(limit = 20) {
  const { data, error } = await supabase.rpc("qa_questionnaires", { p_limit: limit });
  if (error) throw error;
  return data;
}
export async function rpcQaQuestions(qid: string) {
  const { data, error } = await supabase.rpc("qa_questions", { p_qid: qid });
  if (error) throw error;
  return data;
}
export async function rpcQaResponses(limit = 20) {
  const { data, error } = await supabase.rpc("qa_responses", { p_limit: limit });
  if (error) throw error;
  return data;
}
export async function rpcQaLeads(limit = 20) {
  const { data, error } = await supabase.rpc("qa_leads", { p_limit: limit });
  if (error) throw error;
  return data;
}

/** טוסט בטוח – לא מפיל אם אין ספריית טוסטים */
export const safeToast = (data: { title: string; description?: string }) => {
  try {
    // אם יש ספריית toast גלובלית שלך – קרא אליה כאן (לא חובה)
    // toast({ title: data.title, description: data.description });
    console.log("TOAST:", data.title, data.description ?? "");
  } catch {}
};

/** קבלת User ID פשוטה */
export async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

/** טעינת פרופיל לפי User ID */
export async function fetchProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export type UpsertProfileInput = {
  userId: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string;
  locale?: string;
  brandPrimary?: string | null;
  brandSecondary?: string | null;
  backgroundColor?: string | null;
  brandLogoPath?: string | null;
  occupation?: string | null;
  suboccupation?: string | null;
  links?: {title: string; url: string}[] | null;
};

export async function upsertProfile(input: UpsertProfileInput) {
  const row = {
    id: input.userId,
    business_name: String(input.businessName ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    email: String(input.email ?? "").trim(),
    website: String(input.website ?? "").trim(),
    locale: String(input.locale ?? "he-IL").trim(),
    brand_primary: toHexOrNull(input.brandPrimary, "#000000"),
    brand_secondary: toHexOrNull(input.brandSecondary, "#000000"),
    background_color: toHexOrNull(input.backgroundColor, "#ffffff"),
    brand_logo_path: input.brandLogoPath ?? null,
    occupation: (input.occupation ?? "").trim() || null,
    suboccupation: (input.suboccupation ?? "").trim() || null,
    links: input.links ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) { console.error("upsert profile error:", error); throw error; }
  return data;
}
