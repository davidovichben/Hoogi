-- Create function to get all leads that might need reminders in a single query
-- This function joins distributions, automation_templates, and leads

CREATE OR REPLACE FUNCTION get_leads_needing_reminders()
RETURNS TABLE (
  lead_id UUID,
  questionnaire_id UUID,
  distribution_id UUID,
  distribution_token TEXT,
  automation_template_ids JSONB,
  is_active BOOLEAN,
  lead_status TEXT,
  lead_sub_status TEXT,
  answer_json JSONB,
  created_at TIMESTAMPTZ,
  last_reminder_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    l.id AS lead_id,
    d.questionnaire_id,
    d.id AS distribution_id,
    d.token AS distribution_token,
    d.automation_template_ids,
    d.is_active,
    l.status AS lead_status,
    l.sub_status AS lead_sub_status,
    l.answer_json,
    l.created_at,
    l.last_reminder_sent_at
  FROM
    public.distributions d
  INNER JOIN
    public.leads l ON (
      (d.token IS NOT NULL AND l.distribution_token = d.token)
      OR (d.token IS NULL AND l.questionnaire_id = d.questionnaire_id)
    )
  WHERE
    d.is_active = true
    AND d.automation_template_ids IS NOT NULL
    AND jsonb_array_length(d.automation_template_ids) > 0
    -- Check if any template in the distribution has include_reminder = true
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(d.automation_template_ids) AS template_mapping
      INNER JOIN public.automation_templates at
        ON at.id = (template_mapping->>'template_id')::UUID
      WHERE at.include_reminder = true
        -- Match status if reminder_status is set in template
        AND (at.reminder_status IS NULL OR at.reminder_status = '' OR l.status = at.reminder_status)
        -- Match sub_status if reminder_sub_status is set in template
        AND (at.reminder_sub_status IS NULL OR at.reminder_sub_status = '' OR l.sub_status = at.reminder_sub_status)
    );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_leads_needing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leads_needing_reminders() TO service_role;

COMMENT ON FUNCTION get_leads_needing_reminders() IS 'Returns all leads that match reminder criteria from distributions with reminder-enabled templates';
