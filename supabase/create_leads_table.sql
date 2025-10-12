-- Create leads table to store lead information extracted from questionnaire responses
-- This table complements the responses table by storing structured lead data

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to questionnaire
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,

  -- Client information
  client_name TEXT,

  -- Partner assignment
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT DEFAULT 'new',
  sub_status TEXT,

  -- Automations (JSON array of automation types: email, whatsapp, sms)
  automations JSONB DEFAULT '[]'::jsonb,

  -- Comments/Notes
  comments TEXT,

  -- Full answer data from questionnaire response
  answer_json JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_questionnaire_id ON leads(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Add GIN index for JSONB data
CREATE INDEX IF NOT EXISTS idx_leads_automations ON leads USING GIN(automations);
CREATE INDEX IF NOT EXISTS idx_leads_answer_json ON leads USING GIN(answer_json);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage leads from their own questionnaires

-- Policy: Users can view leads from their questionnaires
CREATE POLICY "Users can view leads from their questionnaires" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = leads.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

-- Policy: Users can insert leads to their questionnaires
CREATE POLICY "Users can insert leads to their questionnaires" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = leads.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

-- Policy: Users can update leads from their questionnaires
CREATE POLICY "Users can update leads from their questionnaires" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = leads.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete leads from their questionnaires
CREATE POLICY "Users can delete leads from their questionnaires" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = leads.questionnaire_id
      AND questionnaires.owner_id = auth.uid()
    )
  );

-- Policy: Allow public insert for guest questionnaire submissions
CREATE POLICY "Allow public insert for guest submissions" ON leads
  FOR INSERT WITH CHECK (true);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Helper function to extract client name from answer_json
CREATE OR REPLACE FUNCTION extract_client_name_from_answer(answer_data JSONB)
RETURNS TEXT AS $$
DECLARE
  extracted_name TEXT := NULL;
  key TEXT;
  value TEXT;
BEGIN
  -- Iterate through all keys in the answer_data
  FOR key, value IN SELECT * FROM jsonb_each_text(answer_data)
  LOOP
    -- Try to match name fields (Hebrew and English)
    IF extracted_name IS NULL AND (
      key ILIKE '%name%' OR
      key ILIKE '%שם%' OR
      key ILIKE '%full%name%' OR
      key ILIKE '%שם%מלא%' OR
      key ILIKE '%client%' OR
      key ILIKE '%לקוח%'
    ) THEN
      extracted_name := value;
      EXIT; -- Found, exit loop
    END IF;
  END LOOP;

  RETURN COALESCE(extracted_name, 'Unknown');
END;
$$ LANGUAGE plpgsql;

-- Verify the table was created correctly
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
