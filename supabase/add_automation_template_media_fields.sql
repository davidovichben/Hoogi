-- Add media and display fields to automation_templates table

ALTER TABLE public.automation_templates
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS use_profile_logo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_profile_image BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.automation_templates.link_url IS 'External link URL to include in template';
COMMENT ON COLUMN public.automation_templates.image_url IS 'Image/attachment URL to include in template';
COMMENT ON COLUMN public.automation_templates.use_profile_logo IS 'Whether to display user profile logo in template';
COMMENT ON COLUMN public.automation_templates.use_profile_image IS 'Whether to display user profile image in template';
