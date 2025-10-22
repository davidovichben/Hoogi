-- Add statistics columns to automation_templates table
ALTER TABLE public.automation_templates
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for is_default for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_templates_is_default
  ON public.automation_templates(is_default) WHERE is_default = true;

-- Add helpful comments
COMMENT ON COLUMN public.automation_templates.status IS 'Template status: active or inactive';
COMMENT ON COLUMN public.automation_templates.sent_count IS 'Total number of times this template was sent';
COMMENT ON COLUMN public.automation_templates.usage_count IS 'Total number of times this template was used';
COMMENT ON COLUMN public.automation_templates.last_used IS 'Last time this template was used';
COMMENT ON COLUMN public.automation_templates.is_default IS 'Whether this is the default template';
COMMENT ON COLUMN public.automation_templates.notes IS 'User notes about this template';
