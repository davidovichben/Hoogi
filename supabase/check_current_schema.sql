-- בדיקה מה באמת קיים בטבלת questionnaires
-- הרץ את זה בסופר בייס

-- 1. בדוק איזה עמודות קיימות
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questionnaires' 
ORDER BY ordinal_position;

-- 2. בדוק אם יש עמודת locale
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'questionnaires' AND column_name = 'locale'
) as locale_exists;

-- 3. הצג דוגמה של שאלון
SELECT * FROM questionnaires LIMIT 1;
