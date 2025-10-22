-- Add link_text column to distributions table
-- This allows customizable button text for email links

ALTER TABLE public.distributions
ADD COLUMN IF NOT EXISTS link_text TEXT;

COMMENT ON COLUMN public.distributions.link_text IS 'Custom text to display on link button in emails (e.g., "Click Here", "Learn More")';

-- Set default value for existing rows
UPDATE public.distributions
SET link_text = 'לחץ כאן'
WHERE link_text IS NULL;
