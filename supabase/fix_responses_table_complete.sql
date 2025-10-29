-- Complete fix for responses table: Add missing columns and fix RLS policies
-- This fixes both the schema mismatch and RLS issues
-- Run this in the Supabase SQL Editor

-- ========================================
-- Step 1: Add missing columns to responses table
-- ========================================

-- Add response_data column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'responses'
        AND column_name = 'response_data'
    ) THEN
        ALTER TABLE public.responses ADD COLUMN response_data JSONB;
    END IF;
END $$;

-- Add submitted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'responses'
        AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE public.responses ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ========================================
-- Step 2: Disable RLS temporarily to test
-- ========================================

-- OPTION A: Disable RLS completely (simple but less secure)
-- Uncomment the line below if you want to completely disable RLS for testing
-- ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Step 3: OR Fix RLS policies (recommended)
-- ========================================

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous inserts on responses" ON public.responses;
DROP POLICY IF EXISTS "Allow users to view their questionnaire responses" ON public.responses;
DROP POLICY IF EXISTS "Allow public to insert responses" ON public.responses;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.responses;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.responses;

-- Create a single clear INSERT policy for everyone (anon + authenticated)
CREATE POLICY "responses_insert_policy"
ON public.responses
FOR INSERT
WITH CHECK (true);

-- Create SELECT policy for questionnaire owners
CREATE POLICY "responses_select_policy"
ON public.responses
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = responses.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

-- ========================================
-- Step 4: Fix response_items table RLS
-- ========================================

ALTER TABLE public.response_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts on response_items" ON public.response_items;
DROP POLICY IF EXISTS "Allow users to view their response items" ON public.response_items;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.response_items;

CREATE POLICY "response_items_insert_policy"
ON public.response_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "response_items_select_policy"
ON public.response_items
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.responses r
    JOIN public.questionnaires q ON q.id = r.questionnaire_id
    WHERE r.id = response_items.response_id
    AND (q.owner_id = auth.uid() OR q.user_id = auth.uid())
  )
);

-- ========================================
-- Step 5: Fix leads table RLS
-- ========================================

DROP POLICY IF EXISTS "Users can insert leads to their questionnaires" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert for guest submissions" ON public.leads;
DROP POLICY IF EXISTS "Allow all inserts on leads" ON public.leads;

CREATE POLICY "leads_insert_policy"
ON public.leads
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view leads from their questionnaires" ON public.leads;
CREATE POLICY "leads_select_policy"
ON public.leads
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update leads from their questionnaires" ON public.leads;
CREATE POLICY "leads_update_policy"
ON public.leads
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete leads from their questionnaires" ON public.leads;
CREATE POLICY "leads_delete_policy"
ON public.leads
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

-- ========================================
-- Verification
-- ========================================

-- Check the responses table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'responses'
ORDER BY ordinal_position;

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('responses', 'response_items', 'leads')
AND schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('responses', 'response_items', 'leads')
ORDER BY tablename, policyname;
