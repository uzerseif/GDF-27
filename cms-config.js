/* GDF'27 CMS — Supabase connections used by the public site and the UCMS.
   Only PUBLISHABLE (anon) keys belong here. Never put a secret / service_role
   key in this file.

   Two separately configurable Supabase connections are used:
   - GDF_SUPABASE: the main CMS (texts, sections, settings, content tables,
     audit logs, notifications, backups).
   - GDF_VERIFY_SUPABASE: the certificate service used by verify.js and
     certificate.js. Certificate administration reuses the CMS staff session,
     so its URL must match GDF_SUPABASE.url when that admin feature is enabled. */
window.GDF_SUPABASE = {
  url: "https://imsmvmzjtrcjhhqlgwsx.supabase.co",
  key: "sb_publishable_PJnVN7UBG5u6jyDQM7fRlw_rM-G8cl1"
};
window.GDF_VERIFY_SUPABASE = {
  url: "https://imsmvmzjtrcjhhqlgwsx.supabase.co",
  key: "sb_publishable_PJnVN7UBG5u6jyDQM7fRlw_rM-G8cl1"
};
