import { supabase } from '@/integrations/supabase/client';
import { Questionnaire, Question, DEFAULT_META } from '../models/questionnaire';

// Helper function to normalize questionnaire with safe meta defaults
export const normalizeQuestionnaire = (q: any): Questionnaire => ({
  ...q,
  meta: (q && typeof q.meta === 'object' && q.meta !== null) ? q.meta : DEFAULT_META,
});

export async function fetchQuestionnaireForReview(id: string) {
  // Adjust to your schema; this is a safe baseline
  const [q, qs] = await Promise.all([
    supabase.from("questionnaires").select("*").eq("id", id).maybeSingle(),
    supabase.from("questions").select("*").eq("questionnaire_id", id).order("question_order", { ascending: true }),
  ]);
  if (q.error) throw q.error; 
  if (qs.error) throw qs.error; 
  if (!q.data) return null;
  
  // Load options if we have questions
  let opts = { data: [], error: null };
  if (qs.data && qs.data.length > 0) {
    const questionIds = qs.data.map(q => q.id);
    opts = await supabase.from("question_options").select("*").in("question_id", questionIds).order("order_index", { ascending: true });
    if (opts.error) throw opts.error;
  }
  
  return { questionnaire: q.data, questions: qs.data || [], options: opts.data || [] };
}

export async function updateQuestionnaireMeta(id: string, payload: any) {
  // No destructive migration; write to dedicated columns if they exist, otherwise merge into meta JSON
  const { data: current, error: e0 } = await supabase.from("questionnaires").select("id, meta").eq("id", id).maybeSingle();
  if (e0) throw e0;
  const meta = { ...(current?.meta || {}), ...payload };
  const { error } = await supabase.from("questionnaires").update({ meta }).eq("id", id);
  if (error) throw error; 
  return true;
}

export async function applyQuickEdit(questionId: string, patch: any) {
  const { error } = await supabase.from("questions").update(patch).eq("id", questionId);
  if (error) throw error; 
  return true;
}

export async function reorderQuestions(questionIdsInOrder: string[]) {
  // Minimal safe reordering – update question_order per question
  await Promise.all(
    questionIdsInOrder.map((qid, idx) => 
      supabase.from("questions").update({ question_order: idx }).eq("id", qid)
    )
  );
  return true;
}

export async function reorderOptions(questionId: string, optionIdsInOrder: string[]) {
  await Promise.all(
    optionIdsInOrder.map((oid, idx) => 
      supabase.from("question_options").update({ order_index: idx }).eq("id", oid)
    )
  );
  return true;
}

export async function duplicateQuestionnaireToLanguage(qId: string, fromLang: string, toLang: string) {
  // Read all questions and clone labels to new language key in meta/translations
  const { data: qs, error } = await supabase.from("questions").select("id, meta").eq("questionnaire_id", qId);
  if (error) throw error;
  await Promise.all(
    (qs || []).map((q) => {
      const meta = (q as any).meta || {};
      const tr = meta.translations || {};
      tr[toLang] = tr[fromLang] || tr.default || {};
      return supabase.from("questions").update({ meta: { ...meta, translations: tr } }).eq("id", (q as any).id);
    })
  );
  return true;
}

export async function setQuestionnaireStatus(id: string, status: 'draft' | 'published') {
  const { error } = await supabase.from("questionnaires").update({ 
    meta: { status },
    // If you have a dedicated status column, uncomment:
    // status 
  }).eq("id", id);
  if (error) throw error;
  return true;
}

// Publish questionnaire function
export async function publishQuestionnaire(id: string, signal?: AbortSignal): Promise<boolean> {
  try {
    // Check if aborted
    if (signal?.aborted) {
      return false;
    }

    // Update questionnaire status to published
    const { error } = await supabase
      .from('questionnaires')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to publish questionnaire:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error publishing questionnaire:', error);
    return false;
  }
}

