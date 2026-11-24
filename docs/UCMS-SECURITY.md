# UCMS V5/V6 — Security

## Principles
Only publishable keys are in frontend code (verified by `scripts/ucms-qa.js`).
Every write is authorized by RLS policies built on `has_perm(module, perm)` or
by a `security definer` function with an empty `search_path`. Sign-ups must be
disabled in Supabase; staff accounts are created by an administrator. Users
without an `admin_users` row are signed out of the dashboard.

## What the database enforces (measured with real PostgreSQL, migrations 001–010)

| Action | anon | non-staff signed-in | editor | publisher | admin | super_admin |
|---|---|---|---|---|---|---|
| Read published content | yes | yes | yes | yes | yes | yes |
| Read drafts (staff rows) | no | no | yes* | yes* | yes* | yes |
| Create / edit / delete content rows | no | no | yes* | yes* | yes* | yes |
| Toggle `is_published` / lifecycle publish | no | no | **no** | yes | yes | yes |
| Approve (pending_review → approved) | no | no | no | yes | yes | yes |
| Write `site_settings` | no | no | no | no | yes | yes |
| Write certificates | no | no | yes | yes | yes | yes |
| Upload `site-media` files | no | no | yes | yes | yes | yes |
| **Delete in-use `site-media` files (any API path)** | no | no | **no** | **no** | **no** | **no** |
| Delete unused media files | no | no | yes | yes | yes | yes |
| `create_cms_backup()` / `restore_cms_backup()` | no | no | no | no | yes | yes |
| Manage `admin_users` | no | no | no | no | yes (not super_admin rows) | yes |
| Write `role_permissions` | no | no | no | no | yes | yes |
| Change own role / delete own row | no | no | no | no | no | no |
| Read audit log | no | no | yes | yes | yes | yes |
| Edit/delete audit log | no | no | no | no | no | no (service_role only) |

\* unless the operator restricts the module on the Permissions page — all
values are configurable per module; a missing row means deny (super_admin
always keeps full access as a bootstrap safety net).

Measured by `tests/rbac-workflow.test.mjs` (62 assertions) and
`tests/db-migrations.test.mjs` (24 assertions).

## Hardening added in V5/V6

1. **Publish gating (database-enforced).** Editors can no longer toggle
   `is_published` — the trigger raises `Publishing requires the publish
   permission`. Non-publishers who manage to insert with `is_published=true`
   get a draft instead (defense in depth).
2. **Media-usage protection (server-side).** The storage delete policy calls
   `media_path_in_use(name)`; a file referenced by any content row, setting,
   section or text cannot be deleted — even by calling the raw Storage API,
   closing the former UI-only protection gap. Denied attempts are audit-logged
   with outcome `denied`.
3. **Deterministic atomic restore.** `restore_cms_backup()` runs validation,
   an automatic pre-restore checkpoint, dependency-ordered upserts and cleanup
   of post-backup rows inside a single transaction; any failure rolls back
   everything. Incompatible schema versions are rejected before any write.
4. **Permission escalation guards.** Migration 008 (only super_admin touches
   super_admin rows; no self-role changes) + migration 009 (matrix writable
   only via `users.manage`; every matrix change audit-logged).
5. **Real last-login.** `record_staff_login()` runs on an actual
   authenticated sign-in; the UI only ever shows recorded values.
6. **No fake success.** Storage deletes report failure when PostgREST returns
   success but removes nothing (blocked by policy). Restores report the
   server's per-table counts, not a client-side guess.

## Known limitations (documented, not hidden)

* Session revocation of another user's Supabase session requires the Auth
  admin API (service_role key) and is not available from the static dashboard.
  Removing the `admin_users` row revokes access within one request, and the
  next dashboard load signs the user out (no staff row → sign-out).
* Rate limiting relies on Supabase Auth defaults; the publishable key can be
  abused for reading public content only.
* CSRF is not applicable (token-based API, no cookies set by the app).
* Media usage matching is string-based (path and URL-encoded variants); files
  whose URL contains encoded characters beyond spaces could be missed in the
  advisory report — the delete policy uses the same matchers, so treat
  "unused" as advisory and rely on the pre-restore checkpoint for recovery.
* No custom roles — the four fixed roles are intentionally simple; the matrix
  is per-module configurable.

## Security checklist (operator runbook)

- [ ] Public sign-ups disabled in Supabase Auth.
- [ ] Only the publishable key in `cms-config.js` / `GDF_VERIFY_SUPABASE`.
- [ ] Migrations 001–010 applied in order (run 009/010 on existing projects too).
- [ ] First super_admin created via SQL editor (no JWT subject) or dashboard.
- [ ] Permissions page reviewed: editors have no publish anywhere.
- [ ] Audit log reviewed after first week (`outcome <> 'success'`).
- [ ] Backup created and downloaded before any migration or bulk edit.
- [ ] `node scripts/ucms-qa.js .` and `cd tests && npm run test:all` green.
