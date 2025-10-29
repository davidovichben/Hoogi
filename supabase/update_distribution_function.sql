-- Update the get_distribution_by_token function (without link_text)
-- This function bypasses RLS and allows anonymous users to fetch distributions

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

COMMENT ON FUNCTION public.get_distribution_by_token IS 'Fetches an active distribution by token, bypassing RLS for anonymous access';