// חדש: פונקציות לשיתוף ציבורי
export async function ensurePublicToken(qid: string): Promise<string> {
  // קורא קודם את השורה
  const { data, error } = await supabase
    .from('questionnaires')
    .select('public_token,is_published')
    .eq('id', qid)
    .single();

  if (error) throw error;

  if (data?.public_token) {
    // כבר קיים טוקן – מחזירים אותו
    return data.public_token as string;
  }

  // מייצרים token בצד הלקוח (פשוט ובטוח), אפשר גם בצד ה-DB אם תרצי:
  const token = crypto.randomUUID().replace(/-/g, '');

  const { error: upErr, data: up } = await supabase
    .from('questionnaires')
    .update({
      public_token: token,
      is_published: true,
      published_at: new Date().toISOString()
    })
    .eq('id', qid)
    .select('public_token')
    .single();

  if (upErr) throw upErr;
  return up!.public_token as string;
}

export function buildPublicUrl(token: string) {
  const origin = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');
  return `${origin}/q/${token}`;
}

// RPC מאובטח: שליפת שאלון לפי public_token
export async function fetchQuestionnaireByToken(publicToken: string): Promise<any> {
  const { data, error } = await supabase
    .rpc('get_questionnaire_by_token', { p_token: publicToken })
    .single();
  if (error) {
    console.error('get_questionnaire_by_token failed', error);
    throw error;
  }
  return data; // מצופה: { id, public_token, title, lang, user_id }
}

