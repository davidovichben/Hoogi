-- Add missing columns to leads table
-- Run this in Supabase SQL Editor to fix the "column does not exist" error

-- Add email column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column';
    ELSE
        RAISE NOTICE 'email column already exists';
    END IF;
END $$;

-- Add phone column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
END $$;

-- Add name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column';
    ELSE
        RAISE NOTICE 'name column already exists';
    END IF;
END $$;

-- Add distribution_token column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'distribution_token'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN distribution_token TEXT;
        RAISE NOTICE 'Added distribution_token column';
    ELSE
        RAISE NOTICE 'distribution_token column already exists';
    END IF;
END $$;

-- Add channel column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'channel'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN channel TEXT;
        RAISE NOTICE 'Added channel column';
    ELSE
        RAISE NOTICE 'channel column already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_distribution_token ON public.leads(distribution_token);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON public.leads(channel);

-- Verify the columns were added
SELECT
    'Verification: Leads table columns' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN ('email', 'phone', 'name', 'distribution_token', 'channel')
ORDER BY column_name;

-- Show a success message if all columns exist
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM (
        SELECT 'email' as col
        UNION SELECT 'phone'
        UNION SELECT 'name'
        UNION SELECT 'distribution_token'
        UNION SELECT 'channel'
    ) required
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = required.col
    );

    IF missing_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All required columns exist in leads table!';
    ELSE
        RAISE WARNING '⚠️ WARNING: % column(s) still missing', missing_count;
    END IF;
END $$;
