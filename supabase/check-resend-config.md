# Resend Email Not Delivered - Troubleshooting Guide

## Problem
Resend returns 200 status and email ID, but emails don't arrive in Gmail inbox.

## Most Common Cause
**FROM_EMAIL domain is not verified in Resend.**

When the domain isn't verified:
- ✅ Resend accepts the email (200 status)
- ❌ Resend does NOT deliver it
- ❌ No error is returned

## Steps to Fix

### 1. Check What FROM_EMAIL You're Using

In your Supabase Edge Functions logs, look for:
```
📤 [SEND-EMAIL] FROM: xxx@yourdomain.com → TO: recipient@gmail.com
```

### 2. Log into Resend Dashboard

Go to: https://resend.com/domains

### 3. Check Domain Status

**Option A: Using Your Own Domain (Recommended)**

If FROM_EMAIL is like `noreply@ihoogi.com`:

1. Check if `ihoogi.com` appears in your Resend domains
2. Status should be **"Verified" ✅**
3. If not verified, you need to:
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for DNS propagation (can take 24-48 hours)

**Option B: Using Resend's Test Domain (Quick Fix)**

If you don't have a verified domain yet:

1. In Resend, they provide a test domain like `onboarding@resend.dev`
2. Update your Supabase environment variable:
   ```
   FROM_EMAIL=onboarding@resend.dev
   ```
3. **Important**: Test domains have limitations:
   - Can only send to verified recipient emails
   - Limited sending volume
   - Should only be used for testing

### 4. Verify Email Delivery in Resend

1. Go to: https://resend.com/emails
2. Find the email by ID (from logs)
3. Check the status:
   - **Delivered** ✅ - Check spam folder
   - **Queued** ⏳ - Domain not verified
   - **Failed** ❌ - Check error message

### 5. Check Resend API Key Permissions

1. Go to: https://resend.com/api-keys
2. Make sure your API key has "Sending access"
3. Check if it's restricted to specific domains

## Quick Fix for Testing

### Temporary Solution (Test Domain)

Update environment variable in Supabase:
```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
FROM_EMAIL=onboarding@resend.dev
```

Then redeploy:
```bash
supabase functions deploy send-automation-email
```

### Permanent Solution (Your Domain)

1. Add your domain in Resend
2. Add DNS records to your domain:
   ```
   TXT  @  v=spf1 include:amazonses.com ~all
   CNAME resend._domainkey  [Resend provides this]
   TXT  _dmarc  v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
   ```
3. Wait for verification (check every few hours)
4. Update FROM_EMAIL to use your domain

## Check Spam Folder

Even with verified domain, Gmail might mark as spam if:
- New sender domain
- High volume of emails
- Content triggers spam filters

## Test Email Sending

Create a test script to verify:

```typescript
// Test in Supabase Edge Functions
const { data, error } = await supabase.functions.invoke('send-automation-email', {
  body: {
    to: 'your-email@gmail.com',
    subject: 'Test Email from iHoogi',
    html: '<h1>Test</h1><p>If you see this, email is working!</p>',
    text: 'Test email'
  }
});

console.log('Response:', data);
```

## Resend Sandbox Mode

If you're using Resend's free tier:
- You might be in "Sandbox mode"
- Only sends to verified email addresses
- Add recipient emails in Resend dashboard first

**To verify:**
1. Go to https://resend.com/domains
2. Check if there's a "Sandbox" badge
3. Add recipient emails to "Verified emails" list

## Summary Checklist

- [ ] Check what FROM_EMAIL is being used (in logs)
- [ ] Verify domain in Resend dashboard
- [ ] Check DNS records (SPF, DKIM, DMARC)
- [ ] Check Resend email delivery status
- [ ] Check Gmail spam folder
- [ ] Verify Resend API key has sending permissions
- [ ] If using sandbox: Add recipient to verified emails
- [ ] Try sending to a different email provider (not just Gmail)

## Contact Resend Support

If still not working after verifying domain:
- Email: support@resend.com
- Include: Email ID from logs
- They can check delivery logs on their end
