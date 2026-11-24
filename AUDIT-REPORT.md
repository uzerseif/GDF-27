# Audit report — Phase 1 (Builder Studio removal, database safety, security fixes)

**Scope of this delivery.** Builder Studio removal, SQL consolidation, the privilege-escalation fix, a media-deletion fix, documentation,
and verification. **Not delivered in this phase** (see "Remaining work"): the backend API, provider-independent database layer,
full RBAC with custom roles, and the admin folder restructure. Nothing below claims those exist.

## 1. Problems discovered

| # | Finding | Evidence |
|---|---|---|
| 1 | Builder Studio footprint: 16 tables, 14 functions, 20 triggers, 32 policies, 9 migrations, runtime references in search, health checks, restore, permissions matrix, ~240 i18n keys, CSS, docs | grep + real PostgreSQL inventory |
| 2 | `cms-migration-v5.sql` could not be installed without Builder tables, and `create_cms_backup()` read 8 Builder tables, so dropping them would have broken backups | reproduced in PostgreSQL (tests S3.01, S3.02) |
| 3 | The old "Pages" module was left as a 253-line commented-out block (dead code); the QA script counted it as a registered page | code + QA run |
| 4 | **Privilege escalation:** any `admin` could promote themselves or anyone to `super_admin` and demote/delete the real `super_admin` | reproduced (S5.01) |
| 5 | **Media deletion could report success without deleting:** `storage.remove()` returns no error when a policy blocks it; the UI toasted "Deleted" and wrote a `media.delete` audit entry | code review of `deleteFile`/`replaceFile` (not executed against live Supabase) |
| 6 | `publisher` has no capability beyond `editor`; editors can toggle `is_published`; docs claimed otherwise | measured matrix (docs/SECURITY.md) |
| 7 | Media "in use" protection is UI-only; an editor can delete storage objects through the API | measured (delete from `site-media` = allowed for editor) |
| 8 | Backup restore is not atomic (separate browser upserts); the `pre_restore` kind is displayed but never created | code review |
| 9 | `002-cms-admin-upgrade.sql` allows `image/svg+xml` (scripts); only 004 re-tightens it | SQL review (documented; fresh installs are safe once 004 runs) |
| 10 | The QA script's "A.go targets" count included dead code | QA run |

## 2. Problems fixed
1 (removed or archived, see section 5), 2 (backup function re-defined; 004 is Builder-free), 3 (block deleted; QA now comment-aware and fails on commented-out executable code),
4 (migration 008, 17 tests), 5 (deletion and replace cleanup now verify the object was removed, new message in EN/AR/TR), 10.
Items 6, 7, 8, 9 are documented, not fixed.

## 3. Files
**Removed:** `BUILDER-GUIDE.md`; `builder-migration-v1..v9.sql`; `README.txt`, `CMS-SETUP.txt`; old reports/guides (`ARCHITECTURE`, `AUDIT-REPORT`, `CHANGES`, `CMS-SETUP`, `DATABASE`, `DEPLOYMENT`, `MIGRATIONS`, `README`, `REPORT`, `SECURITY`, `TESTING`, `UCMS-GUIDE`), replaced by the new set. Original SQL files at the root were moved (content unchanged except 004).
**Modified:** `admin.js`, `admin.css`, `admin/ucms.css`, `admin/ucms-core.js`, `admin/pages-website.js`, `admin/pages-system.js`, `admin-i18n.js`, `admin-ucms-i18n.js`, `cms-config.js` (comment), `scripts/ucms-qa.js`.
**Added:** `database/` (migrations 001-008, seed, maintenance purge, removal doc), `docs/*`, `tests/*`, `README.md`, this report, `TEST-REPORT.md`.
**Public website files modified: none** (verified by directory diff), so the design, content and behavior are unchanged.

## 4. Dependencies removed
GrapesJS, CodeMirror, JSZip were no longer loaded by `admin.html` (already absent); all remaining mentions (docs, a dependency-error message) were removed. No runtime dependency was added;
`tests/` adds a dev-only dependency (`@electric-sql/pglite`).

## 5. Database changes
- `004-ucms-v5.sql`: v5 without Builder (no `set_builder_updated_at`, templates table, publish function; backup function cleaned).
- `007-remove-builder-studio.sql`: archive, not drop (16 tables to `builder_archive`; 14 functions, 20 triggers, 32 policies removed). Transactional, idempotent, aborts on foreign-key dependencies.
- `008-protect-privileged-roles.sql`: trigger on `admin_users`.
- `database/maintenance/purge-builder-archive.sql`: manual, dry-run by default.
No shared table or data was altered (verified by content hash).

## 6. Security improvements
Super_admin protection and self-role-change block (DB level); media deletion verification; Builder RPCs and tables no longer reachable; the measured permission matrix is now documented.

## 7. i18n
243 Builder-owned keys removed per language (785 to 543 English keys), verified by reloading all three dictionaries and diffing. 69 other keys are unused but not Builder-related; left untouched because dynamically built keys cannot be fully excluded by static analysis.

