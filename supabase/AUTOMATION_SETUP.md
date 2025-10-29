# Automation Setup Guide

## Issue
SMS and emails are not being sent when users submit questionnaires.

## Root Causes Identified

1. **Missing Environment Variables** - The edge functions require API credentials
2. **Edge Functions May Not Be Deployed** - The functions need to be deployed to Supabase
3. **Missing columns in leads table** - Email, phone, name, distribution_token columns needed

## Required Environment Variables

### For Email Sending (send-automation-email function)
```bash
RESEND_API_KEY=re_xxxxx  # Your Resend API key
FROM_EMAIL=noreply@yourdomain.com  # Verified sender email
```

### For SMS Sending (send-sms function)
```bash
FREE_SMS_API_KEY=xxxxx
FREE_SMS_API_USERNAME=xxxxx
FREE_SMS_API_PASSWORD=xxxxx
FREE_SMS_API_SENDER=xxxxx  # Sender name/number
```

### For Webhook Security (on-new-lead function)
```bash
INCOMING_WEBHOOK_SECRET=xxxxx  # Optional but recommended
```

### Required by All Functions
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

## Steps to Fix

### 1. Run SQL Migration to Add Missing Columns

The file `/home/hoogi/supabase/create_submit_response_function.sql` needs to be run in the Supabase SQL Editor. This will:
- Add email, phone, name, distribution_token, channel columns to the leads table
- Create the submit_lead() function

### 2. Configure Environment Variables

In your Supabase project:
```bash
# Using Supabase CLI:
supabase secrets set RESEND_API_KEY=your_key_here
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FREE_SMS_API_KEY=your_key_here
supabase secrets set FREE_SMS_API_USERNAME=your_username_here
supabase secrets set FREE_SMS_API_PASSWORD=your_password_here
supabase secrets set FREE_SMS_API_SENDER=your_sender_here

# Or through Supabase Dashboard:
# Project Settings > Edge Functions > Secrets
```

### 3. Deploy Edge Functions

```bash
# Deploy all automation-related functions:
supabase functions deploy on-new-lead
supabase functions deploy send-automation-email
supabase functions deploy send-sms
```

### 4. Test the Flow

After deployment:
1. Submit a test questionnaire through the public form
2. Check the Edge Function logs:
   ```bash
   supabase functions logs on-new-lead --follow
   ```
3. Look for error messages or missing configuration issues

## How the Automation Works

### Flow:
1. User submits questionnaire → `questionnaire-live.ts`
2. Frontend calls `submit_lead()` RPC function → Inserts lead into database
3. Frontend calls `on-new-lead` edge function → Triggers automation
4. `on-new-lead` function:
   - Looks up questionnaire and distribution
   - Finds automation templates configured for the distribution
   - For each template and each channel (email/SMS):
     - Calls `send-automation-email` or `send-sms` functions
     - These functions use Resend API (email) or SMS4Free API (SMS)

### Key Files:
- `/supabase/functions/on-new-lead/index.ts` - Main automation orchestrator
- `/supabase/functions/send-automation-email/index.ts` - Email sender
- `/supabase/functions/send-sms/index.ts` - SMS sender
- `/ng/src/app/pages/questionnaire-live/questionnaire-live.ts` - Frontend trigger

## Verification Checklist

- [ ] Leads table has email, phone, name, distribution_token columns
- [ ] submit_lead() function exists in database
- [ ] RESEND_API_KEY is configured and valid
- [ ] FROM_EMAIL is verified in Resend dashboard
- [ ] SMS API credentials are configured (all 4 secrets)
- [ ] Edge functions are deployed (check Supabase dashboard)
- [ ] Test questionnaire submission triggers automation
- [ ] Check logs for any errors

## Common Issues

### "Email service not configured"
- RESEND_API_KEY is missing or invalid
- Solution: Set the secret and redeploy the function

### "SMS API credentials not configured"
- One or more SMS secrets are missing
- Solution: Set all 4 SMS secrets and redeploy

### "No active distribution found"
- The questionnaire doesn't have an active distribution
- Solution: Create a distribution in the Distribution Hub page

### "Template not found"
- The distribution references a template that doesn't exist
- Solution: Check that automation templates are created and linked

### Silent failures
- Check the Edge Function logs for detailed error messages
- Enable verbose logging by checking the console.log statements
