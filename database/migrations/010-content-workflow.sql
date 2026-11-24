-- =====================================================================
-- GDF'27 UCMS — MIGRATION 010: CONTENT WORKFLOW
-- (version history, review lifecycle, optimistic-concurrency support)
--
-- Additive and safe to run more than once. Requires 009 (has_perm).
--
--   1. content_revisions — every insert/update of a content row records a
--      version snapshot (actor, timestamp, full row). Last 50 versions are
--      kept per record; older ones are pruned automatically.
--   2. restore_content_version(table, record_id, version) — restores a
--      previous version. The current state is preserved automatically as a
--      new version BEFORE the restore is applied, so no history is lost.
--   3. content_status on committees/sponsors/faqs/applications — the review
--      lifecycle: draft → pending_review → approved → published → archived.
--      is_published stays in sync (the public site keeps reading it).
--      Transitions into/out of "published" and approvals require the
--      module's publish permission (009 gating).
--   4. content_version counter on the workflow tables — used by the
--      dashboard for optimistic concurrency (a save that is based on a
--      stale version updates 0 rows and is reported to the user).
--
-- Run in: Supabase Dashboard > SQL Editor > paste > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VERSION HISTORY
-- ---------------------------------------------------------------------
create table if not exists public.content_revisions (
  id               uuid primary key default gen_random_uuid(),
  table_name       text not null,
  record_id        text not null,
  version          int  not null,
  action           text not null check (action in ('create', 'update', 'restore')),
  snapshot         jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by       uuid references auth.users (id) on delete set null,
  changed_by_email text,
  created_at       timestamptz not null default now(),
  unique (table_name, record_id, version)
);
create index if not exists content_revisions_rec_idx
  on public.content_revisions (table_name, record_id, version desc);

-- widen the module mapping from 009: site_texts / page_sections belong to
-- the "texts" module (replaces the 009 definition, idempotent)
create or replace function public.content_module_of(p_table text)
returns text language sql immutable set search_path = '' as $$
  select case p_table
    when 'certificates' then 'certificates'
    when 'site_texts'   then 'texts'
    when 'page_sections' then 'texts'
    else 'content'
  end
$$;

alter table public.content_revisions enable row level security;

drop policy if exists "staff read revisions" on public.content_revisions;
create policy "staff read revisions" on public.content_revisions
  for select to authenticated
  using ((select public.has_perm(public.content_module_of(table_name), 'edit')));

-- versioning trigger: records one revision per insert/update and keeps the
-- latest 50 per record. Re-entrant updates made by this trigger itself
-- (content_version counter) are skipped via app.revision_guard.
create or replace function public.record_content_revision()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_table  text := tg_table_name;
  v_pk     text := case when tg_table_name = 'site_texts' then 'key' else 'id' end;
  v_id     text;
  v_version int;
  v_email  text;
  v_action text;
begin
  if current_setting('app.revision_guard', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  v_id := to_jsonb(new) ->> v_pk;
  if v_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if not coalesce((select public.is_staff()), false) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select coalesce(max(version), 0) + 1 into v_version
    from public.content_revisions
   where table_name = v_table and record_id = v_id;

  v_email := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '');
  v_action := coalesce(nullif(current_setting('app.revision_action', true), ''),
                       case when tg_op = 'INSERT' then 'create' else 'update' end);
  insert into public.content_revisions
    (table_name, record_id, version, action, snapshot, changed_by, changed_by_email)
  values
    (v_table, v_id, v_version, v_action,
     to_jsonb(new), (select auth.uid()), v_email);

  -- keep the latest 50 revisions per record
  delete from public.content_revisions
   where table_name = v_table and record_id = v_id
     and version <= v_version - 50;

  -- maintain the optimistic-concurrency counter. The nested block confines
  -- the exception (tables without content_version) so the revision insert
  -- above is NOT rolled back with it.
  perform set_config('app.revision_guard', 'on', true);
  begin
    execute format('update public.%I set content_version = %s where %I = %L',
                   v_table, v_version, v_pk, v_id);
  exception when undefined_column or undefined_table then
    null; -- tables without content_version simply skip the counter
  end;
  perform set_config('app.revision_guard', 'off', true);
  perform set_config('app.revision_action', '', true);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $body$
