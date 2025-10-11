-- תיקון ערכי slug בטבלת questionnaires
-- הרץ את זה בסופר בייס

-- 1. יצירת slug לכל השאלונים (מהכותרת)
UPDATE questionnaires 
SET slug = lower(regexp_replace(
  COALESCE(title, 'questionnaire-' || id::text), 
  '[^a-zA-Z0-9\u0590-\u05FF]', 
  '-', 
  'g'
))
WHERE slug IS NULL;

-- 2. הסרת דאש כפול
UPDATE questionnaires 
SET slug = regexp_replace(slug, '-+', '-', 'g')
WHERE slug LIKE '%-%-%';

-- 3. הסרת דאש מתחילת ומסוף
UPDATE questionnaires 
SET slug = trim(both '-' from slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- 4. בדיקה שהכל עובד
SELECT 
    id,
    title,
    slug,
    public_token,
    is_published
FROM questionnaires 
ORDER BY created_at DESC
LIMIT 5;
