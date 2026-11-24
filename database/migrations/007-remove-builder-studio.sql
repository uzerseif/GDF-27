-- =====================================================================
-- 007 — REMOVE BUILDER STUDIO (archive, non-destructive)
--
-- Builder Studio (GrapesJS visual builder) has been removed from the CMS.
-- This migration removes every database object that only Builder Studio
-- used. It is SAFE BY DESIGN:
--
--   * It does NOT drop any data. The 16 Builder tables are MOVED into a
--     private schema called builder_archive (not exposed by the API, row
--     level security stays on, no role has been granted access).
--   * Builder-only functions, triggers and RLS policies are removed through
--     an explicit allow-list — never by wildcard.
--   * Shared CMS objects are untouched: admin_users, site_*, page_sections,
--     team_*, committees, faqs, sponsors, applications, audit_logs,
--     cms_notifications, cms_backups, certificates, storage buckets,
--     auth.* and the generic helpers is_staff/is_admin/is_super/
--     can_publish/can_manage_design/set_updated_at/is_i18n.
--   * create_cms_backup() is re-defined FIRST. The previous version read
--     from builder_* tables and would fail as soon as they were gone.
--   * Everything runs in ONE transaction: any failed check rolls it all back.
--   * It aborts if a non-Builder table has a foreign key into a Builder table.
--   * Idempotent: safe to run again, and a no-op on fresh installs.
--
-- BEFORE YOU RUN IT (existing deployments):
--   1. Take a backup. Supabase Dashboard > Database > Backups (or PITR),
--      or:  pg_dump "$DATABASE_URL" --format=custom --file=gdf-before-builder-removal.dump
--   2. Also use the CMS "Backups" page to create a content backup.
--
-- RUN:  Supabase Dashboard > SQL Editor > paste > Run.
-- LATER (optional, after you have verified the site for a while):
--   database/maintenance/purge-builder-archive.sql permanently deletes the
--   archive. Until then you can recover any table with
--   ALTER TABLE builder_archive.<name> SET SCHEMA public;
-- =====================================================================

begin;

-- 0. Preconditions ----------------------------------------------------
do $$
begin
  if to_regclass('public.admin_users') is null
     or to_regclass('public.cms_backups') is null then
    raise exception 'Run migrations 001-004 first (admin_users / cms_backups are missing).';
  end if;
end
$$;

-- Allow-lists of objects owned exclusively by Builder Studio.
create temp table _builder_tables (name text primary key) on commit drop;
insert into _builder_tables (name) values
    ('builder_projects'),
    ('builder_project_settings'),
    ('builder_project_pages'),
    ('builder_project_assets'),
    ('builder_editor_documents'),
    ('builder_project_components'),
    ('builder_project_revisions'),
    ('builder_project_navigation'),
    ('builder_project_heroes'),
    ('builder_project_responsive'),
    ('builder_project_custom_code'),
    ('builder_project_archives'),
    ('builder_project_releases'),
    ('builder_project_integrations'),
    ('builder_project_test_runs'),
    ('builder_page_templates');

create temp table _builder_functions (name text primary key) on commit drop;
insert into _builder_functions (name) values
    ('set_builder_updated_at'),
    ('can_manage_builder_project'),
    ('protect_builder_project'),
    ('duplicate_builder_project'),
    ('protect_builder_navigation'),
    ('protect_builder_system_pages'),
    ('protect_builder_custom_code'),
    ('protect_builder_integrations'),
    ('protect_builder_document_links'),
    ('protect_builder_revision_links'),
    ('protect_builder_hero_links'),
    ('protect_builder_release_links'),
    ('publish_builder_document'),
    ('restore_builder_revision');

