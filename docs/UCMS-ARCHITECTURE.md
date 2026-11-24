# UCMS V5/V6 — Architecture

This document describes the GDF'27 Unified Content Management System after the
V5/V6 upgrade (migrations 001–010). The public website is untouched; everything
below concerns the admin dashboard (`/admin/`) and its Supabase backend.

## Layers

```
Public website (static HTML on GitHub Pages)  -- publishable key, RLS -->  Supabase project
Admin dashboard (/admin/, static JS)          -- user session, RLS+RPC  --> (tables, storage, RPCs)
```

There is **no application server**: authorization is enforced by PostgreSQL
Row Level Security, storage policies and `security definer` functions. The
dashboard UI mirrors permissions (`A.canM(module, perm)`) but never gates them.

## Dashboard modules (plain scripts, load order matters)

| File | Responsibility |
|---|---|
| `admin.js` | Supabase client, auth (+ `record_staff_login()` on sign-in), UI kit, dirty tracking, router (`A.go`), permission-aware navigation |
| `admin/ucms-core.js` | capabilities (`A.canM`, `A.applyCapabilities`), audit log (`A.log`/`U.audit`), notifications, global search (Ctrl/⌘+K, permission-filtered), website + database health checks |
| `admin/pages-shared.js` | `sectionEditor`, `editorPage`, `sectionsManager`, `tableList` (workflow status, versions, optimistic concurrency, permission-gated actions) |
| `admin/pages-dashboard.js` | Dashboard (real statistics via `dashboard_stats()` RPC), Website Health |
| `admin/pages-website.js` | Header, Homepage, President, Footer, SEO, Global Settings |
| `admin/pages-content.js` | Applications, Certificates, Sponsors, About, Team, Committees, FAQs, Texts, Translations |
| `admin/pages-system.js` | Audit Logs (AND-filters + CSV export), Media Library (server-verified usage, multi-upload, bulk delete), Users & Roles (real last-login), Permissions (editable matrix), Backups & Restore (atomic RPC), Notifications |
| `admin/boot.js` | starts the router after all modules register |

Navigation groups: Overview, Website, Content, Media, System. Navigation items
are filtered by the signed-in role's `view` permission per module.

## Server-side building blocks (added by 009/010)

| Object | Purpose |
|---|---|
| `role_permissions` | per-module matrix for the 4 fixed roles (view/create/edit/delete/publish/manage) |
| `has_perm(module, perm)` | the single authorization primitive; used by every staff RLS policy |
| `my_role()` | caller's staff role |
| `gate_publish_toggle()` | trigger: `is_published` changes require the module's publish permission; non-publishers always insert drafts |
| `sync_content_status()` | trigger: keeps `is_published` in sync with the review lifecycle (`content_status`) |
| `content_revisions` + `record_content_revision()` | version history (last 50 per record, actor + full row snapshot) |
| `restore_content_version(table, id, version)` | restore a version; the pre-restore state is recorded first |
| `media_path_in_use(path)` / `media_usage_for(path)` / `media_usage_report()` | server-side media usage verification; wired into the storage delete policy |
| `record_staff_login()` | real `admin_users.last_login_at` + `auth.login` audit entry |
| `restore_cms_backup(id)` | atomic, transactional server-side restore with automatic pre-restore checkpoint |
| `dashboard_stats()` | one call with all real dashboard counters |

## Data flow of a content save

1. Editor edits a row in `tableList`; the modal collects fields and the chosen
   lifecycle status (`content_status`).
2. The update is sent with `.eq("content_version", expected)` — if another
   admin saved meanwhile, 0 rows are updated and the UI reports the conflict.
3. `sync_content_status` + `gate_publish_toggle` validate the transition
   against `has_perm`.
4. `record_content_revision` stores the new version and advances
   `content_version`.
5. `log_admin_action` (called by the dashboard) appends an audit entry with
   actor, action, target, outcome and metadata.

## Saving model
Dirty tracking with unsaved-changes guard; save bars show Saving / Saved /
Failed / Offline. Saved content is live on the next public page load (no
deploy step).

## Deployment
See `docs/UCMS-OPERATIONS.md`. Migration order is 001 → 010 (see
`docs/DATABASE.md`).
