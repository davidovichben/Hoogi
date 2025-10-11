-- Diagnostics function: read-only checks, no data changes
create or replace function public.diagnostics_report()
returns table (check_key text, ok boolean, details jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1) required tables exist
  return query
  with req(name) as (
    values ('attachments'),('leads'),('option_i18n'),('profiles'),('question_i18n'),
           ('question_options'),('questionnaire_i18n'),('questionnaires'),('questions'),
           ('response_items'),('responses')
  ), found as (
    select table_name from information_schema.tables
    where table_schema='public' and table_name in (select name from req)
  )
  select 'tables_exist', (select count(*) = (select count(*) from req) from found),
         jsonb_build_object(
           'found',(select jsonb_agg(table_name order by table_name) from found),
           'missing',(select jsonb_agg(name) from (select name from req except select table_name from found) m)
         );

  -- 2) required columns exist
  return query
  with req as (
    select * from (values
      ('questionnaires','is_published'),
      ('questionnaires','form_token'),
      ('questionnaires','brand_logo_url'),
      ('questionnaires','brand_primary'),
      ('questionnaires','brand_accent'),
      ('questionnaires','brand_background'),
      ('questions','questionnaire_id'),
      ('responses','respondent_contact'),
      ('responses','status'),
      ('response_items','response_id'),
      ('response_items','question_id')
    ) t(table_name, column_name)
  ), found as (
    select table_name, column_name
    from information_schema.columns
    where table_schema='public'
      and (table_name, column_name) in (select table_name, column_name from req)
  )
  select 'columns_exist',
         (select count(*) = (select count(*) from req) from found),
         jsonb_build_object('missing',(select jsonb_agg((r.table_name,r.column_name)) from (select * from req except select * from found) r));

  -- 3) RLS enabled on core tables (and storage.objects)
  return query
  with t as (
    select n.nspname as schema, c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public','storage') and c.relkind='r'
      and c.relname in ('attachments','leads','option_i18n','profiles','question_i18n',
                        'question_options','questionnaire_i18n','questionnaires','questions',
                        'response_items','responses','objects')
  )
  select 'rls_enabled', bool_and(rls_enabled),
         jsonb_agg(jsonb_build_object('table',table_name,'rls',rls_enabled) order by table_name);

  -- 4) RLS policies present (objects & questionnaires)
  return query
  with p as (
    select schemaname, tablename, policyname, roles, cmd
    from pg_policies
    where schemaname in ('public','storage')
      and tablename in ('objects','questionnaires')
  )
  select 'rls_policies_present',
         exists(select 1 from p where tablename='objects') and
         exists(select 1 from p where tablename='questionnaires'),
         jsonb_agg(jsonb_build_object('table',tablename,'policy',policyname,'cmd',cmd,'roles',roles));

  -- 5) expected triggers exist (sample)
  return query
  with trg as (
    select event_object_table as table_name, trigger_name
    from information_schema.triggers
    where trigger_schema='public'
      and event_object_table in ('questionnaires','leads','questions')
  )
  select 'triggers_present', exists(select 1 from trg),
         jsonb_agg(jsonb_build_object('table',table_name,'trigger',trigger_name));

  -- 6) storage buckets exist (adjust names if your project differs)
  return query
  select 'storage_buckets',
         exists(select 1 from storage.buckets where name in ('branding','attachments')),
         jsonb_agg(jsonb_build_object('name',name,'public',public,'created_at',created_at))
  from storage.buckets
  where name in ('branding','attachments');

  -- 7) auth users snapshot (non-sensitive)
  return query
  select 'auth_users', true,
         jsonb_build_object(
           'last_users',(select jsonb_agg(jsonb_build_object('email',email,'created_at',created_at,'confirmed',email_confirmed_at is not null))
                         from auth.users order by created_at desc limit 5)
         );
end;
$$;

revoke all on function public.diagnostics_report() from public;
grant execute on function public.diagnostics_report() to authenticated;
