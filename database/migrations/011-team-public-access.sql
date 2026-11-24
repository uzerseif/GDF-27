-- GDF'27: ensure team CMS tables are readable by the public site and
-- manageable by authenticated staff. Run this migration in Supabase SQL Editor.

-- Restore the standard tabs if they were deleted or the seed migration was not
-- applied. Existing tabs are preserved; only missing slugs are created/re-enabled.
do $migration$
begin
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.team_tabs'::regclass
      and tgname = 'trg_team_tabs_gate_publish'
      and not tgisinternal
  ) then
    alter table public.team_tabs disable trigger trg_team_tabs_gate_publish;
  end if;

  insert into public.team_tabs (id, slug, title, description, sort_order, is_published)
  values
    ('3a2dbb5e-8fc8-506d-bc4b-0f8156f15d47', 'presidency',
     '{"en":"Presidency","ar":"الرئاسة","tr":"Başkanlık"}'::jsonb, null, 0, true),
    ('14049de7-161c-597c-92d7-f8543698f870', 'board',
     '{"en":"Board of Directors","ar":"مجلس الإدارة","tr":"Yönetim Kurulu"}'::jsonb, null, 1, true),
    ('da79cfb7-d365-5e9d-89f6-3740e47ae961', 'advisory',
     '{"en":"Advisory Board","ar":"المجلس الاستشاري","tr":"Danışma Kurulu"}'::jsonb, null, 2, true),
    ('ab94bc7d-5ad1-51d3-8d07-1f1ea5f74805', 'units',
     '{"en":"Units","ar":"الوحدات","tr":"Birimler"}'::jsonb, null, 3, true)
  on conflict (slug) do update set
    title = excluded.title,
    sort_order = excluded.sort_order,
    is_published = true;

  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.team_tabs'::regclass
      and tgname = 'trg_team_tabs_gate_publish'
      and not tgisinternal
  ) then
    alter table public.team_tabs enable trigger trg_team_tabs_gate_publish;
  end if;
exception
  when others then
    if exists (
      select 1 from pg_trigger
      where tgrelid = 'public.team_tabs'::regclass
        and tgname = 'trg_team_tabs_gate_publish'
        and not tgisinternal
    ) then
      alter table public.team_tabs enable trigger trg_team_tabs_gate_publish;
    end if;
    raise;
end
$migration$;

alter table public.team_tabs enable row level security;
alter table public.team_members enable row level security;
alter table public.team_groups enable row level security;
alter table public.team_placements enable row level security;

drop policy if exists "public read published" on public.team_tabs;
create policy "public read published" on public.team_tabs
  for select to anon, authenticated
  using (is_published);

drop policy if exists "staff manage" on public.team_tabs;
create policy "staff manage" on public.team_tabs
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "public read published" on public.team_members;
create policy "public read published" on public.team_members
  for select to anon, authenticated
  using (is_published);

drop policy if exists "staff manage" on public.team_members;
create policy "staff manage" on public.team_members
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "public read published" on public.team_groups;
create policy "public read published" on public.team_groups
  for select to anon, authenticated
  using (is_published);

drop policy if exists "staff manage" on public.team_groups;
create policy "staff manage" on public.team_groups
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "public read placements" on public.team_placements;
create policy "public read placements" on public.team_placements
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.team_members m
      join public.team_tabs t on t.id = team_placements.tab_id
      where m.id = team_placements.member_id
        and m.is_published
        and t.is_published
    )
  );

drop policy if exists "staff manage" on public.team_placements;
create policy "staff manage" on public.team_placements
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

grant select on public.team_tabs, public.team_members, public.team_groups, public.team_placements
  to anon, authenticated;

grant insert, update, delete on public.team_tabs, public.team_members, public.team_groups, public.team_placements
  to authenticated;
