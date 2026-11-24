# Architecture

## Layers

```
Public website (static HTML on GitHub Pages)  -- publishable key, RLS -->  Supabase project
Admin dashboard (/admin/, static JS)          -- user session, RLS ------>  (tables, storage, RPCs)
```

There is no application server: authorization is enforced by PostgreSQL Row Level Security,
storage policies and `security definer` functions. The dashboard UI mirrors permissions but never gates them.
The certificate verification pages use the connection `GDF_VERIFY_SUPABASE` (currently the same project).

## Public data flow

1. `cms-boot.js` (head) applies cached design tokens and hidden sections to avoid a flash.
2. `i18n.js` sets language/direction. `cms-public.js` loads `site_texts`, `page_sections`, `site_settings`
   and content tables, applies them to `[data-cms]` hooks and per-page SEO.
3. Every value falls back to the original HTML if the CMS is empty or unreachable.

## Dashboard modules (plain scripts, load order matters)

| File | Responsibility |
|---|---|
| `admin.js` | Supabase client, auth, UI kit, dirty tracking, save bars, navigation, router (`A.go`) |
| `admin/ucms-core.js` | audit log (`A.log`), notifications, global search (Ctrl/Cmd+K), health checks, capabilities (`A.can`) |
| `admin/pages-shared.js` | `sectionEditor`, `editorPage`, `sectionsManager`, `tableList` |
| `admin/pages-dashboard.js` | Dashboard, Website Health |
| `admin/pages-website.js` | Header, Homepage, President, Footer, SEO, Global Settings |
| `admin/pages-content.js` | Applications, Certificates, Sponsors, About, Team, Committees, FAQs, Texts, Translations |
| `admin/pages-system.js` | Audit Logs, Media Library, Users, Permissions, Backups, Notifications |
| `admin/boot.js` | starts the router after all modules register |

Navigation groups: Overview, Website, Content, Media, System.

## Saving model
Dirty tracking with unsaved-changes guard; save bars show Saving / Saved / Failed / Offline.
Saved content is live on the next public page load (no deploy step).
