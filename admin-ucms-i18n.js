/* =====================================================================
   GDF'27 UCMS — interface strings for the new administrative surfaces.
   Deep-merged into window.ADMIN_I18N (admin-i18n.js) at load time.
   English is required; Arabic and Turkish fall back to English when empty.
   ===================================================================== */
(function () {
  "use strict";
  window.ADMIN_I18N = window.ADMIN_I18N || { en: {}, ar: {}, tr: {} };
  var EN = {
    "role.super_admin": "Super Admin", "role.publisher": "Publisher",
    "ucms.group.overview": "Overview", "ucms.group.website": "Website Management",
    "ucms.group.content": "Content Management",
    "ucms.group.media": "Media Library", "ucms.group.system": "System Administration",
    "nav.group.overview": "Overview", "nav.group.website": "Website Management",
    "nav.group.content": "Content",
    "nav.group.media": "Media", "nav.group.system": "System",
    "ucms.nav.activity": "Recent Activity", "ucms.nav.health": "Website Health",
"ucms.nav.seo": "SEO",
    "ucms.nav.settings": "Global Website Settings", "ucms.nav.translations": "Translations",
"ucms.nav.users": "Users & Roles",
    "ucms.nav.permissions": "Permissions", "ucms.nav.audit": "Audit Logs",
    "ucms.nav.backups": "Backups & Restore", "ucms.nav.notifications": "Notifications",
    "ucms.nav.mediaUsage": "Media Usage",
    "ucms.dash.title": "Welcome back", "ucms.dash.sub": "Everything on the GDF'27 website, in one place.",
    "ucms.dash.stats": "Website statistics", "ucms.dash.activity": "Recent activity",
    "ucms.dash.health": "Website health", "ucms.dash.quick": "Quick actions",

    "ucms.dash.media": "Media files", "ucms.dash.members": "Team members",
    "ucms.dash.sponsors": "Sponsors", "ucms.dash.committees": "Committees",
    "ucms.dash.apps": "Application forms", "ucms.dash.faqs": "FAQs",
    "ucms.dash.textsEdited": "Edited texts",
"ucms.dash.qaHome": "Edit Homepage",
    "ucms.dash.qaMedia": "Upload Media",
    "ucms.dash.qaPreview": "Preview Website", "ucms.dash.qaUsers": "Manage Users",
    "ucms.dash.noActivity": "No activity recorded yet. Administrative actions will appear here.",
    "ucms.dash.activityHint": "From the audit log. Every administrative operation is recorded with its actor and outcome.",
    "ucms.health.title": "Website health", "ucms.health.sub": "Live status of the services this website depends on.",
    "ucms.health.lastRun": "Last checked", "ucms.health.rerun": "Check again",
    "ucms.health.ok": "Healthy", "ucms.health.warn": "Warning", "ucms.health.error": "Error",
    "ucms.health.unknown": "Unknown",
    "ucms.health.auth": "Authentication", "ucms.health.authOk": "Signed in",
    "ucms.health.db": "Database", "ucms.health.dbOk": "Responding",
    "ucms.health.storage": "Storage (site-media bucket)", "ucms.health.storageOk": "Reachable",
    "ucms.health.deps": "Required libraries", "ucms.health.depsOk": "All loaded",
    "ucms.health.depsMissing": "Not loaded",
    "ucms.health.migrations": "Migrations", "ucms.health.migrationsOk": "CMS tables present",
    "ucms.health.migrationsMissing": "Run the migrations in database/migrations (001-008)",
    "ucms.health.publish": "Publishing", "ucms.health.publishDetail": "published / total pages",
    "ucms.health.errors": "Recent errors", "ucms.health.errorsOk": "No recent failures",
    "ucms.health.errorsSome": "recent failed operations",
    "ucms.health.certProject": "Certificate service", "ucms.health.certOk": "Configured (separate Supabase project)",
    "ucms.health.certMissing": "verify-common.js has no Supabase URL",
    "ucms.health.dbTitle": "Database diagnostics", "ucms.health.dbSub": "Tables, columns, RPC functions, storage, RLS behaviour and applied migrations.",
    "ucms.health.gConn": "Connection", "ucms.health.gTables": "Required tables", "ucms.health.gColumns": "Required columns",
    "ucms.health.gRpc": "RPC functions", "ucms.health.gStorage": "Storage", "ucms.health.gRls": "Row Level Security",
    "ucms.health.gMigrations": "Migrations", "ucms.health.gStatus": "Status",
    "ucms.health.dbMissing": "Table missing — run the SQL migration",
    "ucms.health.rpcOk": "Responding",
    "ucms.health.missing": "Missing", "ucms.health.migration": "Migration Required",
    "ucms.health.permission": "Permission Error", "ucms.health.fail": "Connection Failed",
    "ucms.health.rlsPublicRead": "Anonymous can read CMS content", "ucms.health.rlsStaffHidden": "Staff rows hidden from anonymous",
    "ucms.health.rlsNoAnonWrite": "Anonymous writes rejected", "ucms.health.rlsBlocked": "Blocked (RLS active)",
    "ucms.health.rlsLeak": "Unexpected rows visible — review the RLS policies!",
    "err.network": "Network", "err.auth": "Auth / permission", "err.database": "Database",
    "err.validation": "Validation", "err.runtime": "Application error",
    "msg.corePartial": "Some CMS data could not be loaded — parts of the website may show defaults until this is fixed.",
    "ucms.activity.title": "Recent activity",
    "ucms.activity.sub": "Every administrative operation, with actor, resource and outcome.",
    "ucms.activity.empty": "No entries match the current filters.",
    "ucms.activity.filterAction": "Action", "ucms.activity.filterUser": "User",
    "ucms.activity.filterResource": "Resource", "ucms.activity.filterOutcome": "Outcome",
    "ucms.activity.from": "From", "ucms.activity.to": "To", "ucms.activity.all": "All",
    "ucms.activity.actor": "Actor", "ucms.activity.action": "Action",
    "ucms.activity.resource": "Resource", "ucms.activity.time": "Time",
    "ucms.activity.outcome": "Outcome", "ucms.activity.loadMore": "Load more",
    "ucms.activity.meta": "Details", "ucms.activity.allUsers": "All users",
    "ucms.activity.allOutcomes": "All outcomes", "ucms.activity.allResources": "All resources",











"ucms.pages.publishNote": "Publishing stores the document and a release snapshot in the database. The public GDF'27 pages are static files deployed to GitHub Pages; database publishing does not redeploy them automatically.",

    "ucms.seo.title": "SEO management", "ucms.seo.sub": "Page-level metadata. Values are applied to the public pages after they load; the original HTML stays the fallback.",
    "ucms.seo.page": "Page", "ucms.seo.seoTitle": "SEO title",
    "ucms.seo.seoDesc": "Meta description", "ucms.seo.canonical": "Canonical URL",
    "ucms.seo.ogTitle": "Open Graph title", "ucms.seo.ogDesc": "Open Graph description",
    "ucms.seo.ogImage": "Open Graph image", "ucms.seo.robots": "Robots directive",
    "ucms.seo.robotsHelp": "index, noindex, follow, nofollow…",
    "ucms.seo.preview": "Search result preview", "ucms.seo.saved": "SEO settings saved",
    "ucms.seo.titleLong": "Title is longer than 60 characters — it may be truncated in search results.",
    "ucms.seo.descLong": "Description is longer than 160 characters — it may be truncated.",
    "ucms.seo.robotsInvalid": "Robots directive may only contain index/noindex/follow/nofollow/none.",
    "ucms.settings.title": "Global website settings", "ucms.settings.sub": "Low-level key/value settings (countdown date, domain, branding). Administrators only.",
    "ucms.settings.key": "Key", "ucms.settings.value": "Value (JSON)", "ucms.settings.label": "Label",
    "ucms.settings.updated": "Updated", "ucms.settings.invalidJson": "The value is not valid JSON.",
    "ucms.settings.adminOnly": "Only administrators can change these settings.",
    "ucms.translations.title": "Translations", "ucms.translations.sub": "Coverage of the website texts in Arabic and Turkish, plus the dashboard interface translations.",
    "ucms.translations.public": "Public website texts", "ucms.translations.admin": "Admin interface",
    "ucms.translations.lang": "Language", "ucms.translations.coverage": "Coverage",
    "ucms.translations.missing": "Missing", "ucms.translations.of": "of",
    "ucms.translations.builtin": "Built-in dictionary", "ucms.translations.cms": "CMS overrides",
    "ucms.translations.goTexts": "Open Website Texts", "ucms.translations.complete": "Complete",













    "ucms.media.title": "Media Library", "ucms.media.usage": "Usage",
    "ucms.media.usedIn": "Used in", "ucms.media.unknown": "Unknown",
    "ucms.media.unknownHelp": "Some reference checks failed, so usage cannot be proven. Deletion stays blocked until the checks pass.",
    "ucms.media.unused": "No references found", "ucms.media.noRefs": "This file has no recorded references.",
    "ucms.media.refsFailed": "reference checks failed", "ucms.media.rename": "Rename",
    "ucms.media.newName": "New name", "ucms.media.renamed": "File renamed",
    "ucms.media.replace": "Replace file", "ucms.media.replaced": "File replaced and references updated",
    "ucms.media.deleteBlocked": "This file is referenced by existing content. Update or remove those references first, or use Replace file.",
    "ucms.media.deleteFailed": "The file could not be deleted from storage (it is still there). Check your permissions and try again.",
    "ucms.media.typeImages": "Images", "ucms.media.typeAll": "All files",
    "ucms.media.docsNote": "The site-media bucket accepts JPG, PNG and WebP images only (SVG and documents are blocked because SVG can carry scripts). Document hosting is not available.",
    "ucms.media.sortName": "Name", "ucms.media.sortDate": "Upload date", "ucms.media.sortSize": "Size",
    "ucms.media.search": "Search files…", "ucms.media.count": "files",
    "ucms.users.title": "Users & Roles", "ucms.users.sub": "Administrative accounts and their roles. Role changes take effect on the user's next sign-in.",
    "ucms.users.name": "Display name", "ucms.users.role": "Role", "ucms.users.created": "Added", "ucms.users.lastLogin": "Last sign-in",
    "ucms.users.notAvailable": "Not visible to the admin dashboard (stored in the auth service)",
    "ucms.users.invite": "Add administrator", "ucms.users.inviteHelp": "Accounts are created in Supabase Authentication (no password is ever stored in this dashboard). Follow these steps:",
    "ucms.users.inviteStep1": "1. Supabase Dashboard → Authentication → Users → Add user (tick “Auto confirm”).",
    "ucms.users.inviteStep2": "2. Copy the new user's UID and run this in the SQL editor:",
    "ucms.users.changeRole": "Change role", "ucms.users.revoke": "Revoke access",
    "ucms.users.revokeConfirm": "Revoke administrative access for this user? They will keep their auth account but lose all dashboard rights.",
    "ucms.users.selfRole": "You cannot change your own role.",
    "ucms.users.selfRevoke": "You cannot revoke your own access.",
    "ucms.users.lastAction": "Last recorded action",
    "ucms.users.noLastAction": "None recorded",
    "ucms.users.adminOnly": "Only administrators can manage users.",
    "ucms.perms.title": "Permissions", "ucms.perms.sub": "What each role may do. Enforced by Row Level Security in the database, not just hidden in the interface.",
    "ucms.perms.cap": "Capability", "ucms.perms.enforcedBy": "Enforced by",
    "ucms.perms.rls": "RLS policy", "ucms.perms.rpc": "RPC check",
    "ucms.perms.ui": "Interface only",
    "ucms.perms.capContent": "Edit website content (texts, sections, lists)",
    "ucms.perms.capMedia": "Upload and manage media",
    "ucms.perms.capDesign": "Design tokens & global settings",

    "ucms.perms.capUsers": "Manage users and roles",
    "ucms.perms.capBackups": "Create and restore backups",
    "ucms.perms.capAudit": "Read audit logs",
    "ucms.audit.title": "Audit logs", "ucms.audit.sub": "Append-only records of administrative operations. Logs cannot be edited or deleted from the dashboard.",
    "ucms.audit.detail": "Details",
    "ucms.backups.title": "Backups & Restore", "ucms.backups.sub": "Point-in-time snapshots of all website content (database records). Storage media files are referenced by URL and are not copied into the backup.",
    "ucms.backups.create": "Create backup", "ucms.backups.label": "Label",
    "ucms.backups.labelPh": "e.g. Before homepage redesign",
    "ucms.backups.created": "Backup created",
    "ucms.backups.empty": "No backups yet.",
    "ucms.backups.download": "Download JSON",
    "ucms.backups.restore": "Restore…",
    "ucms.backups.restoreWarn": "Restoring overwrites the current content with the backup snapshot. A safety backup of the current state is created first. Media files already uploaded are not deleted.",
    "ucms.backups.confirmRestore": "Restore this backup now?",
    "ucms.backups.restored": "Content restored from backup",
    "ucms.backups.checkpoint": "Safety backup created before restoring",
    "ucms.backups.stats": "Records",
    "ucms.backups.createdBy": "Created",
    "ucms.backups.failed": "Backup failed",
    "ucms.notif.title": "Notifications", "ucms.notif.markAll": "Mark all as read",
    "ucms.notif.empty": "No notifications.", "ucms.notif.unread": "unread",
    "ucms.notif.openAll": "View all",
    "ucms.search.placeholder": "Search pages, content, media…",
    "ucms.search.title": "Search", "ucms.search.empty": "No results.",
    "ucms.search.hint": "Ctrl/⌘ + K",
"ucms.search.groupTexts": "Website texts",
    "ucms.search.groupContent": "Content records", "ucms.search.groupMedia": "Media",
    "ucms.save.saving": "Saving…", "ucms.save.saved": "Saved", "ucms.save.failed": "Save failed",
    "ucms.save.unsaved": "Unsaved changes", "ucms.save.offline": "Offline — changes not saved",
    "ucms.save.autosaved": "Autosaved", "ucms.save.autosaveOn": "Autosave on",
    "hdr.position": "Header behavior", "hdr.positionOver": "Over hero", "hdr.positionStatic": "Normal flow", "hdr.positionSticky": "Sticky while scrolling", "hdr.positionFixed": "Fixed on screen",
    "hdr.width": "Header width", "hdr.widthContained": "Contained", "hdr.widthFull": "Full width", "hdr.widthInset": "Inset from edges",
    "hdr.alignment": "Header alignment", "hdr.alignBetween": "Logo left · links right", "hdr.alignLeft": "Logo and links aligned left", "hdr.alignCenter": "Centered", "hdr.alignRight": "Logo right · links left",
    "hdr.navGap": "Spacing between navigation items", "hdr.logoGap": "Logo / brand spacing", "hdr.navPadding": "Navigation bar padding", "hdr.top": "Header top distance", "hdr.radius": "Navigation corner radius",
    "hdr.background": "Navigation background", "hdr.text": "Navigation text", "hdr.hideScroll": "Hide header while scrolling down",
    "hero.bgType": "Hero background type", "hero.bgNone": "No background", "hero.bgImage": "Image", "hero.bgVideo": "Video",
    "hero.bgImageUrl": "Hero background image", "hero.bgVideoUrl": "Hero background video", "hero.bgPosition": "Background position", "hero.bgSize": "Background size",
    "hero.bgCover": "Cover", "hero.bgContain": "Contain", "hero.bgStretch": "Stretch", "hero.heroHeight": "Hero minimum height", "hero.contentWidth": "Content maximum width",
    "hero.contentAlign": "Desktop content alignment", "hero.mobileContentAlign": "Tablet and mobile alignment",
    "hero.alignStart": "Start (follows language direction)", "hero.alignEnd": "End (follows language direction)",
    "hero.contentGap": "Spacing between hero elements",
    "nav.certificates": "Certificates",
    "cert.title": "Certificates", "cert.new": "Add certificate", "cert.import": "Import CSV", "cert.search": "Search certificates…",
    "cert.importing": "Importing CSV…",
    "cert.csvHelp": "CSV headers: certificate_id, recipient_name (required); course_name, committee_name, conference_name, represented_country, performance_summary, certificate_type, certificate_image, issue_date, status (optional). Dates: YYYY-MM-DD. Status: valid, revoked, expired.",
    "cert.csvInvalid": "CSV import failed: %s", "cert.csvReadError": "Could not read the CSV file.",
    "cert.csvImported": "Imported %d certificate(s).", "cert.csvEmpty": "The CSV contains no certificate rows.",
    "cert.csvMissingHeaders": "The CSV must include certificate_id and recipient_name headers.",
    "cert.csvDuplicateHeader": "Duplicate CSV header: %s.", "cert.csvMalformed": "Malformed CSV near line %d.",
    "cert.csvRowColumns": "Row %d has more columns than the header.", "cert.csvRequired": "Row %d needs a certificate ID and recipient name.",
    "cert.csvDuplicateId": "Row %d repeats a certificate ID in this file.", "cert.csvDate": "Row %d has an invalid issue_date; use YYYY-MM-DD.",
    "cert.csvStatus": "Row %d has an invalid status.", "cert.csvImage": "Row %d has an invalid certificate image URL.",
    "cert.id": "Certificate ID", "cert.recipient": "Recipient / delegate name", "cert.course": "Course",
    "cert.committee": "Committee", "cert.conference": "Conference", "cert.country": "Represented country",
    "cert.summary": "Performance summary", "cert.type": "Certificate type", "cert.image": "Certificate image",
    "cert.date": "Issue date", "cert.status": "Status", "cert.statusValid": "Valid",
    "cert.statusRevoked": "Revoked", "cert.statusExpired": "Expired",
    "cert.sameProject": "Certificate management requires the certificate and CMS URLs to use the same Supabase project.",



















    "ucms.confirm.publish": "Publish", "ucms.confirm.restore": "Restore",
    "ucms.common.none": "None", "ucms.common.unknownShort": "?",
    "ucms.common.current": "Current",

    /* V5: workflow lifecycle */
    "wf.status": "Status",
    "wf.draft": "Draft", "wf.pending_review": "Pending review",
    "wf.approved": "Approved", "wf.published": "Published", "wf.archived": "Archived",
    "wf.locked": "read-only for your role",
    "wf.versions": "Versions", "wf.noVersions": "No versions recorded yet.",
    "wf.versionN": "Version %d",
    "wf.created": "Created", "wf.saved": "Edited", "wf.restored": "Restored",
    "wf.restore": "Restore this version",
    "wf.confirmRestore": "Restore version %d? The current state is kept as a new version first.",
    "wf.restoredMsg": "Version %d restored",
    "wf.conflict": "This item was changed by someone else while you were editing. Your save was cancelled — please review and try again.",

    /* V5: permissions matrix */
    "ucms.perms.intro": "Every permission is enforced in the database on every query. Changes here take effect immediately — sessions do not need to be refreshed.",
    "ucms.perms.readonly": "Only administrators can change the permission matrix.",
    "ucms.perms.saved": "Permissions saved",
    "ucms.perms.module": "Module",
    "ucms.perms.module.content": "Content (committees, team, sponsors, FAQs, applications)",
    "ucms.perms.module.certificates": "Certificates",
    "ucms.perms.module.texts": "Website texts & sections",
    "ucms.perms.module.settings": "Global settings & design",
    "ucms.perms.module.media": "Media library",
    "ucms.perms.module.users": "Users & permissions",
    "ucms.perms.module.system": "System (backups, audit log, notifications)",
    "ucms.perms.view": "View", "ucms.perms.create": "Create", "ucms.perms.edit": "Edit",
    "ucms.perms.del": "Delete", "ucms.perms.publish": "Publish", "ucms.perms.manage": "Manage",
    "ucms.perms.viewDesc": "Open and read pages or records",
    "ucms.perms.createDesc": "Add a new record or item",
    "ucms.perms.editDesc": "Change existing content",
    "ucms.perms.delDesc": "Permanently remove content",
    "ucms.perms.publishDesc": "Approve and publish to the public website",
    "ucms.perms.manageDesc": "Change advanced settings and administration",

    /* V5: audit export, media bulk + server check, dashboard extras */
    "ucms.audit.export": "Export CSV", "ucms.audit.exported": "Exported %d entries",
    "ucms.media.uploadMany": "Upload files",
    "ucms.media.uploadedMany": "Uploaded %d file(s)%f",
    "ucms.media.bulkDelete": "Delete selected",
    "ucms.media.deleteBlockedBy": "Deletion blocked: this file is referenced by content (verified on the server).",
    "md.select": "Select file",
    "ucms.dash.unpublished": "%d unpublished item(s)",
    "ucms.dash.staff": "%d staff account(s)",
    "ucms.dash.certs": "Certificates: %d / %t valid",
    "ucms.search.groupCertificates": "Certificates",
    "ucms.users.neverLogin": "never signed in"
  };
  var AR = {
    "role.super_admin": "مدير أعلى", "role.publisher": "ناشر",
    "ucms.group.overview": "نظرة عامة", "ucms.group.website": "إدارة الموقع",
    "ucms.group.content": "إدارة المحتوى",
    "ucms.group.media": "مكتبة الوسائط", "ucms.group.system": "إدارة النظام",
    "nav.group.overview": "نظرة عامة", "nav.group.website": "إدارة الموقع",
    "nav.group.content": "المحتوى",
    "nav.group.media": "الوسائط", "nav.group.system": "النظام",
    "ucms.nav.activity": "النشاط الأخير", "ucms.nav.health": "صحة الموقع",
"ucms.nav.seo": "تحسين محركات البحث",
    "ucms.nav.settings": "إعدادات الموقع العامة", "ucms.nav.translations": "الترجمات",
"ucms.nav.users": "المستخدمون والأدوار",
    "ucms.nav.permissions": "الصلاحيات", "ucms.nav.audit": "سجلات التدقيق",
    "ucms.nav.backups": "النسخ الاحتياطي والاستعادة", "ucms.nav.notifications": "الإشعارات",
    "ucms.nav.mediaUsage": "استخدام الوسائط",
    "ucms.dash.title": "مرحباً بعودتك", "ucms.dash.sub": "كل ما يخص موقع GDF'27 في مكان واحد.",
    "ucms.dash.stats": "إحصاءات الموقع", "ucms.dash.activity": "النشاط الأخير",
    "ucms.dash.health": "صحة الموقع", "ucms.dash.quick": "إجراءات سريعة",

    "ucms.dash.media": "ملفات الوسائط", "ucms.dash.members": "أعضاء الفريق",
    "ucms.dash.sponsors": "الرعاة", "ucms.dash.committees": "اللجان",
    "ucms.dash.apps": "نماذج التقديم", "ucms.dash.faqs": "الأسئلة الشائعة",
    "ucms.dash.textsEdited": "نصوص معدّلة",
"ucms.dash.qaHome": "تحرير الصفحة الرئيسية",
    "ucms.dash.qaMedia": "رفع وسائط",
    "ucms.dash.qaPreview": "معاينة الموقع", "ucms.dash.qaUsers": "إدارة المستخدمين",
    "ucms.dash.noActivity": "لا يوجد نشاط مسجّل بعد. ستظهر العمليات الإدارية هنا.",
    "ucms.dash.activityHint": "من سجل التدقيق. تُسجّل كل عملية إدارية مع منفّذها ونتيجتها.",
    "ucms.health.title": "صحة الموقع", "ucms.health.sub": "الحالة الفعلية للخدمات التي يعتمد عليها الموقع.",
    "ucms.health.lastRun": "آخر فحص", "ucms.health.rerun": "إعادة الفحص",
    "ucms.health.ok": "سليم", "ucms.health.warn": "تحذير", "ucms.health.error": "خطأ",
    "ucms.health.unknown": "غير معروف",
    "ucms.health.auth": "المصادقة", "ucms.health.authOk": "مسجّل الدخول",
    "ucms.health.db": "قاعدة البيانات", "ucms.health.dbOk": "تستجيب",
    "ucms.health.storage": "التخزين (حاوية site-media)", "ucms.health.storageOk": "متاح",
    "ucms.health.deps": "المكتبات المطلوبة", "ucms.health.depsOk": "كلها محمّلة",
    "ucms.health.depsMissing": "غير محمّلة",
    "ucms.health.migrations": "الترحيلات", "ucms.health.migrationsOk": "جداول النظام موجودة",
    "ucms.health.migrationsMissing": "شغّل الترحيلات في database/migrations (001-008)",
    "ucms.health.publish": "النشر", "ucms.health.publishDetail": "منشورة / إجمالي الصفحات",
    "ucms.health.errors": "الأخطاء الأخيرة", "ucms.health.errorsOk": "لا إخفاقات حديثة",
    "ucms.health.errorsSome": "عمليات فاشلة حديثة",
    "ucms.health.certProject": "خدمة الشهادات", "ucms.health.certOk": "مضبوطة (مشروع Supabase منفصل)",
    "ucms.health.certMissing": "verify-common.js بلا عنوان Supabase",
    "ucms.health.dbTitle": "تشخيص قاعدة البيانات", "ucms.health.dbSub": "الجداول والأعمدة ودوال RPC والتخزين وسلوك RLS والترحيلات المطبّقة.",
    "ucms.health.gConn": "الاتصال", "ucms.health.gTables": "الجداول المطلوبة", "ucms.health.gColumns": "الأعمدة المطلوبة",
    "ucms.health.gRpc": "دوال RPC", "ucms.health.gStorage": "التخزين", "ucms.health.gRls": "أمان الصفوف (RLS)",
    "ucms.health.gMigrations": "الترحيلات", "ucms.health.gStatus": "الحالة",
    "ucms.health.dbMissing": "الجدول غير موجود — نفّذ ترحيل SQL",
    "ucms.health.rpcOk": "يستجيب",
    "ucms.health.missing": "مفقود", "ucms.health.migration": "يلزم ترحيل",
    "ucms.health.permission": "خطأ صلاحيات", "ucms.health.fail": "فشل الاتصال",
    "ucms.health.rlsPublicRead": "الزائر يقرأ محتوى CMS", "ucms.health.rlsStaffHidden": "صفوف الطاقم مخفية عن الزائر",
    "ucms.health.rlsNoAnonWrite": "كتابة الزائر مرفوضة", "ucms.health.rlsBlocked": "محجوب (RLS يعمل)",
    "ucms.health.rlsLeak": "صفوف غير متوقعة ظاهرة — راجع سياسات RLS!",
    "err.network": "الشبكة", "err.auth": "المصادقة / الصلاحيات", "err.database": "قاعدة البيانات",
    "err.validation": "التحقق", "err.runtime": "خطأ في التطبيق",
    "msg.corePartial": "تعذّر تحميل بعض بيانات CMS — قد تعرض أجزاء الموقع النصوص الافتراضية حتى تُعالج المشكلة.",
    "ucms.activity.title": "النشاط الأخير",
    "ucms.activity.sub": "كل عملية إدارية مع المنفّذ والمورد والنتيجة.",
    "ucms.activity.empty": "لا توجد سجلات مطابقة للتصفية الحالية.",
    "ucms.activity.filterAction": "الإجراء", "ucms.activity.filterUser": "المستخدم",
    "ucms.activity.filterResource": "المورد", "ucms.activity.filterOutcome": "النتيجة",
    "ucms.activity.from": "من", "ucms.activity.to": "إلى", "ucms.activity.all": "الكل",
    "ucms.activity.actor": "المنفّذ", "ucms.activity.action": "الإجراء",
    "ucms.activity.resource": "المورد", "ucms.activity.time": "الوقت",
    "ucms.activity.outcome": "النتيجة", "ucms.activity.loadMore": "تحميل المزيد",
    "ucms.activity.meta": "التفاصيل", "ucms.activity.allUsers": "كل المستخدمين",
    "ucms.activity.allOutcomes": "كل النتائج", "ucms.activity.allResources": "كل الموارد",











"ucms.pages.publishNote": "النشر يحفظ المستند ويلتقط إصداراً في قاعدة البيانات. صفحات GDF'27 العامة ملفات ثابتة على GitHub Pages؛ والنشر إلى قاعدة البيانات لا يعيد نشرها تلقائياً.",

    "ucms.seo.title": "إدارة SEO", "ucms.seo.sub": "بيانات وصفية لكل صفحة. تُطبّق على الصفحات العامة بعد تحميلها، وتبقى HTML الأصلية خياراً احتياطياً.",
    "ucms.seo.page": "الصفحة", "ucms.seo.seoTitle": "عنوان SEO",
    "ucms.seo.seoDesc": "وصف الصفحة", "ucms.seo.canonical": "الرابط الأساسي",
    "ucms.seo.ogTitle": "عنوان Open Graph", "ucms.seo.ogDesc": "وصف Open Graph",
    "ucms.seo.ogImage": "صورة Open Graph", "ucms.seo.robots": "توجيه الروبوتات",
    "ucms.seo.robotsHelp": "index، noindex، follow، nofollow…",
    "ucms.seo.preview": "معاينة نتيجة البحث", "ucms.seo.saved": "حُفظت إعدادات SEO",
    "ucms.seo.titleLong": "العنوان أطول من 60 حرفاً — قد يُقتَطع في نتائج البحث.",
    "ucms.seo.descLong": "الوصف أطول من 160 حرفاً — قد يُقتَطع.",
    "ucms.seo.robotsInvalid": "توجيه الروبوتات يقبل index/noindex/follow/nofollow/none فقط.",
    "ucms.settings.title": "إعدادات الموقع العامة", "ucms.settings.sub": "إعدادات أساسية (مؤقت العد التنازلي، النطاق، الهوية). للمدراء فقط.",
    "ucms.settings.key": "المفتاح", "ucms.settings.value": "القيمة (JSON)", "ucms.settings.label": "التسمية",
    "ucms.settings.updated": "آخر تحديث", "ucms.settings.invalidJson": "القيمة ليست JSON صالحاً.",
    "ucms.settings.adminOnly": "المدراء فقط يمكنهم تغيير هذه الإعدادات.",
    "ucms.translations.title": "الترجمات", "ucms.translations.sub": "تغطية نصوص الموقع بالعربية والتركية، وترجمات واجهة لوحة التحكم.",
    "ucms.translations.public": "نصوص الموقع العامة", "ucms.translations.admin": "واجهة الإدارة",
    "ucms.translations.lang": "اللغة", "ucms.translations.coverage": "التغطية",
    "ucms.translations.missing": "ناقصة", "ucms.translations.of": "من",
    "ucms.translations.builtin": "القاموس المدمج", "ucms.translations.cms": "تجاوزات النظام",
    "ucms.translations.goTexts": "فتح نصوص الموقع", "ucms.translations.complete": "مكتملة",













    "ucms.media.title": "مكتبة الوسائط", "ucms.media.usage": "الاستخدام",
    "ucms.media.usedIn": "مستخدم في", "ucms.media.unknown": "غير معروف",
    "ucms.media.unknownHelp": "تعذّر إتمام بعض فحوص المراجع، لذا لا يمكن إثبات الاستخدام. يبقى الحذف محظوراً حتى نجاح الفحوص.",
    "ucms.media.unused": "لا مراجع", "ucms.media.noRefs": "لا توجد مراجع مسجلة لهذا الملف.",
    "ucms.media.refsFailed": "فحوص مراجع فشلت", "ucms.media.rename": "إعادة تسمية",
    "ucms.media.newName": "الاسم الجديد", "ucms.media.renamed": "أُعيدت تسمية الملف",
    "ucms.media.replace": "استبدال الملف", "ucms.media.replaced": "استُبدل الملف وحُدّثت المراجع",
    "ucms.media.deleteBlocked": "هذا الملف مشار إليه في محتوى قائم. حدّث أو احذف المراجع أولاً، أو استخدم استبدال الملف.",
    "ucms.media.deleteFailed": "تعذّر حذف الملف من التخزين (ما زال موجودًا). تحقق من صلاحياتك وحاول مجددًا.",
    "ucms.media.typeImages": "الصور", "ucms.media.typeAll": "كل الملفات",
    "ucms.media.docsNote": "حاوية site-media تقبل صور JPG وPNG وWebP فقط (يُحجب SVG والمستندات لأن SVG قد يحمل برمجيات). لا يتوفر استضافة مستندات.",
    "ucms.media.sortName": "الاسم", "ucms.media.sortDate": "تاريخ الرفع", "ucms.media.sortSize": "الحجم",
    "ucms.media.search": "ابحث في الملفات…", "ucms.media.count": "ملف",
    "ucms.users.title": "المستخدمون والأدوار", "ucms.users.sub": "الحسابات الإدارية وأدوارها. تفعّل تغييرات الدور عند تسجيل المستخدم الدخول لاحقاً.",
    "ucms.users.name": "اسم المستخدم", "ucms.users.role": "الدور", "ucms.users.created": "أُضيف", "ucms.users.lastLogin": "آخر دخول",
    "ucms.users.notAvailable": "غير مرئية للوحة التحكم (محفوظة في خدمة المصادقة)",
    "ucms.users.invite": "إضافة مدير", "ucms.users.inviteHelp": "تُنشأ الحسابات في Supabase Authentication (لا تُخزَّن كلمات المرور هنا أبداً). اتبع الخطوات:",
    "ucms.users.inviteStep1": "1. لوحة Supabase ← Authentication ← Users ← Add user (فعّل «Auto confirm»).",
    "ucms.users.inviteStep2": "2. انسخ معرّف المستخدم UID وشغّل هذا في محرر SQL:",
    "ucms.users.changeRole": "تغيير الدور", "ucms.users.revoke": "سحب الوصول",
    "ucms.users.revokeConfirm": "سحب الوصول الإداري من هذا المستخدم؟ سيبقى حسابه في المصادقة لكنه يفقد كل صلاحيات اللوحة.",
    "ucms.users.selfRole": "لا يمكنك تغيير دورك الخاص.",
    "ucms.users.selfRevoke": "لا يمكنك سحب وصولك الخاص.",
    "ucms.users.lastAction": "آخر إجراء مسجّل",
    "ucms.users.noLastAction": "لا شيء مسجّل",
    "ucms.users.adminOnly": "المدراء فقط يمكنهم إدارة المستخدمين.",
    "ucms.perms.title": "الصلاحيات", "ucms.perms.sub": "ما يسمح به كل دور. مفروضة عبر Row Level Security في قاعدة البيانات، لا مجرد إخفاء في الواجهة.",
    "ucms.perms.cap": "القدرة", "ucms.perms.enforcedBy": "آلية الفرض",
    "ucms.perms.rls": "سياسة RLS", "ucms.perms.rpc": "تحقق في RPC",
    "ucms.perms.ui": "الواجهة فقط",
    "ucms.perms.capContent": "تحرير محتوى الموقع (نصوص، أقسام، قوائم)",
    "ucms.perms.capMedia": "رفع الوسائط وإدارتها",
    "ucms.perms.capDesign": "رموز التصميم والإعدادات العامة",

    "ucms.perms.capUsers": "إدارة المستخدمين والأدوار",
    "ucms.perms.capBackups": "إنشاء النسخ الاحتياطية واستعادتها",
    "ucms.perms.capAudit": "قراءة سجلات التدقيق",
    "ucms.audit.title": "سجلات التدقيق", "ucms.audit.sub": "سجلات للقراءة فقط لكل العمليات الإدارية. لا يمكن تعديلها أو حذفها من اللوحة.",
    "ucms.audit.detail": "التفاصيل",
    "ucms.backups.title": "النسخ الاحتياطي والاستعادة", "ucms.backups.sub": "لقطات زمنية لكل محتوى الموقع (سجلات قاعدة البيانات). ملفات الوسائط تُشار بالروابط ولا تُنسخ داخل النسخة الاحتياطية.",
    "ucms.backups.create": "إنشاء نسخة", "ucms.backups.label": "التسمية",
    "ucms.backups.labelPh": "مثال: قبل إعادة تصميم الرئيسية",
    "ucms.backups.created": "أُنشئت النسخة الاحتياطية",
    "ucms.backups.empty": "لا نسخ بعد.",
    "ucms.backups.download": "تنزيل JSON",
    "ucms.backups.restore": "استعادة…",
    "ucms.backups.restoreWarn": "الاستعادة تستبدل المحتوى الحالي بلقطة النسخة الاحتياطية. تُنشأ أولاً نسخة أمان للحالة الراهنة. ملفات الوسائط المرفوعة لا تُحذف.",
    "ucms.backups.confirmRestore": "استعادة هذه النسخة الآن؟",
    "ucms.backups.restored": "استُعيد المحتوى من النسخة الاحتياطية",
    "ucms.backups.checkpoint": "أُنشئت نسخة أمان قبل الاستعادة",
    "ucms.backups.stats": "السجلات",
    "ucms.backups.createdBy": "أُنشئت",
    "ucms.backups.failed": "فشل النسخ الاحتياطي",
    "ucms.notif.title": "الإشعارات", "ucms.notif.markAll": "وضع علامة مقروء على الكل",
    "ucms.notif.empty": "لا إشعارات.", "ucms.notif.unread": "غير مقروءة",
    "ucms.notif.openAll": "عرض الكل",
    "ucms.search.placeholder": "ابحث في الصفحات والمحتوى والوسائط…",
    "ucms.search.title": "بحث", "ucms.search.empty": "لا نتائج.",
    "ucms.search.hint": "Ctrl/⌘ + K",
"ucms.search.groupTexts": "نصوص الموقع",
    "ucms.search.groupContent": "سجلات المحتوى", "ucms.search.groupMedia": "الوسائط",
    "ucms.save.saving": "جارٍ الحفظ…", "ucms.save.saved": "حُفظ", "ucms.save.failed": "فشل الحفظ",
    "ucms.save.unsaved": "تغييرات غير محفوظة", "ucms.save.offline": "غير متصل — لم تُحفظ التغييرات",
    "ucms.save.autosaved": "حُفظ تلقائياً", "ucms.save.autosaveOn": "الحفظ التلقائي مفعّل",
    "hdr.position": "سلوك الرأس", "hdr.positionOver": "فوق القسم الرئيسي", "hdr.positionStatic": "تدفق طبيعي", "hdr.positionSticky": "لزق أثناء التمرير", "hdr.positionFixed": "ثابت على الشاشة",
    "hdr.width": "عرض الرأس", "hdr.widthContained": "محدود", "hdr.widthFull": "عرض كامل", "hdr.widthInset": "مسافة من الحواف",
    "hdr.alignment": "محاذاة الرأس", "hdr.alignBetween": "الشعار يساراً · الروابط يميناً", "hdr.alignLeft": "الشعار والروابط إلى اليسار", "hdr.alignCenter": "منتصف", "hdr.alignRight": "الشعار يميناً · الروابط يساراً",
    "hdr.navGap": "المسافة بين عناصر التنقل", "hdr.logoGap": "المسافة بين الشعار واسم الموقع", "hdr.navPadding": "حشوة شريط التنقل", "hdr.top": "مسافة الرأس من الأعلى", "hdr.radius": "نصف قطر حواف التنقل",
    "hdr.background": "خلفية شريط التنقل", "hdr.text": "لون نص التنقل", "hdr.hideScroll": "إخفاء الرأس أثناء التمرير للأسفل",
    "hero.bgType": "نوع خلفية القسم الرئيسي", "hero.bgNone": "بدون خلفية", "hero.bgImage": "صورة", "hero.bgVideo": "فيديو",
    "hero.bgImageUrl": "صورة خلفية القسم الرئيسي", "hero.bgVideoUrl": "فيديو خلفية القسم الرئيسي", "hero.bgPosition": "موضع الخلفية", "hero.bgSize": "حجم الخلفية",
    "hero.bgCover": "تغطية", "hero.bgContain": "احتواء", "hero.bgStretch": "تمديد", "hero.heroHeight": "الارتفاع الأدنى للقسم الرئيسي", "hero.contentWidth": "العرض الأقصى للمحتوى",
    "hero.contentAlign": "محاذاة المحتوى على الكمبيوتر", "hero.mobileContentAlign": "محاذاة محتوى التابلت والهاتف",
    "hero.alignStart": "بداية السطر (تتبع اتجاه اللغة)", "hero.alignEnd": "نهاية السطر (تتبع اتجاه اللغة)",
    "hero.contentGap": "المسافة بين عناصر القسم الرئيسي",
    "nav.certificates": "الشهادات",
    "cert.title": "الشهادات", "cert.new": "إضافة شهادة", "cert.import": "استيراد CSV", "cert.search": "البحث في الشهادات…",
    "cert.importing": "جارٍ استيراد CSV…",
    "cert.csvHelp": "أعمدة CSV: certificate_id وrecipient_name (مطلوبان)، وcourse_name وcommittee_name وconference_name وrepresented_country وperformance_summary وcertificate_type وcertificate_image وissue_date وstatus (اختيارية). التاريخ بصيغة YYYY-MM-DD والحالة: valid أو revoked أو expired.",
    "cert.csvInvalid": "تعذر استيراد CSV: %s", "cert.csvReadError": "تعذرت قراءة ملف CSV.",
    "cert.csvImported": "تم استيراد %d شهادة.", "cert.csvEmpty": "لا يحتوي الملف على صفوف شهادات.",
    "cert.csvMissingHeaders": "يجب أن يحتوي CSV على عمودي certificate_id وrecipient_name.",
    "cert.csvDuplicateHeader": "عنوان عمود مكرر في CSV: %s.", "cert.csvMalformed": "تنسيق CSV غير صحيح قرب السطر %d.",
    "cert.csvRowColumns": "يحتوي السطر %d على أعمدة أكثر من العناوين.", "cert.csvRequired": "يحتاج السطر %d إلى رقم الشهادة واسم المستلم.",
    "cert.csvDuplicateId": "رقم الشهادة مكرر في الملف عند السطر %d.", "cert.csvDate": "تاريخ غير صحيح في السطر %d؛ استخدم YYYY-MM-DD.",
    "cert.csvStatus": "حالة غير صحيحة في السطر %d.", "cert.csvImage": "رابط صورة غير صحيح في السطر %d.",
    "cert.id": "رقم الشهادة", "cert.recipient": "اسم المستلم / المندوب", "cert.course": "الدورة",
    "cert.committee": "اللجنة", "cert.conference": "المؤتمر", "cert.country": "الدولة التي يمثلها",
    "cert.summary": "ملخص الأداء", "cert.type": "نوع الشهادة", "cert.image": "صورة الشهادة",
    "cert.date": "تاريخ الإصدار", "cert.status": "الحالة", "cert.statusValid": "سارية",
    "cert.statusRevoked": "ملغاة", "cert.statusExpired": "منتهية",
    "cert.sameProject": "تتطلب إدارة الشهادات أن يستخدم رابط الشهادات ورابط CMS مشروع Supabase نفسه.",



















    "ucms.confirm.publish": "نشر", "ucms.confirm.restore": "استعادة",
    "ucms.common.none": "لا شيء", "ucms.common.unknownShort": "؟",
    "ucms.common.current": "الحالي",

    /* V5: workflow lifecycle */
    "wf.status": "الحالة",
    "wf.draft": "مسودة", "wf.pending_review": "بانتظار المراجعة",
    "wf.approved": "معتمد", "wf.published": "منشور", "wf.archived": "مؤرشف",
    "wf.locked": "للقراءة فقط لدورك",
    "wf.versions": "الإصدارات", "wf.noVersions": "لا توجد إصدارات مسجلة بعد.",
    "wf.versionN": "الإصدار %d",
    "wf.created": "إنشاء", "wf.saved": "تحرير", "wf.restored": "استعادة",
    "wf.restore": "استعادة هذا الإصدار",
    "wf.confirmRestore": "استعادة الإصدار %d؟ سيتم حفظ الحالة الحالية كإصدار جديد أولاً.",
    "wf.restoredMsg": "تمت استعادة الإصدار %d",
    "wf.conflict": "تم تعديل هذا العنصر من شخص آخر أثناء التحرير. تم إلغاء الحفظ — يرجى المراجعة والمحاولة مرة أخرى.",

    /* V5: permissions matrix */
    "ucms.perms.intro": "يتم فرض كل إذن في قاعدة البيانات عند كل استعلام. التغييرات هنا تسري فورًا — لا حاجة لتحديث الجلسات.",
    "ucms.perms.readonly": "يمكن للمسؤولين فقط تغيير مصفوفة الصلاحيات.",
    "ucms.perms.saved": "تم حفظ الصلاحيات",
    "ucms.perms.module": "الوحدة",
    "ucms.perms.module.content": "المحتوى (اللجان، الفريق، الرعاة، الأسئلة، الطلبات)",
    "ucms.perms.module.certificates": "الشهادات",
    "ucms.perms.module.texts": "نصوص الموقع والأقسام",
    "ucms.perms.module.settings": "الإعدادات العامة والتصميم",
    "ucms.perms.module.media": "مكتبة الوسائط",
    "ucms.perms.module.users": "المستخدمون والصلاحيات",
    "ucms.perms.module.system": "النظام (النسخ الاحتياطية، سجل التدقيق، الإشعارات)",
    "ucms.perms.view": "عرض", "ucms.perms.create": "إنشاء", "ucms.perms.edit": "تحرير",
    "ucms.perms.del": "حذف", "ucms.perms.publish": "نشر", "ucms.perms.manage": "إدارة",
    "ucms.perms.viewDesc": "فتح الصفحات والسجلات والاطلاع عليها",
    "ucms.perms.createDesc": "إضافة سجل أو عنصر جديد",
    "ucms.perms.editDesc": "تعديل المحتوى الموجود",
    "ucms.perms.delDesc": "حذف المحتوى نهائياً",
    "ucms.perms.publishDesc": "اعتماد ونشر المحتوى على الموقع العام",
    "ucms.perms.manageDesc": "تغيير الإعدادات المتقدمة والإدارة",

    /* V5: audit export, media bulk + server check, dashboard extras */
    "ucms.audit.export": "تصدير CSV", "ucms.audit.exported": "تم تصدير %d سجلاً",
    "ucms.media.uploadMany": "رفع ملفات",
    "ucms.media.uploadedMany": "تم رفع %d ملف(ات)%f",
    "ucms.media.bulkDelete": "حذف المحدد",
    "ucms.media.deleteBlockedBy": "تم منع الحذف: الملف مُستخدم في المحتوى (تم التحقق على الخادم).",
    "md.select": "تحديد الملف",
    "ucms.dash.unpublished": "%d عنصر غير منشور",
    "ucms.dash.staff": "%d حساب موظفين",
    "ucms.dash.certs": "الشهادات: %d / %t صالحة",
    "ucms.search.groupCertificates": "الشهادات",
    "ucms.users.neverLogin": "لم يسجل الدخول أبدًا"
  };
  var TR = {
    "role.super_admin": "Süper Yönetici", "role.publisher": "Yayıncı",
    "ucms.group.overview": "Genel Bakış", "ucms.group.website": "Web Sitesi Yönetimi",
    "ucms.group.content": "İçerik Yönetimi",
    "ucms.group.media": "Medya Kitaplığı", "ucms.group.system": "Sistem Yönetimi",
    "nav.group.overview": "Genel Bakış", "nav.group.website": "Web Sitesi",
    "nav.group.content": "İçerik",
    "nav.group.media": "Medya", "nav.group.system": "Sistem",
    "ucms.nav.activity": "Son Etkinlik", "ucms.nav.health": "Web Sitesi Durumu",
"ucms.nav.seo": "SEO",
    "ucms.nav.settings": "Genel Web Sitesi Ayarları", "ucms.nav.translations": "Çeviriler",
"ucms.nav.users": "Kullanıcılar ve Roller",
    "ucms.nav.permissions": "İzinler", "ucms.nav.audit": "Denetim Günlükleri",
    "ucms.nav.backups": "Yedekleme ve Geri Yükleme", "ucms.nav.notifications": "Bildirimler",
    "ucms.nav.mediaUsage": "Medya Kullanımı",
    "ucms.dash.title": "Tekrar hoş geldiniz", "ucms.dash.sub": "GDF'27 web sitesinin her şeyi tek yerde.",
    "ucms.dash.stats": "Web sitesi istatistikleri", "ucms.dash.activity": "Son etkinlik",
    "ucms.dash.health": "Web sitesi durumu", "ucms.dash.quick": "Hızlı işlemler",

    "ucms.dash.media": "Medya dosyaları", "ucms.dash.members": "Ekip üyeleri",
    "ucms.dash.sponsors": "Sponsorlar", "ucms.dash.committees": "Komiteler",
    "ucms.dash.apps": "Başvuru formları", "ucms.dash.faqs": "SSS",
    "ucms.dash.textsEdited": "Düzenlenen metinler",
"ucms.dash.qaHome": "Ana Sayfayı Düzenle",
    "ucms.dash.qaMedia": "Medya Yükle",
    "ucms.dash.qaPreview": "Siteyi Önizle", "ucms.dash.qaUsers": "Kullanıcıları Yönet",
    "ucms.dash.noActivity": "Henüz etkinlik kaydedilmedi. Yönetim işlemleri burada görünecek.",
    "ucms.dash.activityHint": "Denetim günlüğünden. Her yönetim işlemi, yapan kişi ve sonucuyla kaydedilir.",
    "ucms.health.title": "Web sitesi durumu", "ucms.health.sub": "Sitenin bağımlı olduğu hizmetlerin canlı durumu.",
    "ucms.health.lastRun": "Son kontrol", "ucms.health.rerun": "Yeniden kontrol et",
    "ucms.health.ok": "Sağlıklı", "ucms.health.warn": "Uyarı", "ucms.health.error": "Hata",
    "ucms.health.unknown": "Bilinmiyor",
    "ucms.health.auth": "Kimlik doğrulama", "ucms.health.authOk": "Oturum açık",
    "ucms.health.db": "Veritabanı", "ucms.health.dbOk": "Yanıt veriyor",
    "ucms.health.storage": "Depolama (site-media bucket)", "ucms.health.storageOk": "Erişilebilir",
    "ucms.health.deps": "Gerekli kitaplıklar", "ucms.health.depsOk": "Tümü yüklü",
    "ucms.health.depsMissing": "Yüklü değil",
    "ucms.health.migrations": "Geçişler", "ucms.health.migrationsOk": "CMS tabloları mevcut",
    "ucms.health.migrationsMissing": "database/migrations içindeki geçişleri (001-008) çalıştırın",
    "ucms.health.publish": "Yayınlama", "ucms.health.publishDetail": "yayınlanan / toplam sayfa",
    "ucms.health.errors": "Son hatalar", "ucms.health.errorsOk": "Yakın zamanda hata yok",
    "ucms.health.errorsSome": "yakın zamanda başarısız işlem",
    "ucms.health.certProject": "Sertifika servisi", "ucms.health.certOk": "Yapılandırıldı (ayrı Supabase projesi)",
    "ucms.health.certMissing": "verify-common.js içinde Supabase adresi yok",
    "ucms.health.dbTitle": "Veritabanı teşhisi", "ucms.health.dbSub": "Tablolar, sütunlar, RPC işlevleri, depolama, RLS davranışı ve uygulanan geçişler.",
    "ucms.health.gConn": "Bağlantı", "ucms.health.gTables": "Gerekli tablolar", "ucms.health.gColumns": "Gerekli sütunlar",
    "ucms.health.gRpc": "RPC işlevleri", "ucms.health.gStorage": "Depolama", "ucms.health.gRls": "Satır Güvenliği (RLS)",
    "ucms.health.gMigrations": "Geçişler", "ucms.health.gStatus": "Durum",
    "ucms.health.dbMissing": "Tablo yok — SQL geçişini çalıştırın",
    "ucms.health.rpcOk": "Yanıt veriyor",
    "ucms.health.missing": "Eksik", "ucms.health.migration": "Geçiş Gerekli",
    "ucms.health.permission": "İzin Hatası", "ucms.health.fail": "Bağlantı Başarısız",
    "ucms.health.rlsPublicRead": "Anonim CMS içeriğini okuyabilir", "ucms.health.rlsStaffHidden": "Personel satırları anonimden gizli",
    "ucms.health.rlsNoAnonWrite": "Anonim yazma reddedildi", "ucms.health.rlsBlocked": "Engelli (RLS aktif)",
    "ucms.health.rlsLeak": "Beklenmeyen satırlar görünür — RLS politikalarını gözden geçirin!",
    "err.network": "Ağ", "err.auth": "Kimlik / izin", "err.database": "Veritabanı",
    "err.validation": "Doğrulama", "err.runtime": "Uygulama hatası",
    "msg.corePartial": "Bazı CMS verileri yüklenemedi — sorun çözülene kadar site bölümleri varsayılan metinleri gösterebilir.",
    "ucms.activity.title": "Son etkinlik",
    "ucms.activity.sub": "Her yönetim işlemi; yapan kişi, kaynak ve sonuçla birlikte.",
    "ucms.activity.empty": "Geçerli filtrelerle eşleşen kayıt yok.",
    "ucms.activity.filterAction": "İşlem", "ucms.activity.filterUser": "Kullanıcı",
    "ucms.activity.filterResource": "Kaynak", "ucms.activity.filterOutcome": "Sonuç",
    "ucms.activity.from": "Başlangıç", "ucms.activity.to": "Bitiş", "ucms.activity.all": "Tümü",
    "ucms.activity.actor": "Yapan", "ucms.activity.action": "İşlem",
    "ucms.activity.resource": "Kaynak", "ucms.activity.time": "Zaman",
    "ucms.activity.outcome": "Sonuç", "ucms.activity.loadMore": "Daha fazla yükle",
    "ucms.activity.meta": "Ayrıntılar", "ucms.activity.allUsers": "Tüm kullanıcılar",
    "ucms.activity.allOutcomes": "Tüm sonuçlar", "ucms.activity.allResources": "Tüm kaynaklar",











"ucms.pages.publishNote": "Yayınlama, belgeyi veritabanına kaydeder ve bir sürüm anlık görüntüsü oluşturur. Herkese açık GDF'27 sayfaları GitHub Pages üzerindeki statik dosyalardır; veritabanına yayınlama bunları otomatik olarak yeniden dağıtmaz.",

    "ucms.seo.title": "SEO yönetimi", "ucms.seo.sub": "Sayfa bazlı meta bilgileri. Değerler, genel sayfalar yüklendikten sonra uygulanır; özgün HTML yedek olarak kalır.",
    "ucms.seo.page": "Sayfa", "ucms.seo.seoTitle": "SEO başlığı",
    "ucms.seo.seoDesc": "Meta açıklama", "ucms.seo.canonical": "Kanonik URL",
    "ucms.seo.ogTitle": "Open Graph başlığı", "ucms.seo.ogDesc": "Open Graph açıklaması",
    "ucms.seo.ogImage": "Open Graph görseli", "ucms.seo.robots": "Robots yönergesi",
    "ucms.seo.robotsHelp": "index, noindex, follow, nofollow…",
    "ucms.seo.preview": "Arama sonucu önizlemesi", "ucms.seo.saved": "SEO ayarları kaydedildi",
    "ucms.seo.titleLong": "Başlık 60 karakterden uzun — arama sonuçlarında kısaltılabilir.",
    "ucms.seo.descLong": "Açıklama 160 karakterden uzun — kısaltılabilir.",
    "ucms.seo.robotsInvalid": "Robots yönergesi yalnızca index/noindex/follow/nofollow/none içerebilir.",
    "ucms.settings.title": "Genel web sitesi ayarları", "ucms.settings.sub": "Alt düzey anahtar/değer ayarları (geri sayım tarihi, alan adı, marka). Yalnızca yöneticiler.",
    "ucms.settings.key": "Anahtar", "ucms.settings.value": "Değer (JSON)", "ucms.settings.label": "Etiket",
    "ucms.settings.updated": "Güncellendi", "ucms.settings.invalidJson": "Değer geçerli bir JSON değil.",
    "ucms.settings.adminOnly": "Bu ayarları yalnızca yöneticiler değiştirebilir.",
    "ucms.translations.title": "Çeviriler", "ucms.translations.sub": "Site metinlerinin Arapça ve Türkçe kapsamı ve yönetim arayüzü çevirileri.",
    "ucms.translations.public": "Genel site metinleri", "ucms.translations.admin": "Yönetim arayüzü",
    "ucms.translations.lang": "Dil", "ucms.translations.coverage": "Kapsam",
    "ucms.translations.missing": "Eksik", "ucms.translations.of": "/",
    "ucms.translations.builtin": "Yerleşik sözlük", "ucms.translations.cms": "CMS geçersiz kılmaları",
    "ucms.translations.goTexts": "Site Metinlerini Aç", "ucms.translations.complete": "Tam",













    "ucms.media.title": "Medya Kitaplığı", "ucms.media.usage": "Kullanım",
    "ucms.media.usedIn": "Kullanıldığı yer", "ucms.media.unknown": "Bilinmiyor",
    "ucms.media.unknownHelp": "Bazı referans kontrolleri başarısız oldu, bu yüzden kullanım kanıtlanamıyor. Kontroller geçene kadar silme engelli kalır.",
    "ucms.media.unused": "Referans bulunamadı", "ucms.media.noRefs": "Bu dosya için kayıtlı referans yok.",
    "ucms.media.refsFailed": "referans kontrolü başarısız", "ucms.media.rename": "Yeniden adlandır",
    "ucms.media.newName": "Yeni ad", "ucms.media.renamed": "Dosya yeniden adlandırıldı",
    "ucms.media.replace": "Dosyayı değiştir", "ucms.media.replaced": "Dosya değiştirildi ve referanslar güncellendi",
    "ucms.media.deleteBlocked": "Bu dosya mevcut içerikte kullanılıyor. Önce referansları güncelleyin veya kaldırın ya da Dosyayı değiştir'i kullanın.",
    "ucms.media.deleteFailed": "Dosya depolamadan silinemedi (hâlâ duruyor). İzinlerinizi kontrol edip tekrar deneyin.",
    "ucms.media.typeImages": "Görseller", "ucms.media.typeAll": "Tüm dosyalar",
    "ucms.media.docsNote": "site-media bucket yalnızca JPG, PNG ve WebP görsellerini kabul eder (SVG belge taşıyabildiğinden SVG ve belgeler engellenir). Belge barındırma yoktur.",
    "ucms.media.sortName": "Ad", "ucms.media.sortDate": "Yükleme tarihi", "ucms.media.sortSize": "Boyut",
    "ucms.media.search": "Dosyalarda ara…", "ucms.media.count": "dosya",
    "ucms.users.title": "Kullanıcılar ve Roller", "ucms.users.sub": "Yönetim hesapları ve rolleri. Rol değişiklikleri kullanıcının sonraki girişinde etkili olur.",
    "ucms.users.name": "Görünen ad", "ucms.users.role": "Rol", "ucms.users.created": "Eklendi", "ucms.users.lastLogin": "Son giriş",
    "ucms.users.notAvailable": "Yönetim panelinde görünmez (kimlik doğrulama servisinde saklanır)",
    "ucms.users.invite": "Yönetici ekle", "ucms.users.inviteHelp": "Hesaplar Supabase Authentication içinde oluşturulur (parola burada asla saklanmaz). Adımlar:",
    "ucms.users.inviteStep1": "1. Supabase Paneli → Authentication → Users → Add user (“Auto confirm” işaretleyin).",
    "ucms.users.inviteStep2": "2. Yeni kullanıcının UID'sini kopyalayın ve SQL editöründe şunu çalıştırın:",
    "ucms.users.changeRole": "Rolü değiştir", "ucms.users.revoke": "Erişimi kaldır",
    "ucms.users.revokeConfirm": "Bu kullanıcının yönetim erişimi kaldırılsın mı? Kimlik hesabı kalır ama tüm panel hakları kaybolur.",
    "ucms.users.selfRole": "Kendi rolünüzü değiştiremezsiniz.",
    "ucms.users.selfRevoke": "Kendi erişiminizi kaldıramazsınız.",
    "ucms.users.lastAction": "Kayıtlı son işlem",
    "ucms.users.noLastAction": "Kayıt yok",
    "ucms.users.adminOnly": "Kullanıcıları yalnızca yöneticiler yönetebilir.",
    "ucms.perms.title": "İzinler", "ucms.perms.sub": "Her rolün yapabilecekleri. Yalnızca arayüzde gizlenmez; veritabanında Row Level Security ile uygulanır.",
    "ucms.perms.cap": "Yetenek", "ucms.perms.enforcedBy": "Uygulama yeri",
    "ucms.perms.rls": "RLS politikası", "ucms.perms.rpc": "RPC kontrolü",
    "ucms.perms.ui": "Yalnızca arayüz",
    "ucms.perms.capContent": "Site içeriğini düzenleme (metinler, bölümler, listeler)",
    "ucms.perms.capMedia": "Medya yükleme ve yönetme",
    "ucms.perms.capDesign": "Tasarım belirteçleri ve genel ayarlar",

    "ucms.perms.capUsers": "Kullanıcı ve rol yönetimi",
    "ucms.perms.capBackups": "Yedek oluşturma ve geri yükleme",
    "ucms.perms.capAudit": "Denetim günlüklerini okuma",
    "ucms.audit.title": "Denetim günlükleri", "ucms.audit.sub": "Yönetim işlemlerinin yalnızca eklenebilir kayıtları. Günlükler panelden düzenlenemez veya silinemez.",
    "ucms.audit.detail": "Ayrıntılar",
    "ucms.backups.title": "Yedekleme ve Geri Yükleme", "ucms.backups.sub": "Tüm site içeriğinin (veritabanı kayıtları) zamana dayalı anlık görüntüleri. Depolama medya dosyalarına URL ile atıf yapılır ve yedeğe kopyalanmaz.",
    "ucms.backups.create": "Yedek oluştur", "ucms.backups.label": "Etiket",
    "ucms.backups.labelPh": "örn. Ana sayfa yenilemesinden önce",
    "ucms.backups.created": "Yedek oluşturuldu",
    "ucms.backups.empty": "Henüz yedek yok.",
    "ucms.backups.download": "JSON indir",
    "ucms.backups.restore": "Geri yükle…",
    "ucms.backups.restoreWarn": "Geri yükleme, mevcut içeriği yedek anlık görüntüsüyle değiştirir. Önce mevcut durumun güvenlik yedeği oluşturulur. Yüklenmiş medya dosyaları silinmez.",
    "ucms.backups.confirmRestore": "Bu yedek şimdi geri yüklensin mi?",
    "ucms.backups.restored": "İçerik yedekten geri yüklendi",
    "ucms.backups.checkpoint": "Geri yüklemeden önce güvenlik yedeği oluşturuldu",
    "ucms.backups.stats": "Kayıtlar",
    "ucms.backups.createdBy": "Oluşturuldu",
    "ucms.backups.failed": "Yedekleme başarısız",
    "ucms.notif.title": "Bildirimler", "ucms.notif.markAll": "Tümünü okundu işaretle",
    "ucms.notif.empty": "Bildirim yok.", "ucms.notif.unread": "okunmamış",
    "ucms.notif.openAll": "Tümünü gör",
    "ucms.search.placeholder": "Sayfa, içerik, medya ara…",
    "ucms.search.title": "Ara", "ucms.search.empty": "Sonuç yok.",
    "ucms.search.hint": "Ctrl/⌘ + K",
"ucms.search.groupTexts": "Site metinleri",
    "ucms.search.groupContent": "İçerik kayıtları", "ucms.search.groupMedia": "Medya",
    "ucms.save.saving": "Kaydediliyor…", "ucms.save.saved": "Kaydedildi", "ucms.save.failed": "Kaydetme başarısız",
    "ucms.save.unsaved": "Kaydedilmemiş değişiklikler", "ucms.save.offline": "Çevrimdışı — değişiklikler kaydedilmedi",
    "ucms.save.autosaved": "Otomatik kaydedildi", "ucms.save.autosaveOn": "Otomatik kaydetme açık",
    "hdr.position": "Başlık davranışı", "hdr.positionOver": "Ana bölümün üzerinde", "hdr.positionStatic": "Normal akış", "hdr.positionSticky": "Kaydırırken yapışkan", "hdr.positionFixed": "Ekranda sabit",
    "hdr.width": "Başlık genişliği", "hdr.widthContained": "Sınırlı", "hdr.widthFull": "Tam genişlik", "hdr.widthInset": "Kenarlardan içeri",
    "hdr.alignment": "Başlık hizalama", "hdr.alignBetween": "Logo solda · bağlantılar sağda", "hdr.alignLeft": "Logo ve bağlantılar solda", "hdr.alignCenter": "Ortalanmış", "hdr.alignRight": "Logo sağda · bağlantılar solda",
    "hdr.navGap": "Gezinme öğeleri arasındaki boşluk", "hdr.logoGap": "Logo / marka boşluğu", "hdr.navPadding": "Gezinme çubuğu dolgusu", "hdr.top": "Başlığın üst mesafesi", "hdr.radius": "Gezinme köşe yarıçapı",
    "hdr.background": "Gezinme arka planı", "hdr.text": "Gezinme metin rengi", "hdr.hideScroll": "Aşağı kaydırırken başlığı gizle",
    "hero.bgType": "Ana bölüm arka plan türü", "hero.bgNone": "Arka plan yok", "hero.bgImage": "Görsel", "hero.bgVideo": "Video",
    "hero.bgImageUrl": "Ana bölüm arka plan görseli", "hero.bgVideoUrl": "Ana bölüm arka plan videosu", "hero.bgPosition": "Arka plan konumu", "hero.bgSize": "Arka plan boyutu",
    "hero.bgCover": "Kapla", "hero.bgContain": "Sığdır", "hero.bgStretch": "Uzat", "hero.heroHeight": "Ana bölüm minimum yüksekliği", "hero.contentWidth": "İçeriğin maksimum genişliği",
    "hero.contentAlign": "Masaüstü içerik hizalaması", "hero.mobileContentAlign": "Tablet ve telefon hizalaması",
    "hero.alignStart": "Başlangıç (dil yönünü izler)", "hero.alignEnd": "Bitiş (dil yönünü izler)",
    "hero.contentGap": "Ana bölüm öğeleri arasındaki boşluk",
    "nav.certificates": "Sertifikalar",
    "cert.title": "Sertifikalar", "cert.new": "Sertifika ekle", "cert.import": "CSV içe aktar", "cert.search": "Sertifikalarda ara…",
    "cert.importing": "CSV içe aktarılıyor…",
    "cert.csvHelp": "CSV başlıkları: certificate_id, recipient_name (zorunlu); course_name, committee_name, conference_name, represented_country, performance_summary, certificate_type, certificate_image, issue_date, status (isteğe bağlı). Tarih: YYYY-MM-DD. Durum: valid, revoked, expired.",
    "cert.csvInvalid": "CSV içe aktarma başarısız: %s", "cert.csvReadError": "CSV dosyası okunamadı.",
    "cert.csvImported": "%d sertifika içe aktarıldı.", "cert.csvEmpty": "CSV dosyasında sertifika satırı yok.",
    "cert.csvMissingHeaders": "CSV, certificate_id ve recipient_name başlıklarını içermelidir.",
    "cert.csvDuplicateHeader": "Yinelenen CSV başlığı: %s.", "cert.csvMalformed": "%d. satır civarında bozuk CSV biçimi.",
    "cert.csvRowColumns": "%d. satır başlıktan daha fazla sütun içeriyor.", "cert.csvRequired": "%d. satırda sertifika numarası ve alıcı adı bulunmalıdır.",
    "cert.csvDuplicateId": "%d. satırda bu dosyada yinelenen bir sertifika numarası var.", "cert.csvDate": "%d. satırdaki issue_date geçersiz; YYYY-MM-DD kullanın.",
    "cert.csvStatus": "%d. satırdaki durum geçersiz.", "cert.csvImage": "%d. satırdaki sertifika görseli URL'si geçersiz.",
    "cert.id": "Sertifika numarası", "cert.recipient": "Alıcı / delege adı", "cert.course": "Kurs",
    "cert.committee": "Komite", "cert.conference": "Konferans", "cert.country": "Temsil edilen ülke",
    "cert.summary": "Performans özeti", "cert.type": "Sertifika türü", "cert.image": "Sertifika görseli",
    "cert.date": "Düzenlenme tarihi", "cert.status": "Durum", "cert.statusValid": "Geçerli",
    "cert.statusRevoked": "İptal edildi", "cert.statusExpired": "Süresi doldu",
    "cert.sameProject": "Sertifika yönetimi için sertifika ve CMS URL'leri aynı Supabase projesini kullanmalıdır.",



















    "ucms.confirm.publish": "Yayınla", "ucms.confirm.restore": "Geri yükle",
    "ucms.common.none": "Yok", "ucms.common.unknownShort": "?",
    "ucms.common.current": "Güncel",

    /* V5: workflow lifecycle */
    "wf.status": "Durum",
    "wf.draft": "Taslak", "wf.pending_review": "İnceleme bekliyor",
    "wf.approved": "Onaylandı", "wf.published": "Yayında", "wf.archived": "Arşivlendi",
    "wf.locked": "rolünüz için salt okunur",
    "wf.versions": "Sürümler", "wf.noVersions": "Henüz kayıtlı sürüm yok.",
    "wf.versionN": "Sürüm %d",
    "wf.created": "Oluşturma", "wf.saved": "Düzenleme", "wf.restored": "Geri yükleme",
    "wf.restore": "Bu sürümü geri yükle",
    "wf.confirmRestore": "%d. sürüm geri yüklensin mi? Önce mevcut durum yeni bir sürüm olarak saklanır.",
    "wf.restoredMsg": "%d. sürüm geri yüklendi",
    "wf.conflict": "Bu kayıt siz düzenlerken başka biri tarafından değiştirildi. Kaydetme iptal edildi — lütfen gözden geçirip tekrar deneyin.",

    /* V5: permissions matrix */
    "ucms.perms.intro": "Her izin veritabanında her sorguda uygulanır. Buradaki değişiklikler anında geçerli olur — oturumların yenilenmesi gerekmez.",
    "ucms.perms.readonly": "İzin matrisini yalnızca yöneticiler değiştirebilir.",
    "ucms.perms.saved": "İzinler kaydedildi",
    "ucms.perms.module": "Modül",
    "ucms.perms.module.content": "İçerik (komiteler, ekip, sponsorlar, SSS, başvurular)",
    "ucms.perms.module.certificates": "Sertifikalar",
    "ucms.perms.module.texts": "Site metinleri ve bölümler",
    "ucms.perms.module.settings": "Genel ayarlar ve tasarım",
    "ucms.perms.module.media": "Medya kütüphanesi",
    "ucms.perms.module.users": "Kullanıcılar ve izinler",
    "ucms.perms.module.system": "Sistem (yedekler, denetim günlüğü, bildirimler)",
    "ucms.perms.view": "Görüntüle", "ucms.perms.create": "Oluştur", "ucms.perms.edit": "Düzenle",
    "ucms.perms.del": "Sil", "ucms.perms.publish": "Yayınla", "ucms.perms.manage": "Yönet",
    "ucms.perms.viewDesc": "Sayfaları ve kayıtları açıp görüntüle",
    "ucms.perms.createDesc": "Yeni kayıt veya öğe ekle",
    "ucms.perms.editDesc": "Mevcut içeriği değiştir",
    "ucms.perms.delDesc": "İçeriği kalıcı olarak sil",
    "ucms.perms.publishDesc": "İçeriği onayla ve genel sitede yayınla",
    "ucms.perms.manageDesc": "Gelişmiş ayarları ve yönetimi değiştir",

    /* V5: audit export, media bulk + server check, dashboard extras */
    "ucms.audit.export": "CSV dışa aktar", "ucms.audit.exported": "%d kayıt dışa aktarıldı",
    "ucms.media.uploadMany": "Dosya yükle",
    "ucms.media.uploadedMany": "%d dosya yüklendi%f",
    "ucms.media.bulkDelete": "Seçilenleri sil",
    "ucms.media.deleteBlockedBy": "Silme engellendi: dosya içerikte kullanılıyor (sunucuda doğrulandı).",
    "md.select": "Dosya seç",
    "ucms.dash.unpublished": "%d yayınlanmamış kayıt",
    "ucms.dash.staff": "%d personel hesabı",
    "ucms.dash.certs": "Sertifikalar: %d / %t geçerli",
    "ucms.search.groupCertificates": "Sertifikalar",
    "ucms.users.neverLogin": "hiç giriş yapmadı"
  };

  function merge(dst, src) {
    Object.keys(src).forEach(function (k) {
      if (dst[k] === undefined) dst[k] = src[k];
    });
  }
  ["en", "ar", "tr"].forEach(function (l) {
    var src = l === "en" ? EN : l === "ar" ? AR : TR;
    window.ADMIN_I18N[l] = window.ADMIN_I18N[l] || {};
    merge(window.ADMIN_I18N[l], src);
  });
})();
