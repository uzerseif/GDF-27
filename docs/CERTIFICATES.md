# Certificate verification

Files: `verify/`, `certificate/` (and legacy `verify.html`, `certificate.html`), `verify.css`, `verify-common.js`, `verify.js`, `certificate.js`,
`certificate-pdf.js`, `certificate-pdf-assets.js`, `assets/certificate-placeholder.svg`.

1. Run migrations 005 and 006.
2. Upload certificate images to the public `gdf-certificates` bucket and store each public URL in `certificates.certificate_image`;
   when empty, the placeholder is shown.
3. Texts: English in HTML/JS; Arabic/Turkish in `translations.js` (`verify.*`, `cert.*`).
4. PDF download uses the local `vendor/html2canvas` and `vendor/jspdf`.

Never place a service_role key in frontend code. Browser-side rate limiting is not production grade.
