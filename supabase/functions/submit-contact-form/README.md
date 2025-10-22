# Submit Contact Form - Supabase Edge Function

This Edge Function handles contact form submissions, stores data in the database, and sends emails using Resend.

## Features

1. **Validates and stores** contact form data in `contact_submissions` table
2. **Uploads file attachments** to Supabase storage bucket
3. **Routes emails** based on country + subject combination from `contact_rules` table:
   - First tries: exact match (country + subject)
   - Then tries: country-only match (first result)
   - Falls back to: `davidovichben@gmail.com`
4. **Sends beautiful HTML emails** using Resend API

## Prerequisites

### 1. Create Tables
Run these SQL files in your Supabase SQL Editor:
```bash
# Run in order:
1. create_contact_rules_table.sql
2. create_contact_submissions_table.sql
```

### 2. Set Environment Variables
In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Get your Resend API key from: https://resend.com/api-keys

### 3. Configure Resend Domain
In Resend dashboard:
1. Add and verify your domain (e.g., `hoogi.app`)
2. Update the `from` address in the function code:
   ```typescript
   from: 'Hoogi Contact Form <noreply@hoogi.app>'
   ```

## Deployment

### Deploy the function:
```bash
supabase functions deploy submit-contact-form
```

### Test locally:
```bash
supabase functions serve submit-contact-form
```

Then send a test request:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/submit-contact-form' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "country": "ישראל",
    "subject": "תמיכה טכנית",
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message"
  }'
```

## Request Format

### POST /submit-contact-form

**Body:**
```json
{
  "country": "ישראל",
  "subject": "תמיכה טכנית",
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I need help with...",
  "url": "https://example.com/issue",  // optional
  "file_name": "screenshot.png",        // optional
  "file_size": 1024000,                 // optional, in bytes
  "file_type": "image/png",             // optional
  "file_path": "path/in/storage"        // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contact form submitted and email sent successfully",
  "submission_id": "uuid-here",
  "email_id": "resend-email-id",
  "routed_to": "support@example.com"
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

## Email Routing Logic

The function determines the recipient email using this priority:

1. **Exact Match**: `country` + `subject` combination in `contact_rules`
   ```sql
   SELECT email FROM contact_rules
   WHERE country = 'ישראל' AND subject = 'תמיכה טכנית'
   ```

2. **Country Match**: First result for `country` only
   ```sql
   SELECT email FROM contact_rules
   WHERE country = 'ישראל'
   LIMIT 1
   ```

3. **Default Fallback**: `davidovichben@gmail.com`

## Email Template

The email includes:
- Subject: `[Contact Form] {subject} - {name}`
- HTML formatted with Hebrew RTL support
- All form fields nicely formatted
- File attachment metadata (if present)
- Submission ID and timestamp
- Reply-to set to user's email

## Storage Bucket

File attachments are stored in the `contact-attachments` bucket with policies:
- **Upload**: Anyone can upload (during form submission)
- **View**: Authenticated users only
- **Delete**: Authenticated users only

Files are named with timestamp + random string to prevent collisions:
```
{timestamp}_{random}.{extension}
```

## Monitoring

View function logs in Supabase Dashboard:
- Edge Functions → submit-contact-form → Logs

Common log messages:
- `Found exact match for {country} + {subject}: {email}`
- `Found country match for {country}: {email}`
- `No match found, using default: {email}`
- `Contact submission created: {id}`
- `Email sent successfully: {result}`

## Troubleshooting

### Email not sending
- Check `RESEND_API_KEY` is set correctly
- Verify domain in Resend dashboard
- Check function logs for Resend API errors

### File upload failing
- Verify storage bucket exists: `contact-attachments`
- Check storage policies are correctly set
- Ensure file size is within limits

### Database errors
- Verify tables exist: `contact_submissions`, `contact_rules`
- Check RLS policies allow anonymous inserts
- Review table constraints (required fields)
