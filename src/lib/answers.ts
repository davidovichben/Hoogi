export type NormalizedQuestion = {
  id: string;
  type: "text"|"textarea"|"number"|"select"|"radio"|"checkbox"|"date"|"email"|"phone";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
};

function isEmpty(v: any, type: NormalizedQuestion["type"]) {
  if (type === "checkbox") return !Array.isArray(v) || v.length === 0;
  return v === undefined || v === null || String(v).trim() === "";
}

export function validateRequired(
  questions: NormalizedQuestion[],
  answers: Record<string, any>
): string[] {
  const missing: string[] = [];
  for (const q of questions) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (isEmpty(v, q.type)) missing.push(q.label || q.id);
  }
  return missing;
}

export function toSerializableAnswers(
  questions: NormalizedQuestion[],
  answers: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const q of questions) {
    const v = answers[q.id];
    switch (q.type) {
      case "number":
        out[q.id] = v === "" || v === undefined || v === null ? null : Number(v);
        break;
      case "checkbox":
        out[q.id] = Array.isArray(v) ? v.map(String) : [];
        break;
      default:
        out[q.id] = v === undefined || v === null ? "" : String(v);
        break;
    }
  }
  return out;
}

