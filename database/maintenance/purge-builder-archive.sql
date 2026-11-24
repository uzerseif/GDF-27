-- =====================================================================
-- PURGE BUILDER ARCHIVE — PERMANENTLY DELETES DATA
--
-- Only run this after 007-remove-builder-studio.sql, after you have verified
-- the website and CMS for a while, and after you have a fresh backup.
--
-- Safe by default: this script is a DRY RUN. It shows what would be deleted
-- and then ROLLS BACK. To really delete, change the last line from
-- "rollback;" to "commit;" and run it again.
-- =====================================================================

begin;

do $$
declare
  r record;
  v_rows bigint;
begin
  if to_regnamespace('builder_archive') is null then
    raise notice 'builder_archive does not exist — nothing to purge.';
    return;
  end if;
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'builder_archive' and c.relkind = 'r' order by c.relname
  loop
    execute format('select count(*) from builder_archive.%I', r.relname) into v_rows;
    raise notice 'will delete builder_archive.% (% rows)', r.relname, v_rows;
  end loop;
end
$$;

drop schema if exists builder_archive cascade;

rollback;   -- change to: commit;
