-- Add automation_template_id column to questionnaires table
ALTER TABLE public.questionnaires
  ADD COLUMN IF NOT EXISTS automation_template_id UUID REFERENCES public.automation_templates(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_questionnaires_automation_template_id
  ON public.questionnaires(automation_template_id);

-- Remove old automation columns if they exist (optional, only if you want to clean up)
-- Uncomment these lines if you want to remove the old columns:
-- ALTER TABLE public.questionnaires DROP COLUMN IF EXISTS automation_template_type;
-- ALTER TABLE public.questionnaires DROP COLUMN IF EXISTS automation_channels;

-- Add helpful comment
COMMENT ON COLUMN public.questionnaires.automation_template_id IS 'Reference to the automation template to use for this questionnaire';