## 8. Remaining work (not done in this phase)
1. **Backend API + database abstraction + adapters (MySQL, SQLite, Postgres, Supabase).** Needs a decision first: the site is deployed on GitHub Pages (static), which cannot run a backend. A server host (Node on a VPS/Render/Fly, or serverless) must be chosen, and the public site reads Supabase directly today. Only PostgreSQL has been tested here.
2. **Full RBAC:** custom roles, per-module view/create/edit/delete/publish/manage permissions, UI for managing them, backend + RLS enforcement. Findings 6 and 7 feed this. Can be done on Supabase alone (permission tables + RLS) without the backend.
3. **Media Library:** server-side usage check and delete (finding 7), usage tracking beyond the current column scan.
4. **Admin restructure** (`admin/core`, `modules`, `services`), atomic restore, retry UI for CDN failure (a dependency-error screen exists; a retry was not verified), HTML/CSS validation, responsive and live-credential tests.
5. Duplicate public pages (`about-us.html` and `about/index.html`, etc.) remain; the clean-URL layout is yours and was not changed.

---

# Audit report — Phase 2 (UCMS V5/V6: RBAC, workflow, media, restore)

**Scope of this delivery.** Full per-module RBAC (configurable, server-enforced),
database-enforced publish gating, server-side media-usage protection, real
last-login tracking, atomic server-side restore, version history + review
lifecycle + optimistic concurrency, dashboard statistics from one real RPC,
and the matching dashboard repairs. Detailed results: `docs/UCMS-TEST-REPORT.md`.

## 1. Problems identified (this phase)

| # | Finding | Evidence |
|---|---|---|
| P1 | **Editors could publish** — `can_publish()` existed but no policy used it; the RLS "staff manage" policy let any staff toggle `is_published` | measured (`tests/rbac-baseline.mjs` matrix; docs/SECURITY.md finding 6) |
| P2 | **Media usage protection was UI-only** — an editor calling the Storage API directly could delete referenced files | docs/SECURITY.md finding 7 |
| P3 | **Backup restore was not atomic** — browser-side upserts, one table at a time; a failure left the database half-restored | code review (`pages-system.js` RESTORE_ORDER loop) |
| P4 | **Dashboard statistics were off by one** — 7 stat cards were filled from 6 values; media showed team_members count, texts showed "—" | code review (`pages-dashboard.js` renderStats) |
| P5 | **Audit filters OR-combined** — all filter categories were joined into one PostgREST `or(...)`; independent categories were not AND-ed | code review (`pages-system.js` audit filters) |
| P6 | **"Load more" on Audit Logs cleared the list** — `list.innerHTML = append ? "" : spinner` replaced rows on append | code review |
| P7 | **Last login was never available** — the UI showed "not available" for every user; no authentication event was ever recorded | code review |
| P8 | **Permissions page was a static, non-authoritative matrix** | code review |
| P9 | **No version history / lifecycle / concurrency protection for content** | code review |
| P10 | **Media upload was single-file only** with no bulk operations | code review |
| P11 | **Publish-gate regression risk on `certificates`** (no `is_published` column) — caught during review and fixed before delivery; regression test S12.25–27 added | migration review |

## 2. Fixes and implementations

1. `009-rbac.sql`: `role_permissions` matrix + `has_perm()`; every staff RLS
   policy rebuilt on it (view/create/edit/delete per module); settings/users/
   backups/audit/storage policies mapped to matrix permissions.
2. Publish gating trigger (`gate_publish_toggle`): toggling `is_published`
   requires the module publish permission; non-publishers always insert drafts.
3. Media protection: storage delete policy calls `media_path_in_use()`;
   `media_usage_report()` / `media_usage_for()` power the UI; denied deletes
   are audit-logged. Media page gained multi-upload (drag & drop, progress),
   bulk selection/delete, and server-verified usage badges.
4. `restore_cms_backup()`: single-transaction restore with automatic
   pre-restore checkpoint, schema validation and deterministic cleanup of
   post-backup rows; UI uses the RPC and reports per-table counts.
5. `010-content-workflow.sql`: `content_revisions` (50 versions/record, actor
   + snapshot), `restore_content_version()` (current state preserved first),
   review lifecycle `draft → pending_review → approved → published → archived`
   on committees/sponsors/faqs/applications, `content_version` optimistic
   concurrency counters; staff notification on review submission.
6. `record_staff_login()`: real `last_login_at` + `auth.login` audit entry.
7. `dashboard_stats()`: one real-data RPC; dashboard fixed and extended
   (published/draft split, media size, certificates validity).
8. Permissions page: live editable matrix (admins), saved changes re-apply
   capabilities and rebuild navigation; every change audit-logged by trigger.
9. Audit page: AND-combined chained filters (OR only within resource search),
   append-safe "Load more", CSV export with audit entry.
10. Global search is permission-aware — restricted modules are not queried.
11. Navigation hides pages the role cannot view; table actions (create/edit/
    delete) are permission-gated in the UI (the server enforces regardless).

## 3. Verification executed
* `tests/db-migrations.test.mjs` — 24 passed (fresh install 001–008 + escalation).
* `tests/rbac-workflow.test.mjs` — 62 passed (009/010: RBAC matrix, publish
  gating, media protection, atomic restore, versions, lifecycle, concurrency).
* `tests/ui-smoke.test.mjs` — 16 passed (real admin modules executed in a DOM
  for editor and admin roles: registration, capabilities, navigation, renders).
* `scripts/ucms-qa.js` — 10/10 static checks.
* Live-credential browser testing was not possible from this environment
  (no local server / no external preview allowed); see UCMS-TEST-REPORT.

## 4. Remaining (unchanged from phase 1)
Backend API/provider abstraction, custom roles beyond the 4 fixed ones,
cross-user session revocation (needs Auth admin API), duplicate legacy public
HTML pages.
