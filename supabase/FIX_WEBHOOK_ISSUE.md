# Fix: Webhook Payload Empty Issue

## Problem
The `on-new-lead` Edge Function is being triggered, but receives an empty payload:
```
📦 [WEBHOOK] Payload received: { type: undefined, table: undefined, recordId: undefined }
```

This means the automation never runs and emails are never sent.

## Root Cause
The database webhook/trigger is either:
1. Not configured correctly
2. Sending data in wrong format
3. Missing entirely

## Solution Steps

### Step 1: Check Existing Webhook Configuration

Go to Supabase Dashboard → Database → Webhooks

**Check if there's a webhook for the `leads` table:**
- Table: `leads`
- Events: `INSERT`
- Type: `HTTP Request`
- URL: Should point to your `on-new-lead` function

### Step 2: Option A - Use Database Webhooks (Recommended)

If you're using Supabase's built-in webhooks:

1. Go to: **Database → Webhooks**
2. Click **"Create a new webhook"** (or edit existing one)
3. Configure:
   - **Table**: `leads`
   - **Events**: Check `INSERT`
   - **Type**: `HTTP Request`
   - **HTTP Request URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/on-new-lead`
   - **HTTP Headers**:
     ```
     Content-Type: application/json
     x-webhook-secret: YOUR_WEBHOOK_SECRET
     ```
   - **HTTP Method**: `POST`

4. Supabase webhooks send this format:
   ```json
   {
     "type": "INSERT",
     "table": "leads",
     "record": { ...lead data... },
     "schema": "public",
     "old_record": null
   }
   ```

### Step 3: Option B - Use Database Triggers (Alternative)

If webhooks don't work, use a database trigger:

1. Install `pg_net` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. Run the SQL file:
   ```bash
   # Via Supabase Dashboard → SQL Editor
   # Copy and paste: supabase/setup-leads-webhook.sql
   ```

3. Set configuration:
   ```sql
   -- Set these in SQL Editor
   ALTER DATABASE postgres SET app.settings.webhook_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/on-new-lead';
   ALTER DATABASE postgres SET app.settings.webhook_secret = 'YOUR_WEBHOOK_SECRET';
   ```

### Step 4: Deploy Updated Function

Deploy the updated function with better logging:

```bash
supabase functions deploy on-new-lead
```

### Step 5: Test It

1. Create a new lead (fill out questionnaire)
2. Check the logs in Supabase Dashboard → Edge Functions → on-new-lead → Logs
3. You should now see:
   ```
   📦 [WEBHOOK] Raw payload: {"type":"INSERT","table":"leads","record":{...}}
   ✅ [EMAIL] Email sent successfully
   ```

## Debugging Steps

### Check What's Actually Being Sent

After deploying the updated function, the logs will show:
- `📦 [WEBHOOK] Raw payload:` - The actual JSON received
- `📦 [WEBHOOK] Payload keys:` - What fields are in the payload

This will tell you exactly what format is being sent.

### Common Issues

**Issue 1: Webhook Secret Mismatch**
```
🔐 [WEBHOOK] Signature validation: FAILED
```
**Fix**: Update `INCOMING_WEBHOOK_SECRET` in Edge Function secrets to match webhook config

**Issue 2: Wrong URL**
- Webhook might be pointing to wrong function
- Check the webhook URL ends with `/on-new-lead`

**Issue 3: Webhook Disabled**
- Check if webhook is enabled in Supabase Dashboard
- Look for toggle switch next to the webhook

**Issue 4: Function Not Deployed**
- Make sure to deploy the function after code changes
- Check deployment succeeded

## Quick Test

To test if the function works when called correctly, use this curl command:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/on-new-lead' \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "type": "INSERT",
    "table": "leads",
    "record": {
      "id": "test-123",
      "email": "test@example.com",
      "questionnaire_id": "YOUR_QUESTIONNAIRE_ID",
      "answer_json": {},
      "distribution_token": "d_test123"
    }
  }'
```

If this works but the automatic trigger doesn't, the webhook configuration is wrong.

## Check Your Project Reference

Your Supabase project URL format:
```
https://[PROJECT_REF].supabase.co/functions/v1/on-new-lead
```

Find your PROJECT_REF:
- Go to Supabase Dashboard
- Project Settings → API
- Look at "Project URL" - the part before `.supabase.co` is your PROJECT_REF

## Summary

1. ✅ Deploy updated function (better logging)
2. ✅ Check/fix webhook configuration in Supabase Dashboard
3. ✅ Test by creating a new lead
4. ✅ Check logs to see the raw payload
5. ✅ Share the raw payload if still having issues
