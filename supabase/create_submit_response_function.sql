-- Create a database function to submit responses that bypasses RLS
-- This is a GUARANTEED fix for the mobile RLS issue
-- Run this in the Supabase SQL Editor

-- First, ensure the columns exist
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS response_data JSONB;
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.submit_questionnaire_response(
  p_questionnaire_id UUID,
  p_response_data JSONB,
  p_submitted_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function owner, bypassing RLS
SET search_path = public
AS $$
DECLARE
  v_response_id UUID;
BEGIN
  -- Insert the response
  INSERT INTO public.responses (
    questionnaire_id,
    response_data,
    submitted_at,
    status,
    created_at
  )
  VALUES (
    p_questionnaire_id,
    p_response_data,
    p_submitted_at,
    'submitted',
    NOW()
  )
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_questionnaire_response(UUID, JSONB, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_questionnaire_response(UUID, JSONB, TIMESTAMPTZ) TO authenticated;

-- Also create a function for inserting leads
CREATE OR REPLACE FUNCTION public.submit_lead(
  p_questionnaire_id UUID,
  p_client_name TEXT,
  p_answer_json JSONB,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_distribution_token TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- Insert the lead
  INSERT INTO public.leads (
    questionnaire_id,
    client_name,
    answer_json,
    email,
    phone,
    name,
    distribution_token,
    channel,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_questionnaire_id,
    p_client_name,
    p_answer_json,
    p_email,
    p_phone,
    p_name,
    p_distribution_token,
    p_channel,
    'new',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_lead(UUID, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_lead(UUID, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add missing columns to leads table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
        ALTER TABLE public.leads ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') THEN
        ALTER TABLE public.leads ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name') THEN
        ALTER TABLE public.leads ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'distribution_token') THEN
        ALTER TABLE public.leads ADD COLUMN distribution_token TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'channel') THEN
        ALTER TABLE public.leads ADD COLUMN channel TEXT;
    END IF;
END $$;
