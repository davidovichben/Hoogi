-- Add missing fields to profiles table
-- Run this in Supabase SQL Editor

-- First, check if columns already exist to avoid errors
DO $$
BEGIN
    -- Add primary_service column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'primary_service'
    ) THEN
        ALTER TABLE profiles ADD COLUMN primary_service TEXT;
    END IF;

    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN image_url TEXT;
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'website'
    ) THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;

    -- Add url_sources column (array of strings) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'url_sources'
    ) THEN
        ALTER TABLE profiles ADD COLUMN url_sources TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add social_networks column (JSONB object) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'social_networks'
    ) THEN
        ALTER TABLE profiles ADD COLUMN social_networks JSONB DEFAULT '{}'::JSONB;
    END IF;
END $$;

-- Also rename main_search_field to primary_service if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'main_search_field'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'primary_service'
    ) THEN
        ALTER TABLE profiles RENAME COLUMN main_search_field TO primary_service;
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('primary_service', 'image_url', 'website', 'url_sources', 'social_networks')
ORDER BY column_name;
