# Content Studio guide

Open `/admin/` and sign in. The EN / AR / TR pills switch the dashboard language (RTL for Arabic), independent of the public site.
Ctrl/Cmd+K searches website texts, team, sponsors, committees, FAQs and applications.

| Group | Pages |
|---|---|
| Overview | Dashboard; Website Health (connection, tables, columns, RPCs, storage, RLS, migrations) |
| Website | Header, Homepage, President, Footer, SEO, Global Website Settings (admin only) |
| Content | Applications, Certificates, Sponsors, About, Team, Committees, FAQs, Website Texts, Translations |
| Media | Media Library: upload, search, sort, copy URL, usage, rename, replace, delete |
| System | Audit Logs, Users & Roles, Permissions, Backups & Restore, Notifications |

**Media deletion** is blocked while content references the file or while usage could not be determined; replacing a file rewrites its
references. Deletion now verifies the object was really removed from storage and reports failure otherwise.
Limits: JPG/PNG/WebP up to 5 MB.

**Homepage marquee:** add, edit, remove, and reorder phrases, and choose the separator logo and animation duration in Homepage → Conference marquee. The logo separates each phrase. Use Sections & order to hide the marquee or change its position.

**Application deadlines:** each published form is hidden after its own closing date. Forms with later deadlines remain available until they close; after the last deadline, the forms list is removed from the page.

**Saving:** unsaved-changes badge, leave-page confirmation, explicit Saved/Failed state. Live preview shows unsaved edits.
**Users:** change roles or revoke staff access; accounts are created in Supabase Authentication. You cannot change your own role;
only a super_admin can manage super_admin accounts.
