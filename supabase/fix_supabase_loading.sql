-- Fix Supabase loading issue - Simple version
-- This script will check and fix the Supabase configuration

-- 1. Check if there are any problematic tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%supabase%' 
   OR tablename LIKE '%lcazbaggfdejukjgkpeu%';

-- 2. Check for any problematic functions
SELECT 
    n.nspname as schema,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%supabase%'
   OR p.proname LIKE '%lcazbaggfdejukjgkpeu%';

-- 3. Check for any problematic views
SELECT 
    schemaname,
    viewname
FROM pg_views
WHERE viewname LIKE '%supabase%'
   OR viewname LIKE '%lcazbaggfdejukjgkpeu%';

-- 4. Check for any problematic policies
SELECT 
    polname as policy_name,
    c.relname as table_name
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE polname LIKE '%supabase%'
   OR polname LIKE '%lcazbaggfdejukjgkpeu%';

-- 5. Check for any problematic triggers
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname LIKE '%supabase%'
   OR t.tgname LIKE '%lcazbaggfdejukjgkpeu%';

-- 6. Check our main tables exist
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename IN ('questionnaires', 'questions', 'question_options', 'responses');

-- 7. Check for any problematic settings
SELECT name, setting
FROM pg_settings 
WHERE name LIKE '%supabase%' 
   OR setting LIKE '%lcazbaggfdejukjgkpeu%';

-- Run this script in your Supabase SQL editor
-- Look for any results that contain the problematic URL
-- If found, we'll need to manually remove or fix those items
