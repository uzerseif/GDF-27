# UCMS V5/V6 — Operations

## Deployment instructions

### New Supabase project
1. Supabase > SQL Editor, run in order:
   `database/migrations/001` → `002` → (seed `database/seed/seed-gdf.sql`,
   empty project only) → `003` → `004` → `005` → `006` → `007` (no-op on
   fresh installs) → `008` → `009` → `010`.
2. Authentication > Users > Add user (auto confirm), then in the SQL editor:
   `insert into public.admin_users (user_id, role) values ('USER-UID', 'super_admin');`
3. Turn off public sign-ups. Deploy the whole folder. Open `/admin/`.

### Existing GDF-V4 deployment
1. **Take a backup first** (Supabase Dashboard > Database > Backups, or
   `pg_dump`), then in the dashboard create a content snapshot
   (Backups & Restore > Create).
2. Run migrations `009` and `010` in the SQL editor. Both are additive and
   safe to re-run; existing rows and role assignments are preserved and
   mapped onto the new lifecycle automatically.
3. Review the Permissions page — defaults grant editors everything **except
   publishing**; adjust per your organization.
4. Deploy the updated static files (whole folder).

`cms-config.js` carries the Supabase URL and **publishable** key only. Never
put a service_role or secret key in a frontend file.

## Daily operations

### Backups & restore
* **Create:** Backups & Restore > label > Create. The snapshot includes all
  CMS content tables; media *files* are referenced by URL (not copied).
* **Download:** every backup row can be downloaded as JSON (admins only).
* **Restore:** server-side and atomic. The system first creates a
  pre-restore checkpoint inside the same transaction, then upserts the
  snapshot in dependency order and removes rows created after the backup.
  A failed restore rolls back completely and reports the database error.
* **Recovery instructions:** if a restore goes wrong, restore the
  automatic `pre_restore` checkpoint (kind badge "safety") from the same
  page. For full-database recovery use the Supabase platform backups.

### Media library
* Usage badges are **server-verified** (`media_usage_report()`); deletion of
  referenced files is blocked by the storage policy no matter which client
  is used. "Unknown" (RPC unreachable) blocks deletion rather than allowing it.
* Multi-file upload with drag & drop and per-file progress; bulk selection
  and bulk delete of unused files.

### Users
* Invite: create the auth user in Supabase (Authentication > Users), then use
  the copy-ready SQL on the Users page. The user appears in the list with
  creation date and — after their first sign-in — a real last-login stamp.
* Revoke: removes the staff row; the user loses all access on their next
  request (every query re-evaluates RLS) and is signed out on next load.
* Role changes: admins can change editor/publisher/admin rows; super_admin
  rows require a super_admin. Nobody can change their own role.
* Sessions: permission changes apply immediately; account removal is
  immediate. Forcing a *session* logout of another user needs the Auth admin
  API (service_role) — see UCMS-SECURITY limitations.

### Health checks
* Dashboard > Website Health runs service checks (auth, database, storage,
  dependencies, migrations, error rate, certificate project).
* Database Health probes tables, columns, RPCs, storage bucket and RLS
  behaviour — including the new V6 objects (`role_permissions`,
  `content_revisions`, `dashboard_stats`, `media_usage_report`,
  `restore_cms_backup`).

### QA before each release
```
node scripts/ucms-qa.js .          # static checks
cd tests && npm run test:all       # migrations + RBAC/workflow + UI smoke (real PostgreSQL + DOM)
```

## Maintenance SQL
`database/maintenance/purge-builder-archive.sql` (dry-run by default) is still
the only maintenance script; V5/V6 pruning (revisions) is automatic.
