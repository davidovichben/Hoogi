-- Add link_label column to distributions table
-- This allows storing a label/title for the link that appears before the link button

ALTER TABLE public.distributions
ADD COLUMN IF NOT EXISTS link_label TEXT;

COMMENT ON COLUMN public.distributions.link_label IS 'Label or title text that appears before the link (e.g., "To fill the survey", "For more information")';
