# Database (Supabase / PostgreSQL)

Migrations live in `database/migrations` and are idempotent unless noted.

| Order | File | Purpose |
|---|---|---|
| 001 | `001-cms-schema.sql` | base CMS tables, staff helpers, RLS, `site-media` bucket |
| 002 | `002-cms-admin-upgrade.sql` | `team_members.sort_order`, bucket upsert |
| seed | `database/seed/seed-gdf.sql` | **empty project only, once**, run after 002 |
| 003 | `003-cms-v4.sql` | site_texts, page_sections, team_groups, extra columns, RLS |
| 004 | `004-ucms-v5.sql` | audit_logs, notifications, backups, roles, safe image allow-list |
| 005 | `005-certificates.sql` | certificates table, `verify_certificate()` RPC, certificate bucket |
| 006 | `006-certificate-admin.sql` | staff management of certificates |
| 007 | `007-remove-builder-studio.sql` | existing deployments: archive Builder objects. No-op on fresh installs |
| 008 | `008-protect-privileged-roles.sql` | prevents privilege escalation on `admin_users` |
| 009 | `009-rbac.sql` | per-module permission matrix + `has_perm()` RLS, publish gating, server-side media-usage protection, real last-login, atomic `restore_cms_backup()`, `dashboard_stats()` |
| 010 | `010-content-workflow.sql` | `content_revisions` version history + restore RPC, review lifecycle (`content_status`), optimistic-concurrency counters |
| optional | `database/maintenance/purge-builder-archive.sql` | permanently deletes the Builder archive (dry-run by default) |

## Tables
- Identity: `admin_users(user_id, role, last_login_at)`; roles `super_admin, admin, publisher, editor`.
  Helpers (security definer, empty search_path): `is_staff`, `is_admin`, `is_super`, `can_publish`, `can_manage_design`, `my_role`, `has_perm`.
- Permissions: `role_permissions(role, module, can_view, can_create, can_edit, can_delete, can_publish, can_manage)` (admin-writable, audit-logged).
- Public content: `committees`, `team_tabs`, `team_groups`, `team_members`, `team_placements`, `sponsors`, `faqs`, `applications`, `news` (unused, kept).
  Workflow tables (committees/sponsors/faqs/applications) carry `content_status` + `content_version`.
- CMS core: `site_texts`, `page_sections`, `site_settings` (public read; staff write; settings admin-only).
- System: `audit_logs` (append-only), `cms_notifications`, `cms_backups` (admin-only).
- Versions: `content_revisions` (staff with module edit permission can read; written only server-side).
- Certificates: `certificates` (+ `verify_certificate()` RPC).
- RPCs: `log_admin_action`, `notify_staff`, `create_cms_backup`, `restore_cms_backup` (atomic), `record_staff_login`, `dashboard_stats`, `media_usage_report`, `media_usage_for`, `media_path_in_use`, `restore_content_version`.

## Storage
Bucket `site-media`: public read, 5 MB, JPEG/PNG/WebP only (SVG excluded on purpose; 004 re-asserts this because 002 once allowed it).
Staff can list, upload, update and delete.

## Backup and recovery
- Before any migration on a live project: Supabase Dashboard > Database > Backups (or `pg_dump`).
- Content snapshots: dashboard > Backups & Restore (`create_cms_backup`). Media files are referenced by URL, not copied.

## Limitations
Only Supabase/PostgreSQL is supported. No provider abstraction exists yet (see AUDIT-REPORT.md).