-- 1. Re-define the backup function so it no longer reads Builder tables --
create or replace function public.create_cms_backup(p_label text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_manifest jsonb;
  v_stats jsonb;
begin
  if not coalesce((select public.is_admin()), false) then
    raise exception 'Only administrators can create backups';
  end if;
  if length(coalesce(p_label, 'Backup')) > 120 then
    raise exception 'Backup label too long';
  end if;

  select jsonb_build_object(
    'schema_version', 5,
    'includes_media_files', false,
    'site_texts',    (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.site_texts t),
    'page_sections', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.page_sections s),
    'site_settings', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.site_settings s),
    'committees',    (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.committees c),
    'faqs',          (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.faqs f),
    'applications',  (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb) from public.applications a),
    'sponsors',      (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.sponsors s),
    'team_tabs',     (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.team_tabs t),
    'team_groups',   (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from public.team_groups g),
    'team_members',  (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.team_members m),
    'team_placements', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from public.team_placements p),
    'backed_up_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  ) into v_manifest;

  select jsonb_build_object(
    'site_texts',    (select count(*) from public.site_texts),
    'page_sections', (select count(*) from public.page_sections),
    'site_settings', (select count(*) from public.site_settings),
    'committees',    (select count(*) from public.committees),
    'faqs',          (select count(*) from public.faqs),
    'applications',  (select count(*) from public.applications),
    'sponsors',      (select count(*) from public.sponsors),
    'team_tabs',     (select count(*) from public.team_tabs),
    'team_groups',   (select count(*) from public.team_groups),
    'team_members',  (select count(*) from public.team_members),
    'team_placements', (select count(*) from public.team_placements)
  ) into v_stats;

  insert into public.cms_backups (label, kind, manifest, stats, created_by)
  values (coalesce(nullif(trim(p_label), ''),
                   'Backup ' || to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI')),
          'manual', v_manifest, v_stats, (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.create_cms_backup(text) from public, anon;
grant execute on function public.create_cms_backup(text) to authenticated;

-- 2. Refuse to continue if anything outside Builder depends on Builder ---
do $$
declare
  v_bad text;
begin
  select string_agg(format('%s (%s)', c.conrelid::regclass, c.conname), ', ')
    into v_bad
  from pg_constraint c
  join pg_class src on src.oid = c.conrelid
  join pg_namespace sn on sn.oid = src.relnamespace
  join pg_class dst on dst.oid = c.confrelid
  join pg_namespace dn on dn.oid = dst.relnamespace
  where c.contype = 'f'
    and dn.nspname = 'public' and dst.relname in (select name from _builder_tables)
    and not (sn.nspname = 'public' and src.relname in (select name from _builder_tables));
  if v_bad is not null then
    raise exception 'Non-Builder tables reference Builder tables, aborting: %', v_bad;
  end if;
end
$$;

-- 3. Remove Builder RLS policies, triggers and functions (allow-listed) --
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (select name from _builder_tables)
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in
    select n.nspname as sch, c.relname as tbl, t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and n.nspname = 'public' and c.relname in (select name from _builder_tables)
  loop
    execute format('drop trigger %I on %I.%I', r.tgname, r.sch, r.tbl);
  end loop;

  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (select name from _builder_functions)
  loop
    execute format('drop function %s', r.sig);   -- no CASCADE: fails loudly if something else uses it
  end loop;
end
$$;

-- 4. Archive (move, do not drop) the Builder tables --------------------
--    Skipped entirely when there is nothing to archive (fresh installs).
do $$
declare
  r record;
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname in (select name from _builder_tables)
  ) then
    raise notice 'No Builder tables in public - nothing to archive.';
    return;
  end if;

  create schema if not exists builder_archive;
  comment on schema builder_archive is
    'Archived Builder Studio tables (removed feature). Safe to drop with database/maintenance/purge-builder-archive.sql once verified.';

  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname in (select name from _builder_tables)
  loop
    execute format('alter table public.%I set schema builder_archive', r.relname);
  end loop;

  -- nobody but the table owner may touch the archive
  execute 'revoke all on schema builder_archive from public';
  execute 'revoke all on all tables in schema builder_archive from public';
  if to_regrole('anon') is not null then
    execute 'revoke all on schema builder_archive from anon';
    execute 'revoke all on all tables in schema builder_archive from anon';
  end if;
  if to_regrole('authenticated') is not null then
    execute 'revoke all on schema builder_archive from authenticated';
    execute 'revoke all on all tables in schema builder_archive from authenticated';
  end if;
end
$$;

-- 5. Post-conditions: fail (and roll everything back) if anything is off --
do $$
declare
  v_left text;
begin
  select string_agg(relname, ', ') into v_left
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and relname like 'builder\_%' escape '\';
  if v_left is not null then
    raise exception 'Builder tables still in public: %', v_left;
  end if;

  select string_agg(proname, ', ') into v_left
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like '%builder%';
  if v_left is not null then
    raise exception 'Builder functions still in public: %', v_left;
  end if;

  if to_regprocedure('public.create_cms_backup(text)') is null
     or to_regprocedure('public.is_staff()') is null
     or to_regclass('public.admin_users') is null
     or to_regclass('public.site_texts') is null then
    raise exception 'A shared CMS object is missing after the migration';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;

-- =====================================================================
-- DONE. Verify with:
--   select table_name from information_schema.tables where table_schema = 'builder_archive';
--   select count(*) from information_schema.tables
--    where table_schema = 'public' and table_name like 'builder%';   -- expect 0
-- =====================================================================
