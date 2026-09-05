(function () {
  var cal = globalThis.FayfieldCalendar;
  if (!cal) return;
  var form = document.getElementById("cal-controls");
  var results = document.getElementById("cal-results");
  if (!form || !results) return;

  var snapshot = null;
  var catalog = cal.CATALOG;
  var asOfEl = document.getElementById("cal-asof");

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentPrefs() {
    var enabled = [];
    form.querySelectorAll('input[name="source"]:checked').forEach(function (el) {
      enabled.push(el.value);
    });
    var viewEl = form.querySelector('input[name="view"]:checked');
    var prev = cal.readPrefs(window.localStorage) || {};
    var prefs = { enabled: enabled, view: viewEl ? viewEl.value : "agenda" };
    if (Array.isArray(prev.seenSourceIds)) prefs.seenSourceIds = prev.seenSourceIds;
    return prefs;
  }

  function capitalizeView(view) {
    view = view || "agenda";
    return view.charAt(0).toUpperCase() + view.slice(1);
  }

  function updateFiltersMeta(prefs) {
    var meta = document.getElementById("cal-filters-meta");
    if (!meta) return;
    var names = [];
    form.querySelectorAll('input[name="source"]:checked').forEach(function (el) {
      var label = el.closest("label");
      var text = label ? label.textContent.replace(/\s+/g, " ").trim() : "";
      if (text) names.push(text);
    });
    var sources = names.length ? names.join(", ") : "No sources";
    meta.textContent = sources + " · " + capitalizeView(prefs.view);
  }

  function filtersDetails() {
    return document.querySelector("details.cal-filters");
  }

  function closeFilters() {
    var details = filtersDetails();
    if (details && details.open) details.open = false;
  }

  function formatWhen(event) {
    var start = event.start || event.dtstart || "";
    if (!start) return "";
    if (event.allDay || /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return start.slice(0, 10);
    }
    return start.replace("T", " ").replace(/Z$/, " UTC");
  }

  function attributionHtml(prefs) {
    if (!snapshot) return "";
    var parts = [];
    var retrieved = snapshot.retrievedAt || "";
    if (retrieved) {
      parts.push('<p class="cal-asof">As of ' + escapeHtml(retrieved) + " (snapshot).</p>");
    }
    var enabled = prefs.enabled || [];
    var links = [];
    (snapshot.sources || []).forEach(function (s) {
      if (enabled.indexOf(s.id) === -1) return;
      if (!s.ok) return;
      var href = s.homepage || "";
      var name = s.name || s.id;
      if (href) {
        links.push('<a href="' + escapeHtml(href) + '" rel="noopener noreferrer">' + escapeHtml(name) + "</a>");
      } else {
        links.push(escapeHtml(name));
      }
    });
    if (links.length) {
      parts.push('<p class="cal-attribution">Publishers: ' + links.join(" · ") + ". We don’t invent events.</p>");
    }
    return parts.join("");
  }

  function emptyMessage(prefs) {
    var onlyFayfield =
      prefs.enabled.length === 1 && prefs.enabled[0] === "fayfield-community";
    if (onlyFayfield) {
      return "Nothing on the calendar yet. Fayfield’s public feed has no upcoming events in this window, so we show nothing rather than make something up.";
    }
    return "Nothing on the calendar yet for the sources you checked. We only show what the public feeds returned — rather than make something up.";
  }

  function renderMonthHtml(events) {
    var monthKey = cal.pickMonthKey(events);
    var model = cal.buildMonthModel(monthKey, events);
    var today = cal.todayYmdNy();
    var head =
      '<div class="month-head"><h2 class="month-title">' +
      escapeHtml(model.label) +
      "</h2></div>";
    var dow = model.weekdayLabels
      .map(function (d) {
        return '<div class="month-dow">' + escapeHtml(d) + "</div>";
      })
      .join("");
    var cells = model.weeks
      .map(function (week) {
        return week
          .map(function (cell) {
            if (!cell.inMonth) {
              return '<div class="month-cell month-cell--pad" aria-hidden="true"></div>';
            }
            var isToday = cell.ymd === today ? " month-cell--today" : "";
            var list = (cell.events || [])
              .slice(0, 3)
              .map(function (event) {
                var tip = escapeHtml(event.title || "");
                return (
                  '<div class="month-event" title="' +
                  tip +
                  '">' +
                  tip +
                  "</div>"
                );
              })
              .join("");
            var more =
              (cell.events || []).length > 3
                ? '<div class="month-more">+' +
                  ((cell.events || []).length - 3) +
                  " more</div>"
                : "";
            return (
              '<div class="month-cell' +
              isToday +
              '"><div class="month-daynum">' +
              cell.day +
              "</div>" +
              list +
              more +
              "</div>"
            );
          })
          .join("");
      })
      .join("");
    var note =
      model.outsideCount > 0
        ? '<p class="month-note">' +
          model.outsideCount +
          " more event" +
          (model.outsideCount === 1 ? "" : "s") +
          " outside this month — switch to Agenda to see them.</p>"
        : "";
    return (
      head +
      '<div class="month-grid" role="grid" aria-label="' +
      escapeHtml(model.label) +
      '">' +
      dow +
      cells +
      "</div>" +
      note
    );
  }

  function render(events, prefs) {
    var attr = attributionHtml(prefs);
    if (!events.length) {
      results.innerHTML =
        attr + '<p class="cal-empty">' + escapeHtml(emptyMessage(prefs)) + "</p>";
      return;
    }
    if (prefs.view === "month") {
      results.innerHTML = attr + renderMonthHtml(events);
      return;
    }
    var items = events
      .slice()
      .sort(function (a, b) {
        return String(a.start || a.dtstart || "").localeCompare(String(b.start || b.dtstart || ""));
      })
      .map(function (event) {
        var label = event.sourceName
          ? '<span class="source">' + escapeHtml(event.sourceName) + "</span>"
          : "";
        var link = event.url
          ? ' <a href="' + escapeHtml(event.url) + '" rel="noopener noreferrer">Original event</a>'
          : "";
        var when = escapeHtml(formatWhen(event));
        var loc = event.location
          ? ' <span class="cal-loc">' + escapeHtml(event.location) + "</span>"
          : "";
        return (
          "<li>" +
          label +
          " <strong>" +
          escapeHtml(event.title) +
          "</strong> " +
          when +
          loc +
          link +
          "</li>"
        );
      })
      .join("");
    results.innerHTML = attr + '<ol class="cal-agenda">' + items + "</ol>";
  }

  async function refresh() {
    var prefs = currentPrefs();
    updateFiltersMeta(prefs);
    cal.savePrefs(window.localStorage, prefs);
    if (asOfEl && snapshot && snapshot.retrievedAt) {
      asOfEl.textContent = "As of " + snapshot.retrievedAt;
    }
    var loaded = await cal.loadEnabledEvents(catalog, prefs, { snapshot: snapshot });
    var filtered = cal.filterEvents(loaded, {
      query: document.getElementById("cal-query").value,
      start: document.getElementById("cal-start").value,
      end: document.getElementById("cal-end").value,
    });
    render(filtered, prefs);
  }

  async function boot() {
    try {
      var res = await fetch(cal.SNAPSHOT_URL, { credentials: "same-origin" });
      if (!res.ok) throw new Error("snapshot " + res.status);
      snapshot = await res.json();
      catalog = cal.catalogFromSnapshot(snapshot, cal.CATALOG);
    } catch (e) {
      snapshot = null;
      catalog = cal.CATALOG;
    }

    var stored = cal.mergePrefsWithCatalog(cal.readPrefs(window.localStorage), catalog);
    cal.savePrefs(window.localStorage, stored);
    form.querySelectorAll('input[name="source"]').forEach(function (el) {
      el.checked = stored.enabled.indexOf(el.value) !== -1;
    });
    form.querySelectorAll('input[name="view"]').forEach(function (el) {
      el.checked = el.value === stored.view;
    });
    form.addEventListener("change", refresh);
    form.addEventListener("input", refresh);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeFilters();
    });

    document.addEventListener("pointerdown", function (e) {
      var details = filtersDetails();
      if (!details || !details.open) return;
      if (details.contains(e.target)) return;
      var active = document.activeElement;
      if (active && active.type === "date" && details.contains(active)) return;
      details.open = false;
    });

    refresh();
  }

  boot();
})();
