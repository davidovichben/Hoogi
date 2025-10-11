-- Create tables for questionnaire responses and automation tasks
-- Only create if they don't already exist (safe approach)

-- questionnaire_responses table
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'landing', 'embed')),
  language text,
  answers jsonb NOT NULL,
  contact jsonb,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- automation_tasks table
CREATE TABLE IF NOT EXISTS public.automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email_reply', 'whatsapp_reply', 'analysis')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  payload jsonb,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- beta_users table for beta mode (20 users limit)
CREATE TABLE IF NOT EXISTS public.beta_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_questionnaire_id 
  ON public.questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at 
  ON public.questionnaire_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_tasks_status 
  ON public.automation_tasks(status) WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_automation_tasks_response_id 
  ON public.automation_tasks(response_id);

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;

-- Add basic policies (adjust according to your auth setup)
-- CREATE POLICY "Users can insert their own responses" ON public.questionnaire_responses
--   FOR INSERT WITH CHECK (true); -- Allow anonymous submissions

-- CREATE POLICY "Users can view their questionnaire responses" ON public.questionnaire_responses
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM questionnaires 
--       WHERE questionnaires.id = questionnaire_responses.questionnaire_id 
--       AND questionnaires.user_id = auth.uid()
--     )
--   );
