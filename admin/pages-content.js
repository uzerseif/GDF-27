/* =====================================================================
   GDF'27 UCMS — Content Management (group "content"):
   About, President, Team, Sponsors & Partners, Committees, Applications,
   FAQs, Website Texts, Translations (coverage overview).
   ===================================================================== */
(function () {
  "use strict";
  var A = window.CMSA, h = A.h, t = A.t, db = A.db, U = A.U;

  /* ==================================================================== */
  /* APPLICATIONS                                                         */
  /* ==================================================================== */
  var APP_BULLETS = ["app.b1", "app.b2", "app.b3", "app.b4", "app.b5", "app.b6", "app.b7"];
  function appFields(r) {
    return [
      ["title", A.fI18n(t("f.title"), r.title, { required: true })],
      ["description", A.fI18n(t("f.description"), r.description, { multiline: true })],
      ["button_label", A.fI18n(t("app.btn"), r.button_label, { placeholder: "Apply Now" })],
      ["form_url", A.fText(t("app.form"), r.form_url, { url: true, https: true, required: true })],
      ["image_url", A.fImage(t("f.image"), r.image_url, { folder: "applications" })],
      ["opens_at", A.fText(t("app.opens"), U.toLocalInput(r.opens_at), { type: "datetime-local" }), function (f) { return U.fromLocalInput(f.get()); }],
      ["closes_at", A.fText(t("app.closes"), U.toLocalInput(r.closes_at), { type: "datetime-local" }), function (f) { return U.fromLocalInput(f.get()); }]
    ];
  }
  A.register("applications", { group: "content", icon: "↗", title: "nav.applications", preview: "applications/", render: function (view) {
    view.appendChild(A.tabs([
      { key: "forms", label: t("app.forms"), render: function (host) {
        return U.tableList(host, { table: "applications", auditType: "applications", title: t("app.forms"), newLabel: t("app.new"), fields: appFields,
          rowInfo: function (r) { var now = Date.now(); var st = r.closes_at && new Date(r.closes_at) < now ? " · closed" : (r.opens_at && new Date(r.opens_at) > now ? " · opens " + new Date(r.opens_at).toLocaleDateString() : ""); return { title: A.tx(r.title), sub: (r.form_url || "") + st, thumb: r.image_url || "" }; } });
      } },
      { key: "info", label: t("app.info"), render: function (host) {
        var s = A.section("applications", "info").settings || {};
        var defaults = U.textsDefaultList(APP_BULLETS);
        var bullets = A.fList(t("app.bullets"), Array.isArray(s.bullets) && s.bullets.length ? s.bullets : defaults, U.i18nItem(t("app.bullets"), { multiline: true, rows: 2 }), function () { return {}; });
        bullets.classList.add("list-field");
        U.editorPage(host, [U.sectionEditor({ page: "applications", key: "info", title: t("app.info"), image: true,
          fields: [["bullets", bullets, function (v) { return U.same(v, defaults) ? "" : v; }], ["protocol_url", A.fText(t("app.protocol"), s.protocol_url || "", { url: true, placeholder: "https://…/protocol.pdf" })], ["show_protocol", A.fToggle(t("app.showProtocol"), s.show_protocol !== false)]],
          texts: [["app.info.h"], ["app.download"]] })]);
      } },
      { key: "page", label: t("app.page"), render: function (host) {
        U.editorPage(host, [U.sectionEditor({ page: "applications", key: "cards", title: t("app.cards"), image: true, texts: [["nav.applications", t("app.page")], ["app.apply_now"], ["app.delegation"], ["app.delegate"], ["app.press"], ["app.chair"]],
          help: "The four original cards are shown only while the Application forms list is empty." })]);
      } },
      { key: "sections", label: t("home.sections"), render: function (host) { U.managerPage(host, U.sectionsManager("applications", [["cards", t("app.cards")], ["info", t("app.info")]])); } }
    ]));
  } });

  /* ==================================================================== */
  /* CERTIFICATES                                                         */
  /* ==================================================================== */
  A.register("certificates", { group: "content", icon: "▧", title: "nav.certificates", render: function (view) {
    var verifyConfig = window.GDF_VERIFY_SUPABASE || {};
    var cmsConfig = window.GDF_SUPABASE || {};
    var certUrl = (verifyConfig.url || "").replace(/\/$/, "");
    var cmsUrl = (cmsConfig.url || "").replace(/\/$/, "");
    if (!certUrl || certUrl !== cmsUrl) {
      view.appendChild(A.card(t("cert.title"), h("p", { class: "banner" }, t("cert.sameProject"))));
      return Promise.resolve();
    }
    var canCreate = A.canM("certificates", "create");
    var canEdit = A.canM("certificates", "edit");
    var canDelete = A.canM("certificates", "delete");

    var list = h("div", { class: "rows" });
    var search = h("input", { type: "search", class: "search", placeholder: t("cert.search") });
    var csvInput = canCreate ? h("input", { type: "file", accept: ".csv,text/csv", hidden: true, "data-nodirty": "1" }) : null;
    var csvButton = canCreate ? h("button", { type: "button", class: "btn btn-ghost", on: { click: function () { csvInput.click(); } } }, t("cert.import")) : null;
    var rows = [];

    function parseCertificateCsv(text) {
      var records = [], row = [], field = "", quoted = false, quoteClosed = false, line = 1, rowLine = 1;
      text = String(text || "").replace(/^\uFEFF/, "");
      function pushRow() {
        row.push(field);
        if (row.some(function (value) { return value.trim() !== ""; })) records.push({ line: rowLine, cells: row });
        row = [];
        field = "";
        quoteClosed = false;
      }
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (quoted) {
          if (ch === '"' && text.charAt(i + 1) === '"') { field += '"'; i++; }
          else if (ch === '"') { quoted = false; quoteClosed = true; }
          else { field += ch; if (ch === "\n") line++; }
          continue;
        }
        if (quoteClosed) {
          if (ch === ",") { row.push(field); field = ""; quoteClosed = false; }
          else if (ch === "\r" || ch === "\n") {
            pushRow();
            if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
            line++; rowLine = line;
          } else if (ch !== " " && ch !== "\t") throw new Error(t("cert.csvMalformed").replace("%d", line));
          continue;
        }
        if (ch === '"') {
          if (field.trim()) throw new Error(t("cert.csvMalformed").replace("%d", line));
          field = "";
          quoted = true;
        } else if (ch === ",") {
          row.push(field); field = "";
        } else if (ch === "\r" || ch === "\n") {
          pushRow();
          if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
          line++; rowLine = line;
        } else field += ch;
      }
      if (quoted) throw new Error(t("cert.csvMalformed").replace("%d", line));
      pushRow();
      if (!records.length) throw new Error(t("cert.csvEmpty"));

      var headers = records.shift(), index = Object.create(null);
      headers.cells.forEach(function (name, i) {
        name = name.trim().toLowerCase();
        if (!name) return;
        if (index[name] !== undefined) throw new Error(t("cert.csvDuplicateHeader").replace("%s", name));
        index[name] = i;
      });
      if (index.certificate_id === undefined || index.recipient_name === undefined) throw new Error(t("cert.csvMissingHeaders"));
      var ids = Object.create(null);
      var fields = ["certificate_id", "recipient_name", "course_name", "committee_name", "conference_name",
        "represented_country", "performance_summary", "certificate_type", "certificate_image", "issue_date", "status"];
      var result = records.map(function (record) {
        if (record.cells.length > headers.cells.length) throw new Error(t("cert.csvRowColumns").replace("%d", record.line));
        var values = {};
        fields.forEach(function (key) {
          var i = index[key];
          values[key] = i === undefined ? "" : String(record.cells[i] || "").trim();
        });
        values.certificate_id = values.certificate_id.replace(/\s+/g, "").toUpperCase();
        values.recipient_name = values.recipient_name.trim();
        if (!values.certificate_id || !values.recipient_name) throw new Error(t("cert.csvRequired").replace("%d", record.line));
        if (ids[values.certificate_id]) throw new Error(t("cert.csvDuplicateId").replace("%d", record.line));
        ids[values.certificate_id] = true;
        if (values.issue_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.issue_date)) {
          throw new Error(t("cert.csvDate").replace("%d", record.line));
        }
        if (values.issue_date) {
          var dateParts = values.issue_date.split("-").map(Number), date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
          if (date.getUTCFullYear() !== dateParts[0] || date.getUTCMonth() !== dateParts[1] - 1 || date.getUTCDate() !== dateParts[2]) {
            throw new Error(t("cert.csvDate").replace("%d", record.line));
          }
        }
        values.status = (values.status || "valid").toLowerCase();
        if (["valid", "revoked", "expired"].indexOf(values.status) < 0) throw new Error(t("cert.csvStatus").replace("%d", record.line));
        if (values.certificate_image && !A.validUrl(values.certificate_image)) throw new Error(t("cert.csvImage").replace("%d", record.line));
        fields.forEach(function (key) {
          if (key !== "certificate_id" && key !== "recipient_name" && key !== "status") values[key] = values[key] || null;
        });
        values.conference_name = values.conference_name || "GDF'27";
        return values;
      });
      if (!result.length) throw new Error(t("cert.csvEmpty"));
      return result;
    }

    function importCsv(file) {
      if (!file) return;
      A.busy(csvButton, true, t("cert.importing"));
      var reader = new FileReader();
      reader.onerror = function () {
        A.busy(csvButton, false);
        csvInput.value = "";
        A.toast(t("cert.csvReadError"), "error");
      };
      reader.onload = function () {
        var records;
        try { records = parseCertificateCsv(reader.result); }
        catch (error) {
          A.busy(csvButton, false);
          csvInput.value = "";
          A.toast(t("cert.csvInvalid").replace("%s", error.message), "error");
          return;
        }
        db.from("certificates").insert(records).then(function (result) {
          if (result.error) throw result.error;
          U.audit("certificates.import", "certificates", "CSV", records.length + " certificates", { count: records.length });
          A.toast(t("cert.csvImported").replace("%d", records.length), "ok");
          return load();
        }).catch(A.fail).then(function () {
          A.busy(csvButton, false);
          csvInput.value = "";
        });
      };
      reader.readAsText(file, "UTF-8");
    }

    function renderRows() {
      list.innerHTML = "";
      var query = search.value.trim().toLowerCase();
      var shown = rows.filter(function (r) {
        return !query || [r.certificate_id, r.recipient_name, r.committee_name, r.represented_country]
          .join(" ").toLowerCase().indexOf(query) !== -1;
      });
      if (!shown.length) {
        list.appendChild(h("div", { class: "empty" }, t("msg.empty")));
        return;
      }
      shown.forEach(function (r) {
        list.appendChild(A.row({
          id: r.id,
          draggable: false,
          title: r.recipient_name,
          sub: r.certificate_id + " · " + (r.committee_name || r.course_name || "") + " · " + r.status,
          thumb: r.certificate_image || "",
          onEdit: canEdit ? function () { editCertificate(r); } : null,
          onDelete: canDelete ? function () {
            A.confirm(t("msg.confirmDelete"), t("btn.delete")).then(function (ok) {
              if (!ok) return;
              db.from("certificates").delete().eq("id", r.id).then(function (result) {
                if (result.error) return A.fail(result.error);
                U.audit("certificates.delete", "certificates", r.certificate_id, r.recipient_name, {});
                A.toast(t("msg.deleted"), "ok");
                load();
              });
            });
          } : null,
          actions: canEdit ? h("button", { type: "button", class: "btn btn-sm btn-ghost", on: { click: function () { showVersions(r); } } }, t("wf.versions")) : null
        }));
      });
    }

    function load() {
      return db.from("certificates").select("*").order("recipient_name").then(function (result) {
        if (result.error) throw result.error;
        rows = result.data || [];
        renderRows();
      }).catch(A.fail);
    }

    /* version history (certificates are versioned like the other content) */
    function showVersions(r) {
      var box = h("div", { class: "rows" }, h("div", { class: "empty" }, h("span", { class: "spinner sm" })));
      A.modal({ title: t("wf.versions") + " · " + r.recipient_name, body: box, size: "md" });
      db.from("content_revisions").select("version,action,snapshot,changed_by_email,created_at")
        .eq("table_name", "certificates").eq("record_id", r.id).order("version", { ascending: false }).limit(50)
        .then(function (res) {
          if (res.error) { box.innerHTML = ""; box.appendChild(h("div", { class: "empty" }, res.error.message)); return; }
          box.innerHTML = "";
          if (!(res.data || []).length) { box.appendChild(h("div", { class: "empty" }, t("wf.noVersions"))); return; }
          res.data.forEach(function (v) {
            box.appendChild(A.row({ id: v.version, draggable: false,
              title: t("wf.versionN").replace("%d", v.version) + " · " + t("wf." + (v.action === "create" ? "created" : v.action === "restore" ? "restored" : "saved")),
              sub: (v.changed_by_email || "—") + " · " + A.fmtDateTime(v.created_at),
              actions: v.version === (r.content_version || 0) ? A.badge(t("ucms.common.current"), "ok")
                : h("button", { type: "button", class: "btn btn-sm", on: { click: function () {
                  A.confirm(t("wf.confirmRestore").replace("%d", v.version), t("wf.restore"), false).then(function (ok) {
                    if (!ok) return;
                    db.rpc("restore_content_version", { p_table_name: "certificates", p_record_id: String(r.id), p_version: v.version })
                      .then(function (res2) {
                        if (res2.error) throw res2.error;
                        U.audit("content.version.restore", "certificates", r.id, r.recipient_name, { version: v.version });
                        A.toast(t("wf.restoredMsg").replace("%d", v.version), "ok");
                        document.querySelectorAll(".modal-backdrop").forEach(function (m) { m.remove(); });
                        load();
                      }).catch(function (e) { A.fail(e); });
                  });
                } } }, t("wf.restore")) }));
          });
        }).catch(A.fail);
    }

    function editCertificate(existing) {
      var isNew = !existing;
      var record = existing || {};
      var fields = [
        ["certificate_id", A.fText(t("cert.id"), record.certificate_id, { required: true })],
        ["recipient_name", A.fText(t("cert.recipient"), record.recipient_name, { required: true })],
        ["course_name", A.fText(t("cert.course"), record.course_name)],
        ["committee_name", A.fText(t("cert.committee"), record.committee_name)],
        ["conference_name", A.fText(t("cert.conference"), record.conference_name || "GDF'27")],
        ["represented_country", A.fText(t("cert.country"), record.represented_country)],
        ["performance_summary", A.fText(t("cert.summary"), record.performance_summary, { multiline: true, rows: 3 })],
        ["certificate_type", A.fText(t("cert.type"), record.certificate_type)],
        ["certificate_image", A.fImage(t("cert.image"), record.certificate_image, { folder: "certificates" })],
        ["issue_date", A.fText(t("cert.date"), record.issue_date, { type: "date" })],
        ["status", A.fSelect(t("cert.status"), record.status || "valid", [
          ["valid", t("cert.statusValid")], ["revoked", t("cert.statusRevoked")], ["expired", t("cert.statusExpired")]
        ])]
      ];
      var body = h("div", { class: "grid" }, fields.map(function (f) { return f[1]; }));
      A.modal({ title: isNew ? t("cert.new") : record.recipient_name, body: body, actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (modal) { modal.close(); } },
        { label: t("btn.save"), cls: "btn-gold", onClick: function (modal, button) {
          if (!A.validateAll(fields.map(function (f) { return f[1]; }))) return;
          var data = {};
          fields.forEach(function (f) {
            var value = f[1].get();
            data[f[0]] = value === "" ? null : value;
          });
          data.certificate_id = String(data.certificate_id || "").replace(/\s+/g, "").toUpperCase();
          A.busy(button, true);
          (isNew
            ? db.from("certificates").insert(data)
            : db.from("certificates").update(data).eq("id", record.id)
          ).then(function (result) {
            if (result.error) throw result.error;
            U.audit(isNew ? "certificates.create" : "certificates.update", "certificates", data.certificate_id, data.recipient_name, {});
            modal.close();
            A.toast(t("msg.saved"), "ok");
            return load();
          }).catch(A.fail).then(function () { A.busy(button, false); });
        } }
      ] });
    }

    search.addEventListener("input", renderRows);
    if (csvInput) csvInput.addEventListener("change", function () { importCsv(csvInput.files && csvInput.files[0]); });
    view.appendChild(A.card(t("cert.title"), [
      h("div", { class: "toolbar", "data-nodirty": "1" }, search, csvInput, csvButton,
        canCreate ? h("button", { type: "button", class: "btn btn-gold", on: { click: function () { editCertificate(null); } } }, "+ " + t("cert.new")) : null),
      canCreate ? h("p", { class: "muted small cert-csv-help" }, t("cert.csvHelp")) : null,
      list
    ]));
    return load();
  } });

  /* ==================================================================== */
  /* SPONSORS                                                             */
  /* ==================================================================== */
  function sponsorCats() {
    var s = A.section("home", "sponsors").settings || {};
    return Array.isArray(s.categories) && s.categories.length ? s.categories : [{ slug: "sponsor", label: { en: "Sponsors", ar: "الرعاة", tr: "Sponsorlar" } }, { slug: "partner", label: { en: "Partners", ar: "الشركاء", tr: "Partnerler" } }, { slug: "media", label: { en: "Media partners", ar: "الشركاء الإعلاميون", tr: "Medya partnerleri" } }];
  }
  A.register("sponsors", { group: "content", icon: "✧", title: "nav.sponsors", preview: "./#sponsors", render: function (view) {
    var listHost = h("div"), secHost = h("div");
    view.appendChild(listHost); view.appendChild(secHost);
    var cats = sponsorCats();
    U.tableList(listHost, { table: "sponsors", auditType: "sponsors", title: t("sp.list"), newLabel: t("sp.new"), contain: true,
      fields: function (r) {
        return [
          ["name", A.fText(t("f.name"), r.name, { required: true })],
          ["website_url", A.fText(t("f.website"), r.website_url, { url: true, placeholder: "https://" })],
          ["logo_url", A.fImage(t("f.logo"), r.logo_url, { folder: "sponsors", required: true })],
          ["category", A.fSelect(t("f.category"), r.category || cats[0].slug, cats.map(function (c) { return [c.slug, A.tx(c.label) || c.slug]; }))],
          ["tier", A.fText(t("f.tier"), r.tier)]
        ];
      },
      rowInfo: function (r) { var c = cats.filter(function (x) { return x.slug === r.category; })[0]; return { title: r.name, sub: (c ? A.tx(c.label) : r.category) + (r.tier ? " · " + r.tier : "") + (r.website_url ? " · " + r.website_url : ""), thumb: r.logo_url || "" }; } });
    var s = A.section("home", "sponsors").settings || {};
    var catField = A.fList(t("sp.cats"), cats, function (c) {
      var slug = A.fText(t("f.slug"), c.slug, { required: true, pattern: /^[a-z0-9-]{1,40}$/, patternMsg: t("f.slugHelp") });
      var label = A.fI18n(t("f.label"), c.label || {}, { required: true });
      return { el: h("div", { class: "grid grid-2" }, slug, label), get: function () { return { slug: slug.get(), label: label.get() }; }, validate: function () { return slug.validate() && label.validate(); } };
    }, function () { return { slug: "", label: {} }; });
    catField.classList.add("list-field");
    U.editorPage(secHost, [U.sectionEditor({ page: "home", key: "sponsors", title: t("sp.section"),
      fields: [["show_category_titles", A.fToggle(t("sp.showCats"), s.show_category_titles === true)], ["categories", catField]],
      texts: [["sponsors.title"]], validate: function () { return catField.validate(); } })]);
  } });

  /* ==================================================================== */
  /* ABOUT                                                                */
  /* ==================================================================== */
  var ABOUT_PARTNERS = [
    { logo_url: "images/ugaihl.webp", url: "https://uluslararasigaziantepaihl.meb.k12.tr/", name: { en: "International Gaziantep Anatolian Imam Hatip High School" } },
    { logo_url: "images/giptu.webp", url: "https://www.gibtu.edu.tr/", name: { en: "GAZİANTEP İSLAM BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ" } }
  ];
  var AIMS = ["about.aims.1", "about.aims.2", "about.aims.3", "about.aims.4"];
  A.register("about", { group: "content", icon: "ℹ", title: "nav.about", preview: "about/", render: function (view) {
    view.appendChild(A.tabs([
      { key: "content", label: t("f.texts"), render: function (host) {
        var b = A.section("about", "behind").settings || {}, v = A.section("about", "vmca").settings || {};
        var partners = A.fList(t("about.partners"), Array.isArray(b.partners) && b.partners.length ? b.partners : ABOUT_PARTNERS, function (p) {
          var logo = A.fImage(t("f.logo"), p.logo_url, { folder: "about" }), url = A.fText(t("f.link"), p.url, { url: true }), name = A.fI18n(t("f.name"), p.name || {}, { required: true });
          return { el: h("div", { class: "grid grid-2" }, logo, h("div", { class: "grid" }, name, url)), get: function () { return { logo_url: logo.get(), url: url.get(), name: name.get() }; }, validate: function () { return name.validate() && url.validate(); } };
        }, function () { return { name: {} }; });
        partners.classList.add("list-field");
        var aimDefaults = U.textsDefaultList(AIMS);
        var aims = A.fList(t("about.aims"), Array.isArray(v.aims) && v.aims.length ? v.aims : aimDefaults, U.i18nItem(t("about.aims"), { multiline: true, rows: 2 }), function () { return {}; });
        aims.classList.add("list-field");
        U.editorPage(host, [
          U.sectionEditor({ page: "about", key: "page", title: t("about.page"), visible: false, style: false, texts: [["about.title"], ["title.about"], ["meta.about"]] }),
          U.sectionEditor({ page: "about", key: "overview", title: t("about.overview"), image: true, texts: [["about.overview.h"], ["about.what.p", null, { multiline: true, rows: 6 }]] }),
          U.sectionEditor({ page: "about", key: "behind", title: t("about.behind"), image: true, fields: [["partners", partners, function (x) { return U.same(x, ABOUT_PARTNERS) ? "" : x; }]], texts: [["about.behind.h"], ["alt.school"], ["alt.univ"]], validate: function () { return partners.validate(); } }),
          U.sectionEditor({ page: "about", key: "why", title: t("about.why"), image: true, texts: [["about.why.h"], ["about.why.p", null, { multiline: true, rows: 6 }]] }),
          U.sectionEditor({ page: "about", key: "vmca", title: t("about.vmca"), image: true, fields: [["aims", aims, function (x) { return U.same(x, aimDefaults) ? "" : x; }]], texts: [["about.vmca.h"], ["about.vision.h"], ["about.vision.p", null, { multiline: true }], ["about.mission.h"], ["about.mission.p", null, { multiline: true }], ["about.aims.h"]] })
        ]);
      } },
      { key: "sections", label: t("home.sections"), render: function (host) { U.managerPage(host, U.sectionsManager("about", [["overview", t("about.overview")], ["behind", t("about.behind")], ["why", t("about.why")], ["vmca", t("about.vmca")]])); } }
    ]));
  } });

  /* ==================================================================== */
  /* TEAM                                                                 */
  /* ==================================================================== */
  A.register("team", { group: "content", icon: "♙", title: "nav.team", preview: "team/", render: function (view) {
    var D = { tabs: [], groups: [], placements: [], members: [] }, activeTab = null;
    var tabsList = h("div", { class: "rows" }), groupsHost = h("div"), membersHost = h("div");
    var tabTitle = h("h2"), tabActions = h("div", { class: "toolbar", style: { margin: 0 } });
    function load() {
      return Promise.all([
        db.from("team_tabs").select("*").order("sort_order"),
        db.from("team_groups").select("*").order("sort_order"),
        db.from("team_placements").select("*").order("row_no").order("sort_order"),
        db.from("team_members").select("*").order("sort_order")
      ]).then(function (r) {
        var bad = r.filter(function (x) { return x.error; })[0]; if (bad) throw bad.error;
        D.tabs = r[0].data; D.groups = r[1].data; D.placements = r[2].data; D.members = r[3].data;
        if (!activeTab || !D.tabs.some(function (x) { return x.id === activeTab; })) activeTab = D.tabs[0] && D.tabs[0].id;
        renderTabs(); renderGroups(); renderMembers();
      }).catch(A.fail);
    }
    var member = function (id) { return D.members.filter(function (m) { return m.id === id; })[0]; };
    function renderTabs() {
      tabsList.innerHTML = "";
      D.tabs.forEach(function (tb) {
        var r = A.row({ id: tb.id, title: A.tx(tb.title), sub: tb.slug + " · " + D.placements.filter(function (p) { return p.tab_id === tb.id; }).length,
          badges: tb.is_published ? null : A.badge(t("f.published") + " ✕", "off"),
          onMove: function () { A.saveOrder("team_tabs", tabsList).then(A.preview.reload); },
          onEdit: function (e) { e.stopPropagation(); editTab(tb); },
          onDelete: function (e) { e.stopPropagation(); A.confirm(t("msg.confirmDelete") + " (" + A.tx(tb.title) + ")", t("btn.delete")).then(function (ok) { if (ok) db.from("team_tabs").delete().eq("id", tb.id).then(done); }); } });
        r.classList.add("tab-row"); if (tb.id === activeTab) r.classList.add("active");
        r.style.cursor = "pointer";
        r.addEventListener("click", function (e) { if (e.target.closest("button")) return; activeTab = tb.id; renderTabs(); renderGroups(); });
        tabsList.appendChild(r);
      });
      if (!D.tabs.length) tabsList.appendChild(h("div", { class: "empty" }, t("msg.empty")));
    }
    function done(x) { if (x && x.error) return A.fail(x.error); A.toast(t("msg.saved"), "ok"); A.preview.reload(); return load(); }
    function placementRow(p) {
      var m = member(p.member_id); if (!m) return null;
      var r = A.row({ id: p.id, title: A.tx(m.name), sub: A.tx(m.role), thumb: m.photo_url || "",
        badges: m.is_published ? null : A.badge(t("f.published") + " ✕", "off"),
        onMove: function (row) { saveGroupOrder(row.parentNode, row.getAttribute("data-id")); },
        onEdit: function () { editMember(m); },
        onDelete: function () { A.confirm(t("msg.confirmDelete"), t("btn.delete")).then(function (ok) { if (ok) db.from("team_placements").delete().eq("id", p.id).then(done); }); } });
      return r;
    }
    /* The list order becomes sort_order; a moved member joins the row (row_no) of the member it was placed next to. */
    function saveGroupOrder(list, movedId) {
      var gid = list.getAttribute("data-group") || null;
      var ids = A.$$(":scope > .row", list).map(function (r) { return r.getAttribute("data-id"); });
      var pmap = {}; D.placements.forEach(function (p) { pmap[p.id] = p; });
      var rowNo = {}; ids.forEach(function (id) { rowNo[id] = pmap[id] ? pmap[id].row_no : 0; });
      if (movedId && pmap[movedId]) {
        var i = ids.indexOf(movedId), mp = pmap[movedId];
        var before = D.placements.filter(function (p) { return p.tab_id === mp.tab_id && (p.group_id || null) === gid; }).map(function (p) { return p.id; });
        var oldIdx = before.indexOf(movedId);
        var movedUp = oldIdx < 0 ? true : i < oldIdx;
        var nb = movedUp ? (ids[i + 1] || ids[i - 1]) : (ids[i - 1] || ids[i + 1]);
        if (nb) rowNo[movedId] = rowNo[nb];
      }
      return A.saveOrder("team_placements", list, function (id) { return { group_id: gid, row_no: rowNo[id] || 0 }; }).then(function () { A.preview.reload(); return load(); });
    }
    function groupBlock(g, items) {
      var list = h("div", { class: "rows", "data-group": g ? g.id : "" });
      items.forEach(function (p) { var r = placementRow(p); if (r) list.appendChild(r); });
      if (!items.length) list.appendChild(h("div", { class: "empty" }, t("msg.empty")));
      A.sortable(list, function (row, target) { saveGroupOrder(target, row.getAttribute("data-id")); }, "team-placements");
      var head = h("div", { class: "g-head" },
        g && g.image_url ? h("img", { class: "r-thumb contain", src: g.image_url, alt: "" }) : null,
        h("div", { class: "r-main" }, h("div", { class: "r-title" }, g ? (A.tx(g.title) || (t("team.group") + " " + (D.groups.filter(function (x) { return x.tab_id === g.tab_id; }).indexOf(g) + 1))) : t("team.noGroup"), g && !g.is_published ? A.badge(t("f.published") + " ✕", "off") : null), g && A.tx(g.description) ? h("div", { class: "r-sub" }, A.tx(g.description)) : null),
        g ? h("div", { class: "r-actions" },
          h("button", { type: "button", class: "icon-btn", title: t("btn.up"), on: { click: function () { moveGroup(g, -1); } } }, "↑"),
          h("button", { type: "button", class: "icon-btn", title: t("btn.down"), on: { click: function () { moveGroup(g, 1); } } }, "↓"),
          h("button", { type: "button", class: "icon-btn", title: t("btn.edit"), on: { click: function () { editGroup(g); } } }, "✎"),
          h("button", { type: "button", class: "icon-btn danger", title: t("btn.delete"), on: { click: function () { A.confirm(t("msg.confirmDelete"), t("btn.delete")).then(function (ok) { if (ok) db.from("team_groups").delete().eq("id", g.id).then(done); }); } } }, "🗑")) : null);
      return h("div", { class: "group-card" }, head, list);
    }
    function moveGroup(g, dir) {
      var gs = D.groups.filter(function (x) { return x.tab_id === g.tab_id; });
      var i = gs.indexOf(g), j = i + dir;
      if (j < 0 || j >= gs.length) return;
      gs.splice(j, 0, gs.splice(i, 1)[0]);
      Promise.all(gs.map(function (x, k) { return db.from("team_groups").update({ sort_order: k }).eq("id", x.id); })).then(function (res) { var b = res.filter(function (x) { return x.error; })[0]; done(b); });
    }
    function renderGroups() {
      groupsHost.innerHTML = "";
      var tb = D.tabs.filter(function (x) { return x.id === activeTab; })[0];
      tabTitle.textContent = tb ? A.tx(tb.title) : "";
      tabActions.innerHTML = "";
      if (!tb) { groupsHost.appendChild(h("div", { class: "empty" }, t("msg.empty"))); return; }
      tabActions.appendChild(h("button", { type: "button", class: "btn btn-sm", on: { click: function () { editGroup(null); } } }, "+ " + t("team.newGroup")));
      tabActions.appendChild(h("button", { type: "button", class: "btn btn-sm btn-gold", on: { click: function () { editMember(null, { tab_id: tb.id }); } } }, "+ " + t("team.newMember")));
      var groups = D.groups.filter(function (g) { return g.tab_id === tb.id; });
      var places = D.placements.filter(function (p) { return p.tab_id === tb.id; });
      groups.forEach(function (g) { groupsHost.appendChild(groupBlock(g, places.filter(function (p) { return p.group_id === g.id; }))); });
      var loose = places.filter(function (p) { return !p.group_id || !groups.some(function (g) { return g.id === p.group_id; }); });
      if (loose.length || !groups.length) groupsHost.appendChild(groupBlock(null, loose));
    }
    function renderMembers() {
      membersHost.innerHTML = "";
      var list = h("div", { class: "rows" });
      D.members.forEach(function (m) {
        var tabs = D.placements.filter(function (p) { return p.member_id === m.id; }).map(function (p) { var tb = D.tabs.filter(function (x) { return x.id === p.tab_id; })[0]; return tb ? A.tx(tb.title) : ""; }).filter(Boolean);
        list.appendChild(A.row({ id: m.id, draggable: false, title: A.tx(m.name), sub: A.tx(m.role) + " · " + (tabs.length ? tabs.join(", ") : t("team.unplaced")), thumb: m.photo_url || "",
          badges: m.is_published ? null : A.badge(t("f.published") + " ✕", "off"),
          onEdit: function () { editMember(m); },
          onDelete: function () { A.confirm(t("msg.confirmDelete") + " (" + A.tx(m.name) + ")", t("btn.delete")).then(function (ok) { if (ok) db.from("team_members").delete().eq("id", m.id).then(done); }); } }));
      });
      if (!list.children.length) list.appendChild(h("div", { class: "empty" }, t("msg.noSearch")));
      membersHost.appendChild(list);
    }
    function editTab(tb) {
      var isNew = !tb; tb = tb || {};
      var title = A.fI18n(t("f.title"), tb.title, { required: true });
      var slug = A.fText(t("f.slug"), tb.slug || "", { required: true, pattern: /^[a-z0-9-]+$/, patternMsg: t("f.slugHelp"), help: t("f.slugHelp") });
      if (isNew) title.inputs.en.addEventListener("input", function () { slug.set(A.slugify(title.inputs.en.value)); });
      var desc = A.fI18n(t("f.description"), tb.description, { multiline: true, rows: 3 });
      var pub = A.fToggle(t("f.published"), tb.is_published !== false);
      if (!A.canM("content", "publish")) pub.input.disabled = true; /* enforced server-side too */
      A.modal({ title: isNew ? t("team.newTab") : A.tx(tb.title), body: h("div", { class: "grid" }, title, slug, desc, pub), actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (m) { m.close(); } },
        { label: t("btn.save"), cls: "btn-gold", onClick: function (m, btn) {
          if (!A.validateAll([title, slug])) return;
          var rec = { title: title.get(), slug: slug.get(), description: desc.getOrNull(), is_published: pub.get() };
          if (isNew) rec.sort_order = D.tabs.length;
          A.busy(btn, true);
          (isNew ? db.from("team_tabs").insert(rec).select().single() : db.from("team_tabs").update(rec).eq("id", tb.id).select().single()).then(function (x) {
            A.busy(btn, false); if (x.error) return A.fail(x.error);
            U.audit(isNew ? "content.team.tab_create" : "content.team.tab_update", "team_tabs", x.data.id, A.tx(rec.title) || rec.slug, {});
            m.close(); if (isNew) activeTab = x.data.id; done();
          });
        } }] });
    }
    function editGroup(g) {
      var isNew = !g; g = g || {};
      var title = A.fI18n(t("team.groupTitle"), g.title), desc = A.fI18n(t("f.description"), g.description, { multiline: true, rows: 3 });
      var img = A.fImage(t("f.image"), g.image_url, { folder: "team/units" }), pub = A.fToggle(t("f.published"), g.is_published !== false);
      if (!A.canM("content", "publish")) pub.input.disabled = true;
      A.modal({ title: isNew ? t("team.newGroup") : (A.tx(g.title) || t("team.group")), body: h("div", { class: "grid" }, title, desc, img, pub), actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (m) { m.close(); } },
        { label: t("btn.save"), cls: "btn-gold", onClick: function (m, btn) {
          var rec = { title: title.getOrNull(), description: desc.getOrNull(), image_url: img.get() || null, is_published: pub.get() };
          if (isNew) { rec.tab_id = activeTab; rec.sort_order = D.groups.filter(function (x) { return x.tab_id === activeTab; }).length; }
          A.busy(btn, true);
          (isNew ? db.from("team_groups").insert(rec) : db.from("team_groups").update(rec).eq("id", g.id)).then(function (x) { A.busy(btn, false); if (x.error) return A.fail(x.error); U.audit("content.team.group_save", "team_groups", x.data ? x.data.id : g.id, A.tx(rec.title) || "", {}); m.close(); done(); });
        } }] });
    }
    function editMember(m, preset) {
      var isNew = !m; m = m || {};
      var name = A.fI18n(t("f.name"), m.name, { required: true }), role = A.fI18n(t("f.role"), m.role, { required: true });
      var bio = A.fI18n(t("f.bio"), m.bio, { multiline: true, rows: 6 });
      var photo = A.fImage(t("f.photo"), m.photo_url, { folder: "team/members" });
      var so = m.social || {};
      var social = ["instagram", "linkedin", "x", "website", "email"].map(function (k) { return [k, A.fText(k === "x" ? "X" : k.charAt(0).toUpperCase() + k.slice(1), so[k] || "", k === "email" ? { type: "email" } : { url: true, https: true, placeholder: "https://" })]; });
      var pub = A.fToggle(t("f.published"), m.is_published !== false);
      if (!A.canM("content", "publish")) pub.input.disabled = true;
      [["name", name], ["role", role], ["bio", bio], ["photo_url", photo]].forEach(function (x) { x[1].setAttribute("data-field", x[0]); });
      var existing = isNew ? (preset ? [{ tab_id: preset.tab_id, group_id: null, row_no: 0 }] : []) : D.placements.filter(function (p) { return p.member_id === m.id; });
      var places = A.fList(t("team.placements"), existing, function (p) {
        var tabSel = A.fSelect(t("team.tab"), p.tab_id || (D.tabs[0] && D.tabs[0].id), D.tabs.map(function (x) { return [x.id, A.tx(x.title)]; }));
        var grpSel = A.fSelect(t("team.group"), "", [["", t("team.noGroup")]]);
        function fillGroups(v) {
          var opts = [["", t("team.noGroup")]].concat(D.groups.filter(function (g) { return g.tab_id === tabSel.get(); }).map(function (g, i) { return [g.id, A.tx(g.title) || (t("team.group") + " " + (i + 1))]; }));
          grpSel.input.innerHTML = ""; opts.forEach(function (o) { grpSel.input.appendChild(h("option", { value: o[0] }, o[1])); });
          grpSel.set(v || "");
        }
        var firstGroup = function () { var g = D.groups.filter(function (x) { return x.tab_id === tabSel.get(); })[0]; return g ? g.id : ""; };
        fillGroups(p.id ? p.group_id : (p.group_id || firstGroup()));
        tabSel.input.addEventListener("change", function () { fillGroups(firstGroup()); });
        return { el: h("div", { class: "grid grid-2" }, tabSel, grpSel), get: function () { return { id: p.id, tab_id: tabSel.get(), group_id: grpSel.get() || null, row_no: p.row_no || 0, sort_order: p.sort_order || 0, moved: !p.id || p.tab_id !== tabSel.get() || (p.group_id || null) !== (grpSel.get() || null) }; } };
      }, function () { return { tab_id: activeTab, row_no: 0 }; }, { addLabel: t("team.addPlacement") });
      var body = h("div", { class: "grid" }, A.grid(2, [h("div", { class: "grid" }, name, role), photo]), bio,
        h("details", null, h("summary", { class: "muted", style: { cursor: "pointer" } }, t("team.social")), A.grid(2, social.map(function (s) { return s[1]; }))), places, pub);
      A.modal({ title: isNew ? t("team.newMember") : A.tx(m.name), body: body, actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (md) { md.close(); } },
        { label: t("btn.save"), cls: "btn-gold", onClick: function (md, btn) {
          if (!A.validateAll([name, role].concat(social.map(function (s) { return s[1]; })))) return;
          var pl = places.get();
          var tabIds = pl.map(function (p) { return p.tab_id; });
          if (tabIds.some(function (x, i) { return tabIds.indexOf(x) !== i; })) { A.toast(t("team.tab") + ": duplicate", "error"); return; }
          var soc = {}; social.forEach(function (s) { if (s[1].get()) soc[s[0]] = s[1].get(); });
          var rec = { name: name.get(), role: role.get(), bio: bio.getOrNull(), photo_url: photo.get() || null, social: soc, is_published: pub.get() };
          if (isNew) rec.sort_order = D.members.length;
          A.busy(btn, true);
          (isNew ? db.from("team_members").insert(rec).select().single() : db.from("team_members").update(rec).eq("id", m.id).select().single()).then(function (x) {
            if (x.error) throw x.error;
            var mid = x.data.id;
            U.audit(isNew ? "content.team.member_create" : "content.team.member_update", "team_members", mid, A.tx(rec.name) || "", {});
            var keep = pl.filter(function (p) { return p.id; }).map(function (p) { return p.id; });
            var old = existing.filter(function (p) { return p.id && keep.indexOf(p.id) < 0; }).map(function (p) { return p.id; });
            var jobs = [];
            if (old.length) jobs.push(db.from("team_placements").delete().in("id", old));
            return Promise.all(jobs).then(function () {
              return Promise.all(pl.map(function (p) {
                var rec2 = { tab_id: p.tab_id, member_id: mid, group_id: p.group_id, row_no: p.row_no };
                if (p.moved) {
                  /* a member added to / moved into a group goes to the end of its last row */
                  var target = D.placements.filter(function (q) { return q.tab_id === p.tab_id && (q.group_id || null) === p.group_id && q.id !== p.id; });
                  rec2.sort_order = target.reduce(function (mx, q) { return Math.max(mx, q.sort_order + 1); }, 0);
                  rec2.row_no = target.reduce(function (mx, q) { return Math.max(mx, q.row_no); }, 0);
                }
                if (p.id) return db.from("team_placements").update(rec2).eq("id", p.id);
                return db.from("team_placements").insert(rec2);
              }));
            });
          }).then(function (res) {
            var bad = (res || []).filter(function (r) { return r && r.error; })[0]; if (bad) throw bad.error;
            md.close(); done();
          }).catch(A.fail).then(function () { A.busy(btn, false); });
        } }] });
    }
    A.sortable(tabsList, function () { A.saveOrder("team_tabs", tabsList).then(function () { A.preview.reload(); return load(); }); }, "team-tabs");
    view.appendChild(A.tabs([
      { key: "structure", label: t("team.tabs") + " & " + t("team.groups"), render: function (host) {
        host.appendChild(h("div", { class: "team-layout" },
          A.card(t("team.tabs"), tabsList, { actions: h("button", { type: "button", class: "btn btn-sm btn-gold", on: { click: function () { editTab(null); } } }, "+ " + t("team.newTab")) }),
          h("section", { class: "card" }, h("div", { class: "card-head" }, tabTitle, tabActions), h("p", { class: "muted small" }, t("team.dragHelp")), groupsHost)));
        return load();
      } },
      { key: "members", label: t("team.allMembers"), render: function (host) {
        host.appendChild(A.card(t("team.allMembers"), [h("div", { class: "toolbar", "data-nodirty": "1" }, h("button", { type: "button", class: "btn btn-gold", on: { click: function () { editMember(null); } } }, "+ " + t("team.newMember"))), membersHost]));
        return load();
      } },
      { key: "texts", label: t("f.texts"), render: function (host) {
        U.editorPage(host, [U.sectionEditor({ page: "team", key: "members", title: t("nav.team"), texts: [["team.title"], ["team.view"], ["team.tba"], ["team.bio.soon"], ["title.team"]] })]);
      } }
    ]));
  } });

  /* ==================================================================== */
  /* COMMITTEES + FAQ                                                     */
  /* ==================================================================== */
  A.register("committees", { group: "content", icon: "▤", title: "nav.committees", preview: "committees/", render: function (view) {
    return U.tableList(view, { table: "committees", auditType: "committees", title: t("nav.committees"), newLabel: t("cm.new"),
      fields: function (r) {
        var name = A.fI18n(t("f.name"), r.name, { required: true }), slug = A.fText(t("f.slug"), r.slug || "", { required: true, pattern: /^[a-z0-9-]+$/, patternMsg: t("f.slugHelp"), help: t("f.slugHelp") });
        if (!r.id) name.inputs.en.addEventListener("input", function () { slug.set(A.slugify(name.inputs.en.value)); });
        return [["name", name], ["slug", slug], ["short_desc", A.fI18n(t("cm.short"), r.short_desc, { required: true, multiline: true, rows: 3 })], ["about", A.fI18n(t("cm.about"), r.about, { multiline: true })], ["expect", A.fI18n(t("cm.expect"), r.expect, { multiline: true })], ["image_url", A.fImage(t("f.image"), r.image_url, { folder: "committees" })], ["image_alt", A.fI18n(t("cm.alt"), r.image_alt)]];
      },
      rowInfo: function (r) { return { title: A.tx(r.name), sub: r.slug + " · " + A.tx(r.short_desc), thumb: r.image_url || "" }; } });
  } });
  A.register("faqs", { group: "content", icon: "?", title: "nav.faqs", preview: "faq/", render: function (view) {
    return U.tableList(view, { table: "faqs", auditType: "faqs", title: t("nav.faqs"), newLabel: t("fq.new"),
      fields: function (r) { return [["question", A.fI18n(t("fq.q"), r.question, { required: true })], ["answer", A.fI18n(t("fq.a"), r.answer, { required: true, multiline: true })], ["link_url", A.fText(t("f.link"), r.link_url, { url: true })], ["link_label", A.fI18n(t("fq.linkLabel"), r.link_label)]]; },
      rowInfo: function (r) { return { title: A.tx(r.question), sub: A.tx(r.answer) }; } });
  } });

  /* ==================================================================== */
  /* ALL WEBSITE TEXTS                                                    */
  /* ==================================================================== */
  var PAGE_NAMES = { index: "nav.home", "about-us": "nav.about", applications: "nav.applications", "message-from-president": "nav.president", "our-team": "nav.team", committees: "nav.committees", "committee-detail": "nav.committees", faq: "nav.faqs", verify: "verify", certificate: "certificate", "404": "404" };
  A.register("texts", { group: "content", icon: "Aa", title: "nav.texts", render: function (view) {
    var search = h("input", { type: "search", class: "search", placeholder: t("tx.search") });
    var pageSel = h("select", { style: { maxWidth: "240px" } }, h("option", { value: "" }, t("tx.all")), Object.keys(PAGE_NAMES).map(function (p) { return h("option", { value: p }, t(PAGE_NAMES[p]) + " (" + p + ")"); }));
    var editedOnly = A.fToggle(t("tx.edited"), false);
    var langSel = h("select", { style: { maxWidth: "120px" }, "aria-label": t("ucms.translations.lang") },
      [["", t("ucms.activity.all")], ["en", "EN"], ["ar", "AR"], ["tr", "TR"]].map(function (o) { return h("option", { value: o[0] }, o[1]); }));
    var host = h("div");
    var fields = A.allTextKeys().map(function (k) {
      var f = A.textField(k, A.textDefaults(k).en.replace(/<[^>]+>/g, " ").slice(0, 70) || k, { rows: 3 });
      var missing = h("span", { class: "lang-missing" });
      var state = h("span", { class: "tx-state" });
      var row = h("div", { class: "text-row", "data-key": k }, h("div", null, h("code", null, k), state, missing, h("div", { class: "small muted" }, A.textPages(k).join(", "))), f);
      row._f = f; row._missing = missing; row._state = state;
      host.appendChild(row);
      return f;
    });
    function paintEdited() {
      A.$$(".text-row", host).forEach(function (r) {
        var k = r.getAttribute("data-key");
        r._state.innerHTML = "";
        if (A.data.texts[k]) r._state.appendChild(A.badge(t("tx.edited"), "gold"));
      });
    }
    function missingTexts(k) {
      var d = A.textDefaults(k), cur = A.data.texts[k] || {}, miss = [];
      ["ar", "tr"].forEach(function (l) {
        if (!(String(cur[l] || d[l] || "").trim())) miss.push(l.toUpperCase());
      });
      return miss;
    }
    function paintMissing() {
      var l = langSel.value;
      A.$$(".text-row", host).forEach(function (r) {
        var k = r.getAttribute("data-key"), miss = missingTexts(k);
        if (!l) r._missing.textContent = miss.length ? t("ucms.translations.missing") + ": " + miss.join(", ") : "";
        else r._missing.textContent = miss.indexOf(l.toUpperCase()) >= 0 ? t("ucms.translations.missing") + ": " + l.toUpperCase() : "";
      });
    }
    function filter() {
      var q = search.value.trim().toLowerCase(), p = pageSel.value, ed = editedOnly.get(), n = 0;
      A.$$(".text-row", host).forEach(function (r) {
        var k = r.getAttribute("data-key"), f = r._f;
        var ok = (!p || A.textPages(k).indexOf(p) >= 0) && (!ed || A.data.texts[k]) && (!q || (k + " " + JSON.stringify(f.get())).toLowerCase().indexOf(q) >= 0);
        r.hidden = !ok; if (ok) n++;
      });
      paintMissing();
    }
    [search, pageSel, editedOnly, langSel].forEach(function (el) { el.addEventListener("input", filter); el.addEventListener("change", filter); });
    view.appendChild(A.card(t("nav.texts"), [h("div", { class: "toolbar", "data-nodirty": "1" }, search, pageSel, editedOnly, langSel), host], { help: t("f.fallback") }));
    view.appendChild(A.saveBar(function () {
      /* saveTexts already refreshed A.data.texts — update badges + filters in
         place instead of re-rendering the whole page (keeps scroll + filters). */
      return A.saveTexts(fields).then(function () {
        U.audit("content.texts.save", "site_texts", "batch", fields.length + " keys", {});
        paintEdited();
        filter();
      });
    }));
    filter();
  } });

  /* ==================================================================== */
  /* TRANSLATIONS (coverage overview)                                     */
  /* ==================================================================== */
  A.register("translations", { group: "content", icon: "文", title: "ucms.nav.translations", render: function (view) {
    var pubBox = h("div", { class: "checks" });
    var admBox = h("div", { class: "checks" });
    view.appendChild(A.card(t("ucms.translations.public"), pubBox, { help: t("ucms.translations.sub") }));
    view.appendChild(A.card(t("ucms.translations.admin"), admBox));
    view.appendChild(h("div", { class: "savebar" }, h("button", { type: "button", class: "btn btn-gold", on: { click: function () { A.go("texts"); } } }, t("ucms.translations.goTexts"))));

    function pct(done, total) { return total ? Math.round(done * 100 / total) + "%" : "—"; }
    function bar(label, done, total) {
      return h("div", { class: "check big", role: "status" }, h("i", { "aria-hidden": "true" }),
        h("div", null, h("b", null, label, " — ", pct(done, total)),
          h("div", { class: "muted small" }, done + " / " + total + (done < total ? " · " + t("ucms.translations.missing") + ": " + (total - done) : " · " + t("ucms.translations.complete"))),
          h("div", { class: "pbar" }, h("i", { style: { width: pct(done, total) } }))));
    }
    /* public site texts: built-in dictionary coverage per language */
    var keys = A.allTextKeys();
    ["ar", "tr"].forEach(function (l) {
      var d = (window.GDF_TRANSLATIONS || {})[l] || {};
      var have = keys.filter(function (k) { return !!(d[k] && String(d[k]).trim()); }).length;
      pubBox.appendChild(bar(l.toUpperCase() + " · " + t("ucms.translations.builtin"), have, keys.length));
    });
    /* CMS overrides: how many edited keys carry ar/tr values */
    var edited = Object.keys(A.data.texts || {});
    ["ar", "tr"].forEach(function (l) {
      var have = edited.filter(function (k) { var v = A.data.texts[k] || {}; return !!(v[l] && String(v[l]).trim()); }).length;
      pubBox.appendChild(bar(l.toUpperCase() + " · " + t("ucms.translations.cms"), have, edited.length || 0));
    });
    /* admin interface dictionary */
    var ai = window.ADMIN_I18N || {};
    ["ar", "tr"].forEach(function (l) {
      var d = ai[l] || {}, en = ai.en || {};
      var have = Object.keys(en).filter(function (k) { return !!(d[k] && String(d[k]).trim()); }).length;
      admBox.appendChild(bar(l.toUpperCase(), have, Object.keys(en).length));
    });
    return Promise.resolve();
  } });
})();
