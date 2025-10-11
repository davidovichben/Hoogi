-- Remove primary_service column from profiles table
-- This column is no longer needed as we now store the "Other" occupation value
-- directly in the occupation column when user selects "אחר"

-- Note: Run this migration only after deploying the updated application code
-- to ensure no data loss

-- First, check if there are any profiles using primary_service
-- (You can uncomment and run this query first to see the data)
/*
SELECT id, company, occupation, primary_service
FROM profiles
WHERE primary_service IS NOT NULL AND primary_service != '';
*/

-- Remove the column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS primary_service;
