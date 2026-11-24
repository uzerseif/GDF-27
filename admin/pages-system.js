/* =====================================================================
   GDF'27 UCMS — System Administration (group "system"):
   Audit Logs (append-only), Media Library (reference-safe), Users & Roles,
   Permissions matrix, Backups & Restore, Notifications.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.CMSA, h = A.h, t = A.t, db = A.db, U = A.U;

  /* ==================================================================== */
  /* AUDIT LOGS (full list; filters AND-combine between categories, OR     */
  /* within the resource search; export needs system.view)                 */
  /* ==================================================================== */
  A.register("audit", { group: "system", icon: "⏱", title: "ucms.nav.audit", render: function (view) {
    var PAGE = 25, offset = 0;
    var fAction = h("input", { type: "search", placeholder: t("ucms.activity.filterAction"), "aria-label": t("ucms.activity.filterAction"), style: { maxWidth: "180px" } });
    var fUser = h("input", { type: "search", placeholder: t("ucms.activity.filterUser"), "aria-label": t("ucms.activity.filterUser"), style: { maxWidth: "180px" } });
    var fResource = h("input", { type: "search", placeholder: t("ucms.activity.filterResource"), "aria-label": t("ucms.activity.filterResource"), style: { maxWidth: "180px" } });
    var fOutcome = h("select", null, [["", t("ucms.activity.allOutcomes")], ["success", "success"], ["error", "error"], ["denied", "denied"]].map(function (o) { return h("option", { value: o[0] }, o[1]); }));
    var fFrom = h("input", { type: "date", "aria-label": t("ucms.activity.from") });
    var fTo = h("input", { type: "date", "aria-label": t("ucms.activity.to") });
    var list = h("div", { class: "rows" });
    var more = h("button", { type: "button", class: "btn", on: { click: function () { offset += PAGE; load(true); } } }, t("ucms.activity.loadMore"));
    var exportBtn = h("button", { type: "button", class: "btn btn-sm", on: { click: exportCsv } }, t("ucms.audit.export"));
    var summary = h("span", { class: "muted small" });
    view.appendChild(A.card(t("ucms.audit.title"), [
      h("div", { class: "toolbar", "data-nodirty": "1" }, fAction, fUser, fResource, fOutcome, fFrom, fTo, summary, exportBtn),
      list, h("div", { class: "card-foot" }, more)], { help: t("ucms.audit.sub") }));

    function like(v) { return "%" + v.replace(/[%_,]/g, "") + "%"; }
    /* Independent categories are chained (AND); only the three resource
       fields form one OR group — PostgREST semantics, verified. */
    function applyFilters(query) {
      var a = fAction.value.trim(); if (a) query = query.ilike("action", like(a));
      var u = fUser.value.trim(); if (u) query = query.ilike("actor_email", like(u));
      var r = fResource.value.trim();
      if (r) query = query.or(["resource_label", "resource_type", "resource_id"].map(function (c) { return c + ".ilike." + like(r); }).join(","));
      var o = fOutcome.value; if (o) query = query.eq("outcome", o);
      var d1 = fFrom.value; if (d1) query = query.gte("created_at", d1 + "T00:00:00Z");
      var d2 = fTo.value; if (d2) query = query.lte("created_at", d2 + "T23:59:59Z");
      return query;
    }
    function load(append) {
      /* "Load more" appends; a fresh load (filter change) replaces. */
      if (!append) list.innerHTML = '<div class="empty"><span class="spinner sm"></span> ' + A.esc(t("msg.loading")) + "</div>";
      more.hidden = true;
      var query = applyFilters(db.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + PAGE - 1));
      return query.then(function (r) {
        if (r.error) throw r.error;
        var rows = r.data || [];
        if (!append) list.innerHTML = "";
        rows.forEach(function (e) {
          list.appendChild(A.row({ id: e.id, draggable: false,
            title: (e.resource_label || e.resource_type || "—") + " · " + e.action,
            sub: (e.actor_email || "—") + " · " + (e.actor_role || "") + " · " + A.fmtDateTime(e.created_at),
            badges: e.outcome === "success" ? A.badge("✓", "ok") : A.badge(e.outcome, e.outcome === "error" ? "off" : "gold"),
            actions: h("button", { type: "button", class: "btn btn-sm btn-ghost", on: { click: function () {
              A.modal({ title: t("ucms.audit.detail"), size: "md", body: h("pre", { class: "code-block" }, JSON.stringify(e, null, 2)) });
            } } }, t("ucms.activity.meta")) }));
        });
        if (!append && !rows.length) list.appendChild(h("div", { class: "empty" }, t("ucms.activity.empty")));
        more.hidden = rows.length < PAGE;
        summary.textContent = total(r.count);
        function total(c) { return c != null ? (offset + rows.length) + " / " + c : ""; }
      }).catch(A.fail);
    }
    function exportCsv() {
      var query = applyFilters(db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(1000));
      query.then(function (r) {
        if (r.error) throw r.error;
        var rows = r.data || [];
        var head = ["created_at", "actor_email", "actor_role", "action", "resource_type", "resource_id", "resource_label", "outcome"];
        var esc = function (v) { v = v == null ? "" : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        var csv = head.join(",") + "\n" + rows.map(function (e) {
          return head.map(function (k) { return esc(k === "resource_label" ? e.resource_label : e[k]); }).join(",");
        }).join("\n");
        var url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
        var a = h("a", { href: url, download: "gdf27-audit-log-" + new Date().toISOString().slice(0, 10) + ".csv" });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        A.toast(t("ucms.audit.exported").replace("%d", rows.length), "ok");
        U.audit("audit.export", "audit_logs", "csv", rows.length + " rows", {});
      }).catch(A.fail);
    }
    [fAction, fUser, fResource].forEach(function (el) { el.addEventListener("input", function () { offset = 0; load(); }); });
    [fOutcome, fFrom, fTo].forEach(function (el) { el.addEventListener("change", function () { offset = 0; load(); }); });
    return load();
  } });

  /* ==================================================================== */
  /* MEDIA LIBRARY — server-verified usage, multi-upload, bulk actions     */
  /* ==================================================================== */
  A.register("media", { group: "media", icon: "▣", title: "nav.media", render: function (view) {
    var grid = h("div", { class: "media-grid" });
    var filter = "all", sortBy = "date", q = "";
    var files = [];
    var usedPaths = null;     /* set of in-use paths from the server RPC */
    var usageError = false;   /* RPC failure → usage state UNKNOWN for all */
    var selected = {};        /* path → true (bulk selection) */
    var search = h("input", { type: "search", class: "search", placeholder: t("ucms.media.search") });
    var filt = h("div", { class: "toolbar", "data-nodirty": "1" },
      ["all", "inUse", "unused"].map(function (k) {
        return h("button", { type: "button", class: "chip" + (k === "all" ? " on" : ""), "data-f": k, on: { click: function (e) { filter = k; A.$$("[data-f]", filt).forEach(function (b) { b.classList.toggle("on", b === e.currentTarget); }); render(); } } }, t(k === "all" ? "md.all" : "md." + k));
      }),
      h("select", { "aria-label": t("ucms.media.sortDate") }, [["date", t("ucms.media.sortDate")], ["name", t("ucms.media.sortName")], ["size", t("ucms.media.sortSize")]].map(function (o) { return h("option", { value: o[0] }, o[1]); })),
      search);
    var sortSel = filt.querySelector("select");
    sortSel.addEventListener("change", function () { sortBy = sortSel.value; render(); });
    search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); render(); });
    var counts = h("span", { class: "muted small" });
    var bulkBtn = h("button", { type: "button", class: "btn btn-sm btn-danger", hidden: true, on: { click: deleteSelected } }, t("ucms.media.bulkDelete"));

    /* multi-file uploader with per-file progress (drag & drop supported) */
    var dropZone = h("div", { class: "uploader multi" });
    var fileInput = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true, hidden: true, "data-nodirty": "1" });
    var pickBtn = h("button", { type: "button", class: "btn btn-gold", on: { click: function () { fileInput.click(); } } }, t("ucms.media.uploadMany"));
    var progressList = h("div", { class: "upload-progress" });
    dropZone.appendChild(h("div", { class: "u-hint" }, t("up.drop")));
    dropZone.appendChild(h("div", { class: "u-hint small" }, t("up.types")));
    dropZone.appendChild(h("div", { class: "u-actions" }, pickBtn));
    dropZone.appendChild(progressList);
    dropZone.appendChild(fileInput);
    ["dragenter", "dragover"].forEach(function (ev) { dropZone.addEventListener(ev, function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types, "Files") >= 0) { e.preventDefault(); dropZone.classList.add("drag"); } }); });
    ["dragleave", "drop"].forEach(function (ev) { dropZone.addEventListener(ev, function () { dropZone.classList.remove("drag"); }); });
    dropZone.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); uploadMany([].slice.call(e.dataTransfer.files)); } });
    fileInput.addEventListener("change", function () { uploadMany([].slice.call(fileInput.files)); fileInput.value = ""; });

    function uploadMany(fileList) {
      if (!fileList.length) return;
      var okCount = 0, badCount = 0;
      fileList.reduce(function (p, f) {
        return p.then(function () {
          var bar = h("div", { class: "progress", role: "status" }, h("i"), h("span", { class: "muted small" }, f.name));
          progressList.appendChild(bar);
          var track = bar.firstChild;
          return A.upload(f, "library", function (pct) { track.style.width = Math.round(pct * 100) + "%"; }).then(function () {
            okCount++; bar.remove();
          }, function (e) {
            badCount++; track.style.width = "100%"; track.style.background = "#b0431f";
            A.toast((f.name || "") + ": " + e.message, "error");
          });
        });
      }, Promise.resolve()).then(function () {
        if (okCount) A.toast(t("ucms.media.uploadedMany").replace("%d", okCount).replace("%f", badCount), badCount ? "info" : "ok");
        if (okCount) U.audit("media.upload", "storage", "batch", okCount + " file(s)", { failed: badCount });
        setTimeout(function () { progressList.innerHTML = ""; }, 1200);
        load();
      });
    }

    view.appendChild(A.card(t("btn.upload"), dropZone));
    view.appendChild(A.card(t("md.title"), [h("div", { class: "toolbar", "data-nodirty": "1" }, filt, counts, bulkBtn), grid], { help: t("ucms.media.docsNote") }));

    function listAll(prefix, depth) {
      /* paginated folder walk (storage list caps at 1000 per call) */
      function page(pfx, offset) {
        return db.storage.from("site-media").list(pfx, { limit: 1000, offset: offset, sortBy: { column: "created_at", order: "desc" } }).then(function (r) {
          if (r.error) throw r.error;
          return r.data || [];
        });
      }
      function walk(pfx, offset, depth2, acc) {
        return page(pfx, offset).then(function (data) {
          var jobs = [];
          (data || []).forEach(function (o) {
            var path = pfx ? pfx + "/" + o.name : o.name;
            if (!o.id && depth2 < 5) jobs.push(walk(path, 0, depth2 + 1, acc));
            else if (o.id) acc.push({ path: path, name: o.name, size: o.metadata && o.metadata.size, created: o.created_at });
          });
          if ((data || []).length === 1000 && depth2 >= 0) return walk(pfx, offset + 1000, depth2, acc);
          return Promise.all(jobs).then(function () { return acc; });
        });
      }
      return walk(prefix, 0, depth, []);
    }

    /* server truth: one RPC returns every in-use path. If the RPC fails the
       usage state is UNKNOWN for every file (never "unused"). */
    function loadUsage() {
      usedPaths = null; usageError = false;
      return db.rpc("media_usage_report").then(function (r) {
        if (r.error) { usageError = true; return; }
        usedPaths = {};
        ((r.data || {}).used_paths || []).forEach(function (p) { usedPaths[p] = true; });
      }).catch(function () { usageError = true; });
    }
    function usageState(f) {
      if (usageError || usedPaths === null) return "unknown";
      return usedPaths[f.path] ? "used" : "unused";
    }

    function render() {
      grid.innerHTML = "";
      var shown = files.filter(function (f) { return (!q || f.name.toLowerCase().indexOf(q) >= 0 || f.path.toLowerCase().indexOf(q) >= 0) && (filter === "all" || (filter === "inUse") === (usageState(f) === "used")); });
      shown.sort(function (a, b) {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return (b.size || 0) - (a.size || 0);
        return new Date(b.created || 0) - new Date(a.created || 0);
      });
      counts.textContent = shown.length + " " + t("ucms.media.count") + (usageError ? " · " + t("ucms.media.refsFailed") : "");
      if (!shown.length) { grid.appendChild(h("div", { class: "empty", style: { gridColumn: "1/-1" } }, t("md.empty"))); updateBulk(); return; }
      shown.forEach(function (f) {
        var url = A.publicUrl(f.path), st = usageState(f);
        var badgeEl = st === "unknown" ? A.badge(t("ucms.media.unknown"), "gold")
          : st === "used" ? A.badge(t("md.inUse"), "ok") : A.badge(t("ucms.media.unused"), "");
        var cb = h("input", { type: "checkbox", "aria-label": t("md.select") });
        cb.checked = !!selected[f.path];
        cb.addEventListener("change", function () { if (cb.checked) selected[f.path] = true; else delete selected[f.path]; updateBulk(); });
        var sizeText = f.size ? (f.size >= 1024 * 1024 ? (f.size / (1024 * 1024)).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB") : "—";
        var dateText = f.created ? A.fmtDateTime(f.created) : "—";
        grid.appendChild(h("div", { class: "media-item" + (selected[f.path] ? " selected" : "") },
          h("div", { class: "mi-img" },
            h("label", { class: "mi-select", title: t("md.select") }, cb),
            h("img", { src: url, alt: f.name, loading: "lazy" })),
          h("div", { class: "mi-body" },
            h("div", { class: "mi-title-row" },
              h("div", { class: "mi-name", title: f.path }, f.name),
              badgeEl),
            h("div", { class: "mi-meta" },
              h("span", null, "📦 " + sizeText),
              h("span", null, "◷ " + dateText)),
            h("div", { class: "mi-path", title: f.path }, f.path),
            h("div", { class: "mi-actions" },
              h("button", { type: "button", class: "btn btn-sm mi-action", title: t("ucms.media.usage"), on: { click: function () { showUsage(f); } } }, h("span", { class: "mi-action-icon" }, "ⓘ"), h("span", null, t("ucms.media.usage"))),
              h("button", { type: "button", class: "btn btn-sm mi-action", title: t("btn.copy"), on: { click: function () { copyUrl(url); } } }, h("span", { class: "mi-action-icon" }, "⧉"), h("span", null, t("btn.copy"))),
              A.canM("media", "edit") ? h("button", { type: "button", class: "btn btn-sm mi-action", title: t("ucms.media.rename"), on: { click: function () { renameFile(f); } } }, h("span", { class: "mi-action-icon" }, "Aa"), h("span", null, t("ucms.media.rename"))) : null,
              A.canM("media", "edit") ? h("button", { type: "button", class: "btn btn-sm mi-action", title: t("ucms.media.replace"), on: { click: function () { replaceFile(f); } } }, h("span", { class: "mi-action-icon" }, "↻"), h("span", null, t("ucms.media.replace"))) : null,
              A.canM("media", "delete") ? h("button", { type: "button", class: "btn btn-sm btn-danger mi-action", title: t("btn.delete"), on: { click: function () { deleteFile(f); } } }, h("span", { class: "mi-action-icon" }, "×"), h("span", null, t("btn.delete"))) : null))));
      });
      updateBulk();
    }
    function updateBulk() {
      var n = Object.keys(selected).length;
      bulkBtn.hidden = !n;
      if (n) bulkBtn.textContent = t("ucms.media.bulkDelete") + " (" + n + ")";
    }
    function deleteSelected() {
      var paths = Object.keys(selected);
      if (!paths.length) return;
      var inUse = paths.filter(function (p) { var f = files.filter(function (x) { return x.path === p; })[0]; return f && usageState(f) === "used"; });
      if (inUse.length) { A.toast(t("ucms.media.deleteBlocked"), "error"); return; }
      A.confirm(t("msg.confirmDelete") + " (" + paths.length + ")", t("btn.delete"), true).then(function (okr) {
        if (!okr) return;
        db.storage.from("site-media").remove(paths).then(function (r) {
          if (r.error) return A.fail(r.error);
          var done = ((r.data || []).length);
          U.audit("media.delete", "storage", "batch", done + "/" + paths.length, {});
          selected = {};
          if (done < paths.length) A.toast(t("ucms.media.deleteFailed"), "error");
          else A.toast(t("msg.deleted"), "ok");
          load();
        });
      });
    }
    function copyUrl(url) {
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(function () { A.toast(t("msg.copied"), "ok"); }, function () { window.prompt("URL", url); });
    }
    /* server-side usage rows for one file: table/column/record ids */
    function fetchFileRefs(f) {
      return db.rpc("media_usage_for", { p_path: f.path }).then(function (r) {
        return r.error ? null : (r.data || []);
      }, function () { return null; });
    }
    function showUsage(f) {
      var list = h("div", { class: "rows" }, h("div", { class: "empty" }, h("span", { class: "spinner sm" })));
      A.modal({ title: t("ucms.media.usedIn") + " · " + f.name, body: list, size: "md" });
      fetchFileRefs(f).then(function (refs) {
        list.innerHTML = "";
        if (refs === null) { list.appendChild(h("p", { class: "muted" }, t("ucms.media.unknownHelp"))); return; }
        if (!refs.length) { list.appendChild(h("p", { class: "muted" }, t("ucms.media.noRefs"))); return; }
        var PAGE_TARGET = { team_members: "team", team_groups: "team", sponsors: "sponsors", applications: "applications", committees: "committees", certificates: "certificates", page_sections: "home", site_settings: "settings", site_texts: "texts" };
        refs.forEach(function (r) {
          list.appendChild(A.row({ id: r.table_name + ":" + r.record_id, draggable: false,
            title: r.table_name + " · " + r.column_name,
            sub: "id: " + r.record_id,
            actions: h("button", { type: "button", class: "btn btn-sm btn-ghost", on: { click: function () { var pg = PAGE_TARGET[r.table_name]; if (pg && A.pages[pg]) A.go(pg); } } }, t("btn.edit")) }));
        });
      });
    }
    /* rewrite every reference of an old URL to a new one (replace/rename flows);
       targets come from the server RPC, not a client-side scan */
    var REF_TARGETS = [
      ["team_members", "photo_url", false, "team"], ["team_groups", "image_url", false, "team"],
      ["sponsors", "logo_url", false, "sponsors"], ["applications", "image_url", false, "applications"],
      ["committees", "image_url", false, "committees"], ["certificates", "certificate_image", false, "certificates"],
      ["page_sections", "settings", true, "home"], ["site_settings", "value", true, "settings"], ["site_texts", "value", true, "texts"]
    ];
    function rewriteRefs(oldPath, newPath, progress) {
      var oldUrl = A.publicUrl(oldPath), newUrl = A.publicUrl(newPath);
      var changed = 0;
      return db.rpc("media_usage_for", { p_path: oldPath }).then(function (r) {
        var targets = r.error ? [] : (r.data || []);
        return targets.reduce(function (p, t) {
          return p.then(function () {
            var meta = REF_TARGETS.filter(function (x) { return x[0] === t.table_name && x[1] === t.column_name; })[0];
            if (!meta) return;
            return db.from(t.table_name).select("id," + t.column_name).eq(meta[2] ? "id" : (t.table_name === "site_texts" || t.table_name === "site_settings" ? "key" : "id"), t.record_id).then(function (res) {
              if (res.error || !res.data || !res.data.length) return;
              var row = res.data[0];
              var val = row[t.column_name];
              var str = meta[2] ? JSON.stringify(val || {}) : String(val || "");
              var next = str.split(oldUrl).join(newUrl).split(encodeURI(oldPath)).join(encodeURI(newPath)).split(oldPath).join(newPath);
              if (next === str) return;
              var patch = {};
              patch[t.column_name] = meta[2] ? JSON.parse(next) : next;
              return db.from(t.table_name).update(patch).eq(meta[2] ? "id" : (t.table_name === "site_texts" || t.table_name === "site_settings" ? "key" : "id"), t.record_id).then(function (w) {
                if (!w.error) { changed++; if (progress) progress(changed); }
              });
            });
          });
        }, Promise.resolve()).then(function () { return changed; });
      });
    }
    function renameFile(f) {
      var name = h("input", { type: "text", value: f.name, class: "code-input", "aria-label": t("ucms.media.newName") });
      var note = h("p", { class: "muted small" }, usageState(f) === "unknown" ? t("ucms.media.unknownHelp") : (usageState(f) === "used" ? t("ucms.media.renamed") : t("ucms.media.noRefs")));
      A.modal({ title: t("ucms.media.rename") + " · " + f.name, size: "sm", body: h("div", { class: "grid" }, h("label", { class: "field" }, h("span", null, t("ucms.media.newName")), name), note), actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (m) { m.close(); } },
        { label: t("ucms.media.rename"), cls: "btn-gold", onClick: function (m, btn) {
          var newName = name.value.trim().replace(/[^A-Za-z0-9._-]+/g, "-");
          if (!newName || newName === f.name) { m.close(); return; }
          if (!/\.(jpe?g|png|webp)$/i.test(newName)) newName += (f.name.match(/\.[a-z0-9]+$/i) || [""])[0];
          var dir = f.path.split("/").slice(0, -1).join("/");
          var newPath = (dir ? dir + "/" : "") + newName;
          A.busy(btn, true);
          db.storage.from("site-media").move(f.path, newPath).then(function (r) {
            if (r.error) throw r.error;
            return rewriteRefs(f.path, newPath);
          }).then(function () {
            U.audit("media.rename", "storage", newPath, f.name + " → " + newName, {});
            A.busy(btn, false); m.close(); A.toast(t("ucms.media.renamed"), "ok"); load();
          }).catch(function (e) { A.busy(btn, false); A.fail(e); });
        } }] });
    }
    function replaceFile(f) {
      var file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", hidden: true });
      var pick = h("button", { type: "button", class: "btn btn-gold", on: { click: function () { file.click(); } } }, t("btn.upload"));
      A.modal({ title: t("ucms.media.replace") + " · " + f.name, size: "sm", body: h("div", { class: "grid" }, pick, file,
        h("p", { class: "muted small" }, t("ucms.media.replaced"))), actions: [
        { label: t("btn.cancel"), cls: "btn-ghost", onClick: function (m) { m.close(); } },
        { label: t("btn.close"), cls: "btn-ghost", onClick: function (m) { m.close(); } }] });
      file.addEventListener("change", function () {
        var nf = file.files[0]; if (!nf) return;
        A.upload(nf, f.path.split("/").slice(0, -1).join("/") || "library").then(function (r) {
          return rewriteRefs(f.path, r.path).then(function () { return r; });
        }).then(function (r) {
          U.audit("media.replace", "storage", r.path, f.name + " → " + nf.name, {});
          A.toast(t("ucms.media.replaced"), "ok");
          return db.storage.from("site-media").remove([f.path]).then(function (d) {
            if (d.error || !d.data || !d.data.length) A.toast(t("ucms.media.deleteFailed"), "error");
          });
        }).then(load).catch(function (e) { A.fail(e); });
        document.querySelectorAll(".modal-backdrop").forEach(function (m) { m.remove(); });
      });
    }
    function deleteFile(f) {
      var st = usageState(f);
      if (st === "unknown") { A.toast(t("ucms.media.deleteBlocked") + " (" + t("ucms.media.unknownHelp") + ")", "error"); return; }
      if (st === "used") { A.toast(t("ucms.media.deleteBlockedBy"), "error"); showUsage(f); return; }
      A.confirm(t("msg.confirmDelete"), t("btn.delete"), true).then(function (okr) {
        if (!okr) return;
        db.storage.from("site-media").remove([f.path]).then(function (r) {
          if (r.error) return A.fail(r.error);
          /* A blocked delete (usage policy or permission) returns no error
             but also no removed object — never a fake success. */
          if (!r.data || !r.data.length) {
            U.audit("media.delete", "storage", f.path, f.name, { blocked: true }, "denied");
            return A.fail(new Error(t("ucms.media.deleteFailed")));
          }
          U.audit("media.delete", "storage", f.path, f.name, {});
          A.toast(t("msg.deleted"), "ok"); load();
        });
      });
    }
    function load() {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="spinner sm"></span></div>';
      return Promise.all([listAll("", 0), loadUsage()]).then(function (r) { files = r[0]; render(); }).catch(A.fail);
    }
    return load();
  } });

  /* ==================================================================== */
  /* USERS & ROLES                                                        */
  /* ==================================================================== */
  A.register("users", { group: "system", icon: "☰", title: "ucms.nav.users", render: function (view) {
    var list = h("div", { class: "rows" });
    var inviteHost = h("div");           /* built once; load() only toggles it */
    view.appendChild(A.card(t("ucms.users.title"), [list], { help: t("ucms.users.sub") }));
    function load() {
      list.innerHTML = '<div class="empty"><span class="spinner sm"></span> ' + A.esc(t("msg.loading")) + "</div>";
      return Promise.all([
        db.from("admin_users").select("*").order("created_at"),
        db.from("audit_logs").select("actor_id,actor_email,action,created_at").order("created_at", { ascending: false }).limit(300)
      ]).then(function (r) {
        if (r[0].error) throw r[0].error;
        var rows = r[0].data || [];
        var lastAct = {};
        (r[1].data || []).forEach(function (e) { if (e.actor_id && !lastAct[e.actor_id]) lastAct[e.actor_id] = e.action + " · " + A.fmtDateTime(e.created_at); });
        list.innerHTML = "";
        if (!A.can.users && !view.querySelector(".banner")) view.insertBefore(h("div", { class: "banner" }, t("ucms.users.adminOnly")), view.firstChild);
        rows.forEach(function (u) {
          var isSelf = A.user && u.user_id === A.user.id;
          var userLabel = (u.display_name || "").trim() || u.user_id.slice(0, 8) + "…";
          var nameInput = h("input", { type: "text", value: u.display_name || "", maxlength: 120,
            placeholder: t("ucms.users.name"), "aria-label": t("ucms.users.name"), disabled: !A.can.users });
          var nameSave = h("button", { type: "button", class: "btn btn-sm", disabled: !A.can.users,
            on: { click: function () { saveName(u, nameInput); } } }, t("btn.save"));
          var roleSel = h("select", { "aria-label": t("ucms.users.role"), disabled: !A.can.users || isSelf },
            [["super_admin", t("role.super_admin")], ["admin", t("role.admin")], ["publisher", t("role.publisher")], ["editor", t("role.editor")]].map(function (o) { return h("option", { value: o[0] }, o[1]); }));
          roleSel.value = u.role;
          roleSel.addEventListener("change", function () { changeRole(u, roleSel.value, roleSel); });
          list.appendChild(A.row({ id: u.user_id, draggable: false,
            title: userLabel + " " + t("role." + u.role),
            sub: t("ucms.users.created") + ": " + A.fmtDate(u.created_at)
              + " · " + t("ucms.users.lastLogin") + ": " + (u.last_login_at ? A.fmtDateTime(u.last_login_at) : t("ucms.users.notAvailable"))
              + " · " + t("ucms.users.lastAction") + ": " + (lastAct[u.user_id] || t("ucms.users.noLastAction")),
            actions: h("div", { class: "r-actions user-actions" }, h("div", { class: "user-name-edit" }, nameInput, nameSave), roleSel,
              h("button", { type: "button", class: "btn btn-sm btn-danger", disabled: !A.can.users || isSelf, on: { click: function () { revoke(u); } } }, t("ucms.users.revoke"))) }));
        });
        if (!rows.length) list.appendChild(h("div", { class: "empty" }, t("msg.empty")));
        /* invite card is created once and toggled, not re-appended per load */
        inviteHost.innerHTML = "";
        if (A.can.users) inviteHost.appendChild(A.card(t("ucms.users.invite"), inviteCard(), { help: t("ucms.users.inviteHelp") }));
      }).catch(A.fail);
    }
    function inviteCard() {
      var sql = "insert into public.admin_users (user_id, role)\nselect id, 'editor' from auth.users where email = 'USER@EXAMPLE.COM'\non conflict (user_id) do update set role = excluded.role;";
      var code = h("pre", { class: "code-block" }, sql);
      var copy = h("button", { type: "button", class: "btn btn-sm", on: { click: function () {
        (navigator.clipboard ? navigator.clipboard.writeText(sql) : Promise.reject())
          .then(function () { A.toast(t("msg.copied"), "ok"); }, function () { window.prompt("", sql); });
      } } }, t("btn.copy"));
      return h("div", null,
        h("p", null, t("ucms.users.inviteStep1")),
        h("p", null, t("ucms.users.inviteStep2")),
        code, copy);
    }
    function changeRole(u, role, selEl) {
      if (u.user_id === (A.user && A.user.id)) { A.toast(t("ucms.users.selfRole"), "error"); if (selEl) selEl.value = u.role; return; }
      A.confirm(t("ucms.users.changeRole") + ": " + u.role + " → " + role + "?", t("btn.confirm"), false).then(function (ok) {
        if (!ok) { if (selEl) selEl.value = u.role; return; }
        db.from("admin_users").update({ role: role }).eq("user_id", u.user_id).then(function (r) {
          if (r.error) { A.fail(r.error); if (selEl) selEl.value = u.role; return; }
          U.audit("users.role_change", "admin_users", u.user_id, u.user_id.slice(0, 8), { from: u.role, to: role });
          A.notify("warning", t("ucms.users.changeRole"), u.user_id.slice(0, 8) + "… " + u.role + " → " + role, "users");
          A.toast(t("msg.saved"), "ok"); load();
        });
      });
    }
    function saveName(u, input) {
      var displayName = input.value.trim();
      db.from("admin_users").update({ display_name: displayName }).eq("user_id", u.user_id).then(function (r) {
        if (r.error) return A.fail(r.error);
        U.audit("users.name_change", "admin_users", u.user_id, u.user_id.slice(0, 8), { from: u.display_name || "", to: displayName });
        A.toast(t("msg.saved"), "ok");
        load();
      }).catch(A.fail);
    }
    function revoke(u) {
      if (u.user_id === (A.user && A.user.id)) { A.toast(t("ucms.users.selfRevoke"), "error"); return; }
      A.confirm(t("ucms.users.revokeConfirm"), t("ucms.users.revoke"), true).then(function (ok) {
        if (!ok) return;
        db.from("admin_users").delete().eq("user_id", u.user_id).then(function (r) {
          if (r.error) return A.fail(r.error);
          U.audit("users.revoke", "admin_users", u.user_id, u.user_id.slice(0, 8), { former_role: u.role });
          A.notify("warning", t("ucms.users.revoke"), u.user_id.slice(0, 8) + "… (" + u.role + ")", "users");
          A.toast(t("msg.deleted"), "ok"); load();
        });
      });
    }
    view.appendChild(inviteHost);
    return load();
  } });

  /* ==================================================================== */
  /* PERMISSIONS (live role_permissions matrix; editable by admins —      */
  /* enforced server-side by has_perm() on every query, never by the UI)   */
  /* ==================================================================== */
  A.register("permissions", { group: "system", icon: "⛨", title: "ucms.nav.permissions", render: function (view) {
    var ROLES = ["super_admin", "admin", "publisher", "editor"];
    var MODULES = ["content", "certificates", "texts", "settings", "media", "users", "system"];
    var PERMS = ["view", "create", "edit", "del", "publish", "manage"];
    var PERM_COLS = ["can_view", "can_create", "can_edit", "can_delete", "can_publish", "can_manage"];
    var canManage = A.canM("users", "manage");
    var matrix = {};      /* { role: { module: {can_view,...} } } */
    var selectedRole = "admin";
    var table = h("table", { class: "perm-table" });
    var roleTabs = h("div", { class: "perm-role-tabs", role: "tablist" });
    var legend = h("div", { class: "perm-legend" },
      PERMS.map(function (pm) {
        return h("div", { class: "perm-legend-item" },
          h("span", { class: "perm-legend-icon" }, pm === "view" ? "👁" : pm === "create" ? "+" : pm === "edit" ? "✎" : pm === "del" ? "×" : pm === "publish" ? "✓" : "⚙"),
          h("div", null,
            h("strong", null, t("ucms.perms." + pm)),
            h("span", null, t("ucms.perms." + pm + "Desc"))));
      }));
    var saveBtn = h("button", { type: "button", class: "btn btn-gold", hidden: true, on: { click: save } }, t("btn.save"));
    var note = h("p", { class: "muted small", role: "status" });
    view.appendChild(h("p", { class: "muted" }, t("ucms.perms.intro")));
    if (!canManage) view.appendChild(h("div", { class: "banner", style: { margin: "0 0 16px" } }, t("ucms.perms.readonly")));
    view.appendChild(A.card(t("ucms.perms.title"), [roleTabs, legend, h("div", { class: "table-scroll perm-table-wrap" }, table), h("div", { class: "card-foot" }, saveBtn, note)], { help: t("ucms.perms.sub") }));
    view.appendChild(h("p", { class: "muted small" }, t("ucms.pages.publishNote")));

    function load() {
      table.innerHTML = "";
      table.appendChild(h("thead", null, h("tr", null, h("th", null, t("ucms.perms.module")),
        PERMS.map(function (pm) { return h("th", { class: "perm-head" }, t("ucms.perms." + pm)); }))));
      var body = h("tbody");
      table.appendChild(body);
      return db.from("role_permissions").select("*").then(function (r) {
        if (r.error) throw r.error;
        matrix = {};
        ROLES.forEach(function (ro) { matrix[ro] = {}; });
        (r.data || []).forEach(function (p) {
          matrix[p.role] = matrix[p.role] || {};
          matrix[p.role][p.module] = { can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit,
            can_delete: p.can_delete, can_publish: p.can_publish, can_manage: p.can_manage };
        });
        roleTabs.innerHTML = "";
        ROLES.forEach(function (ro) {
          var tab = h("button", { type: "button", class: "perm-role-tab" + (ro === selectedRole ? " active" : ""), role: "tab", "aria-selected": ro === selectedRole ? "true" : "false", on: { click: function () { selectedRole = ro; renderRole(); } } }, t("role." + ro));
          roleTabs.appendChild(tab);
        });
        renderRole();
        saveBtn.hidden = true;
      }).catch(A.fail);
    }

    function renderRole() {
      roleTabs.querySelectorAll(".perm-role-tab").forEach(function (tab) {
        var active = tab.textContent === t("role." + selectedRole);
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      var body = table.querySelector("tbody");
      if (!body) { body = h("tbody"); table.appendChild(body); }
      body.innerHTML = "";
      var ro = selectedRole;
        MODULES.forEach(function (m) {
          var tr = h("tr", null, h("th", { scope: "row", "data-label": t("ucms.perms.module") }, t("ucms.perms.module." + m)));
          var flags = matrix[ro][m] || {};
          PERMS.forEach(function (pm, i) {
            var td = h("td", { "data-label": t("ucms.perms." + pm) });
            var cb = h("input", { type: "checkbox", "aria-label": t("role." + ro) + " · " + m + " · " + pm });
            cb.checked = ro === "super_admin" ? true : !!flags[PERM_COLS[i]];
            if (!canManage || ro === "super_admin") cb.disabled = true;
            cb.addEventListener("change", function () {
              matrix[ro][m] = matrix[ro][m] || {};
              matrix[ro][m][PERM_COLS[i]] = cb.checked;
              saveBtn.hidden = false;
            });
            td.appendChild(h("label", { class: "perm-cell" }, cb, h("span", { class: "perm-mobile-label" }, t("ucms.perms." + pm))));
            tr.appendChild(td);
          });
          body.appendChild(tr);
        });
    }
    function save() {
      var jobs = [];
      ROLES.forEach(function (ro) {
        if (ro === "super_admin") return;
        MODULES.forEach(function (m) {
          var flags = matrix[ro][m];
          if (!flags) return;
          jobs.push(db.from("role_permissions").upsert(Object.assign({ role: ro, module: m }, flags), { onConflict: "role,module" }));
        });
      });
      A.busy(saveBtn, true);
      Promise.all(jobs).then(function (res) {
        var bad = res.filter(function (r) { return r.error; })[0];
        if (bad) throw bad.error;
        /* re-fetch our own capabilities and rebuild the navigation */
        return A.applyCapabilities().then(function () {
          if (A.rebuildNav) A.rebuildNav();
          A.preview.reload();
          A.toast(t("ucms.perms.saved"), "ok");
          A.notify("info", t("ucms.perms.saved"), t("ucms.perms.intro"), "permissions");
          saveBtn.hidden = true;
          return load();
        });
      }).catch(function (e) { A.fail(e); }).then(function () { A.busy(saveBtn, false); });
    }
    return load();
  } });

  /* ==================================================================== */
  /* BACKUPS & RESTORE                                                    */
  /* ==================================================================== */
  A.register("backups", { group: "system", icon: "🖫", title: "ucms.nav.backups", render: function (view) {
    var list = h("div", { class: "rows backup-rows" });
    var labelInput = h("input", { type: "text", placeholder: t("ucms.backups.labelPh"), "aria-label": t("ucms.backups.label"), maxlength: 120, style: { maxWidth: "260px" } });
    var createBtn = h("button", { type: "button", class: "btn btn-gold", on: { click: create } }, t("ucms.backups.create"));
    view.appendChild(A.card(t("ucms.backups.title"), [
      h("div", { class: "toolbar backup-create-toolbar", "data-nodirty": "1" }, labelInput, createBtn),
      list], { help: t("ucms.backups.sub") }));

    function load() {
      list.innerHTML = '<div class="empty"><span class="spinner sm"></span> ' + A.esc(t("msg.loading")) + "</div>";
      return db.from("cms_backups").select("*").order("created_at", { ascending: false }).then(function (r) {
        if (r.error) { list.innerHTML = ""; list.appendChild(h("div", { class: "empty" }, r.error.message)); return; }
        list.innerHTML = "";
        (r.data || []).forEach(function (b) {
          var stats = Object.keys(b.stats || {}).length ? Object.keys(b.stats).map(function (k) { return k + ": " + b.stats[k]; }).join(" · ") : "";
          var row = A.row({ id: b.id, draggable: false,
            title: (b.kind === "pre_restore" ? "⟲ " : "") + b.label,
            sub: t("ucms.backups.createdBy") + ": " + A.fmtDateTime(b.created_at) + (stats ? " · " + stats : ""),
            badges: b.kind === "pre_restore" ? A.badge("safety", "gold") : null,
            actions: h("div", { class: "backup-actions" },
              h("button", { type: "button", class: "btn btn-sm btn-ghost", on: { click: function () { download(b); } } }, t("ucms.backups.download")),
              b.kind === "pre_restore" ? null : h("button", { type: "button", class: "btn btn-sm", on: { click: function () { restore(b); } } }, t("ucms.backups.restore"))) });
          row.classList.add("backup-row");
          list.appendChild(row);
        });
        if (!(r.data || []).length) list.appendChild(h("div", { class: "empty" }, t("ucms.backups.empty")));
      });
    }
    function create() {
      if (!A.can.backups) { A.toast(t("ucms.users.adminOnly"), "error"); return; }
      createBtn.disabled = true;
      db.rpc("create_cms_backup", { p_label: labelInput.value.trim() || null }).then(function (r) {
        createBtn.disabled = false;
        if (r.error) { A.fail(r.error); A.notify("error", t("ucms.backups.failed"), r.error.message, "backups"); return; }
        U.audit("backup.create", "cms_backups", r.data, labelInput.value || "Backup", {});
        A.toast(t("ucms.backups.created"), "ok");
        load();
      }).catch(function (e) { createBtn.disabled = false; A.fail(e); });
    }
    function download(b) {
      var url = URL.createObjectURL(new Blob([JSON.stringify(b.manifest, null, 2)], { type: "application/json" }));
      var a = h("a", { href: url, download: "gdf27-backup-" + b.id.slice(0, 8) + ".json" });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }
    /* Server-side atomic restore: validation + pre-restore checkpoint +
       upserts + cleanup all run in ONE database transaction via the
       restore_cms_backup() RPC (order and dependencies are handled in the
       database). A failure rolls back everything — the database is never
       left half-restored. */
    function restore(b) {
      if (!A.can.backups) { A.toast(t("ucms.users.adminOnly"), "error"); return; }
      A.confirm(t("ucms.backups.confirmRestore"), t("ucms.confirm.restore"), true).then(function (ok) {
        if (!ok) return;
        var steps = h("div", { class: "rows" });
        var dlg = A.modal({ title: t("ucms.backups.restore"), size: "md", body: steps, actions: [] });
        function step(text) { steps.appendChild(h("div", { class: "check", role: "status" }, h("i"), text)); }
        step("⚙ " + t("ucms.save.saving") + "…");
        db.rpc("restore_cms_backup", { p_backup_id: b.id }).then(function (r) {
          if (r.error) throw r.error;
          var res = r.data || {};
          steps.innerHTML = "";
          step("🔒 " + t("ucms.backups.checkpoint") + (res.checkpoint_id ? " (" + String(res.checkpoint_id).slice(0, 8) + "…)" : ""));
          var restored = res.restored || {};
          Object.keys(restored).forEach(function (k) { step("✓ " + k + " (" + restored[k] + ")"); });
          U.audit("backup.restore", "cms_backups", b.id, b.label, { server_side: true, checkpoint: res.checkpoint_id });
          A.notify("warning", t("ucms.backups.restored"), b.label, "backups");
          A.toast(t("ucms.backups.restored"), "ok");
          setTimeout(function () { dlg.close(); A.loadCore().then(function () { A.go("backups", true); }); }, 900);
        }).catch(function (e) {
          U.audit("backup.restore", "cms_backups", b.id, b.label, { error: e.message }, "error");
          A.fail(e); dlg.close(); load();
        });
      });
    }
    return load();
  } });

})();
