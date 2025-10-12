-- Add channel column to leads table to track the source channel
ALTER TABLE leads ADD COLUMN IF NOT EXISTS channel TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);

-- Update existing leads to have a default channel if needed
-- UPDATE leads SET channel = 'website' WHERE channel IS NULL;
