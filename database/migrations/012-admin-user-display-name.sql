alter table public.admin_users
  add column if not exists display_name text not null default '';

notify pgrst, 'reload schema';
