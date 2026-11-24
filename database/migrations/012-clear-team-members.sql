-- GDF'27: clear all existing team members and placements.
-- Standard tabs remain available so staff can add and place new members in Admin.

delete from public.team_placements;
delete from public.team_groups;
delete from public.team_members;

update public.team_tabs
set is_published = true
where slug in ('presidency', 'board', 'advisory', 'units');
