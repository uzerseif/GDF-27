# Builder Studio removal — database procedure

Builder Studio (the GrapesJS visual builder) was removed from the application. Databases created before
this change still contain its tables and functions. `007-remove-builder-studio.sql` removes them safely.
New installs never create them; running 007 there changes nothing.

## 1. Back up first (recommended, required for production)
- Supabase Dashboard > Database > Backups (or PITR), **or** `pg_dump "$DATABASE_URL" --format=custom --file=before-builder-removal.dump`
- Also create a content backup in the dashboard (Backups & Restore).

## 2. Apply
Supabase > SQL Editor > paste `database/migrations/007-remove-builder-studio.sql` > Run.
Then run `008-protect-privileged-roles.sql` (separate security fix).

What 007 does, in one transaction (any failure rolls everything back):
1. Re-defines `create_cms_backup()` so it no longer reads Builder tables (the old one would fail once they are gone).
2. Aborts if any non-Builder table has a foreign key into a Builder table.
3. Drops Builder RLS policies, triggers and functions (explicit allow-list, no wildcards, no CASCADE).
4. **Moves** the 16 Builder tables into a private schema `builder_archive` (not exposed by the API, no grants). No data is deleted.
5. Verifies that nothing Builder-related remains in `public` and that shared objects still exist.

## 3. Verify
```sql
select count(*) from information_schema.tables where table_schema='public' and table_name like 'builder%';  -- 0
select table_name from information_schema.tables where table_schema='builder_archive';                       -- 16 rows
```
Open the dashboard: Website Health should show no missing tables, and Backups > Create backup should succeed.

## 4. Recover (if ever needed)
`alter table builder_archive.<name> set schema public;` moves a table back (functions and policies are not restored).

## 5. Purge (optional, permanent)
After you have run the site for a while with a fresh backup: `database/maintenance/purge-builder-archive.sql`.
It is a dry run that ends with `rollback`; change the last line to `commit` to delete.

## Affected objects
**Tables moved to `builder_archive` (16):**
- `builder_editor_documents`
- `builder_page_templates`
- `builder_project_archives`
- `builder_project_assets`
- `builder_project_components`
- `builder_project_custom_code`
- `builder_project_heroes`
- `builder_project_integrations`
- `builder_project_navigation`
- `builder_project_pages`
- `builder_project_releases`
- `builder_project_responsive`
- `builder_project_revisions`
- `builder_project_settings`
- `builder_project_test_runs`
- `builder_projects`

**Functions dropped (14):**
- `can_manage_builder_project(uuid)`
- `duplicate_builder_project(uuid,text,jsonb)`
- `protect_builder_custom_code()`
- `protect_builder_document_links()`
- `protect_builder_hero_links()`
- `protect_builder_integrations()`
- `protect_builder_navigation()`
- `protect_builder_project()`
- `protect_builder_release_links()`
- `protect_builder_revision_links()`
- `protect_builder_system_pages()`
- `publish_builder_document(uuid,text)`
- `restore_builder_revision(uuid)`
- `set_builder_updated_at()`

**Triggers dropped (20):**
- `builder_editor_documents :: trg_builder_editor_documents_updated`
- `builder_editor_documents :: trg_protect_builder_document_links`
- `builder_page_templates :: trg_builder_page_templates_updated`
- `builder_project_components :: trg_builder_project_components_updated`
- `builder_project_custom_code :: trg_builder_project_custom_code_updated`
- `builder_project_custom_code :: trg_protect_builder_custom_code`
- `builder_project_heroes :: trg_builder_project_heroes_updated`
- `builder_project_heroes :: trg_protect_builder_hero_links`
- `builder_project_integrations :: trg_builder_project_integrations_updated`
- `builder_project_integrations :: trg_protect_builder_integrations`
- `builder_project_navigation :: trg_builder_navigation_updated`
- `builder_project_navigation :: trg_protect_builder_navigation`
- `builder_project_pages :: trg_builder_project_pages_updated`
- `builder_project_pages :: trg_protect_builder_system_pages`
- `builder_project_releases :: trg_protect_builder_release_links`
- `builder_project_responsive :: trg_builder_project_responsive_updated`
- `builder_project_revisions :: trg_protect_builder_revision_links`
- `builder_project_settings :: trg_builder_project_settings_updated`
- `builder_projects :: trg_builder_projects_updated`
- `builder_projects :: trg_protect_builder_project`

**RLS policies dropped:** 32 (all on the tables above).
Indexes, constraints and primary keys travel with their tables.

**Not touched:** `admin_users`, `site_*`, `page_sections`, `committees`, `faqs`, `sponsors`, `applications`, `team_*`, `news`, `audit_logs`
(historic entries mentioning Builder stay as history), `cms_notifications`, `cms_backups` (old manifests may contain `builder_*` keys; they are ignored on restore),
`certificates`, storage buckets, `auth.*`, and the helpers `is_staff`, `is_admin`, `is_super`, `can_publish`, `can_manage_design`, `set_updated_at`, `is_i18n`.
Builder did not use storage buckets, so no files need cleanup.
