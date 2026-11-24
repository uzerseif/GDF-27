# UCMS V5/V6 — Permissions

## Model

Four fixed roles (Super Admin, Admin, Publisher, Editor). Permissions are
**per module** and **configurable** in the dashboard (Permissions page, admins
only). Every permission is enforced **in PostgreSQL** on every query — a
permission change takes effect on the next query; sessions never need to be
refreshed for correctness.

Modules: `content` (committees, team, sponsors, FAQs, applications),
`certificates`, `texts` (site texts + page sections), `settings` (global
settings/design), `media`, `users` (admin users + the permission matrix),
`system` (backups, audit log, notifications).

Permission set per module: **View, Create, Edit, Delete, Publish, Manage**.

## Enforcement points

| Layer | Mechanism |
|---|---|
| Reads (staff) | RLS `staff read all` policies → `has_perm(module,'view')` |
| Creates | RLS `staff insert` → `has_perm(module,'create')` |
| Edits | RLS `staff update` → `has_perm(module,'edit')` |
| Deletes | RLS `staff delete` → `has_perm(module,'delete')` |
| Publishing | trigger `gate_publish_toggle` + `sync_content_status` → publish permission |
| Media deletion | storage delete policy → `media.delete` permission **and** server-side usage check |
| Settings writes | `has_perm('settings','manage')` |
| User/permission management | `has_perm('users','manage')` + migration 008 escalation guards |
| Backups/restore | `has_perm('system','manage')` |
| Audit log read | `has_perm('system','view')` |

## Factory defaults (seeded by 009; editable afterwards)

| Module | super_admin | admin | publisher | editor |
|---|---|---|---|---|
| content | all | all | VCED+P | VCED (no publish) |
| certificates | all | all | VCED+P | VCED (no publish) |
| texts | all | all | VCED+P | VCED (no publish) |
| settings | all | all | view only | view only |
| media | all | all | VCED+P | VCED (no publish) |
| users | all | all | view only | none |
| system | all | all | view only | view only |

Legend: V=view, C=create, E=edit, D=delete, P=publish. `manage` is true for
admin/super_admin on every module, false for publisher/editor.

## Hard rules (enforced in the database, migration 008 + 009/010)

1. Only a `super_admin` may create, change or remove a `super_admin` row.
2. Nobody may change their own role or delete their own staff row —
   therefore the last Super Admin can never remove themselves.
3. Editors cannot publish (or approve, or unpublish/archive) unless the
   publisher permission is explicitly granted on the Permissions page.
4. A caller without the publish permission always inserts drafts — sending
   `is_published=true` or `content_status='published'` is forced to draft.
5. Every change to `role_permissions` is audit-logged by a database trigger
   (`rbac.perms.insert/update/delete`) with the actor from the JWT.
6. Non-admins cannot write `role_permissions` at all (RLS denies; an attempt
   updates 0 rows).

## Content lifecycle (committees, sponsors, FAQs, applications)

```
draft → pending_review → approved → published → archived
        (editor)          (publisher) (publisher)  (publisher)
```

* Editors may move items between `draft` and `pending_review` only.
* Every transition into or out of `published` — and approvals — require the
  publish permission. `is_published` always follows `content_status`, so the
  public site (which reads `is_published`) never shows unapproved content.
* Other content tables (team, certificates, texts, sections) keep the classic
  `is_published` toggle, gated by the same publish permission.

## Version history & concurrent editing

* Every create/update of versioned content records a revision (actor, email,
  timestamp, full row). The last 50 versions per record are kept.
* "Restore" re-applies an older version; the current state is recorded as a
  new version first — history is never overwritten. Restoring across the
  publish boundary requires the publish permission.
* Optimistic concurrency: saves are sent with the `content_version` the
  editor saw. If another admin saved first, the save updates 0 rows and the
  dashboard reports the conflict instead of silently overwriting.

## Auditing of security events

`audit_logs` (append-only) records logins (`auth.login`), permission changes
(`rbac.perms.*`), content lifecycle changes, media operations (including
**denied** delete attempts), backups/restore, and errors. Ordinary admins can
read it; nobody can edit or delete it through the API (no update/delete
policies). Passwords and tokens are never logged — the audit writer only
stores action/resource/outcome metadata and emails come from JWT claims.
