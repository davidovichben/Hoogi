-- Setup Database Webhook for on-new-lead Edge Function
-- This creates a database trigger that calls the Edge Function when a new lead is inserted

-- First, check if pg_net extension exists (needed for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_lead_insert_trigger ON public.leads;
DROP FUNCTION IF EXISTS handle_new_lead() CASCADE;

-- Create function that calls the Edge Function
CREATE OR REPLACE FUNCTION handle_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
  payload JSONB;
BEGIN
  -- Get the webhook URL (you need to replace this with your actual URL)
  -- Format: https://YOUR_PROJECT_REF.supabase.co/functions/v1/on-new-lead
  webhook_url := current_setting('app.settings.webhook_url', true);

  -- Get the webhook secret
  webhook_secret := current_setting('app.settings.webhook_secret', true);

  -- Build the payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  -- Log the attempt
  RAISE LOG 'Calling webhook for new lead: %', NEW.id;

  -- Make HTTP request to Edge Function
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_lead_insert_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_lead();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, authenticated, service_role;

COMMENT ON FUNCTION handle_new_lead() IS 'Triggers webhook to on-new-lead Edge Function when new lead is inserted';

-- Show status
SELECT 'Webhook trigger created successfully!' as status;
SELECT 'IMPORTANT: You must set these config values:' as note;
SELECT '  app.settings.webhook_url = https://YOUR_PROJECT.supabase.co/functions/v1/on-new-lead' as step1;
SELECT '  app.settings.webhook_secret = YOUR_WEBHOOK_SECRET' as step2;
