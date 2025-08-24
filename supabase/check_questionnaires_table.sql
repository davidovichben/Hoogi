-- בדיקת מבנה טבלת questionnaires
-- הרץ את זה בסופר בייס כדי לראות מה קיים ומה חסר

-- 1. בדוק איזה עמודות קיימות
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questionnaires' 
ORDER BY ordinal_position;

-- 2. בדוק אם יש עמודת slug
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'questionnaires' AND column_name = 'slug'
) as slug_exists;

-- 3. בדוק אם יש עמודת public_token
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'questionnaires' AND column_name = 'public_token'
) as public_token_exists;

-- 4. בדוק אם יש עמודת is_published
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'questionnaires' AND column_name = 'is_published'
) as is_published_exists;

-- 5. הצג כמה שאלונים יש
SELECT COUNT(*) as questionnaires_count FROM questionnaires;

-- 6. הצג דוגמה של שאלון
SELECT * FROM questionnaires LIMIT 1;
