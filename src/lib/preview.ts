import { supabase } from "@/integrations/supabase/client";
import { rpcPublishQuestionnaire, safeToast } from "@/lib/rpc";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * Checks the current publication state of a questionnaire.
 * @param qid The questionnaire ID.
 * @returns An object with is_published status and the public_token, or null if not found.
 */
async function getPublishState(qid: string): Promise<{ is_published: boolean; public_token: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("is_published, public_token")
      .eq("id", qid)
      .single();

    if (error) {
      console.error("Error getting publish state:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Explicitly publishes a questionnaire using an RPC call.
 * @param qid The questionnaire ID.
 * @returns The public token if successful, otherwise null.
 */
async function publishExplicit(qid: string): Promise<string | null> {
  try {
    const result = await rpcPublishQuestionnaire(qid);
    if (result?.token) {
      safeToast({ title: "השאלון פורסם", description: "השאלון זמין כעת לצפייה." });
      return result.token;
    }
    throw new Error("Publish RPC did not return a token.");
  } catch (e) {
    console.error("Error publishing questionnaire:", e);
    safeToast({ title: "שגיאת פרסום", description: "לא ניתן היה לפרסם את השאלון." });
    return null;
  }
}

/**
 * Opens a questionnaire preview in a new tab using its token.
 * @param token The public token.
 * @param lang The language code.
 * @param ref The reference source for the link.
 */
function openPreviewByToken(token: string, lang: string = "he", ref: string = "preview") {
  const baseUrl = getBaseUrl();
  const url = new URL(`/q/${token}`, baseUrl);
  url.searchParams.set("lang", lang);
  url.searchParams.set("ref", ref);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/**
 * Main flow to ensure a preview can be opened.
 * Checks if a questionnaire is published, asks for confirmation to publish if not,
 * and then opens the preview.
 * @param qid The questionnaire ID.
 * @param lang The language code.
 * @param ref The reference source for the link.
 */
export async function ensurePreviewFlow(qid: string | null, lang: string = "he", ref: string = "preview") {
  if (!qid) {
    safeToast({ title: "שגיאה", description: "לא נבחר שאלון." });
    return;
  }

  try {
    let state = await getPublishState(qid);

    if (state?.is_published && state.public_token) {
      // Already published, just open it.
      openPreviewByToken(state.public_token, lang, ref);
    } else {
      // Not published, ask the user.
      const confirmPublish = window.confirm(
        "השאלון עדיין לא פורסם. האם תרצה/י לפרסם אותו עכשיו כדי לצפות בתצוגה מקדימה?"
      );

      if (confirmPublish) {
        const newToken = await publishExplicit(qid);
        if (newToken) {
          openPreviewByToken(newToken, lang, ref);
        }
      } else {
        safeToast({ title: "הפעולה בוטלה", description: "השאלון לא פורסם." });
      }
    }
  } catch (e) {
    console.error("ensurePreviewFlow failed:", e);
    safeToast({ title: "השאלון לא מוצג", description: "אירעה שגיאה בלתי צפויה." });
  }
}
