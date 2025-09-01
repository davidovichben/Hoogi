import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/baseUrl";
import { rpcPublishQuestionnaire, safeToast } from "@/lib/rpc";

/** שליפת מצב פרסום וטוקן לשאלון */
export async function getPublishState(qid: string) {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("token,is_published")
    .eq("id", qid)
    .single();
  if (error) throw error;
  return { token: data?.token as string | null, is_published: !!data?.is_published };
}

/** פרסום מפורש (קריאה ל-RPC) */
export async function publishExplicit(qid: string) {
  const res = await rpcPublishQuestionnaire(qid);
  const token = (res as any)?.token as string | undefined;
  if (!token) throw new Error("publish returned without token");
  return token;
}

/** פתיחת תצוגה/הצגה בלשונית חדשה */
export function openPreviewByToken(token: string, lang: string = "he", ref: string = "preview") {
  const url = new URL(`/q/${token}?lang=${lang}&ref=${ref}`, getBaseUrl());
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/**
 * זרימה מלאה:
 * - אם פורסם ויש token → פתיחה.
 * - אם לא פורסם → confirm מערכת; אם מאשרים → publish ואז פתיחה.
 * - ללא שינוי UI/Markup. טוסטים רק ליידע.
 */
export async function ensurePreviewFlow(qid: string, lang: string = "he", ref: string = "preview") {
  try {
    const { token, is_published } = await getPublishState(qid);
    
    if (is_published && token) {
      openPreviewByToken(token, lang, ref);
    } else {
      const confirmPublish = window.confirm(
        "השאלון עדיין לא פורסם. האם תרצה/י לפרסם אותו עכשיו כדי לצפות בתצוגה מקדימה?"
      );

      if (confirmPublish) {
        const newToken = await publishExplicit(qid);
        safeToast({ title: "השאלון פורסם!", description: "התצוגה המקדימה נפתחת בלשונית חדשה." });
        openPreviewByToken(newToken, lang, ref);
      } else {
        safeToast({ title: "הפעולה בוטלה", description: "השאלון לא פורסם." });
      }
    }
  } catch (e) {
    console.error("ensurePreviewFlow failed:", e);
    // נוסח טוסט ידידותי יותר
    safeToast({ title: "אופס, הצגה נכשלה", description: "לא הצלחנו להציג את השאלון כרגע. אפשר לנסות שוב בעוד רגע." });
  }
}
