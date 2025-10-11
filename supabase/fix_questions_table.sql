-- תיקון מבנה טבלת השאלות בסופרבייס
-- הרץ את הקוד הזה ב-SQL Editor בסופרבייס

-- 1. הוסף עמודות חסרות לטבלה questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS help_text TEXT;

-- 2. צור טבלה לאפשרויות השאלות (אם לא קיימת)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. הוסף אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_questions_questionnaire_id 
  ON public.questions(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_questions_order 
  ON public.questions(questionnaire_id, order_index);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id 
  ON public.question_options(question_id, order_index);

-- 4. עדכן שאלות קיימות עם ערכי ברירת מחדל
UPDATE public.questions 
SET 
  question_type = COALESCE(question_type, 'text'),
  is_required = COALESCE(is_required, false),
  order_index = COALESCE(order_index, 1),
  label = COALESCE(label, question_text)
WHERE question_type IS NULL 
   OR is_required IS NULL 
   OR order_index IS NULL 
   OR label IS NULL;

-- 5. הוסף אילוצים (constraints) לוודא תקינות הנתונים
ALTER TABLE public.questions 
ADD CONSTRAINT questions_type_check 
CHECK (question_type IN ('text', 'textarea', 'select', 'radio', 'checkbox', 'single_choice', 'multi_choice', 'long_text', 'number', 'date', 'email', 'phone'));

-- 6. הוסף עמודות נוספות שנדרשות על ידי הקוד
ALTER TABLE public.questionnaires
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS public_token TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS form_token TEXT,
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_primary TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS brand_accent TEXT DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS brand_background TEXT DEFAULT '#ffffff';

-- 7. צור אינדקס לטוקן ציבורי
CREATE INDEX IF NOT EXISTS idx_questionnaires_public_token 
  ON public.questionnaires(public_token) 
  WHERE public_token IS NOT NULL;

-- 8. הוסף עמודות לטבלת responses אם נדרש
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'submitted',
  respondent_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.response_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_number NUMERIC,
  answer_date DATE,
  answer_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. הוסף אינדקסים לטבלאות responses
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_id 
  ON public.responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_response_items_response_id 
  ON public.response_items(response_id);

CREATE INDEX IF NOT EXISTS idx_response_items_question_id 
  ON public.response_items(question_id);

-- 10. הוסף RLS (Row Level Security) אם נדרש
-- ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.response_items ENABLE ROW LEVEL SECURITY;

-- סיום - המבנה עכשיו תואם לקוד!
