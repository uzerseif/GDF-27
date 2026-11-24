-- =====================================================================
-- GDF'27 UCMS — MIGRATION V5 (audit log, notifications, backups, roles).
-- Additive and safe to run more than once.
--   * No DROP TABLE, no DELETE of data. Existing rows are preserved.
--   * Requires 001-cms-schema.sql and 003-cms-v4.sql (helpers are re-created
--     here idempotently).
-- Run in: Supabase Dashboard > SQL Editor > paste > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. HELPERS (re-created idempotently; extends role model)
-- ---------------------------------------------------------------------
create or replace function public.is_i18n(v jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select v is not null and jsonb_typeof(v) = 'object'
     and length(trim(coalesce(v ->> 'en', ''))) > 0;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;

-- admin_users: add the publisher / super_admin roles alongside admin+editor.
-- Existing rows keep their role; 'admin' keeps full rights (backward compatible).
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'editor',
  created_at timestamptz not null default now()
);
do $$ begin
  -- widen the role check if the old 2-role constraint is still present
  begin
    alter table public.admin_users drop constraint if exists admin_users_role_check;
  exception when others then null; end;
  begin
    alter table public.admin_users drop constraint if exists admin_users_role_check1;
  exception when others then null; end;
end $$;
alter table public.admin_users drop constraint if exists admin_users_role_ucms;
alter table public.admin_users
  add constraint admin_users_role_ucms
  check (role in ('super_admin', 'admin', 'editor', 'publisher'));

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- admin or super_admin (full administrative rights)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role in ('admin', 'super_admin')
  );
$$;

-- super_admin only (user management, backups, audit pruning)
create or replace function public.is_super()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'super_admin'
  );
$$;

-- may publish/unpublish (publisher, admin, super_admin) — NOT editors
create or replace function public.can_publish()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
      and role in ('publisher', 'admin', 'super_admin')
  );
$$;

-- may change design tokens / global settings (admin, super_admin)
create or replace function public.can_manage_design()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;

revoke execute on function public.is_staff()  from public, anon;
revoke execute on function public.is_admin()  from public, anon;
revoke execute on function public.is_super()  from public, anon;
revoke execute on function public.can_publish() from public, anon;
revoke execute on function public.can_manage_design() from public, anon;
grant  execute on function public.is_staff()  to authenticated;
grant  execute on function public.is_admin()  to authenticated;
grant  execute on function public.is_super()  to authenticated;
grant  execute on function public.can_publish() to authenticated;
grant  execute on function public.can_manage_design() to authenticated;

-- ---------------------------------------------------------------------
-- 2. AUDIT LOG — append-only record of administrative operations.
--    No update/delete policy: staff and admins cannot rewrite history.
--    Only the service_role (dashboard) may prune old rows.
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references auth.users (id) on delete set null,
  actor_email    text,
  actor_role     text,
  action         text not null check (action ~ '^[a-z0-9_.:-]{1,80}$'),
  resource_type  text check (resource_type ~ '^[a-z0-9_.-]{1,60}$'),
  resource_id    text,
  resource_label text,
  metadata       jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  outcome        text not null default 'success' check (outcome in ('success', 'error', 'denied')),
  created_at     timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx  on public.audit_logs (action, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "staff write audit" on public.audit_logs;
drop policy if exists "staff read audit"  on public.audit_logs;
create policy "staff write audit" on public.audit_logs
  for insert to authenticated
  with check ((select public.is_staff()));
create policy "staff read audit" on public.audit_logs
  for select to authenticated
  using ((select public.is_staff()));

-- Central write helper: stamps actor id / email / role server-side.
create or replace function public.log_admin_action(
  p_action        text,
  p_resource_type text default null,
  p_resource_id   text default null,
  p_resource_label text default null,
  p_metadata      jsonb default '{}'::jsonb,
  p_outcome       text default 'success'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_role text; v_email text;
begin
  if not coalesce((select public.is_staff()), false) then
    return null;
  end if;
  if p_action !~ '^[a-z0-9_.:-]{1,80}$'
     or (p_resource_type is not null and p_resource_type !~ '^[a-z0-9_.-]{1,60}$')
     or p_outcome not in ('success', 'error', 'denied')
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) is distinct from 'object'
  then
    raise exception 'Invalid audit log parameters';
  end if;
  select a.role into v_role from public.admin_users a where a.user_id = (select auth.uid());
  -- actor email comes from the JWT claims (never from client input)
  v_email := coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'email', '');
  insert into public.audit_logs
    (actor_id, actor_email, actor_role, action, resource_type, resource_id,
     resource_label, metadata, outcome)
  values
    ((select auth.uid()), v_email, v_role, p_action, p_resource_type,
     nullif(p_resource_id, ''), nullif(p_resource_label, ''),
     coalesce(p_metadata, '{}'::jsonb), p_outcome)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.log_admin_action(text, text, text, text, jsonb, text)
  from public, anon;
