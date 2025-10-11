-- בדיקת סכמת הדאטהבייס הנוכחית
-- הרץ את זה בסופר בייס כדי לראות מה קיים ומה חסר

-- 1. בדוק איזה טבלאות קיימות
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. בדוק את מבנה טבלת questionnaires
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questionnaires' 
ORDER BY ordinal_position;

-- 3. בדוק את מבנה טבלת questions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;

-- 4. בדוק אם יש טבלת question_options
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'question_options'
) as question_options_exists;

-- 5. בדוק אם יש טבלת options (legacy)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'options'
) as options_exists;

-- 6. בדוק כמה שאלונים יש
SELECT COUNT(*) as questionnaires_count FROM questionnaires;

-- 7. בדוק כמה שאלות יש
SELECT COUNT(*) as questions_count FROM questions;

-- 8. בדוק אם יש public_token בשאלונים
SELECT 
  id, 
  title, 
  name,
  public_token,
  is_published,
  created_at
FROM questionnaires 
LIMIT 5;

-- 9. בדוק אם יש שאלות עם אפשרויות
SELECT 
  q.id,
  q.question_text,
  q.label,
  q.question_type,
  COUNT(o.id) as options_count
FROM questions q
LEFT JOIN (
  SELECT * FROM question_options 
  UNION ALL 
  SELECT * FROM options
) o ON q.id = o.question_id
GROUP BY q.id, q.question_text, q.label, q.question_type
LIMIT 10;
