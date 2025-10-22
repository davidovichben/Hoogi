-- Add token and is_active columns to distributions table
ALTER TABLE public.distributions
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_distributions_token
  ON public.distributions(token);

CREATE INDEX IF NOT EXISTS idx_distributions_is_active
  ON public.distributions(is_active);

-- Trigger to auto-generate token when distribution is activated
CREATE OR REPLACE FUNCTION generate_distribution_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false OR NEW.token IS NULL) THEN
    NEW.token = 'd_' || encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_distribution_token_trigger ON public.distributions;
CREATE TRIGGER generate_distribution_token_trigger
  BEFORE INSERT OR UPDATE ON public.distributions
  FOR EACH ROW
  EXECUTE FUNCTION generate_distribution_token();

-- Add RLS policy for public access via token (for anonymous users accessing the live link)
CREATE POLICY "Anyone can view active distributions by token"
  ON public.distributions
  FOR SELECT USING (is_active = true AND token IS NOT NULL);

-- Add helpful comments to the columns
COMMENT ON COLUMN public.distributions.token IS 'Unique public token for sharing the distribution link (auto-generated when is_active is true)';
COMMENT ON COLUMN public.distributions.is_active IS 'Whether this distribution is active and can be accessed via public link';
