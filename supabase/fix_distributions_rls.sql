-- Fix distributions table RLS for mobile/anonymous access
-- This allows anonymous users to view active distributions when accessing forms

-- Create RPC function to get distribution (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_distribution_by_token(
  p_token TEXT
)
RETURNS TABLE (
  id UUID,
  questionnaire_id UUID,
  token TEXT,
  is_active BOOLEAN,
  automation_template_ids JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.questionnaire_id,
    d.token,
    d.is_active,
    d.automation_template_ids,
    d.created_at
  FROM public.distributions d
  WHERE d.token = p_token
    AND d.is_active = true
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_distribution_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_distribution_by_token(TEXT) TO authenticated;

-- Alternative: Enable RLS policy for anonymous users to SELECT distributions
-- (Only if you prefer policy-based approach over RPC)

-- Enable RLS on distributions table (if not already enabled)
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

-- Drop existing anonymous select policy if it exists
DROP POLICY IF EXISTS "Allow anonymous users to view active distributions" ON public.distributions;

-- Create policy allowing anonymous users to SELECT active distributions
CREATE POLICY "Allow anonymous users to view active distributions"
ON public.distributions
FOR SELECT
TO anon
USING (is_active = true);

-- Also allow authenticated users to view active distributions
DROP POLICY IF EXISTS "Allow authenticated users to view active distributions" ON public.distributions;

CREATE POLICY "Allow authenticated users to view active distributions"
ON public.distributions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Verify the setup
SELECT
  'RLS Policies Created' as status,
  schemaname,
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'distributions';
