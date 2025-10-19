-- Add link_label column to questionnaires table

ALTER TABLE public.questionnaires
ADD COLUMN IF NOT EXISTS link_label TEXT;

COMMENT ON COLUMN public.questionnaires.link_label IS 'Label or title for the link URL associated with the questionnaire';
