# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e99f7e1b-0e0e-4c74-b35f-c8f675d1851f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e99f7e1b-0e0e-4c74-b35f-c8f675d1851f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Questionnaire Review & Automation System

### Step 3: Review & Publish (`/questionnaires/:id/review`)

Complete review system with validation, automation setup, and multi-channel distribution:

**UI Components:**
- `MetaPanel.tsx` – Title/category/tags with auto-save
- `QuestionsPreview.tsx` – Inline editing + drag&drop reordering  
- `LanguageTools.tsx` – Translation status + 1:1 duplication
- `ChannelsPanel.tsx` – Email/WhatsApp/Landing/Embed distribution
- `AutomationPanel.tsx` – Auto-reply setup with templates
- `ValidationPanel.tsx` – Critical issues (blocking) + warnings
- `PublishBar.tsx` – Sticky bottom bar with validation status

### Navigation Flow
1. **Profile & Branding** (Step 1)
2. **Question Builder** (Step 2) 
3. **Review & Publish** (Step 3) ← **NEW**
4. **Design & Preview** (Step 4)

### Automation Providers

**Email (Resend):**
- `src/integrations/emailProvider.ts` – Production + simulation fallback
- Template variables: `{{name}}`, `{{questionnaire_title}}`, `{{answer.question_id}}`

**WhatsApp (Meta Cloud API):**
- `src/integrations/whatsappProvider.ts` – Production + simulation fallback  
- Simple text messages with template variables

**Queue Processing:**
- `src/services/automation.ts` – Framework-agnostic processor
- `src/services/automationDb.ts` – Supabase adapter
- `supabase/functions/process-automation/` – Edge function processor

### Beta Mode (20 Users)

Set environment variables:
```bash
BETA_MODE=true
BETA_MAX_USERS=20
```

Rate limits: 50 responses per user, managed via `beta_users` table.

### Environment Setup

**Client (.env.local):**
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Providers (optional - falls back to simulation)
VITE_RESEND_API_KEY=your_resend_key
VITE_EMAIL_FROM="Your App <no-reply@yourdomain.com>"
VITE_META_WA_TOKEN=your_meta_token
VITE_META_WA_PHONE_ID=your_phone_id

# Beta
VITE_BETA_MODE=true
VITE_BETA_MAX_USERS=20
```

**Edge Functions (.env):**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
EMAIL_FROM="Your App <no-reply@yourdomain.com>"
META_WA_TOKEN=your_meta_token  
META_WA_PHONE_ID=your_phone_id
BETA_MODE=true
BETA_MAX_USERS=20
```

### Database Tables

Run `supabase/sql/questionnaire_automation.sql` to create:

- `questionnaire_responses` – Form submissions with contact/answers
- `automation_tasks` – Email/WhatsApp/analysis queue
- `beta_users` – Beta user management

### API Endpoints

**Submit Response:**
```bash
curl -X POST [supabase-url]/functions/v1/submit-response \
  -H 'Content-Type: application/json' \
  -d '{
    "questionnaire_id": "uuid",
    "channel": "landing",
    "contact": {"name": "John", "email": "john@example.com"},
    "answers": {"q1": "answer1"},
    "automation": {
      "email": {"enabled": true, "subject": "Thanks!", "text": "Thank you"}
    }
  }'
```

**Process Queue:**
```bash
curl -X GET [supabase-url]/functions/v1/process-automation
```

### Simulation Mode

Without API keys, the system runs in **simulation mode**:
- No actual emails/WhatsApp sent
- Tasks marked as `done (simulated)`
- Preview functionality works normally
- Perfect for development and demo

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e99f7e1b-0e0e-4c74-b35f-c8f675d1851f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 📋 חוקי עבודה בפרויקט

1. **לא משנים או מוחקים קבצים/קומפוננטות/סקריפטים שלא התבקש מפורשות!**
2. **לא מוסיפים קבצים או קוד חדש בלי אישור.**
3. **כל תיקון/פיצ'ר/בדיקה חייב להיות מבוצע בפרומפט אחד בלבד, ברור, וללא שינויים רוחביים במערכת.**
4. **כל עדכון שמבוצע – לוודא ש:**
   - אין שבירת פונקציונליות קיימת
   - אין פגיעה בשפה (עברית/אנגלית)
   - העיצוב נשאר כמו במקור (ולא מוחלף)
5. **אם יש התנגשות קבצים/תיקיות – לעצור ולבקש ממני הנחיות לפני מחיקה.**
6. **כל commit לגיטהב: לוודא שהוא עוסק רק במה שהתבקש בפרומפט, עם תיאור ברור בעברית/אנגלית.**

