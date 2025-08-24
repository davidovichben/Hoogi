-- הוספת עמודות חסרות לטבלת questionnaires
-- הרץ את זה בסופר בייס

-- 1. הוספת עמודות חסרות
DO $$ 
BEGIN
    -- הוספת עמודת public_token אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'public_token') THEN
        ALTER TABLE questionnaires ADD COLUMN public_token TEXT;
        RAISE NOTICE 'Added public_token column';
    END IF;
    
    -- הוספת עמודת is_published אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'is_published') THEN
        ALTER TABLE questionnaires ADD COLUMN is_published BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_published column';
    END IF;
    
    -- הוספת עמודת slug אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'slug') THEN
        ALTER TABLE questionnaires ADD COLUMN slug TEXT;
        RAISE NOTICE 'Added slug column';
    END IF;
    
    -- הוספת עמודת form_token אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'form_token') THEN
        ALTER TABLE questionnaires ADD COLUMN form_token TEXT;
        RAISE NOTICE 'Added form_token column';
    END IF;
    
    -- הוספת עמודת brand_logo_url אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_logo_url') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_logo_url TEXT;
        RAISE NOTICE 'Added brand_logo_url column';
    END IF;
    
    -- הוספת עמודת brand_primary אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_primary') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_primary TEXT DEFAULT '#16939B';
        RAISE NOTICE 'Added brand_primary column';
    END IF;
    
    -- הוספת עמודת brand_accent אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_accent') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_accent TEXT DEFAULT '#FFD500';
        RAISE NOTICE 'Added brand_accent column';
    END IF;
    
    -- הוספת עמודת brand_background אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'brand_background') THEN
        ALTER TABLE questionnaires ADD COLUMN brand_background TEXT DEFAULT '#FFFFFF';
        RAISE NOTICE 'Added brand_background column';
    END IF;
    
    -- הוספת עמודת owner_id אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'owner_id') THEN
        ALTER TABLE questionnaires ADD COLUMN owner_id UUID;
        RAISE NOTICE 'Added owner_id column';
    END IF;
    
    -- הוספת עמודת variant_name אם לא קיימת
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questionnaires' AND column_name = 'variant_name') THEN
        ALTER TABLE questionnaires ADD COLUMN variant_name TEXT;
        RAISE NOTICE 'Added variant_name column';
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

-- 4. יצירת slug לכל השאלונים הקיימים (מהכותרת)
UPDATE questionnaires 
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9\u0590-\u05FF]', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

-- 5. בדיקה שהכל עובד
SELECT 
    id,
    title,
    slug,
    public_token,
    is_published,
    form_token,
    brand_primary,
    brand_accent,
    brand_background,
    owner_id,
    variant_name
FROM questionnaires 
LIMIT 5;
