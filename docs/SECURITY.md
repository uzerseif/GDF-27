# Security

## Principles
Only publishable keys are in frontend code (verified by `scripts/ucms-qa.js`). Every write is authorized by RLS or a
`security definer` function with an empty `search_path`. Sign-ups must be disabled in Supabase; staff accounts are created by an administrator.
Users without an `admin_users` row are signed out of the dashboard.

## What the database enforces today (measured on PostgreSQL, schema 001-008)

| Action | anon | signed-in, no staff row | editor | publisher | admin | super_admin |
|---|---|---|---|---|---|---|
| Read published content | yes | yes | yes | yes | yes | yes |
| Create / edit / delete content rows | no | no | yes | yes | yes | yes |
| Toggle `is_published` | no | no | **yes** | yes | yes | yes |
| Write `site_settings` | no | no | no | no | yes | yes |
| Write certificates | no | no | yes | yes | yes | yes |
| Upload / delete `site-media` files | no | no | yes | yes | yes | yes |
| `create_cms_backup()` | no | no | no | no | yes | yes |
| Manage `admin_users` | no | no | no | no | yes (not super_admin rows) | yes |
| Change own role | - | - | no | no | no | no |

Measured by `tests/rbac-baseline.mjs`. Notes:
- **`publisher` currently has no capability that `editor` lacks.** Builder's publish RPC was the only thing that used `can_publish()`.
- Media "in use" protection was UI-only; an editor calling the Storage API directly could delete any file. **Fixed in migration 009**: the storage delete policy now calls `media_path_in_use(name)`.
- Before migration 008, an `admin` could promote themselves to `super_admin` and demote or delete the real one. 008 closes this
  (only a super_admin may touch super_admin rows; nobody may change or remove their own role). Operators with no JWT
  subject (SQL editor, service_role) are not restricted; that is how the first super_admin is created.
- Editors could toggle `is_published` (finding above). **Fixed in migration 009** (publish-gating trigger + per-module
  permission matrix); see `docs/UCMS-SECURITY.md` for the current measured matrix.

> **Up to date?** This file describes the phase-1 baseline. The current
> enforcement matrix, hardening list and security checklist live in
> **[docs/UCMS-SECURITY.md](UCMS-SECURITY.md)** (V5/V6, migrations 001–010).

## Known gaps (not yet addressed)
No custom roles (four fixed roles with a configurable per-module matrix instead); cross-user session revocation needs the
Auth admin API (service_role); no rate limiting beyond Supabase Auth defaults; CSRF is not applicable (token-based API,
no cookies set by the app).
