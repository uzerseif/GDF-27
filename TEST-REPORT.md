# Test report — Phase 1

Environment: Node 22, PostgreSQL 18.7 (PGlite, real PostgreSQL compiled to WASM). Supabase's `auth`/`storage` schemas and roles are stubbed;
all SQL under test is the real project SQL. No live Supabase project or credentials were used.

## Passed

| Suite | Result |
|---|---|
| `scripts/ucms-qa.js`: JS syntax (30 files), i18n key resolution (static and dynamic), AR/TR parity, route targets (23 pages), asset paths (22 HTML files), secret scan, no Builder references, no Builder files, no commented-out executable code | 10/10 |
| Migration tests on an **existing deployment** (original 14 files incl. Builder, with data, then 007): 16 tables archived with identical row counts, 14 functions removed and nothing else, 40 shared policies / 13 triggers / indexes unchanged, shared data hash identical, RLS behavior identical, backup works, archive unreachable by anon/authenticated, idempotent, purge dry-run then purge | 25/25 |
| Migration tests, **fresh install** 001-006 (+seed) then 007: no Builder objects, backup works, 007 is a no-op | 7/7 |
| Defect reproduction: original v5 not installable without Builder; naive drop breaks original backup | 2/2 |
| Guard: foreign key from a non-Builder table aborts 007 and leaves the database unchanged | 2/2 |
| Privilege-escalation fix (008): exploit confirmed before, blocked after; legitimate admin/super_admin operations still work; multi-row statements rejected | 17/17 |
| **Total database tests** | **54/54** (the in-project `tests/` suite, fresh install and 008 only, is 24/24) |
| Measured per-role permission matrix (`tests/rbac-baseline.mjs`) | documented in docs/SECURITY.md |

Tests I corrected while writing them (reported for transparency): one assertion was vacuous (`|| true`) and one hard-coded `true`; both were replaced with real checks. A rule in 008 was found unreachable and removed.

## Not tested / limitations
- **Not run against a live Supabase project** (needs your credentials): RLS in Supabase's real `auth`/`storage` implementation, Storage API behavior (the media-deletion fix is code-reviewed only), Auth flows, password recovery.
- **Not tested:** the dashboard in a browser (login, navigation, every CRUD form, search, health page after migration, upload/replace/delete), responsive layouts, AR/TR/EN visual checks, HTML/CSS validation, CDN-failure behavior, production build (none exists; the site is static).
- **Not applicable yet (not built):** backend API tests, MySQL/SQLite/other adapters, custom-role permission tests, API security tests.
- Requires production deployment: GitHub Pages routing and certificate service checks.

---

# Phase 2 (V5/V6) pointer

The V5/V6 test results (RBAC, workflow, media protection, atomic restore,
dashboard fixes, UI smoke) live in **[docs/UCMS-TEST-REPORT.md](docs/UCMS-TEST-REPORT.md)**
with reproducible suites: `node scripts/ucms-qa.js .` and
`cd tests && npm run test:all` (102 assertions total, all executed and green).
