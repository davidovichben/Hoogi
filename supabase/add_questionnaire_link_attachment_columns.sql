-- Add link_url and attachment_url columns to questionnaires table

ALTER TABLE public.questionnaires
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

COMMENT ON COLUMN public.questionnaires.link_url IS 'External link URL associated with the questionnaire';
COMMENT ON COLUMN public.questionnaires.attachment_url IS 'File attachment URL for the questionnaire';
