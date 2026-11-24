-- =====================================================================
-- GDF'27 UCMS — MIGRATION 009: CENTRALIZED RBAC + SERVER-SIDE MEDIA
-- PROTECTION + REAL LAST-LOGIN + ATOMIC RESTORE + DASHBOARD STATS.
--
-- What this migration changes (additive; existing rows and roles are
-- preserved; safe to run more than once):
--
--   1. role_permissions — configurable per-module permissions for the four
--      fixed roles (super_admin, admin, publisher, editor). Seeded with
--      defaults that match the documented matrix; editable by admins on
--      the Permissions page.
--   2. has_perm(module, perm) — the single server-side authorization
--      primitive. Every staff RLS policy is re-defined on top of it, so a
--      permission change takes effect on the very next query (no stale
--      sessions to worry about).
--   3. Publish gating: toggling is_published now requires the module's
--      "publish" permission — enforced in the database, not the UI.
--      Editors can no longer publish unless explicitly authorized.
--   4. Server-side media-usage protection: the storage delete policy calls
--      media_path_in_use(name), so a file referenced by any content row
--      cannot be deleted even through the raw Storage API.
--   5. record_staff_login() — stores a real last-login timestamp (only set
--      when an actual authenticated sign-in is recorded) + audit entry.
--   6. restore_cms_backup() — atomic, transactional server-side restore
--      with automatic pre-restore checkpoint and schema validation.
--   7. dashboard_stats() — one RPC for the dashboard's real statistics.
--   8. Permission changes are audit-logged by a database trigger.
--
-- Requires 001-008. Run in: Supabase Dashboard > SQL Editor > paste > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERMISSION MODEL — helpers first (policies below reference them)
-- ---------------------------------------------------------------------

-- The role of the caller (null when not staff).
create or replace function public.my_role()
returns text
language sql stable security definer set search_path = '' as $$
  select role from public.admin_users where user_id = (select auth.uid())
$$;

-- The central authorization primitive. p_perm is one of
-- view | create | edit | delete | publish | manage.
-- A missing row means deny, except super_admin which keeps full access
-- even if its rows were removed by accident.
create or replace function public.has_perm(p_module text, p_perm text)
returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_role text;
begin
  if p_module is null or p_perm is null
     or p_module !~ '^[a-z_]{1,40}$'
     or p_perm not in ('view', 'create', 'edit', 'delete', 'publish', 'manage')
  then
    raise exception 'Invalid permission parameters';
  end if;
  select r.role into v_role from public.admin_users r where r.user_id = (select auth.uid());
  if v_role is null then return false; end if;
  if v_role = 'super_admin' then return true; end if;
  return exists (
    select 1 from public.role_permissions p
    where p.role = v_role and p.module = p_module
      and case p_perm
            when 'view'    then p.can_view
            when 'create'  then p.can_create
            when 'edit'    then p.can_edit
            when 'delete'  then p.can_delete
            when 'publish' then p.can_publish
            when 'manage'  then p.can_manage
          end
  );
end;
$$;

revoke execute on function public.my_role() from public, anon;
revoke execute on function public.has_perm(text, text) from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.has_perm(text, text) to authenticated;

create table if not exists public.role_permissions (
  role        text not null check (role in ('super_admin', 'admin', 'publisher', 'editor')),
  module      text not null check (module in
                ('content', 'certificates', 'texts', 'settings', 'media', 'users', 'system')),
  can_view    boolean not null default false,
  can_create  boolean not null default false,
  can_edit    boolean not null default false,
  can_delete  boolean not null default false,
  can_publish boolean not null default false,
  can_manage  boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (role, module)
);
create index if not exists role_permissions_role_idx on public.role_permissions (role);

alter table public.role_permissions enable row level security;

drop policy if exists "staff read permissions" on public.role_permissions;
drop policy if exists "admins manage permissions" on public.role_permissions;
create policy "staff read permissions" on public.role_permissions
  for select to authenticated using ((select public.is_staff()));
create policy "admins manage permissions" on public.role_permissions
  for all to authenticated
  using ((select public.has_perm('users', 'manage')))
  with check ((select public.has_perm('users', 'manage')));

