/* =====================================================================
   GDF'27 UCMS — Overview: dashboard (real data), recent activity,
   website health. Registered group: "overview".
   ===================================================================== */
(function () {
  "use strict";
  var A = window.CMSA, h = A.h, t = A.t, db = A.db, U = A.U;

  function statCard(label, pageId, icon) {
    var b = h("b", null, "…");
    var el = h("button", { type: "button", class: "stat", on: { click: function () { if (pageId) A.go(pageId); } } },
      h("span", { class: "ico", "aria-hidden": "true" }, icon || ""), b, h("span", null, label));
    el.setValue = function (v) { b.textContent = v; };
    el.setValueErr = function () { b.textContent = "—"; };
    return el;
  }

  /* ================= DASHBOARD ================= */
  A.register("dashboard", { group: "overview", icon: "⌂", title: "nav.dashboard", render: function (view) {
    /* --- statistics (single server-side RPC; every number is real) --- */
    var stats = h("div", { class: "stats" });
    /* label, page, icon, stats-key — the mapping is explicit, so a missing
       key can never shift values onto the wrong card (fixed off-by-one) */
    var cards = [
      ["ucms.dash.media", "media", "▣", "media_files"],
      ["ucms.dash.members", "team", "♙", "team_members"],
      ["ucms.dash.sponsors", "sponsors", "✧", "sponsors"],
      ["ucms.dash.committees", "committees", "▤", "committees"],
      ["ucms.dash.apps", "applications", "↗", "applications"],
      ["ucms.dash.faqs", "faqs", "?", "faqs"],
      ["ucms.dash.textsEdited", "texts", "Aa", "texts_edited"]
    ].map(function (c) { var el = statCard(t(c[0]), c[1], c[2]); el._key = c[3]; stats.appendChild(el); return el; });
    var draftNote = h("p", { class: "muted small", role: "status" });
    view.appendChild(A.card(t("ucms.dash.stats"), [stats, draftNote], { help: t("ucms.dash.sub") }));

    /* --- recent activity + health side by side --- */
    var grid = h("div", { class: "dash-cols" });
    var actList = h("div", { class: "rows" });
    grid.appendChild(A.card(t("ucms.dash.activity"), actList, { help: t("ucms.dash.activityHint") }));
    var healthBox = h("div", { class: "checks" });
    var healthCard = A.card(t("ucms.dash.health"), [healthBox,
      h("div", { class: "card-foot" }, h("button", { type: "button", class: "btn btn-sm btn-ghost", on: { click: function () { A.go("health"); } } }, t("ucms.nav.health") + " →"))]);
    grid.appendChild(healthCard);
    view.appendChild(grid);

    function renderActivity() {
      return db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8)
        .then(function (r) {
          actList.innerHTML = "";
          if (r.error) { actList.appendChild(h("div", { class: "empty" }, r.error.message)); return; }
          (r.data || []).forEach(function (e) {
            actList.appendChild(A.row({ id: e.id, draggable: false,
              title: e.resource_label || e.resource_type || e.action,
              sub: t("ucms.activity.actor") + ": " + (e.actor_email || "—") + " · " + A.fmtDateTime(e.created_at),
              badges: e.outcome === "error" ? A.badge(t("ucms.health.error"), "off") : (e.outcome === "denied" ? A.badge(t("ucms.activity.outcome") + ": denied", "gold") : null),
              actions: h("span", { class: "badge" }, e.action) }));
          });
          if (!(r.data || []).length) actList.appendChild(h("div", { class: "empty" }, t("ucms.dash.noActivity")));
        });
    }
    function renderHealth() {
      return A.health().then(function (res) {
        healthBox.innerHTML = "";
        res.checks.forEach(function (c) {
          var cls = c.status === "ok" ? "" : (c.status === "warn" ? " warn" : (c.status === "error" ? " bad" : " unk"));
          healthBox.appendChild(h("div", { class: "check" + cls, title: c.detail || "" }, h("i"), c.label + " · " + t("ucms.health." + (c.status === "ok" ? "ok" : c.status === "warn" ? "warn" : c.status === "error" ? "error" : "unknown"))));
        });
      });
    }
    function renderStats() {
      return db.rpc("dashboard_stats").then(function (r) {
        if (r.error) throw r.error;
        var s = r.data || {};
        cards.forEach(function (c) {
          c.setValue(s[c._key] == null ? "—" : s[c._key]);
        });
        var parts = [];
        if (s.media_bytes > 1048576) parts.push("≈ " + Math.round(s.media_bytes / 1048576) + " MB media");
        else if (s.media_bytes > 1024) parts.push("≈ " + Math.round(s.media_bytes / 1024) + " KB media");
        if (s.unpublished) parts.push(t("ucms.dash.unpublished").replace("%d", s.unpublished));
        if (s.staff) parts.push(t("ucms.dash.staff").replace("%d", s.staff));
        if (s.certificates) parts.push(t("ucms.dash.certs").replace("%d", s.certificates_valid).replace("%t", s.certificates));
        draftNote.textContent = parts.join(" · ");
      }).catch(function (e) {
        cards.forEach(function (c) { c.setValueErr(); });
        A.fail(e);
      });
    }
    return Promise.all([renderStats(), renderActivity(), renderHealth()]).catch(A.fail);
  } });

  /* Recent activity list lives on the "audit" page (System Administration);
     the dashboard card above shows the latest entries. */

  /* ================= WEBSITE HEALTH ================= */
  A.register("health", { group: "overview", icon: "♥", title: "ucms.nav.health", render: function (view) {
    var box = h("div", { class: "checks" });
    var stamp = h("span", { class: "muted small" });
    var rerun = h("button", { type: "button", class: "btn btn-sm", on: { click: function () { run(); } } }, "↻ " + t("ucms.health.rerun"));
    view.appendChild(A.card(t("ucms.health.title"), [h("div", { class: "toolbar", "data-nodirty": "1" }, stamp, rerun), box], { help: t("ucms.health.sub") }));

    /* Database diagnostics: tables, columns, RPCs, storage, RLS, migrations */
    var dbBox = h("div", { class: "db-health" });
    var dbStamp = h("span", { class: "muted small" });
    var dbRerun = h("button", { type: "button", class: "btn btn-sm", on: { click: function () { runDb(); } } }, "↻ " + t("ucms.health.rerun"));
    view.appendChild(A.card(t("ucms.health.dbTitle"), [h("div", { class: "toolbar", "data-nodirty": "1" }, dbStamp, dbRerun), dbBox], { help: t("ucms.health.dbSub") }));

    var CLASS = { ok: "", warn: " warn", error: " bad", missing: " bad", migration: " bad", permission: " bad", fail: " bad", unknown: " unk" };
    var LABEL = function (s) { return t("ucms.health." + (s === "ok" ? "ok" : s === "warn" ? "warn" : s === "error" ? "error" : s === "missing" ? "missing" : s === "migration" ? "migration" : s === "permission" ? "permission" : s === "fail" ? "fail" : "unknown")); };
    function run() {
      box.innerHTML = '<div class="empty"><span class="spinner sm"></span> ' + A.esc(t("msg.loading")) + "</div>";
      return A.health().then(function (res) {
        box.innerHTML = "";
        stamp.textContent = t("ucms.health.lastRun") + ": " + A.fmtDateTime(res.at);
        var order = { ok: 0, warn: 1, error: 2, missing: 2, migration: 2, permission: 2, fail: 3, unknown: 4 };
        res.checks.slice().sort(function (a, b) { return order[b.status] - order[a.status]; }).forEach(function (c) {
          box.appendChild(h("div", { class: "check big " + CLASS[c.status], role: "status" },
            h("i", { "aria-hidden": "true" }),
            h("div", null, h("b", null, c.label, " — ", LABEL(c.status)), h("div", { class: "muted small" }, c.detail || ""))));
        });
      }).catch(A.fail);
    }
    function runDb() {
      dbBox.innerHTML = '<div class="empty"><span class="spinner sm"></span> ' + A.esc(t("msg.loading")) + "</div>";
      return A.dbHealth().then(function (res) {
        dbBox.innerHTML = "";
        dbStamp.textContent = t("ucms.health.lastRun") + ": " + A.fmtDateTime(res.at);
        res.groups.forEach(function (g) {
          dbBox.appendChild(h("div", { class: "db-group" },
            h("h3", { class: "db-group-title " + CLASS[g.status].trim() }, t("ucms.health.gStatus") + " — ", LABEL(g.status), " · ", g.name)));
          g.items.forEach(function (it) {
            dbBox.appendChild(h("div", { class: "check" + CLASS[it.status], title: it.detail || "" },
              h("i", { "aria-hidden": "true" }), h("b", null, it.label),
              h("span", { class: "muted small" }, (it.detail ? " · " + it.detail : "") + " · " + LABEL(it.status))));
          });
        });
      }).catch(A.fail);
    }
    return Promise.all([run(), runDb()]);
  } });
})();
