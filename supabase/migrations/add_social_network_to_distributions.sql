-- Add social_network column to distributions table
-- This allows tracking which social network the distribution link is intended for

ALTER TABLE public.distributions
ADD COLUMN IF NOT EXISTS social_network TEXT;

COMMENT ON COLUMN public.distributions.social_network IS 'The social network where this distribution link will be shared (e.g., "facebook", "instagram", "linkedin", "general")';

-- Add a check constraint to ensure only valid values
ALTER TABLE public.distributions
DROP CONSTRAINT IF EXISTS distributions_social_network_check;

ALTER TABLE public.distributions
ADD CONSTRAINT distributions_social_network_check
CHECK (social_network IN ('facebook', 'instagram', 'linkedin', 'general') OR social_network IS NULL);