-- Defaults for the four roles. on conflict do nothing → operator overrides
-- made through the Permissions page are never overwritten by re-running.
insert into public.role_permissions
  (role, module, can_view, can_create, can_edit, can_delete, can_publish, can_manage)
values
  -- super_admin: everything, everywhere (also enforced by has_perm fallback)
  ('super_admin','content',      true, true, true, true, true,  true),
  ('super_admin','certificates', true, true, true, true, true,  true),
  ('super_admin','texts',        true, true, true, true, true,  true),
  ('super_admin','settings',     true, true, true, true, true,  true),
  ('super_admin','media',        true, true, true, true, true,  true),
  ('super_admin','users',        true, true, true, true, true,  true),
  ('super_admin','system',       true, true, true, true, true,  true),
  -- admin: full content + administration
  ('admin','content',      true, true, true, true, true,  true),
  ('admin','certificates', true, true, true, true, true,  true),
  ('admin','texts',        true, true, true, true, true,  true),
  ('admin','settings',     true, true, true, true, true,  true),
  ('admin','media',        true, true, true, true, true,  true),
  ('admin','users',        true, true, true, true, true,  true),
  ('admin','system',       true, true, true, true, true,  true),
  -- publisher: everything content-side, may publish; no administration
  ('publisher','content',      true, true, true, true, true,  false),
  ('publisher','certificates', true, true, true, true, true,  false),
  ('publisher','texts',        true, true, true, true, true,  false),
  ('publisher','settings',     true, false, false, false, false, false),
  ('publisher','media',        true, true, true, true, true,  false),
  ('publisher','users',        true, false, false, false, false, false),
  ('publisher','system',       true, false, false, false, false, false),
  -- editor: same content rights but NO publishing anywhere
  ('editor','content',      true, true, true, true, false, false),
  ('editor','certificates', true, true, true, true, false, false),
  ('editor','texts',        true, true, true, true, false, false),
  ('editor','settings',     true, false, false, false, false, false),
  ('editor','media',        true, true, true, true, false, false),
  ('editor','users',        false, false, false, false, false, false),
  ('editor','system',       true, false, false, false, false, false)
on conflict (role, module) do nothing;

-- Permission changes are audit-logged server-side (actor from the JWT).
create or replace function public.audit_role_permissions()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := (select auth.uid());
  v_changes jsonb;
