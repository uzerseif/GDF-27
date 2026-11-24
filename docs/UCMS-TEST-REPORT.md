# UCMS V5/V6 — Test Report

All results below come from executed runs on this machine (Windows, Node 24,
PGlite = real PostgreSQL 18 in WASM, jsdom). **No test below is claimed
without execution.** Run everything yourself:

```
node scripts/ucms-qa.js .            # 10 static checks
cd tests && npm run test:all         # 3 suites, 102 assertions
```

Latest run results:

| Suite | File | Result |
|---|---|---|
| Static QA (syntax, i18n parity, routes, assets, secrets, dead code) | `scripts/ucms-qa.js` | **10/10 PASS** |
| Migration install + hardening (001–008 fresh install, escalation matrix) | `tests/db-migrations.test.mjs` | **24 passed / 0 failed** |
| V5/V6 RBAC + workflow (009/010) | `tests/rbac-workflow.test.mjs` | **62 passed / 0 failed** |
| Admin UI smoke (real modules executed in DOM, editor + admin roles) | `tests/ui-smoke.test.mjs` | **16 passed / 0 failed** |

## Functional coverage (executed)

* Fresh install of migrations 001–010 applies cleanly and **idempotently**
  (S9.01/02), zero Builder leftovers (S2.02).
* Dashboard statistics: single server-side RPC with real counters
  (`dashboard_stats()` — S12.23/24); the former off-by-one mapping of stat
  cards is fixed and covered by an explicit key→card mapping.
* Audit logs: filters AND-combine between categories (chained PostgREST
  filters), resource search stays an OR group, "Load more" appends instead of
  replacing, CSV export works and is audit-logged (S13 page-render coverage +
  code-level verification of the built query chain).
* Media library: usage truth comes from the server RPC (S10.05); deletion of
  referenced files is blocked by the storage policy even through the raw
  Storage API (S10.03); unreferenced files delete (S10.04); bulk operations
  and multi-upload render without errors (S13.10).
* Backup restore: server-side, atomic, with automatic pre-restore checkpoint
  (S11.04–08); JSON-null jsonb values survive the round trip (S11.07);
  incompatible schema versions are rejected before any write (S11.08).
* Content lifecycle: editor drafts → pending_review (staff notification
  created, S12.02/03); editor cannot approve/publish/unpublish/archive
  (S12.04/07/09); publisher can (S12.05/06/08); the public-site flag
  `is_published` always follows the lifecycle status.
* Version history: every change recorded with actor + snapshot (S12.10/11);
  restore re-applies an old version and preserves the current state as a new
  revision (S12.12–15); restores crossing the publish boundary are permission
  gated (S12.12c); certificates (no is_published column) keep working and are
  versioned (S12.25–27 — regression test added when this bug was found in
  review).
* Optimistic concurrency: `content_version` counter maintained server-side
  (S12.18); the UI guards saves with the version it saw.
* Real last-login: recorded on an actual sign-in via `record_staff_login()`
  (S9.16–19), displayed only when a value exists.
* Permission matrix: editable by admins only (S9.09/12/13); changes are
  audit-logged (S9.14); granting publish to editors immediately enables it
  (S9.10) and revoking immediately disables it (S9.11) — no session refresh.

## Security coverage (executed)

| Threat | Verified by |
|---|---|
| Editor publishes without permission | S9.04, S12.04, S12.07, S12.09 |
| Editor grants itself permissions | S9.12 (0 rows updated) |
| Publisher grants itself permissions | S9.13 |
| Admin self-promotes to super_admin / touches super_admin rows | S5.02–S5.06, S5.10–S5.11 (previous suite, still green) |
| Non-staff calls protected RPCs | S9.19, S12.22, S11.02/03 |
| Restricted records leak through global search | search skips modules without `view` (S13 role capabilities; code-level) |
| In-use media deleted | S10.03 (policy-level) |
| Partially validated restore | S11.04–08 (single-transaction RPC; validation before any write) |
| Audit log tampering | append-only policies (no update/delete) — asserted by policy inventory in S2 + code |
| Secrets in frontend | QA secret scan (service_role / sb_secret_ patterns) — PASS |

## Browser testing — actual limitation

The execution environment refused to start a local HTTP server and refused
`file://` and external preview URLs, so **interactive browser tests against a
live Supabase project could not be executed here** (there are also no live
Supabase credentials in this archive). As the closest executable substitute,
`tests/ui-smoke.test.mjs` loads the **real** admin modules (admin.js,
ucms-core.js, all pages-*.js, boot.js) into a DOM (jsdom) with a stubbed
Supabase client and verifies: all 12 scripts evaluate, all 23 pages register,
capabilities drive navigation (Users hidden for editors), every visible page
renders without throwing for editor and admin roles, and no uncaught errors.

**To complete browser-level acceptance**, deploy the folder with live
credentials and walk: login → navigation per role → content edit → publish
denial (editor) → media upload/delete-block → backup create/restore →
responsive layouts (360/390/768/1024/1366/1920 px). The UI uses the
pre-existing responsive CSS (unchanged) plus the new permission-aware nav.

## Remaining limitations

1. No live-Supabase browser session (see above) — documented, not faked.
2. Cross-user session revocation requires the Auth admin API (service_role).
3. Media usage matching is string-based; exotic encodings fall back to the
   pre-restore checkpoint.
4. Publisher currently has **full content publish rights by default** — the
   matrix is configurable, but the defaults keep parity with the old model.
5. `news` table remains unused (kept for compatibility, documented in
   docs/DATABASE.md).
