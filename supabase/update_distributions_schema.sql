-- Update distributions table schema
-- This migration updates the distributions table to match the current application requirements

-- 1. Rename response_template_ids to automation_template_ids if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'distributions'
        AND column_name = 'response_template_ids'
    ) THEN
        ALTER TABLE public.distributions
        RENAME COLUMN response_template_ids TO automation_template_ids;

        -- Update the column type to JSONB for better structure
        ALTER TABLE public.distributions
        ALTER COLUMN automation_template_ids TYPE JSONB
        USING automation_template_ids::JSONB;
    END IF;
END $$;

-- 2. Add automation_template_ids column if it doesn't exist
ALTER TABLE public.distributions
ADD COLUMN IF NOT EXISTS automation_template_ids JSONB DEFAULT '[]'::JSONB;

-- 3. Update indexes
DROP INDEX IF EXISTS idx_distributions_response_template_ids;

CREATE INDEX IF NOT EXISTS idx_distributions_automation_template_ids
  ON public.distributions USING GIN(automation_template_ids);

-- 4. Update comments
COMMENT ON COLUMN public.distributions.automation_template_ids IS 'JSONB array of automation template configurations with template_id and channels';

-- Verify the schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'distributions'
ORDER BY ordinal_position;
