# Deployment

## 1. Database
Run the migrations in `docs/DATABASE.md` order. Create the first super_admin (README quick start). Disable public sign-ups.

## 2. Configuration
`cms-config.js` holds the Supabase URL and publishable key (`GDF_SUPABASE`, `GDF_VERIFY_SUPABASE`).
To manage certificates in the dashboard, both must point to the same project. No environment variables; static hosting.
Replace the `https://YOUR-DOMAIN.com` placeholders in page metadata, `sitemap.xml`, `robots.txt` and the `site.domain` setting.

## 3. GitHub Pages
Push the whole folder (including `images/`, `Videos/`, `assets/`, `vendor/`, `admin/`), then Settings > Pages > branch, `/ (root)`.
Clean routes are static directories (`<route>/index.html`); `admin/index.html` carries `<base href="../">` for project sites.
Never prefix local URLs with `/`.

| Legacy URL | Clean URL |
|---|---|
| `/admin.html` | `/admin/` |
| `/about-us.html` | `/about/` |
| `/applications.html` | `/applications/` |
| `/committees.html` | `/committees/` |
| `/committee-detail.html?id=...` | `/committee/?id=...` |
| `/certificate.html?id=...` | `/certificate/?id=...` |
| `/faq.html` | `/faq/` |
| `/message-from-president.html` | `/president/` |
| `/our-team.html` | `/team/` |
| `/verify.html` | `/verify/` |

## 4. Release checklist
- [ ] `node scripts/ucms-qa.js .` passes
- [ ] migrations 001-008 applied; `cd tests && npm test` passes against your SQL
- [ ] sign-in works; editor cannot open Users or write settings
- [ ] public EN/AR/TR pages render; media upload and backup work

## 5. Backup and recovery
Database: Supabase backups/PITR or `pg_dump`. Content: dashboard Backups & Restore (restore creates a safety backup first and never deletes rows absent from the snapshot; it is applied as separate upserts from the browser, so it is **not atomic**: if it fails midway, restore the safety backup).
Files: the `site-media` bucket is not included in content backups; export it separately.