begin
  if tg_op = 'INSERT' then
    v_changes := jsonb_build_object('row', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    v_changes := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
  else
    v_changes := jsonb_build_object('removed', to_jsonb(old));
  end if;
  insert into public.audit_logs
    (actor_id, actor_email, actor_role, action, resource_type, resource_id,
     resource_label, metadata, outcome)
  values
    (v_actor,
     coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
     (select a.role from public.admin_users a where a.user_id = v_actor),
     'rbac.perms.' || lower(tg_op), 'role_permissions',
     coalesce(new.role, old.role) || ':' || coalesce(new.module, old.module),
     coalesce(new.role, old.role) || ' · ' || coalesce(new.module, old.module),
     v_changes, 'success');
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_audit_role_permissions on public.role_permissions;
create trigger trg_audit_role_permissions
after insert or update or delete on public.role_permissions
for each row execute function public.audit_role_permissions();

-- ---------------------------------------------------------------------
-- 2. SERVER-SIDE MEDIA USAGE PROTECTION (functions first — the storage
--    delete policy below calls media_path_in_use).
--    A site-media file referenced by ANY content row (direct URL column,
--    JSONB settings or text values) cannot be deleted.
-- ---------------------------------------------------------------------
create or replace function public.media_usage_for(p_path text)
returns table (table_name text, column_name text, record_id text)
language sql stable security definer set search_path = '' as $$
  with p as (
    select '%' || p_path || '%' as like_a,
           '%' || replace(p_path, ' ', '%20') || '%' as like_b
    where coalesce(p_path, '') <> ''
  )
  select 'team_members'::text, 'photo_url'::text, m.id::text
    from public.team_members m, p where m.photo_url like p.like_a or m.photo_url like p.like_b
  union all
  select 'team_groups', 'image_url', g.id::text
    from public.team_groups g, p where g.image_url like p.like_a or g.image_url like p.like_b
  union all
  select 'sponsors', 'logo_url', s.id::text
    from public.sponsors s, p where s.logo_url like p.like_a or s.logo_url like p.like_b
  union all
  select 'applications', 'image_url', a.id::text
    from public.applications a, p where a.image_url like p.like_a or a.image_url like p.like_b
  union all
  select 'committees', 'image_url', c.id::text
    from public.committees c, p where c.image_url like p.like_a or c.image_url like p.like_b
  union all
  select 'certificates', 'certificate_image', c.id::text
    from public.certificates c, p
    where c.certificate_image like p.like_a or c.certificate_image like p.like_b
  union all
  select 'page_sections', 'settings', s.id::text
    from public.page_sections s, p
    where s.settings::text like p.like_a or s.settings::text like p.like_b
  union all
  select 'site_settings', 'value', s.key
    from public.site_settings s, p
    where s.value::text like p.like_a or s.value::text like p.like_b
  union all
  select 'site_texts', 'value', t.key
    from public.site_texts t, p
    where t.value::text like p.like_a or t.value::text like p.like_b
$$;

-- Flat boolean used by the storage delete policy (fast, no result set).
create or replace function public.media_path_in_use(p_path text)
returns boolean
language sql stable security definer set search_path = '' as $$
  with p as (
    select '%' || p_path || '%' as like_a,
           '%' || replace(p_path, ' ', '%20') || '%' as like_b
    where coalesce(p_path, '') <> ''
  )
  select exists (select 1 from public.team_members, p
                  where photo_url like p.like_a or photo_url like p.like_b)
      or exists (select 1 from public.team_groups, p
                  where image_url like p.like_a or image_url like p.like_b)
      or exists (select 1 from public.sponsors, p
                  where logo_url like p.like_a or logo_url like p.like_b)
      or exists (select 1 from public.applications, p
                  where image_url like p.like_a or image_url like p.like_b)
      or exists (select 1 from public.committees, p
                  where image_url like p.like_a or image_url like p.like_b)
      or exists (select 1 from public.certificates, p
                  where certificate_image like p.like_a or certificate_image like p.like_b)
      or exists (select 1 from public.page_sections, p
                  where settings::text like p.like_a or settings::text like p.like_b)
      or exists (select 1 from public.site_settings, p
                  where value::text like p.like_a or value::text like p.like_b)
      or exists (select 1 from public.site_texts, p
                  where value::text like p.like_a or value::text like p.like_b)
$$;

-- Full in-use set for the media library UI (one call instead of N queries).
create or replace function public.media_usage_report()
returns jsonb
language sql stable security definer set search_path = '' as $$
  with refs as (
    select photo_url as ref from public.team_members
    union all select image_url from public.team_groups
    union all select logo_url from public.sponsors
    union all select image_url from public.applications
    union all select image_url from public.committees
    union all select certificate_image from public.certificates
    union all select settings::text from public.page_sections
    union all select value::text from public.site_settings
    union all select value::text from public.site_texts
  ),
  hits as (
    select distinct (regexp_matches(
      ref,
      '([A-Za-z0-9_/.%~+-]+(?: [A-Za-z0-9_/.%~+-]+)*\.(?:jpe?g|png|webp|mp4|webm|mov|m4v))',
      'g'))[1] as p
    from refs
    where ref like '%site-media%' or ref like '%/%'
  ),
  paths as (
    -- a full public URL is reduced to the storage path after /site-media/
    select case when position('site-media/' in p) > 0
                then substring(p from position('site-media/' in p) + length('site-media/'))
                else p end as path
    from hits
  )
  select jsonb_build_object('used_paths', coalesce(jsonb_agg(distinct path), '[]'::jsonb))
  from paths
  where path not like 'images/%'      -- static-site assets are not in the bucket
    and path not like 'Videos/%'
$$;

-- ---------------------------------------------------------------------
-- 3. CONTENT POLICIES → has_perm
--    Replaces the single "staff manage" (is_staff) policy per table with
--    separate view/insert/update/delete policies.
-- ---------------------------------------------------------------------
do $body$
declare t text; m text;
begin
  foreach t in array array[
    'committees', 'team_tabs', 'team_groups', 'team_members', 'team_placements',
    'sponsors', 'faqs', 'applications'
  ] loop
    m := 'content';
    execute format('drop policy if exists "staff manage" on public.%I', t);
    execute format('drop policy if exists "staff read all" on public.%I', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff read all" on public.%I
      for select to authenticated using ((select public.has_perm(%L, ''view'')))', t, m);
    execute format('create policy "staff insert" on public.%I
      for insert to authenticated with check ((select public.has_perm(%L, ''create'')))', t, m);
    execute format('create policy "staff update" on public.%I
      for update to authenticated
      using ((select public.has_perm(%L, ''edit'')))
      with check ((select public.has_perm(%L, ''edit'')))', t, m, m);
    execute format('create policy "staff delete" on public.%I
      for delete to authenticated using ((select public.has_perm(%L, ''delete'')))', t, m);
  end loop;

  -- certificates (module "certificates")
  execute 'drop policy if exists "Staff manage GDF certificates" on public.certificates';
  execute 'drop policy if exists "staff read all" on public.certificates';
  execute 'drop policy if exists "staff insert" on public.certificates';
  execute 'drop policy if exists "staff update" on public.certificates';
  execute 'drop policy if exists "staff delete" on public.certificates';
  execute 'create policy "staff read all" on public.certificates
    for select to authenticated using ((select public.has_perm(''certificates'', ''view'')))';
  execute 'create policy "staff insert" on public.certificates
    for insert to authenticated with check ((select public.has_perm(''certificates'', ''create'')))';
  execute 'create policy "staff update" on public.certificates
    for update to authenticated
    using ((select public.has_perm(''certificates'', ''edit'')))
    with check ((select public.has_perm(''certificates'', ''edit'')))';
  execute 'create policy "staff delete" on public.certificates
    for delete to authenticated using ((select public.has_perm(''certificates'', ''delete'')))';

  -- texts + sections (module "texts")
  foreach t in array array['site_texts', 'page_sections'] loop
    execute format('drop policy if exists "staff manage" on public.%I', t);
    execute format('drop policy if exists "staff read all" on public.%I', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff read all" on public.%I
      for select to authenticated using ((select public.has_perm(%L, ''view'')))', t, 'texts');
    execute format('create policy "staff insert" on public.%I
      for insert to authenticated with check ((select public.has_perm(%L, ''create'')))', t, 'texts');
    execute format('create policy "staff update" on public.%I
      for update to authenticated
      using ((select public.has_perm(%L, ''edit'')))
      with check ((select public.has_perm(%L, ''edit'')))', t, 'texts', 'texts');
    execute format('create policy "staff delete" on public.%I
      for delete to authenticated using ((select public.has_perm(%L, ''delete'')))', t, 'texts');
  end loop;

  -- settings: write requires settings.manage (admins); read stays public
  execute 'drop policy if exists "admins write settings" on public.site_settings';
  execute 'create policy "admins write settings" on public.site_settings
    for all to authenticated
    using ((select public.has_perm(''settings'', ''manage'')))
    with check ((select public.has_perm(''settings'', ''manage'')))';

  -- admin_users: management via users.manage (008 trigger still guards escalation)
  execute 'drop policy if exists "admins manage" on public.admin_users';
  execute 'create policy "admins manage" on public.admin_users
    for all to authenticated
    using ((select public.has_perm(''users'', ''manage'')))
    with check ((select public.has_perm(''users'', ''manage'')))';

  -- audit logs: staff read requires system.view
  execute 'drop policy if exists "staff read audit" on public.audit_logs';
  execute 'create policy "staff read audit" on public.audit_logs
    for select to authenticated using ((select public.has_perm(''system'', ''view'')))';

  -- backups: full access via system.manage
  execute 'drop policy if exists "admins read backups" on public.cms_backups';
  execute 'drop policy if exists "admins create backups" on public.cms_backups';
  execute 'create policy "admins read backups" on public.cms_backups
    for select to authenticated using ((select public.has_perm(''system'', ''manage'')))';
  execute 'create policy "admins create backups" on public.cms_backups
    for insert to authenticated with check ((select public.has_perm(''system'', ''manage'')))';

  -- notifications: read via system.view
  execute 'drop policy if exists "staff read notifications" on public.cms_notifications';
  execute 'create policy "staff read notifications" on public.cms_notifications
    for select to authenticated using ((select public.has_perm(''system'', ''view'')))';

  -- storage: per-permission media policies
  execute 'drop policy if exists "staff list media" on storage.objects';
  execute 'drop policy if exists "staff upload media" on storage.objects';
  execute 'drop policy if exists "staff update media" on storage.objects';
  execute 'drop policy if exists "staff delete media" on storage.objects';
  execute 'create policy "staff list media" on storage.objects
    for select to authenticated
    using (bucket_id = ''site-media'' and (select public.has_perm(''media'', ''view'')))';
  execute 'create policy "staff upload media" on storage.objects
    for insert to authenticated
    with check (bucket_id = ''site-media'' and (select public.has_perm(''media'', ''create'')))';
  execute 'create policy "staff update media" on storage.objects
    for update to authenticated
    using (bucket_id = ''site-media'' and (select public.has_perm(''media'', ''edit'')))
    with check (bucket_id = ''site-media'' and (select public.has_perm(''media'', ''edit'')))';
  -- Delete additionally requires the file to be unreferenced (server-side
  -- usage check — a UI bypass through the Storage API is now impossible).
  execute 'create policy "staff delete media" on storage.objects
    for delete to authenticated
    using (bucket_id = ''site-media'' and (select public.has_perm(''media'', ''delete''))
           and not coalesce((select public.media_path_in_use(name)), false))';
end
$body$;

-- ---------------------------------------------------------------------
-- 4. PUBLISH GATING (database-enforced)
--    Only callers with the module's publish permission may flip
--    is_published. Editors are blocked unless explicitly authorized on
--    the Permissions page.
-- ---------------------------------------------------------------------
create or replace function public.content_module_of(p_table text)
returns text language sql immutable set search_path = '' as $$
  select case p_table
    when 'certificates' then 'certificates'
    else 'content'
  end
$$;

create or replace function public.gate_publish_toggle()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    -- editors without the publish permission always create drafts
    if coalesce(new.is_published, false)
       and not coalesce((select public.has_perm(public.content_module_of(tg_table_name), 'publish')), false)
    then
      new.is_published := false;
    end if;
    return new;
  end if;
  if new.is_published is distinct from old.is_published
     and not coalesce((select public.has_perm(public.content_module_of(tg_table_name), 'publish')), false)
  then
    raise exception 'Publishing requires the publish permission for this module';
  end if;
  return new;
end;
$$;

do $body$
declare t text;
begin
  -- NOTE: certificates has no is_published column (its visibility is
  -- controlled by the certificates edit permission), so it is not gated here.
  foreach t in array array[
    'committees', 'team_tabs', 'team_groups', 'team_members', 'sponsors',
    'faqs', 'applications'
  ] loop
    execute format('drop trigger if exists trg_%1$s_gate_publish on public.%1$s', t);
    execute format('create trigger trg_%1$s_gate_publish before insert or update on public.%1$s
      for each row execute function public.gate_publish_toggle()', t);
  end loop;
end
$body$;

-- ---------------------------------------------------------------------
-- 5. REAL LAST-LOGIN
-- ---------------------------------------------------------------------
alter table public.admin_users add column if not exists last_login_at timestamptz;

-- Called by the dashboard right after a successful authenticated sign-in.
create or replace function public.record_staff_login()
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select public.is_staff()), false) then
    return; -- silently ignore non-staff sessions
  end if;
  update public.admin_users set last_login_at = now()
    where user_id = (select auth.uid());
  perform public.log_admin_action('auth.login', 'admin_users',
    (select auth.uid())::text, null, '{}', 'success');
end;
$$;
revoke execute on function public.record_staff_login() from public, anon;
grant execute on function public.record_staff_login() to authenticated;

-- ---------------------------------------------------------------------
-- 6. ATOMIC RESTORE
-- ---------------------------------------------------------------------
-- Shared snapshot function (used by create_cms_backup and the restore path).
create or replace function public.cms_snapshot_manifest()
returns jsonb
language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'schema_version', 6,
    'includes_media_files', false,
    'site_texts',      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.site_texts t),
    'page_sections',   (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.page_sections s),
    'site_settings',   (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.site_settings s),
    'committees',      (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.committees c),
    'faqs',            (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.faqs f),
    'applications',    (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb) from public.applications a),
    'sponsors',        (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.sponsors s),
    'team_tabs',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.team_tabs t),
    'team_groups',     (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from public.team_groups g),
    'team_members',    (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.team_members m),
    'team_placements', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from public.team_placements p),
    'certificates',    (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.certificates c),
    'backed_up_at',    to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
$$;

create or replace function public.create_cms_backup(p_label text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_id uuid;
  v_manifest jsonb;
  v_stats jsonb;
begin
  if not coalesce((select public.has_perm('system', 'manage')), false) then
    raise exception 'Only administrators can create backups';
  end if;
  if length(coalesce(p_label, 'Backup')) > 120 then
    raise exception 'Backup label too long';
  end if;

  v_manifest := public.cms_snapshot_manifest();

  select jsonb_build_object(
    'site_texts',      (select count(*) from public.site_texts),
    'page_sections',   (select count(*) from public.page_sections),
    'site_settings',   (select count(*) from public.site_settings),
    'committees',      (select count(*) from public.committees),
    'faqs',            (select count(*) from public.faqs),
    'applications',    (select count(*) from public.applications),
    'sponsors',        (select count(*) from public.sponsors),
    'team_tabs',       (select count(*) from public.team_tabs),
    'team_groups',     (select count(*) from public.team_groups),
    'team_members',    (select count(*) from public.team_members),
    'team_placements', (select count(*) from public.team_placements),
    'certificates',    (select count(*) from public.certificates)
  ) into v_stats;

  insert into public.cms_backups (label, kind, manifest, stats, created_by)
  values (coalesce(nullif(trim(p_label), ''),
                   'Backup ' || to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI')),
          'manual', v_manifest, v_stats, (select auth.uid()))
  returning id into v_id;
  perform public.log_admin_action('backup.create', 'cms_backups', v_id::text, null, v_stats, 'success');
  return v_id;
end
$body$;

-- Atomic restore: validation + pre-restore checkpoint + upserts all run in
-- ONE function = one transaction. Any failure rolls back everything,
-- including the checkpoint — the database is never left half-restored.
create or replace function public.restore_cms_backup(p_backup_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_manifest jsonb;
  v_label text;
  v_schema int;
  v_checkpoint uuid;
  v_entry text;
  v_rows jsonb;
  v_counts jsonb := '{}'::jsonb;
  v_error text;
begin
  if not coalesce((select public.has_perm('system', 'manage')), false) then
    raise exception 'Only administrators can restore backups';
  end if;

  select manifest, label into v_manifest, v_label
    from public.cms_backups where id = p_backup_id;
  if v_manifest is null then
    raise exception 'Backup not found';
  end if;
  v_schema := coalesce((v_manifest ->> 'schema_version')::int, 0);
  if v_schema not between 5 and 6 then
    raise exception 'Incompatible backup schema version %', v_schema;
  end if;

  -- automatic pre-restore checkpoint (same transaction)
  insert into public.cms_backups (label, kind, manifest, stats, created_by)
  values ('Pre-restore checkpoint · ' || coalesce(v_label, p_backup_id::text),
          'pre_restore', public.cms_snapshot_manifest(), '{}'::jsonb, (select auth.uid()))
  returning id into v_checkpoint;

  -- dependency order; parents before children
  foreach v_entry in array array[
    'site_settings', 'site_texts', 'page_sections',
    'committees', 'faqs', 'sponsors', 'applications', 'certificates',
    'team_tabs', 'team_groups', 'team_members', 'team_placements'
  ] loop
    v_rows := v_manifest -> v_entry;
    if jsonb_typeof(v_rows) = 'array' and jsonb_array_length(v_rows) > 0 then
      -- jsonb_populate_recordset maps JSON null to SQL NULL; the NOT NULL
      -- jsonb columns (site_settings.value, site_texts.value,
      -- page_sections.settings) legitimately store JSON 'null', so those
      -- columns are coalesced back to the jsonb null literal.
      execute format(
        'insert into public.%I (%s)
         select %s from jsonb_populate_recordset(null::public.%I, $1) j
         on conflict (%s) do update set %s',
        v_entry,
        (select string_agg(quote_ident(u.column_name), ', ' order by u.ordinal_position)
           from information_schema.columns u
          where u.table_schema = 'public' and u.table_name = v_entry),
        (select string_agg(
                  case when u.data_type = 'jsonb' and u.is_nullable = 'NO'
                       then 'coalesce(j.' || quote_ident(u.column_name) || ', ''null''::jsonb)'
                       else 'j.' || quote_ident(u.column_name) end,
                  ', ' order by u.ordinal_position)
           from information_schema.columns u
          where u.table_schema = 'public' and u.table_name = v_entry),
        v_entry,
        case when v_entry in ('site_texts', 'site_settings') then 'key' else 'id' end,
        (select string_agg(quote_ident(u.column_name) || ' = excluded.' || quote_ident(u.column_name), ', ')
           from information_schema.columns u
          where u.table_schema = 'public' and u.table_name = v_entry
            and u.column_name not in ('id', 'key', 'created_at')))
      using v_rows;
      v_counts := jsonb_set(v_counts, array[v_entry], to_jsonb(jsonb_array_length(v_rows)), true);
      -- deterministic restore: rows added AFTER the backup are removed
      -- (the pre-restore checkpoint keeps a copy of that state)
      execute format(
        'delete from public.%I t where not exists (
           select 1 from jsonb_array_elements($1) e where e ->> $2 = t.%I::text)',
        v_entry,
        case when v_entry in ('site_texts', 'site_settings') then 'key' else 'id' end)
      using v_rows,
            case when v_entry in ('site_texts', 'site_settings') then 'key' else 'id' end;
    end if;
  end loop;

  perform public.log_admin_action('backup.restore', 'cms_backups', p_backup_id::text,
    v_label, jsonb_build_object('checkpoint', v_checkpoint, 'restored', v_counts), 'success');
  return jsonb_build_object('ok', true, 'checkpoint_id', v_checkpoint, 'restored', v_counts);
exception when others then
  get stacked diagnostics v_error = MESSAGE_TEXT;
  perform public.log_admin_action('backup.restore', 'cms_backups', p_backup_id::text,
    v_label, jsonb_build_object('error', v_error), 'error');
  raise;
end
$body$;
revoke execute on function public.restore_cms_backup(uuid) from public, anon;
grant execute on function public.restore_cms_backup(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 7. DASHBOARD STATISTICS (real counts, one call)
-- ---------------------------------------------------------------------
create or replace function public.dashboard_stats()
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'committees',        (select count(*) from public.committees),
    'committees_live',   (select count(*) from public.committees where is_published),
    'sponsors',          (select count(*) from public.sponsors),
    'sponsors_live',     (select count(*) from public.sponsors where is_published),
    'faqs',              (select count(*) from public.faqs),
    'faqs_live',         (select count(*) from public.faqs where is_published),
    'applications',      (select count(*) from public.applications),
    'applications_live', (select count(*) from public.applications where is_published),
    'team_members',      (select count(*) from public.team_members),
    'team_members_live', (select count(*) from public.team_members where is_published),
    'certificates',      (select count(*) from public.certificates),
    'certificates_valid',(select count(*) from public.certificates where status = 'valid'),
    'texts_edited',      (select count(*) from public.site_texts),
    'sections',          (select count(*) from public.page_sections),
    'media_files',       (select count(*) from storage.objects where bucket_id = 'site-media'),
    'media_bytes',       (select coalesce(sum((metadata ->> 'size')::bigint), 0)
                            from storage.objects where bucket_id = 'site-media'),
    'staff',             (select count(*) from public.admin_users),
    'unpublished',       (select (select count(*) from public.committees where not is_published)
                                + (select count(*) from public.sponsors where not is_published)
                                + (select count(*) from public.faqs where not is_published)
                                + (select count(*) from public.applications where not is_published)
                                + (select count(*) from public.team_members where not is_published)),
    'errors_7d',         (select count(*) from public.audit_logs
                            where outcome <> 'success'
                              and created_at > now() - interval '7 days')
  )
$$;
revoke execute on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

notify pgrst, 'reload schema';
-- =====================================================================
-- DONE (009). role_permissions + has_perm() RBAC, publish gating,
-- server-side media protection, real last-login, atomic restore,
-- dashboard_stats. Re-run safe. UI: Permissions page (admins).
-- =====================================================================
