# Email Debugging - Step by Step

## CRITICAL: Check Resend Dashboard First!

### 1. Go to Resend Emails Page
Visit: https://resend.com/emails

### 2. Find Your Recent Emails
Look for the emails you just sent. You should see them listed with:
- **Email ID** (like `af12a0c9-9e27-47e7-9a22-8629d76509c5`)
- **Recipient**
- **Subject**
- **Status**
- **Time sent**

### 3. Click on One of the Emails

You'll see detailed information. **TELL ME WHAT YOU SEE:**

#### Possible Status Values:

**A) Status: "Delivered" ✅**
- ✅ Email was delivered successfully
- **Action**: Check spam/promotions folders in Gmail
- **Try**: Search Gmail for the sender email or subject

**B) Status: "Bounced" ❌**
- ❌ Gmail rejected the email
- **Look for**: Bounce reason (soft bounce, hard bounce, etc.)
- **Common reasons**:
  - "550 Mailbox not found" = Wrong recipient email
  - "550 Spam detected" = Content triggered spam filter
  - "550 Rate limit exceeded" = Sending too many emails

**C) Status: "Queued" ⏳**
- Still waiting to be sent
- **If stuck here**: Domain might not be fully verified
- **Action**: Wait 5 minutes and refresh

**D) Status: "Failed" ❌**
- Failed to send
- **Look for**: Error message
- **Common reasons**: API key issues, from email issues

#### Events Section

You should see events like:
- ✅ `email.sent` - Resend sent it
- ✅ `email.delivered` - Recipient server accepted it
- ❌ `email.bounced` - Recipient server rejected it
- ✅ `email.opened` - Recipient opened it (if tracking enabled)

---

## Test 1: Simple Email Test

Deploy the simple test function and try sending:

### Deploy:
```bash
# Via Supabase Dashboard:
# Edge Functions → test-email-simple → Deploy
```

### Test it:
```bash
# Using curl or from your app:
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/test-email-simple' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com"}'
```

This sends a VERY simple email with minimal HTML. If this works, the problem is with the automation email content.

---

## Test 2: Check Gmail Filters

### Check if Gmail is auto-filtering:

1. **Search Gmail for**: `from:YOUR_FROM_EMAIL`
2. **Check these folders**:
   - Spam
   - Promotions tab
   - Social tab
   - All Mail

3. **Check Gmail filters**:
   - Go to Gmail Settings → Filters and Blocked Addresses
   - See if any filters are catching your emails

4. **Try a different email**:
   - Send to a different email provider (not Gmail)
   - Try Yahoo, Outlook, or ProtonMail
   - This tells us if it's Gmail-specific

---

## Test 3: Check Email Content Issues

### Common Issues that Cause Silent Failures:

1. **Broken/Invalid URLs in content**
   - Image URLs that don't resolve
   - Links to invalid domains

2. **Spam Trigger Words**
   - Too many sales words
   - ALL CAPS in subject
   - Too many exclamation marks!!!

3. **HTML Issues**
   - Malformed HTML
   - Very large HTML (>100KB)
   - Suspicious scripts or styles

### From Your Logs:

Check these values:
```
📋 [SEND-EMAIL] Email payload: {
  "from": "...",          ← Should be your verified domain
  "to": ["..."],          ← Check this is correct
  "subject": "...",       ← Check for spam words
  "htmlLength": ...,      ← Should be < 100000
  "textLength": ...,
  "replyTo": "..."
}
```

---

## Test 4: Direct Resend API Test

Test Resend directly (bypassing our code):

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "your-from@domain.com",
    "to": ["your-email@gmail.com"],
    "subject": "Direct Test",
    "html": "<h1>Test</h1><p>Direct API test</p>"
  }'
```

If this works but your automation doesn't, the issue is in our function code.

---

## What to Share

Please share:

1. **Resend dashboard status** for the email
2. **Any bounce/error messages** from Resend
3. **The "to" email address** you're testing with
4. **Results** of the simple test function
5. **Your FROM_EMAIL** (from environment variables)

This will help me pinpoint exactly what's wrong!