// מאחד: טען שאלון לפי public_token או form_token עם maybeSingle
export async function fetchQuestionnaireByAnyToken(token: string): Promise<{ data: any | null; error: any | null }> {
  // נסיון לפי public_token
  let { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('public_token', token)
    .maybeSingle();

  if (!data && !error) {
    // נסיון לפי form_token
    const alt = await supabase
      .from('questionnaires')
      .select('*')
      .eq('form_token', token)
      .maybeSingle();
    data = alt.data ?? null;
    error = alt.error ?? null;
  }

  return { data, error };
}



// חדש: פונקציות לשיתוף ציבורי מתקדם
export async function generateQRCode(url: string): Promise<string> {
  try {
    // שימוש ב-API חיצוני ליצירת QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    return qrUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

export async function shareToWhatsApp(text: string, url: string): Promise<void> {
  const message = `${text}\n\n${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

export async function shareToEmail(subject: string, body: string, url: string): Promise<void> {
  const fullBody = `${body}\n\n${url}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  window.location.href = mailtoUrl;
}

export async function shareToSocialMedia(platform: string, url: string, text: string = ''): Promise<void> {
  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  };

  const shareUrl = shareUrls[platform];
  if (shareUrl) {
    window.open(shareUrl, '_blank');
  }
}

export async function getEmbedCode(url: string, options: { width?: string; height?: string; theme?: string } = {}): Promise<string> {
  const { width = '100%', height = '900px', theme = 'light' } = options;
  
  return `<iframe 
    src="${url}" 
    width="${width}" 
    height="${height}" 
    style="border: 0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" 
    allow="clipboard-write; microphone; camera"
    title="Questionnaire"
  ></iframe>`;
}

// חדש: פונקציות לניהול תשובות
export async function submitQuestionnaireResponse(data: {
  questionnaire_id: string;
  answers: Record<string, any>;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  channel?: string;
  meta?: any;
}): Promise<{ success: boolean; response_id?: string; error?: string }> {
  try {
    // בדוק אם השאלון פורסם
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('id, is_published, public_token')
      .eq('id', data.questionnaire_id)
      .single();

    if (qError || !questionnaire) {
      throw new Error('Questionnaire not found');
    }

    if (!questionnaire.is_published) {
      throw new Error('Questionnaire is not published');
    }

    // צור תשובה חדשה
    const { data: response, error: rError } = await supabase
      .from('responses')
      .insert({
        questionnaire_id: data.questionnaire_id,
        status: 'submitted',
        submitter_id: null, // אנונימי
        respondent_contact: data.contact || {},
        meta: {
          ...data.meta,
          channel: data.channel || 'landing',
          submitted_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (rError) throw rError;

    // שמור את התשובות
    const responseItems = Object.entries(data.answers).map(([question_id, answer]) => ({
      response_id: response.id,
      question_id,
      answer_text: typeof answer === 'string' ? answer : JSON.stringify(answer),
      answer_json: typeof answer === 'object' ? answer : null
    }));

    if (responseItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('response_items')
        .insert(responseItems);

      if (itemsError) {
        console.warn('Warning: Could not save response items:', itemsError);
      }
    }

    // הפעל אוטומציה אם יש אימייל
    if (data.contact?.email) {
      await triggerAutomation(response.id, data.contact.email, data.questionnaire_id);
    }

    return { success: true, response_id: response.id };
  } catch (error: any) {
    console.error('Error submitting response:', error);
    return { success: false, error: error.message };
  }
}

// חדש: פונקציה להפעלת אוטומציה
async function triggerAutomation(responseId: string, email: string, questionnaireId: string): Promise<void> {
  try {
    // צור משימת אוטומציה
    const { error } = await supabase
      .from('automation_tasks')
      .insert({
        type: 'email_reply',
        status: 'queued',
        payload: {
          response_id: responseId,
          to: email,
          subject: 'תודה על התשובה שלך!',
          html: `
            <h2>תודה על התשובה שלך!</h2>
            <p>קיבלנו את התשובה שלך בהצלחה.</p>
            <p>נציג יצור איתך קשר בהקדם האפשרי.</p>
            <br>
            <p>בברכה,<br>צוות iHoogi</p>
          `
        },
        scheduled_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Warning: Could not create automation task:', error);
    }
  } catch (error) {
    console.warn('Warning: Could not trigger automation:', error);
  }
}

// חדש: פונקציה לטעינת שאלון לתצוגה מקדימה (לבעלים)
export const fetchQuestionnaireForPreview = async (id: string) => {
  try {
    console.log('🔄 Loading questionnaire for preview:', id);
    
    // מצא שאלון לפי ID (גם אם לא פורסם)
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError) {
      console.error('Error loading questionnaire by ID:', qError);
      throw new Error('Questionnaire not found');
    }

    if (!questionnaire) {
      throw new Error('Questionnaire not found');
    }

    console.log('✅ Questionnaire loaded:', questionnaire);

    // טען שאלות עם כל השדות הנדרשים
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, question_type, is_required, question_order, is_active, questionnaire_id, created_at')
      .eq('questionnaire_id', questionnaire.id)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      throw questionsError;
    }

    console.log('✅ Questions loaded:', questions);

    // טען אפשרויות לכל שאלה
    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        let options = [];
        
        try {
          // נסה קודם question_options
          const { data: questionOptions, error: optionsError } = await supabase
            .from('question_options')
            .select('id, label, value, order_index, question_id')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });
          
          if (!optionsError && questionOptions) {
            options = questionOptions;
            console.log(`✅ Options loaded for question ${question.id}:`, questionOptions);
          }
        } catch (error) {
          console.warn('question_options table not found, trying options table');
        }
        
        // אם לא מצאנו ב-question_options, נסה בטבלת options
        if (options.length === 0) {
          try {
            const { data: legacyOptions, error: legacyError } = await supabase
              .from('options')
              .select('id, label, value, order_index, question_id')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true });
            
            if (!legacyError && legacyOptions) {
              options = legacyOptions;
              console.log(`✅ Legacy options loaded for question ${question.id}:`, legacyOptions);
            }
          } catch (error) {
            console.warn('Could not load options for question:', question.id, error);
          }
        }

        const questionWithOptions = {
          ...question,
          options: options || []
        };
        
        console.log(`✅ Question ${question.id} with options:`, questionWithOptions);
        return questionWithOptions;
      })
    );

    console.log('✅ Questions with options loaded:', questionsWithOptions);

    const result = {
      ...questionnaire,
      questions: questionsWithOptions
    };
    
    console.log('✅ Final result:', result);
    return result;
  } catch (error) {
    console.error('Error in fetchQuestionnaireForPreview:', error);
    throw error;
  }
}