grant execute on function public.log_admin_action(text, text, text, text, jsonb, text)
  to authenticated;

-- ---------------------------------------------------------------------
-- 3. NOTIFICATIONS — staff-wide operational alerts.
-- ---------------------------------------------------------------------
create table if not exists public.cms_notifications (
  id         uuid primary key default gen_random_uuid(),
  severity   text not null default 'info' check (severity in ('info', 'warning', 'error', 'success')),
  title      text not null check (length(title) between 1 and 200),
  body       text check (body is null or length(body) <= 2000),
  link       text check (link is null or length(link) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cms_notifications_created_idx
  on public.cms_notifications (is_read, created_at desc);

alter table public.cms_notifications enable row level security;

drop policy if exists "staff read notifications"  on public.cms_notifications;
drop policy if exists "staff create notifications" on public.cms_notifications;
drop policy if exists "staff mark notifications"  on public.cms_notifications;
drop policy if exists "admins clean notifications" on public.cms_notifications;
create policy "staff read notifications" on public.cms_notifications
  for select to authenticated using ((select public.is_staff()));
create policy "staff create notifications" on public.cms_notifications
  for insert to authenticated with check ((select public.is_staff()));
-- each staff member may mark items as read
create policy "staff mark notifications" on public.cms_notifications
  for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
create policy "admins clean notifications" on public.cms_notifications
  for delete to authenticated using ((select public.is_admin()));

create or replace function public.notify_staff(
  p_severity text default 'info',
  p_title    text default '',
  p_body     text default null,
  p_link     text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not coalesce((select public.is_staff()), false) then
    return null;
  end if;
  if p_severity not in ('info', 'warning', 'error', 'success')
     or length(coalesce(p_title, '')) not between 1 and 200
  then
    raise exception 'Invalid notification parameters';
  end if;
  insert into public.cms_notifications (severity, title, body, link, created_by)
  values (p_severity, p_title, p_body, p_link, (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.notify_staff(text, text, text, text) from public, anon;
grant execute on function public.notify_staff(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. BACKUPS — snapshots of all CMS content as one jsonb manifest.
--    Media (Storage objects) are NOT included; only their URLs inside
--    content records. The manifest records that limitation explicitly.
-- ---------------------------------------------------------------------
create table if not exists public.cms_backups (
  id          uuid primary key default gen_random_uuid(),
  label       text not null check (length(label) between 1 and 120),
  kind        text not null default 'manual' check (kind in ('manual', 'pre_restore', 'scheduled')),
  manifest    jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  stats       jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists cms_backups_created_idx on public.cms_backups (created_at desc);

alter table public.cms_backups enable row level security;

drop policy if exists "admins read backups"   on public.cms_backups;
drop policy if exists "admins create backups" on public.cms_backups;
create policy "admins read backups" on public.cms_backups
  for select to authenticated using ((select public.is_admin()));
create policy "admins create backups" on public.cms_backups
  for insert to authenticated with check ((select public.is_admin()));

-- Creates one full CMS-content snapshot (admin only, server-side).
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

-- storage: re-assert the safe image-only allowlist (SVG can carry scripts;
-- an older upgrade script once added image/svg+xml).
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
       file_size_limit = 5242880
 where id = 'site-media';

notify pgrst, 'reload schema';
-- =====================================================================
-- DONE. New tables: audit_logs, cms_notifications, cms_backups.
-- New roles: publisher, super_admin.
-- =====================================================================
