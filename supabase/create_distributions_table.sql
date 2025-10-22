-- Create distributions table
-- This table links questionnaires with arrays of response templates
CREATE TABLE IF NOT EXISTS public.distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  response_template_ids UUID[] NOT NULL DEFAULT '{}',
  token TEXT UNIQUE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_distributions_questionnaire_id
  ON public.distributions(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_distributions_token
  ON public.distributions(token);

CREATE INDEX IF NOT EXISTS idx_distributions_is_active
  ON public.distributions(is_active);

CREATE INDEX IF NOT EXISTS idx_distributions_created_at
  ON public.distributions(created_at DESC);

-- GIN index for array queries (for searching within the UUID array)
CREATE INDEX IF NOT EXISTS idx_distributions_response_template_ids
  ON public.distributions USING GIN(response_template_ids);

-- Enable Row Level Security
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can access distributions for questionnaires they own
CREATE POLICY "Users can view distributions from their questionnaires"
  ON public.distributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = distributions.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert distributions for their questionnaires"
  ON public.distributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = distributions.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update distributions from their questionnaires"
  ON public.distributions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = distributions.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = distributions.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete distributions from their questionnaires"
  ON public.distributions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = distributions.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_distributions_updated_at ON public.distributions;
CREATE TRIGGER update_distributions_updated_at
  BEFORE UPDATE ON public.distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_distributions_updated_at();

-- Trigger to auto-generate token when distribution is activated
CREATE OR REPLACE FUNCTION generate_distribution_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL OR NEW.token IS NULL) THEN
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

-- Add helpful comments to the table and columns
COMMENT ON TABLE public.distributions IS 'Links questionnaires with arrays of response template IDs for distribution management';
COMMENT ON COLUMN public.distributions.questionnaire_id IS 'Foreign key to the questionnaire this distribution belongs to';
COMMENT ON COLUMN public.distributions.response_template_ids IS 'Array of UUID references to response templates';
COMMENT ON COLUMN public.distributions.token IS 'Unique public token for sharing the distribution link (auto-generated when is_active is true)';
COMMENT ON COLUMN public.distributions.is_active IS 'Whether this distribution is active and can be accessed via public link';
