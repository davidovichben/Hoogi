// src/lib/preview.ts
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/baseUrl";
import { rpcPublishQuestionnaire, safeToast } from "@/lib/rpc";

export async function getPublishState(qid: string) {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("token,is_published")
    .eq("id", qid)
    .single();
  if (error) throw error;
  return { token: data?.token as string | null, is_published: !!data?.is_published };
}

export function openPublic(token: string, lang = "he", ref = "preview") {
  const url = new URL(`/q/${token}?lang=${lang}&ref=${ref}`, getBaseUrl());
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

export function openPrivatePreview(qid: string, lang = "he") {
  const url = new URL(`/q/preview/${qid}?lang=${lang}`, getBaseUrl());
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/** לוגיקת תצוגה: ציבורי אם פורסם, אחרת תצוגת טיוטה פרטית */
export async function previewAny(qid: string, lang = "he", ref = "preview") {
  try {
    const { token, is_published } = await getPublishState(qid);
    if (is_published && token) return openPublic(token, lang, ref);
    return openPrivatePreview(qid, lang);
  } catch (e) {
    console.error(e);
    safeToast({ title: "שגיאה", description: "לא ניתן להציג תצוגה כרגע." });
  }
}

/** פרסום מפורש ורענון קישורים אחרי פרסום */
export async function publishThen(qid: string, cb?: () => void) {
  try {
    await rpcPublishQuestionnaire(qid);
    safeToast({ title: "פורסם", description: "השאלון פורסם ונוצר קישור ציבורי." });
    cb?.();
  } catch (e) {
    console.error(e);
    safeToast({ title: "שגיאה", description: "פרסום נכשל." });
  }
}
