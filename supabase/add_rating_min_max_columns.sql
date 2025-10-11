-- Add min_rating and max_rating columns to questions table
-- These columns will store the minimum and maximum rating values for rating-type questions

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS min_rating INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_rating INTEGER DEFAULT 5;

-- Add constraints to ensure valid rating ranges (1-5 stars only)
ALTER TABLE public.questions
ADD CONSTRAINT rating_min_range CHECK (min_rating >= 1 AND min_rating <= 5),
ADD CONSTRAINT rating_max_range CHECK (max_rating >= 1 AND max_rating <= 5),
ADD CONSTRAINT rating_min_less_than_max CHECK (min_rating < max_rating OR (min_rating IS NULL AND max_rating IS NULL));

-- Set default values for existing rating questions
UPDATE public.questions
SET
  min_rating = 1,
  max_rating = 5
WHERE question_type = 'rating'
  AND (min_rating IS NULL OR max_rating IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.questions.min_rating IS 'Minimum rating value for rating-type questions (must be between 1-5)';
COMMENT ON COLUMN public.questions.max_rating IS 'Maximum rating value for rating-type questions (must be between 1-5)';
