// Safe questionnaire models with defaults and Audio support
// Used by questionnaires feature only - no UI changes

export type QuestionType = 'text' | 'single' | 'multi' | 'audio';

// Safe meta defaults
export const DEFAULT_META = {
  primaryLanguage: 'he',
  automationSettings: {},
  selectedChannel: 'landing',
  tags: [],
  title: "",
  subtitle: ""
} as const;

export type QuestionnaireMeta = typeof DEFAULT_META;

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  meta?: QuestionnaireMeta;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id: string;
  questionnaire_id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For single/multi choice
  audio_url?: string; // For audio questions
  order_index: number;
  meta?: any;
  created_at?: string;
  updated_at?: string;
}

// Legacy interface for backward compatibility
export interface LegacyQuestion {
  id: string;
  questionnaire_id: string;
  question_text: string;
  is_required: boolean;
  type: string;
  options?: any[];
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

// Factory functions for safe creation
export const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
  questionnaire_id: '',
  title: '',
  type: 'text',
  required: false,
  options: [],
  audio_url: undefined,
  order_index: 0,
  meta: {},
  ...overrides
});

export const makeQuestionnaire = (ownerId: string, overrides: Partial<Questionnaire> = {}): Questionnaire => ({
  id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
  title: "",
  description: "",
  owner_id: ownerId,
  meta: DEFAULT_META,
  ...overrides
});

// Safe type switching - preserves existing data
export const changeType = (question: Question, newType: QuestionType): Question => {
  if (question.type === newType) return question;
  
  const updated: Question = { ...question, type: newType };
  
  // Handle type-specific defaults
  switch (newType) {
    case 'single':
    case 'multi':
      if (!updated.options || updated.options.length === 0) {
        updated.options = ['אפשרות 1', 'אפשרות 2'];
      }
      break;
    case 'audio':
      updated.audio_url = undefined;
      break;
    case 'text':
      updated.options = undefined;
      updated.audio_url = undefined;
      break;
  }
  
  return updated;
};

// Safe reordering with stable IDs
export const reorderQuestions = (questions: Question[], fromIndex: number, toIndex: number): Question[] => {
  const result = Array.from(questions);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // Update order_index for all questions
  return result.map((q, index) => ({ ...q, order_index: index }));
};
