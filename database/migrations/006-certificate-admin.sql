-- Allow signed-in CMS staff to manage certificate records from the admin UI.
-- Run after the certificate table setup and cms-migration-v4.sql.
-- Certificate images uploaded by the UI use the existing site-media bucket.

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'Run cms-schema.sql or cms-migration-v4.sql before this migration.';
  end if;
end
$$;

alter table public.certificates enable row level security;
grant select, insert, update, delete on public.certificates to authenticated;

drop policy if exists "Staff manage GDF certificates" on public.certificates;
create policy "Staff manage GDF certificates" on public.certificates
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

notify pgrst, 'reload schema';
