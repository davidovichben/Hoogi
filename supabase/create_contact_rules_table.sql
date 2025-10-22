-- Create contact_rules table
-- This table stores email routing rules based on country and subject combinations
CREATE TABLE IF NOT EXISTS public.contact_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on country + subject combination
  CONSTRAINT unique_country_subject UNIQUE (country, subject)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_rules_country
  ON public.contact_rules(country);

CREATE INDEX IF NOT EXISTS idx_contact_rules_subject
  ON public.contact_rules(subject);

CREATE INDEX IF NOT EXISTS idx_contact_rules_created_at
  ON public.contact_rules(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read contact rules
CREATE POLICY "Authenticated users can view contact rules"
  ON public.contact_rules
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete contact rules
CREATE POLICY "Only service role can insert contact rules"
  ON public.contact_rules
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update contact rules"
  ON public.contact_rules
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete contact rules"
  ON public.contact_rules
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_rules_updated_at ON public.contact_rules;
CREATE TRIGGER update_contact_rules_updated_at
  BEFORE UPDATE ON public.contact_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_rules_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.contact_rules IS 'Stores email routing rules based on country and subject combinations for contact form';
COMMENT ON COLUMN public.contact_rules.country IS 'Country code or name (e.g., ישראל, USA, UK)';
COMMENT ON COLUMN public.contact_rules.subject IS 'Contact subject/category (e.g., תמיכה טכנית, Technical Support)';
COMMENT ON COLUMN public.contact_rules.email IS 'Target email address for this country/subject combination';
COMMENT ON CONSTRAINT unique_country_subject ON public.contact_rules IS 'Ensures each country-subject combination is unique';

-- Insert default contact rules
INSERT INTO public.contact_rules (country, subject, email) VALUES
  -- Israeli Hebrew subjects
  ('ישראל', 'תמיכה טכנית', 'support@example.com'),
  ('ישראל', 'שירות לקוחות', 'service@example.com'),
  ('ישראל', 'בעיה בתשלום', 'billing@example.com'),
  ('ישראל', 'דיווח על באג', 'bugs@example.com'),
  ('ישראל', 'שאלה כללית', 'info@example.com'),
  ('ישראל', 'בקשת פיצ''ר', 'features@example.com'),
  ('ישראל', 'משוב על המוצר', 'feedback@example.com'),
  ('ישראל', 'שאלה על השימוש', 'support@example.com'),

  -- USA English subjects
  ('USA', 'Technical Support', 'support-en@example.com'),
  ('USA', 'Customer Service', 'service-en@example.com'),
  ('USA', 'Billing Issue', 'billing-en@example.com'),
  ('USA', 'Bug Report', 'bugs-en@example.com'),

  -- UK English subjects
  ('UK', 'Technical Support', 'support-uk@example.com'),
  ('UK', 'Customer Service', 'service-uk@example.com'),
  ('UK', 'Billing Issue', 'billing-uk@example.com'),
  ('UK', 'Bug Report', 'bugs-uk@example.com'),

  -- Canada subjects (can have both English and French)
  ('קנדה', 'תמיכה טכנית', 'support-ca@example.com'),
  ('קנדה', 'שירות לקוחות', 'service-ca@example.com'),

  -- Australia subjects
  ('אוסטרליה', 'תמיכה טכנית', 'support-au@example.com'),
  ('אוסטרליה', 'שירות לקוחות', 'service-au@example.com')
ON CONFLICT (country, subject) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.contact_rules TO authenticated;
GRANT ALL ON public.contact_rules TO service_role;
