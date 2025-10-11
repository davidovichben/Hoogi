-- Add show_logo and show_profile_image columns to questionnaires table

ALTER TABLE public.questionnaires
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_profile_image BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.questionnaires.show_logo IS 'Whether to display the logo in questionnaire views';
COMMENT ON COLUMN public.questionnaires.show_profile_image IS 'Whether to display the profile image in questionnaire views';
