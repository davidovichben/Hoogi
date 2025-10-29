-- Add whatsapp field to profiles table
-- Run this in Supabase SQL Editor

-- Check if column already exists to avoid errors
DO $$
BEGIN
    -- Add whatsapp column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE profiles ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'whatsapp';
