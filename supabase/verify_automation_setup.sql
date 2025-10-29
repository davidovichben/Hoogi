-- Verification Script for Automation Setup
-- Run this in Supabase SQL Editor to check if everything is configured correctly

-- Check if leads table has required columns
SELECT
  'Leads Table Columns' as check_name,
  column_name,
  data_type,
  CASE WHEN column_name IN ('email', 'phone', 'name', 'distribution_token', 'channel')
       THEN '✅ Present'
       ELSE '⚠️ Check'
  END as status
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('email', 'phone', 'name', 'distribution_token', 'channel', 'questionnaire_id', 'answer_json')
ORDER BY column_name;

-- Check if submit_lead function exists
SELECT
  'submit_lead Function' as check_name,
  routine_name,
  '✅ Present' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'submit_lead';

-- Check if submit_questionnaire_response function exists
SELECT
  'submit_questionnaire_response Function' as check_name,
  routine_name,
  '✅ Present' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'submit_questionnaire_response';

-- Check distributions table structure
SELECT
  'Distributions Table' as check_name,
  column_name,
  data_type,
  CASE WHEN column_name IN ('automation_template_ids', 'token', 'is_active')
       THEN '✅ Required column'
       ELSE '📝 Info'
  END as status
FROM information_schema.columns
WHERE table_name = 'distributions'
ORDER BY column_name;

-- Check if there are any active distributions
SELECT
  'Active Distributions Count' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has active distributions'
       ELSE '⚠️ No active distributions found'
  END as status
FROM distributions
WHERE is_active = true;

-- Check automation templates
SELECT
  'Automation Templates Count' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has templates'
       ELSE '⚠️ No templates found'
  END as status
FROM automation_templates;

-- Sample distribution configuration (if any exist)
SELECT
  'Sample Distribution Config' as info,
  d.id,
  d.questionnaire_id,
  d.token,
  d.is_active,
  d.automation_template_ids,
  q.title as questionnaire_title
FROM distributions d
LEFT JOIN questionnaires q ON q.id = d.questionnaire_id
WHERE d.is_active = true
LIMIT 3;

-- Recent leads (check if leads are being created)
SELECT
  'Recent Leads (Last 5)' as info,
  l.id,
  l.questionnaire_id,
  l.email,
  l.phone,
  l.distribution_token,
  l.channel,
  l.created_at
FROM leads l
ORDER BY l.created_at DESC
LIMIT 5;

-- Check RLS policies on leads table
SELECT
  'Leads RLS Policies' as info,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'leads';
