-- תיקון מלא של טבלת questionnaires
-- הרץ את זה בסופר בייס כדי להוסיף עמודות חסרות

-- 1. הוספת עמודות חסרות לטבלת questionnaires
DO $$ 
BEGIN
    -- הוספת עמודת public_token אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'public_token') THEN
        ALTER TABLE questionnaires ADD COLUMN public_token TEXT;
    END IF;
    
    -- הוספת עמודת is_published אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'is_published') THEN
        ALTER TABLE questionnaires ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    
    -- הוספת עמודת form_token אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'form_token') THEN
        ALTER TABLE questionnaires ADD COLUMN form_token TEXT;
    END IF;
    
    -- הוספת עמודת brand_logo_url אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_logo_url') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_logo_url TEXT;
    END IF;
    
    -- הוספת עמודת brand_primary אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_primary') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_primary TEXT DEFAULT '#16939B';
    END IF;
    
    -- הוספת עמודת brand_accent אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_accent') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_accent TEXT DEFAULT '#FFD500';
    END IF;
    
    -- הוספת עמודת brand_background אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_background') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_background TEXT DEFAULT '#FFFFFF';
    END IF;
    
    -- הוספת עמודת owner_id אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'owner_id') THEN
        ALTER TABLE questionnaires ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- הוספת עמודת slug אם לא קיימת (למרות שלא נשתמש בה כרגע)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'slug') THEN
        ALTER TABLE questionnaires ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 2. יצירת public_token לכל השאלונים הקיימים
UPDATE questionnaires 
SET public_token = 'q_' || encode(gen_random_bytes(16), 'hex')
WHERE public_token IS NULL;

-- 3. יצירת form_token לכל השאלונים הקיימים
UPDATE questionnaires 
SET form_token = 'f_' || encode(gen_random_bytes(16), 'hex')
WHERE form_token IS NULL;

-- 4. הגדרת owner_id לכל השאלונים (אם יש משתמש מחובר)
UPDATE questionnaires 
SET owner_id = auth.uid()
WHERE owner_id IS NULL;

-- 5. בדיקה שהכל עובד
SELECT 
    id,
    title,
    public_token,
    is_published,
    form_token,
    brand_primary,
    brand_accent,
    brand_background,
    owner_id
FROM questionnaires 
LIMIT 5;
