// src/lib/normalizePublicQuestionnaire.ts
export type NormalizedQuestion = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
};

export type NormalizedPublicForm = {
  title?: string;
  description?: string;
  questions: NormalizedQuestion[];
  requireContact?: boolean;
  lang?: string;
};

function coerceBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (v === "1" || v === 1 || v === "true" || v === "TRUE") return true;
  return false;
}

// קונטיינרים אפשריים לשאלות שמגיעים מה-RPC/VIEW במבנים שונים
function findQuestionsContainer(q: any): any[] {
  if (!q) return [];
  // מקרים נפוצים
  if (Array.isArray(q.questions)) return q.questions;
  if (Array.isArray(q?.schema?.questions)) return q.schema.questions;
  if (Array.isArray(q?.form?.questions)) return q.form.questions;
  if (Array.isArray(q?.content?.questions)) return q.content.questions;
  if (Array.isArray(q?.definition?.questions)) return q.definition.questions;
  // חלק מהגרסאות מחזירות JSON בשדה questions_json
  try {
    if (typeof q.questions_json === "string") {
      const parsed = JSON.parse(q.questions_json);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.questions)) return parsed.questions;
    }
  } catch {}
  return [];
}

// מיפוי לסכמה שה-UI שלך מציג כיום
function normalizeOne(raw: any, idx: number): NormalizedQuestion {
  const id = String(raw.id ?? raw.qid ?? raw.name ?? idx);
  const type = String(
    raw.type ??
      raw.kind ??
      raw.input_type ??
      raw.fieldType ??
      "text"
  ).toLowerCase();

  const label =
    raw.label ??
    raw.title ??
    raw.question ??
    raw.text ??
    `שאלה ${idx + 1}`;

  const required = coerceBool(raw.required ?? raw.is_required ?? raw.mandatory);
  const placeholder = raw.placeholder ?? raw.hint ?? "";

  // אופציות לבחירה
  let options: NormalizedQuestion["options"];
  const src =
    raw.options ??
    raw.choices ??
    raw.values ??
    raw.items ??
    (typeof raw.options_json === "string"
      ? (() => {
          try {
            const p = JSON.parse(raw.options_json);
            return Array.isArray(p) ? p : p?.options;
          } catch {
            return undefined;
          }
        })()
      : undefined);
  if (Array.isArray(src)) {
    options = src.map((o: any, i: number) => {
      if (typeof o === "string") return { value: o, label: o };
      return {
        value: String(o.value ?? o.id ?? i),
        label: String(o.label ?? o.text ?? o.title ?? o.value ?? `אפשרות ${i + 1}`),
      };
    });
  }

  return {
    id,
    type,
    label,
    required,
    placeholder,
    options,
    min: typeof raw.min === "number" ? raw.min : undefined,
    max: typeof raw.max === "number" ? raw.max : undefined,
  };
}

export function normalizePublicQuestionnaire(input: any): NormalizedPublicForm {
  // קונטיינר עליון אפשרי
  const root =
    input?.form ??
    input?.schema ??
    input?.content ??
    input?.definition ??
    input;
  const qs = findQuestionsContainer(root);
  const questions = qs.map(normalizeOne);

  const requireContact =
    coerceBool(
      root?.require_contact ??
        root?.requireContact ??
        root?.contact_required
    ) || false;

  return {
    title: root?.title ?? input?.title ?? "",
    description: root?.description ?? "",
    questions,
    requireContact,
    lang: root?.lang ?? input?.lang ?? "he",
  };
}

// החלת מיתוג יציב דרך CSS variables בלי לגעת ב-Markup
export function applyBranding(branding: any) {
  try {
    const primary = (branding?.primary ?? branding?.brand_primary ?? "").toString().replace("#", "");
    const secondary = (branding?.secondary ?? branding?.brand_secondary ?? "").toString().replace("#", "");
    const root = document.documentElement;
    if (primary) root.style.setProperty("--brand-primary", `#${primary}`);
    if (secondary) root.style.setProperty("--brand-secondary", `#${secondary}`);
    // תמונת לוגו – רק הצבה ל-state תעשה ברכיב; כאן לא משנים DOM
  } catch {}
}