// חדש: פונקציה לטעינת שאלון ציבורי לפי טוקן
export async function fetchPublicQuestionnaireByToken(token: string): Promise<any> {
  try {
    // שימוש ב-RPC מאובטח לשליפת שאלון לפי public_token
    const questionnaire = await fetchQuestionnaireByToken(token);

    // טען שאלות
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', questionnaire.id)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      throw questionsError;
    }

    // טען אפשרויות לכל שאלה
    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        let options = [];
        try {
          const { data: questionOptions, error: optionsError } = await supabase
            .from('question_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });
          if (!optionsError && questionOptions) {
            options = questionOptions;
          }
        } catch (error) {
          console.warn('question_options table not found, trying options table');
        }
        if (options.length === 0) {
          try {
            const { data: legacyOptions, error: legacyError } = await supabase
              .from('options')
              .select('*')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true });
            if (!legacyError && legacyOptions) {
              options = legacyOptions;
            }
          } catch (error) {
            console.warn('Could not load options for question:', question.id, error);
          }
        }
        return { ...question, options: options || [] };
      })
    );

    return { ...questionnaire, questions: questionsWithOptions };
  } catch (error) {
    console.error('Error in fetchPublicQuestionnaireByToken:', error);
    throw error;
  }
}

// חדש: פונקציה לקבלת סטטיסטיקות בסיסיות
export async function getQuestionnaireStats(questionnaireId: string): Promise<{
  total_responses: number;
  today_responses: number;
  channels: Record<string, number>;
}> {
  try {
    // סך הכל תשובות
    const { count: total } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('questionnaire_id', questionnaireId);

    // תשובות מהיום
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('questionnaire_id', questionnaireId)
      .gte('created_at', today.toISOString());

    // תשובות לפי ערוץ
    const { data: channelData } = await supabase
      .from('responses')
      .select('meta')
      .eq('questionnaire_id', questionnaireId);

    const channels: Record<string, number> = {};
    channelData?.forEach(response => {
      const channel = response.meta?.channel || 'unknown';
      channels[channel] = (channels[channel] || 0) + 1;
    });

    return {
      total_responses: total || 0,
      today_responses: todayCount || 0,
      channels
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total_responses: 0,
      today_responses: 0,
      channels: {}
    };
  }
}

// חדש: פונקציונליות טיוטות (Drafts)
export type DraftInput = {
  id?: string;
  title?: string;
  category?: string;
  profile?: {
    businessName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  questions?: any[];
  status?: "draft" | "ready" | "published";
};

export async function upsertDraft(input: DraftInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    id: input.id,
    user_id: user.id,
    title: input.title ?? null,
    category: input.category ?? null,
    status: input.status ?? "draft",
    profile: input.profile ?? null,
    questions: input.questions ?? null,
  };

  const { data, error } = await supabase
    .from("questionnaires")
    .upsert(row, { onConflict: "id" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

// פונקציה לקבלת כל הטיוטות של המשתמש
export async function getUserDrafts(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// פונקציה לעדכון סטטוס טיוטה
export async function updateDraftStatus(id: string, status: "draft" | "ready" | "published"): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("questionnaires")
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id); // אבטחה: רק המשתמש יכול לעדכן את הטיוטות שלו

  if (error) throw error;
  return true;
}

// פונקציה למחיקת טיוטה (רק אם היא בטווח draft)
export async function deleteDraft(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // בדיקה שהטיוטה אכן בטווח draft
  const { data: current } = await supabase
    .from("questionnaires")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!current || current.status !== "draft") {
    throw new Error("Can only delete draft questionnaires");
  }

  const { error } = await supabase
    .from("questionnaires")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
}
