/* =====================================================================
   GDF'27 UCMS — Website Management (group "website"):
   Header, Homepage, President, Footer, SEO,
   Global Website Settings. The section editors come from pages-shared.js
   and write to the same site_texts / page_sections tables as before.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.CMSA, h = A.h, t = A.t, db = A.db, U = A.U;

  /* ==================================================================== */
  /* UNIFIED PAGES                                                        */
  /* ==================================================================== */

  /* ==================================================================== */
  /* HEADER & NAVIGATION                                                  */
  /* ==================================================================== */
  var NAV = [["home", "./", "nav.home"], ["applications", "applications/", "nav.applications"], ["committees", "committees/", "nav.committees"], ["about", "about/", "nav.about"], ["team", "team/", "nav.team"], ["faq", "faq/", "nav.faq"]];
  function headerEditor() {
    var s = A.section("global", "header").settings || {};
    var items = Array.isArray(s.nav) && s.nav.length ? s.nav : NAV.map(function (n) { return { page: n[0], href: n[1], visible: true }; });
    NAV.forEach(function (n) { if (!items.some(function (i) { return i.page === n[0]; })) items.push({ page: n[0], href: n[1], visible: false }); });
    var navField = A.fList(t("hdr.nav"), items, function (item) {
      var builtin = NAV.filter(function (n) { return n[0] === item.page; })[0];
      var href = A.fText(t("f.link"), item.href || (builtin && builtin[1]) || "", { url: true, required: true });
      var vis = A.fToggle(t("f.visible"), item.visible !== false);
      var label = builtin ? null : A.fI18n(t("f.label"), item.label || {}, { required: true });
      var newTab = builtin ? null : A.fToggle(t("f.newTab"), !!item.new_tab);
      var title = builtin ? h("strong", null, A.textField(builtin[2]).get().en || builtin[0]) : null;
      return { el: h("div", { class: "grid grid-2" }, title ? h("div", { class: "full" }, title, " ", A.badge(builtin[0])) : null, label ? h("div", { class: "full" }, label) : null, href, h("div", null, vis, newTab)),
        get: function () { var o = { page: item.page, href: href.get(), visible: vis.get() }; if (label) { o.label = label.get(); o.new_tab = newTab.get(); } return o; },
        validate: function () { return href.validate() && (!label || label.validate()); } };
    }, function () { return { page: "custom-" + Date.now().toString(36), href: "https://", visible: true, label: {} }; }, { addLabel: t("hdr.custom"), help: t("hdr.navHelp") });
    navField.classList.add("list-field");
    return U.sectionEditor({ page: "global", key: "header", title: t("nav.header"), visible: false, cols: 2,
      fields: [
        ["logo_url", A.fImage(t("hdr.logo"), s.logo_url || "images/logo.webp", { folder: "global" })],
        ["show_name", A.fToggle(t("hdr.showName"), s.show_name !== false)],
        ["position", A.fSelect(t("hdr.position"), s.position || "absolute", [["absolute", t("hdr.positionOver")], ["static", t("hdr.positionStatic")], ["sticky", t("hdr.positionSticky")], ["fixed", t("hdr.positionFixed")]])],
        ["width", A.fSelect(t("hdr.width"), s.width || "contained", [["contained", t("hdr.widthContained")], ["full", t("hdr.widthFull")], ["inset", t("hdr.widthInset")]])],
        ["alignment", A.fSelect(t("hdr.alignment"), s.alignment || "between", [["between", t("hdr.alignBetween")], ["left", t("hdr.alignLeft")], ["center", t("hdr.alignCenter")], ["right", t("hdr.alignRight")]])],
        ["nav_gap", A.fText(t("hdr.navGap"), s.nav_gap || "18px", { placeholder: "18px" })],
        ["logo_gap", A.fText(t("hdr.logoGap"), s.logo_gap || "8px", { placeholder: "8px" })],
        ["nav_padding", A.fText(t("hdr.navPadding"), s.nav_padding || "8px 20px", { placeholder: "8px 20px" })],
        ["header_top", A.fText(t("hdr.top"), s.header_top || "16px", { placeholder: "16px" })],
        ["nav_radius", A.fText(t("hdr.radius"), s.nav_radius || "18px", { placeholder: "18px" })],
        ["nav_background", A.fColor(t("hdr.background"), s.nav_background || "#EAD7B0")],
        ["nav_text", A.fColor(t("hdr.text"), s.nav_text || "#081933")],
        ["hide_on_scroll", A.fToggle(t("hdr.hideScroll"), s.hide_on_scroll === true)],
        ["nav", navField]
      ],
      texts: [["brand.name"], ["nav.home"], ["nav.applications"], ["nav.committees"], ["nav.about"], ["nav.team"], ["nav.faq"]],
      validate: function () { return navField.validate(); } });
  }
  A.register("header", { group: "website", icon: "☰", title: "nav.header", preview: "./", render: function (view) {
    U.editorPage(view, [headerEditor()]);
  } });

  /* ==================================================================== */
  /* HOMEPAGE                                                             */
  /* ==================================================================== */
  function heroEditor() {
    var s = A.section("home", "hero").settings || {};
    var start = A.data.settings["event.start"] || "2027-03-20T09:00:00+03:00";
    var startMs = new Date(start).getTime();
    var startVal = isNaN(startMs) ? "" : new Date(startMs + 3 * 3600e3).toISOString().slice(0, 16);
    var date = A.fText(t("hero.countdownDate"), startVal, { type: "datetime-local" });
    var ed = U.sectionEditor({ page: "home", key: "hero", title: t("home.hero"),
      fields: [
        ["emblem_url", A.fImage(t("hero.emblem"), s.emblem_url || "images/emblem-gold.webp", { folder: "home/hero" })],
        ["bg_type", A.fSelect(t("hero.bgType"), s.bg_type || (s.use_video !== false ? "video" : "image"), [["none", t("hero.bgNone")], ["image", t("hero.bgImage")], ["video", t("hero.bgVideo")]])],
        ["bg_image_url", A.fMedia(t("hero.bgImageUrl"), s.bg_image_url, { accept: "image/jpeg,image/png,image/webp", folder: "home/hero", types: "JPG, PNG or WebP", uploadLabel: t("btn.uploadImage") })],
        ["bg_video_url", A.fMedia(t("hero.bgVideoUrl"), s.bg_video_url || "", { accept: "video/mp4,video/webm", folder: "home/hero", types: "MP4 or WebM", uploadLabel: t("btn.uploadVideo") })],
        ["bg_position", A.fSelect(t("hero.bgPosition"), s.bg_position || "center", [["center", t("pos.center")], ["top", t("pos.top")], ["bottom", t("pos.bottom")], ["left", t("pos.left")], ["right", t("pos.right")]])],
        ["bg_size", A.fSelect(t("hero.bgSize"), s.bg_size || "cover", [["cover", t("hero.bgCover")], ["contain", t("hero.bgContain")], ["100% 100%", t("hero.bgStretch")]])],
        ["hero_height", A.fText(t("hero.heroHeight"), s.hero_height || "720px", { placeholder: "720px" })],
        ["content_width", A.fText(t("hero.contentWidth"), s.content_width || "1024px", { placeholder: "1024px" })],
        ["content_align", A.fSelect(t("hero.contentAlign"), s.content_align === "center" ? "center" : s.content_align === "right" || s.content_align === "end" ? "end" : "start", [["start", t("hero.alignStart")], ["center", t("pos.center")], ["end", t("hero.alignEnd")]])],
        ["mobile_content_align", A.fSelect(t("hero.mobileContentAlign"), s.mobile_content_align === "start" || s.mobile_content_align === "end" ? s.mobile_content_align : "center", [["start", t("hero.alignStart")], ["center", t("pos.center")], ["end", t("hero.alignEnd")]])],
        ["content_gap", A.fText(t("hero.contentGap"), s.content_gap || "24px", { placeholder: "24px" })],
        ["overlay_color", A.fColor(t("hero.overlay"), s.overlay_color, "#081933")],
        ["overlay_opacity", A.fText(t("hero.opacity"), s.overlay_opacity === undefined ? "" : s.overlay_opacity, { type: "number", placeholder: "50" }), function (v) { return v === "" ? "" : Math.max(0, Math.min(100, +v)); }],
        ["show_buttons", A.fToggle(t("hero.buttons"), s.show_buttons !== false)],
        ["cta1_href", A.fText(t("hero.cta1"), s.cta1_href || "applications/", { url: true })],
        ["cta2_href", A.fText(t("hero.cta2"), s.cta2_href || "committees/", { url: true })],
        ["show_countdown", A.fToggle(t("hero.countdown"), s.show_countdown !== false)]
      ],
      extra: A.grid(2, [date]),
      texts: [["hero.l1"], ["hero.l2"], ["hero.l3"], ["hero.year"], ["hero.tagline"], ["hero.apply"], ["nav.committees"], ["cd.label"], ["cd.days"], ["cd.hours"], ["cd.minutes"], ["cd.seconds"], ["alt.emblem"]],
      collect: function (settings) {
        settings.use_video = settings.bg_type === "video";
      },
      afterSave: function () {
        var v = date.get();
        if (!v || v === startVal) return;
        var iso = v + ":00+03:00";
        return A.saveSetting("event.start", iso, "Event start (countdown target)").then(function () {
          startVal = v;
          U.audit("settings.event_start", "site_settings", "event.start", "Countdown date", { value: iso });
        });
      } });
    var draft = ed.draft;
    ed.draft = function () { var d = draft(); var v = date.get(); if (v) d.settings = { "event.start": v + ":00+03:00" }; return d; };
    return ed;
  }
  function presidentEditor() {
    var s = A.section("home", "president").settings || {};
    return U.sectionEditor({ page: "home", key: "president", title: t("home.president"),
      fields: [
        ["photo_url", A.fImage(t("pres.photo"), s.photo_url || "images/team/president.webp", { folder: "home/president" })],
        ["signature_url", A.fImage(t("pres.signature"), s.signature_url, { folder: "home/president" })],
        ["photo_position", A.fSelect(t("pres.pos"), s.photo_position || "left", [["left", t("pos.left")], ["right", t("pos.right")]])],
        ["button_href", A.fText(t("pres.btnHref"), s.button_href || "president/", { url: true })],
        ["show_photo", A.fToggle(t("pres.showPhoto"), s.show_photo !== false)],
        ["show_button", A.fToggle(t("pres.showBtn"), s.show_button !== false)]
      ],
      texts: [["pres.title"], ["pres.dear"], ["letter.p1", null, { multiline: true }], ["letter.p2", null, { multiline: true }], ["letter.p3", null, { multiline: true }], ["letter.p4", null, { multiline: true }], ["letter.close", null, { multiline: true }], ["pres.name"], ["pres.role"], ["pres.more"], ["pres.back"], ["alt.pres"]],
      help: t("pres.letter") });
  }
  function venueEditor() {
    var s = A.section("home", "venue").settings || {};
    return U.sectionEditor({ page: "home", key: "venue", title: t("home.venue"),
      fields: [
        ["address", A.fText(t("venue.address"), s.address || "Osmanlı Mah. Çakmak Küme Evleri İç Kapı No: 5, Şahinbey / Gaziantep")],
        ["email", A.fText(t("venue.email"), s.email || "gdf27.official@gmail.com", { type: "email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })],
        ["phone", A.fText(t("venue.phone"), s.phone || "+90 5822 064 300", { dir: "ltr" })],
        ["maps_url", A.fText(t("venue.maps"), s.maps_url || "https://maps.google.com/?cid=5253672414103134596", { url: true })],
        ["embed_url", A.fText(t("venue.embed"), s.embed_url || "", { url: true, https: true, placeholder: "https://www.google.com/maps/embed?pb=…", pattern: /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i, patternMsg: t("venue.embed") }), null],
        ["show_map", A.fToggle(t("venue.showMap"), s.show_map !== false)],
        ["photo_url", A.fImage(t("venue.photo"), s.photo_url, { folder: "home/venue" })]
      ],
      texts: [["venue.title"], ["venue.school"], ["lbl.address"], ["lbl.email"], ["lbl.phone"], ["venue.maps"]] });
  }
  function marqueeEditor() {
    var s = A.section("home", "marquee").settings || {};
    var phrases = Array.isArray(s.phrases) ? s.phrases : [
      s.name_en || "Gaziantep Diplomacy Forum 2027",
      s.name_tr || "Gaziantep Diplomasi Forumu 2027",
      s.name_ar || "منتدى غازي عنتاب للدبلوماسية 2027"
    ];
    var phraseField = A.fList(t("marquee.phrases"), phrases, function (phrase) {
      var field = A.fText(t("marquee.phrase"), phrase || "", { required: true });
      return { el: field, get: function () { return field.get().trim() || null; }, validate: function () { return field.validate(); } };
    }, function () { return ""; }, { addLabel: t("marquee.addPhrase") });
    phraseField.classList.add("list-field");
    return U.sectionEditor({ page: "home", key: "marquee", title: t("home.marquee"),
      fields: [
        ["phrases", phraseField],
        ["logo_url", A.fImage(t("marquee.logo"), s.logo_url || "images/logo.webp", { folder: "home/marquee" })],
        ["duration", A.fText(t("marquee.duration"), s.duration || 28, { type: "number", required: true }), function (v) { return Math.max(12, Math.min(90, Number(v) || 28)); }]
      ] });
  }
  var HOME_SECTIONS = function () { return [["hero", t("home.hero")], ["president", t("home.president")], ["venue", t("home.venue")], ["sponsors", t("sp.section")], ["marquee", t("home.marquee")]]; };
  A.register("home", { group: "website", icon: "◈", title: "nav.home", preview: "./", render: function (view) {
    view.appendChild(A.tabs([
      { key: "hero", label: t("home.hero"), render: function (host) { U.editorPage(host, [heroEditor()]); } },
      { key: "president", label: t("home.president"), render: function (host) { U.editorPage(host, [presidentEditor()]); } },
      { key: "venue", label: t("home.venue"), render: function (host) { U.editorPage(host, [venueEditor()]); } },
      { key: "sponsors", label: t("nav.sponsors"), render: function (host) { host.appendChild(h("p", null, h("button", { type: "button", class: "btn", on: { click: function () { A.go("sponsors"); } } }, t("nav.sponsors") + " →"))); } },
      { key: "marquee", label: t("home.marquee"), render: function (host) { U.editorPage(host, [marqueeEditor()]); } },
      { key: "sections", label: t("home.sections"), render: function (host) { U.managerPage(host, U.sectionsManager("home", HOME_SECTIONS())); } }
    ]));
  } });
  A.register("president", { group: "website", icon: "✉", title: "nav.president", preview: "president/", render: function (view) { U.editorPage(view, [presidentEditor()]); } });

  /* ==================================================================== */
  /* FOOTER                                                               */
  /* ==================================================================== */
  var PLATFORMS = ["instagram", "facebook", "x", "linkedin", "youtube", "tiktok", "whatsapp", "website"];
  A.register("footer", { group: "website", icon: "▁", title: "nav.footer", preview: "./#contact", render: function (view) {
    var section = function () { return A.section("global", "footer").settings || {}; };
    var quickLinks = [["home", "nav.home"], ["applications", "nav.applications"], ["committees", "nav.committees"],
      ["about", "nav.about"], ["team", "nav.team"], ["faq", "nav.faq"], ["verify", "nav.verify"]];
    var quickFields = function (s) {
      return [["show_quick", A.fToggle(t("ft.showQuick"), s.show_quick !== false)]].concat(quickLinks.map(function (item) {
        return ["show_quick_" + item[0], A.fToggle(t("ft.showLink") + " · " + t(item[1]), s["show_quick_" + item[0]] !== false)];
      }));
    };
    var phonesField = function (s) {
      var phones = A.fList(t("ft.phones"), s.phones || ["+90 582 206 43 00", "+90 501 335 54 73"], function (p) {
        var f = A.fText("", p, { dir: "ltr", placeholder: "+90 …" });
        return { el: f, get: function () { return f.get() || null; } };
      }, function () { return ""; });
      phones.classList.add("list-field");
      return phones;
    };
    var socialsField = function (s) {
      var socials = A.fList(t("ft.socials"), s.socials || [{ platform: "instagram", url: "https://www.instagram.com/gdf.2027?mdxt=dXg1OGZkbHh3Mmhx", label: "GDF'27" }], function (x) {
        var pf = A.fSelect(t("ft.platform"), x.platform || "instagram", PLATFORMS.map(function (p) { return [p, p.charAt(0).toUpperCase() + p.slice(1)]; }));
        var url = A.fText(t("f.url"), x.url || "", { url: true, https: true, required: true });
        var label = A.fText(t("f.label"), typeof x.label === "string" ? x.label : A.tx(x.label));
        return { el: h("div", { class: "grid grid-3" }, pf, url, label), get: function () { return { platform: pf.get(), url: url.get(), label: label.get() }; }, validate: function () { return url.validate(); } };
      }, function () { return { platform: "instagram", url: "" }; });
      socials.classList.add("list-field");
      return socials;
    };
    var editor = function (host, title, s, fields, texts, validate) {
      U.editorPage(host, [U.sectionEditor({ page: "global", key: "footer", title: title, visible: false,
        fields: fields, texts: texts, validate: validate })]);
    };

    view.appendChild(A.tabs([
      { key: "brand", label: t("ft.brand"), render: function (host) {
        var s = section();
        editor(host, t("ft.brand"), s, [
          ["logo_url", A.fImage(t("ft.logo"), s.logo_url || "images/logo.webp", { folder: "global" })],
          ["show_logo", A.fToggle(t("ft.showLogo"), s.show_logo !== false)],
          ["show_name", A.fToggle(t("ft.showName"), s.show_name !== false)],
          ["show_description", A.fToggle(t("ft.showDescription"), s.show_description !== false)]
        ], [["brand.name"], ["footer.desc", null, { multiline: true }]]);
      } },
      { key: "contact", label: t("ft.contact"), render: function (host) {
        var s = section();
        editor(host, t("ft.contact"), s, [
          ["address", A.fText(t("venue.address"), s.address || "Osmanlı Mah. Çakmak Küme Evleri İç Kapı No: 5, Şahinbey / Gaziantep")],
          ["email", A.fText(t("venue.email"), s.email || "gdf27.official@gmail.com", { type: "email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })],
          ["phones", phonesField(s)],
          ["show_contact", A.fToggle(t("ft.showContact"), s.show_contact !== false)],
          ["show_school", A.fToggle(t("ft.showSchool"), s.show_school !== false)],
          ["show_address", A.fToggle(t("ft.showAddress"), s.show_address !== false)],
          ["show_email", A.fToggle(t("ft.showEmail"), s.show_email !== false)],
          ["show_phones", A.fToggle(t("ft.showPhones"), s.show_phones !== false)]
        ], [["footer.contact"], ["lbl.school"], ["venue.school"], ["lbl.address"], ["lbl.email"], ["lbl.phone"]]);
      } },
      { key: "quick", label: t("ft.quick"), render: function (host) {
        var s = section();
        editor(host, t("ft.quick"), s, quickFields(s), [["footer.quick"]].concat(quickLinks.map(function (item) { return [item[1]]; })));
      } },
      { key: "social", label: t("ft.socials"), render: function (host) {
        var s = section(), socials = socialsField(s);
        editor(host, t("ft.socials"), s, [
          ["socials", socials],
          ["show_social", A.fToggle(t("ft.showSocial"), s.show_social !== false)]
        ], [["footer.follow"]], function () { return socials.validate(); });
      } },
      { key: "credits", label: t("ft.credits"), render: function (host) {
        var s = section();
        editor(host, t("ft.credits"), s, [
          ["show_copyright", A.fToggle(t("ft.showCopyright"), s.show_copyright !== false)],
          ["show_credit", A.fToggle(t("ft.showCredit"), s.show_credit !== false)],
          ["show_made", A.fToggle(t("ft.showMade"), s.show_made !== false)],
          ["show_design", A.fToggle(t("ft.showDesign"), s.show_design !== false)]
        ], [["footer.copy"], ["footer.made"], ["footer.design"]]);
      } }
    ]));
  } });

  /* ==================================================================== */
  /* SEO MANAGEMENT                                                       */
  /* ==================================================================== */
  var SEO_PAGES = [
    ["home", "./"], ["about", "about/"], ["applications", "applications/"], ["committees", "committees/"],
    ["president", "president/"], ["team", "team/"], ["faq", "faq/"], ["verify", "verify/"], ["certificate", "certificate/"], ["404", "404.html"]
  ];
  A.register("seo", { group: "website", icon: "◔", title: "ucms.nav.seo", render: function (view) {
    var ROBOTS = /^(index|noindex|follow|nofollow|none|noarchive|max-snippet:\d+|max-image-preview:\w+)(\s*,\s*(index|noindex|follow|nofollow|none|noarchive|max-snippet:\d+|max-image-preview:\w+))*$/i;
    var loaded = {};
    view.appendChild(h("p", { class: "muted" }, t("ucms.seo.sub")));
    if (!A.can.settings) view.appendChild(h("div", { class: "banner", style: { margin: "0 0 16px" } }, t("ucms.settings.adminOnly")));
    /* Load the existing SEO settings BEFORE the tabs render, otherwise the
       first tab shows empty fields even when values are stored. */
    return db.from("site_settings").select("key,value").like("key", "seo.%").then(function (r) {
      if (r.error) throw r.error;
      (r.data || []).forEach(function (x) { loaded[x.key] = x.value || {}; });
      var tabs = SEO_PAGES.map(function (p) {
        return { key: p[0], label: p[0] + " (" + p[1] + ")", render: function (host) { renderPage(host, p[0]); } };
      });
      view.appendChild(A.tabs(tabs));
    });

    function renderPage(host, pageKey) {
      var key = "seo." + pageKey;
      var v = loaded[key] || {};
      var title = A.fText(t("ucms.seo.seoTitle"), v.title || "", { placeholder: "GDF'27 — Gaziantep Diplomacy Forum 2027" });
      var desc = A.fText(t("ucms.seo.seoDesc"), v.description || "", { multiline: true, rows: 3 });
      var canonical = A.fText(t("ucms.seo.canonical"), v.canonical || "", { url: true, placeholder: "https://…" });
      var ogTitle = A.fText(t("ucms.seo.ogTitle"), v.og_title || "");
      var ogDesc = A.fText(t("ucms.seo.ogDesc"), v.og_description || "", { multiline: true, rows: 2 });
      var ogImage = A.fText(t("ucms.seo.ogImage"), v.og_image || "", { url: true, placeholder: "images/og-image.webp" });
      var robots = A.fText(t("ucms.seo.robots"), v.robots || "", { placeholder: t("ucms.seo.robotsHelp"), help: t("ucms.seo.robotsHelp") });
      var warn = h("p", { class: "muted small", role: "status" });
      var preview = h("div", { class: "seo-preview", "aria-hidden": "true" },
        h("div", { class: "sp-url" }, (v.canonical || new URL(pageKey === "home" ? "./" : SEO_PAGES.filter(function (x) { return x[0] === pageKey; })[0][1], document.baseURI).href)),
        h("div", { class: "sp-title" }, v.title || pageKey),
        h("div", { class: "sp-desc" }, v.description || ""));
      function refresh() {
        preview.querySelector(".sp-title").textContent = title.get() || pageKey;
        preview.querySelector(".sp-desc").textContent = desc.get() || "";
        var msgs = [];
        if (title.get().length > 60) msgs.push(t("ucms.seo.titleLong"));
        if (desc.get().length > 160) msgs.push(t("ucms.seo.descLong"));
        warn.textContent = msgs.join(" ");
      }
      [title, desc, canonical, ogTitle, ogDesc, ogImage, robots].forEach(function (f) { f.input.addEventListener("input", function () { refresh(); preview.querySelector(".sp-url").textContent = canonical.get() || preview.querySelector(".sp-url").textContent; }); });
      var bar = A.saveBar(function () {
        if (!A.validateAll([title, desc, canonical, ogTitle, ogDesc, ogImage, robots])) return false;
        if (robots.get() && !ROBOTS.test(robots.get())) { A.toast(t("ucms.seo.robotsInvalid"), "error"); return false; }
        var value = {};
        if (title.get()) value.title = title.get();
        if (desc.get()) value.description = desc.get();
        if (canonical.get()) value.canonical = canonical.get();
        if (ogTitle.get()) value.og_title = ogTitle.get();
        if (ogDesc.get()) value.og_description = ogDesc.get();
        if (ogImage.get()) value.og_image = ogImage.get();
        if (robots.get()) value.robots = robots.get();
        return A.saveSetting(key, value, "SEO for " + pageKey).then(function () {
          loaded[key] = value;
          U.audit("seo.save", "site_settings", key, pageKey, {});
          A.toast(t("ucms.seo.saved"), "ok");
        });
      });
      host.appendChild(A.card(t("ucms.seo.title") + " · " + pageKey, [A.grid(2, [title, desc, canonical, ogTitle, ogDesc, ogImage, robots]), warn, preview, bar]));
      refresh();
    }
  } });

  /* ==================================================================== */
  /* GLOBAL WEBSITE SETTINGS (site_settings key/value editor)             */
  /* ==================================================================== */
  A.register("settings", { group: "website", icon: "⚙", title: "ucms.nav.settings", render: function (view) {
    var list = h("div", { class: "rows" });
    view.appendChild(A.card(t("ucms.settings.title"), [list], { help: t("ucms.settings.sub") }));
    if (!A.can.settings) view.appendChild(h("div", { class: "banner" }, t("ucms.settings.adminOnly")));
    function load() {
      return db.from("site_settings").select("*").order("key").then(function (r) {
        if (r.error) throw r.error;
        list.innerHTML = "";
        (r.data || []).forEach(function (s) {
          list.appendChild(A.row({ id: s.key, draggable: false,
            title: s.key, sub: (s.label || "") + " · " + (s.updated_at ? A.fmtDateTime(s.updated_at) : ""),
            actions: h("button", { type: "button", class: "btn btn-sm", on: { click: function () { edit(s); } } }, t("btn.edit")) }));
        });
        if (!(r.data || []).length) list.appendChild(h("div", { class: "empty" }, t("msg.empty")));
      }).catch(A.fail);
    }
    function edit(s) {
      var value = h("textarea", { rows: 8, class: "code-input", "aria-label": t("ucms.settings.value") });
      value.value = JSON.stringify(s.value, null, 2);
      var label = A.fText(t("ucms.settings.label"), s.label || "");
      A.modal({ title: s.key, body: h("div", { class: "grid" }, h("label", { class: "field" }, h("span", null, t("ucms.settings.value")), value), label), actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (m) { m.close(); } },
        { label: t("btn.save"), cls: "btn-gold", onClick: function (m, btn) {
          var parsed;
          try { parsed = JSON.parse(value.value); } catch (e) { A.toast(t("ucms.settings.invalidJson"), "error"); return; }
          A.busy(btn, true);
          A.saveSetting(s.key, parsed, label.get() || s.label).then(function () {
            U.audit("settings.update", "site_settings", s.key, s.key, {});
            A.busy(btn, false); m.close(); A.toast(t("msg.saved"), "ok"); load();
            A.preview.reload();
          }).catch(function (e) { A.busy(btn, false); A.fail(e); });
        } }] });
    }
    return load();
  } });
})();
