-- =====================================================================
-- 008 — PROTECT PRIVILEGED ROLES (privilege-escalation fix)
--
-- Problem (measured on the schema produced by 001-007): the "admins manage"
-- policy on public.admin_users lets any 'admin' promote themselves or anyone
-- else to 'super_admin', and demote or delete the real super_admin. The
-- super_admin role therefore added no protection.
--
-- This trigger enforces, in the database (not in the UI):
--   1. Only a super_admin may create, change or delete a super_admin row.
--   2. Nobody may change their own role or delete their own staff row.
--      (Together, 1 and 2 guarantee a super_admin can never remove the last
--      super_admin: whoever acts is a super_admin and cannot touch themselves.)
--   3. Trusted operators with no JWT subject (SQL editor / service_role /
--      the first-admin bootstrap insert) are not restricted.
--
-- Additive and idempotent. No data is changed.
-- =====================================================================

create or replace function public.protect_admin_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor      uuid := (select auth.uid());
  v_actor_role text;
  v_old_role   text := case when tg_op = 'INSERT' then null else old.role end;
  v_new_role   text := case when tg_op = 'DELETE' then null else new.role end;
  v_target     uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
begin
  -- Trusted operator (SQL editor, service_role, bootstrap): no restrictions.
  if v_actor is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select role into v_actor_role from public.admin_users where user_id = v_actor;
  if v_actor_role is null then
    raise exception 'Not an authorised CMS user';
  end if;

  -- 2. no self-service role changes or self-removal
  if v_target = v_actor
     and (tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.role is distinct from old.role)) then
    raise exception 'You cannot change or remove your own role';
  end if;

  -- 1. super_admin rows are managed by super_admins only
  if (v_old_role = 'super_admin' or v_new_role = 'super_admin')
     and v_actor_role <> 'super_admin' then
    raise exception 'Only a super_admin can grant, change or remove the super_admin role';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke execute on function public.protect_admin_users() from public, anon, authenticated;

drop trigger if exists trg_protect_admin_users on public.admin_users;
create trigger trg_protect_admin_users
before insert or update or delete on public.admin_users
for each row execute function public.protect_admin_users();

notify pgrst, 'reload schema';
