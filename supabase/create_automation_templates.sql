-- Create automation_templates table
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('standard', 'ai', 'personal', 'combined')),
  response_type TEXT NOT NULL CHECK (response_type IN ('new_customer', 'reminder')),
  channels TEXT[] NOT NULL DEFAULT '{}',
  email_subject TEXT,
  message_body TEXT,
  custom_ai_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_templates_user_id
  ON public.automation_templates(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_automation_templates_created_at
  ON public.automation_templates(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own automation templates" ON public.automation_templates;
DROP POLICY IF EXISTS "Users can insert their own automation templates" ON public.automation_templates;
DROP POLICY IF EXISTS "Users can update their own automation templates" ON public.automation_templates;
DROP POLICY IF EXISTS "Users can delete their own automation templates" ON public.automation_templates;

-- Create RLS policies
-- Policy: Users can view their own templates
CREATE POLICY "Users can view their own automation templates"
  ON public.automation_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert their own automation templates"
  ON public.automation_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update their own automation templates"
  ON public.automation_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete their own automation templates"
  ON public.automation_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_automation_templates_updated_at ON public.automation_templates;

CREATE TRIGGER set_automation_templates_updated_at
  BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_templates_updated_at();

-- Grant permissions
GRANT ALL ON public.automation_templates TO authenticated;
GRANT ALL ON public.automation_templates TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.automation_templates IS 'Stores user-created automation templates for questionnaire responses';
COMMENT ON COLUMN public.automation_templates.id IS 'Unique identifier for the template';
COMMENT ON COLUMN public.automation_templates.user_id IS 'Reference to the user who created the template';
COMMENT ON COLUMN public.automation_templates.name IS 'User-defined name for the template';
COMMENT ON COLUMN public.automation_templates.template_type IS 'Type of template: standard, ai, personal, or combined';
COMMENT ON COLUMN public.automation_templates.response_type IS 'When to send: new_customer or reminder';
COMMENT ON COLUMN public.automation_templates.channels IS 'Array of channels: email, whatsapp, message, general';
COMMENT ON COLUMN public.automation_templates.email_subject IS 'Subject line for email templates';
COMMENT ON COLUMN public.automation_templates.message_body IS 'Main message content';
COMMENT ON COLUMN public.automation_templates.custom_ai_message IS 'Custom instructions for AI-generated content';
