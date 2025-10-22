export type QuestionType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'single' | 'multi' | 'audio' | 'single_choice' | 'multiple_choice' | 'radio' | 'checkbox' | 'select' | 'rating' | 'calendar' | 'file' | 'conditional';

export interface QuestionnaireMeta {
  primaryLanguage?: string;
  automationSettings?: any;
  selectedChannel?: string;
  tags?: string[];
  title?: string;
  subtitle?: string;
  brand_logo_url?: string;
}

export const DEFAULT_META: QuestionnaireMeta = {
  primaryLanguage: 'he',
  automationSettings: {},
  selectedChannel: 'landing',
  tags: [],
  title: '',
  subtitle: '',
  brand_logo_url: ''
};

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  meta?: QuestionnaireMeta;
  created_at?: string;
  updated_at?: string;
  show_logo?: boolean;
  show_profile_image?: boolean;
  status?: string;
  is_active?: boolean;
  user_id?: string;
  language?: string;
  token?: string;
  attachment_url?: string;
  attachment_size?: number;
  link_url?: string;
  link_label?: string;
}

export interface Question {
  id: string;
  questionnaire_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  options?: string[];
  audio_url?: string;
  question_order?: number;
  order_index?: number;
  meta?: any;
  minimum?: number;
  maximum?: number;
  // Database column names for rating questions
  min_rating?: number;
  max_rating?: number;
  created_at?: string;
  updated_at?: string;
  // Legacy support
  title?: string;
  type?: QuestionType;
  required?: boolean;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  value: string;
  order_index: number;
}

// Factory functions for safe creation
export const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: crypto.randomUUID(),
  questionnaire_id: '',
  question_text: '',
  question_type: 'text',
  is_required: false,
  options: [],
  audio_url: undefined,
  order_index: 0,
  question_order: 0,
  meta: {},
  ...overrides
});

export const makeQuestionnaire = (ownerId: string, overrides: Partial<Questionnaire> = {}): Questionnaire => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  owner_id: ownerId,
  meta: { ...DEFAULT_META },
  ...overrides
});

// Safe type switching - preserves existing data
export const changeQuestionType = (question: Question, newType: QuestionType): Question => {
  if (question.question_type === newType) return question;

  const updated: Question = { ...question, question_type: newType };

  // Handle type-specific defaults
  switch (newType) {
    case 'single':
    case 'multi':
      if (!updated.options || updated.options.length === 0) {
        updated.options = ['Option 1', 'Option 2'];
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
