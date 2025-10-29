-- Fix RLS policies for responses and leads tables to allow anonymous form submissions
-- This fixes the "new row violates row-level security policy for table responses" error
-- Run this in the Supabase SQL Editor

-- ========================================
-- FIX RESPONSES TABLE
-- ========================================

-- Enable RLS on responses table if not already enabled
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts on responses" ON public.responses;
DROP POLICY IF EXISTS "Allow users to view their questionnaire responses" ON public.responses;
DROP POLICY IF EXISTS "Allow public to insert responses" ON public.responses;

-- Create policy to allow anyone (including anonymous users) to insert responses
CREATE POLICY "Allow anonymous inserts on responses"
ON public.responses
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow questionnaire owners to view responses to their questionnaires
CREATE POLICY "Allow users to view their questionnaire responses"
ON public.responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = responses.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

-- Enable RLS on response_items table if not already enabled
ALTER TABLE public.response_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts on response_items" ON public.response_items;
DROP POLICY IF EXISTS "Allow users to view their response items" ON public.response_items;

-- Create policy to allow anyone (including anonymous users) to insert response items
CREATE POLICY "Allow anonymous inserts on response_items"
ON public.response_items
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow questionnaire owners to view response items
CREATE POLICY "Allow users to view their response items"
ON public.response_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.responses r
    JOIN public.questionnaires q ON q.id = r.questionnaire_id
    WHERE r.id = response_items.response_id
    AND (q.owner_id = auth.uid() OR q.user_id = auth.uid())
  )
);

-- ========================================
-- FIX LEADS TABLE
-- ========================================

-- Drop existing conflicting policies on leads table
DROP POLICY IF EXISTS "Users can insert leads to their questionnaires" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert for guest submissions" ON public.leads;

-- Create a single, clear INSERT policy that allows both authenticated users and anonymous users
CREATE POLICY "Allow all inserts on leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

-- Keep the existing SELECT, UPDATE, DELETE policies for authenticated users
-- These should already exist but we'll recreate them to be sure

DROP POLICY IF EXISTS "Users can view leads from their questionnaires" ON public.leads;
CREATE POLICY "Users can view leads from their questionnaires"
ON public.leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update leads from their questionnaires" ON public.leads;
CREATE POLICY "Users can update leads from their questionnaires"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete leads from their questionnaires" ON public.leads;
CREATE POLICY "Users can delete leads from their questionnaires"
ON public.leads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questionnaires
    WHERE questionnaires.id = leads.questionnaire_id
    AND (questionnaires.owner_id = auth.uid() OR questionnaires.user_id = auth.uid())
  )
);
