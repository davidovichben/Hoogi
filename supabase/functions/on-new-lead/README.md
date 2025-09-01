# on-new-lead
Edge Function שמופעלת ב-HTTP ע"י טריגר DB. מקבלת { type, table, record } ושולחת Webhook/Email.

Env:
- INCOMING_WEBHOOK_SECRET: סוד החתימה מהטריגר (חובה בפרוד)
- WEBHOOK_URL: יעד ל-POST (Zapier/CRM) – אופציונלי
- RESEND_API_KEY, FROM_EMAIL, TO_EMAIL – לאימייל אופציונלי
