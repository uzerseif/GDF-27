# GDF'27 — Website + Content Studio (CMS)

The public Gaziantep Diplomacy Forum 2027 website (static HTML/CSS/JS, EN/AR/TR) and its
Supabase-backed admin dashboard (**Content Studio**, `/admin/`). Builder Studio (the GrapesJS visual
builder) has been removed; see `database/documentation/builder-removal.md`.

| Document | Contents |
|---|---|
| [docs/CMS-GUIDE.md](docs/CMS-GUIDE.md) | Using the dashboard, page by page |
| [docs/UCMS-ARCHITECTURE.md](docs/UCMS-ARCHITECTURE.md) | V5/V6 modules, server-side building blocks, save flow |
| [docs/UCMS-PERMISSIONS.md](docs/UCMS-PERMISSIONS.md) | Per-module permission matrix, lifecycle, enforcement points |
| [docs/UCMS-SECURITY.md](docs/UCMS-SECURITY.md) | Measured enforcement matrix, hardening, security checklist |
| [docs/UCMS-OPERATIONS.md](docs/UCMS-OPERATIONS.md) | Deployment, backups/restore, users, QA runbook |
| [docs/UCMS-TEST-REPORT.md](docs/UCMS-TEST-REPORT.md) | Executed test results and limitations |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | (pre-V6) Frontend modules and data flow |
| [docs/DATABASE.md](docs/DATABASE.md) | Tables, RLS, storage, migration order |
| [docs/SECURITY.md](docs/SECURITY.md) | (pre-V6) Roles, what is enforced where |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup, GitHub Pages, backup and recovery |
| [docs/CERTIFICATES.md](docs/CERTIFICATES.md) | Certificate verification system |
| [database/documentation/builder-removal.md](database/documentation/builder-removal.md) | Safe Builder removal procedure |
| [AUDIT-REPORT.md](AUDIT-REPORT.md) / [TEST-REPORT.md](TEST-REPORT.md) | Phase-1 findings/fixes; phase-2 summary |

## Quick start (new Supabase project)

1. Supabase > SQL Editor, run in order: `database/migrations/001` ... `010` (see docs/DATABASE.md).
   Run `database/seed/seed-gdf.sql` once, after 002, on an empty project only.
2. Authentication > Users > Add user (Auto confirm), then in the SQL editor:
   `insert into public.admin_users (user_id, role) values ('USER-UID', 'super_admin');`
3. Turn off public sign-ups. Deploy the whole folder. Open `/admin/`.

Supabase URL and **publishable** key live in `cms-config.js`. Never put a service_role or secret key in a frontend file.

**Existing deployment (V4)?** Take a backup, deploy the updated files, then run
`009-rbac.sql` and `010-content-workflow.sql` in the SQL editor (additive,
idempotent). Review the Permissions page afterwards.

## Checks

```
node scripts/ucms-qa.js .        # static checks: syntax, i18n, routes, assets, secrets, removed-feature scan
cd tests && npm install && npm run test:all   # migrations + RBAC/workflow + UI smoke (real PostgreSQL + DOM)
```

## Layout

```
index.html, about/, team/ ...     public pages (clean routes; legacy *.html kept)
admin.html, admin/index.html      dashboard entry points
admin.js                          core: auth, UI kit, router
admin/ucms-core.js                audit log, notifications, search, health checks, capabilities
admin/pages-*.js                  dashboard modules (website, content, system, dashboard)
admin-i18n.js, admin-ucms-i18n.js dashboard strings (EN/AR/TR)
cms-config.js, cms-boot.js, cms-public.js   Supabase config and public-site CMS binding
database/                         migrations, seed, maintenance, documentation
vendor/                           pinned local libraries (jsPDF, html2canvas)
scripts/ucms-qa.js                static QA
tests/                            database migration tests
```

CDN dependencies: `@supabase/supabase-js@2.49.4` and Google Fonts. (GrapesJS, CodeMirror and JSZip are no longer used.)