declare t text;
begin
  foreach t in array array[
    'committees', 'sponsors', 'faqs', 'applications', 'certificates',
    'team_members', 'team_tabs', 'team_groups', 'site_texts', 'page_sections'
  ] loop
    execute format('drop trigger if exists trg_%1$s_revision on public.%1$s', t);
    execute format('create trigger trg_%1$s_revision after insert or update on public.%1$s
      for each row execute function public.record_content_revision()', t);
  end loop;
end
$body$;

-- ---------------------------------------------------------------------
-- 2. REVIEW LIFECYCLE (committees, sponsors, faqs, applications)
-- ---------------------------------------------------------------------
do $body$
declare t text;
begin
  foreach t in array array['committees', 'sponsors', 'faqs', 'applications'] loop
    execute format('alter table public.%I add column if not exists content_status text default ''draft''', t);
    -- backfill existing rows before the NOT NULL constraint
    execute format('update public.%I set content_status = case when is_published then ''published'' else ''draft'' end
      where content_status is null', t);
    execute format('alter table public.%I alter column content_status set default ''draft''', t);
    execute format('alter table public.%I alter column content_status set not null', t);
    -- replace the check constraint idempotently
    execute format('alter table public.%I drop constraint if exists %I_content_status_check', t, t);
    execute format('alter table public.%I add constraint %I_content_status_check
      check (content_status in (''draft'', ''pending_review'', ''approved'', ''published'', ''archived''))', t, t);
    -- migrate existing rows
    execute format('update public.%I set content_status = case when is_published then ''published'' else ''draft'' end
      where content_status is distinct from case when is_published then ''published'' else ''draft'' end', t);
    execute format('alter table public.%I add column if not exists content_version int not null default 0', t);
  end loop;
end
$body$;

create or replace function public.sync_content_status()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_can_publish boolean;
  v_table text := tg_table_name;
begin
  if current_setting('app.revision_guard', true) = 'on' then
    return new;
  end if;
  v_can_publish := coalesce(
    (select public.has_perm(public.content_module_of(v_table), 'publish')), false);

  if tg_op = 'INSERT' then
    -- editors without the publish permission can only start drafts / submit
    if not v_can_publish and new.content_status not in ('draft', 'pending_review') then
      new.content_status := 'draft';
    end if;
    new.is_published := (new.content_status = 'published');
    return new;
  end if;

  -- An explicit is_published=true from a caller is a publish request
  -- (backward compatible with the pre-workflow toggle in the UI). Only a
  -- CHANGE of is_published counts — a carried-over true is not a request.
  if new.is_published is distinct from old.is_published and new.is_published then
    if not v_can_publish then
      raise exception 'Publishing requires the publish permission for this module';
    end if;
    new.content_status := 'published';
  end if;

  -- transition into or out of "published" always requires the permission
  if not v_can_publish then
    if new.content_status = 'published' and old.content_status is distinct from 'published' then
      raise exception 'Publishing requires the publish permission for this module';
    end if;
    if old.content_status = 'published' and new.content_status is distinct from 'published' then
      raise exception 'Unpublishing requires the publish permission for this module';
    end if;
    -- editors may only move between draft and pending_review
    if new.content_status not in ('draft', 'pending_review')
       and new.content_status is distinct from old.content_status then
      raise exception 'Publishing requires the publish permission for this module';
    end if;
  end if;

  -- is_published always follows the lifecycle status
  new.is_published := (new.content_status = 'published');

  -- someone must review it: notify the staff when an editor submits
  if new.content_status = 'pending_review' and old.content_status <> 'pending_review' then
    perform public.notify_staff('info', 'Content submitted for review',
      'A content item is waiting for review.', null);
  end if;
  return new;
end;
$$;

do $body$
declare t text;
begin
  foreach t in array array['committees', 'sponsors', 'faqs', 'applications'] loop
    execute format('drop trigger if exists trg_%1$s_status on public.%1$s', t);
    execute format('create trigger trg_%1$s_status before insert or update on public.%1$s
      for each row execute function public.sync_content_status()', t);
  end loop;
end
$body$;

-- ---------------------------------------------------------------------
-- 3. RESTORE A PREVIOUS VERSION
-- ---------------------------------------------------------------------
create or replace function public.restore_content_version(
  p_table_name text, p_record_id text, p_version int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_snapshot jsonb;
  v_col record;
  v_sets text := '';
  v_pk text;
  v_module text;
  v_error text;
begin
  if p_table_name not in (
    'committees', 'sponsors', 'faqs', 'applications', 'certificates',
    'team_members', 'team_tabs', 'team_groups', 'site_texts', 'page_sections')
  then
    raise exception 'Unknown table';
  end if;
  v_module := public.content_module_of(p_table_name);
  if not coalesce((select public.has_perm(v_module, 'edit')), false) then
    raise exception 'Not authorized to edit this content';
  end if;

  v_pk := case when p_table_name = 'site_texts' then 'key' else 'id' end;
  select snapshot into v_snapshot
    from public.content_revisions
   where table_name = p_table_name and record_id = p_record_id and version = p_version;
  if v_snapshot is null then
    raise exception 'Version not found';
  end if;

  -- build SET list from the snapshot (never touches id/key/created_at)
  for v_col in
    select c.column_name, c.data_type
      from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = p_table_name
       and c.column_name not in ('id', 'key', 'created_at')
       and v_snapshot ? c.column_name
  loop
    v_sets := v_sets
      || (case when v_sets = '' then '' else ', ' end)
      || quote_ident(v_col.column_name) || ' = '
      || format('%L::%s', v_snapshot ->> v_col.column_name, v_col.data_type);
  end loop;
  if v_sets = '' then
    raise exception 'Snapshot has no restorable fields';
  end if;

  begin
    perform set_config('app.revision_action', 'restore', true);
    execute format('update public.%I set %s where %I = %L',
                   p_table_name, v_sets, v_pk, p_record_id);
    perform set_config('app.revision_action', '', true);
  exception when others then
    get stacked diagnostics v_error = MESSAGE_TEXT;
    perform set_config('app.revision_action', '', true);
    perform public.log_admin_action('content.version.restore', p_table_name,
      p_record_id, null, jsonb_build_object('version', p_version, 'error', v_error), 'error');
    raise exception 'Restore failed: %', v_error;
  end;

  -- the update trigger recorded the pre-restore state as a new version
  perform public.log_admin_action('content.version.restore', p_table_name,
    p_record_id, null, jsonb_build_object('restored_version', p_version), 'success');
  return jsonb_build_object('ok', true, 'table', p_table_name,
                            'record_id', p_record_id, 'restored_version', p_version);
end
$body$;
revoke execute on function public.restore_content_version(text, text, int) from public, anon;
grant execute on function public.restore_content_version(text, text, int) to authenticated;

-- ---------------------------------------------------------------------
-- 4. VERSIONS FOR THE GLOBAL SEARCH (visible in Ctrl+K results)
--    (no extra function needed — content_revisions is directly readable)
-- ---------------------------------------------------------------------

notify pgrst, 'reload schema';
-- =====================================================================
-- DONE (010). content_revisions + restore_content_version + review
-- lifecycle (draft/pending_review/approved/published/archived) +
-- content_version counter for optimistic concurrency.
-- =====================================================================
