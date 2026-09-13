(function () {
  var cal = globalThis.FayfieldCalendar;
  if (!cal) return;
  var form = document.getElementById("cal-controls");
  var results = document.getElementById("cal-results");
  if (!form || !results) return;

  var snapshot = null;
  var catalog = cal.CATALOG;
  var asOfEl = document.getElementById("cal-asof");
  var selectedDay = cal.todayYmdNy();
  var monthKey = selectedDay.slice(0, 7);
  var monthOpen = true;
  var lastEvents = [];

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
    var prev = cal.readPrefs(window.localStorage) || {};
    var prefs = {
      enabled: enabled,
      view: "teams",
      selectedDay: selectedDay,
      monthOpen: monthOpen,
      monthKey: monthKey,
    };
    if (Array.isArray(prev.seenSourceIds)) prefs.seenSourceIds = prev.seenSourceIds;
    return prefs;
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
    var dayLabel = formatDayHeading(prefs.selectedDay || selectedDay);
    meta.textContent = sources + " · " + dayLabel;
  }

  function filtersDetails() {
    return document.querySelector("details.cal-filters");
  }

  function closeFilters() {
    var details = filtersDetails();
    if (details && details.open) details.open = false;
  }

  function cleanLocation(loc) {
    return String(loc || "")
      .replace(/^[\s\-–—]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ymdOf(iso) {
    var m = String(iso || "").match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }

  function clockOf(iso) {
    var m = String(iso || "").match(/T(\d{2}:\d{2})/);
    return m ? m[1] : "";
  }

  function addDaysYmd(ymd, days) {
    var parts = ymd.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
  }

  function shortMonthDay(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || "")) return ymd || "";
    var parts = ymd.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(dt);
  }

  function shortWeekday(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || "")) return "";
    var parts = ymd.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }).format(dt);
  }

  /** Option 3 when portion: includes end when available. */
  function formatWhen(event) {
    var start = event.start || event.dtstart || "";
    var end = event.end || event.dtend || "";
    if (!start) return "";
    var allDay = event.allDay || /^\d{4}-\d{2}-\d{2}$/.test(start);
    if (allDay) {
      var sYmd = ymdOf(start);
      if (!end) return "All day";
      var eYmd = ymdOf(end);
      // ICS all-day DTEND is exclusive
      var last = eYmd ? addDaysYmd(eYmd, -1) : sYmd;
      if (!eYmd || last <= sYmd) return "All day";
      return "All day · " + shortMonthDay(sYmd) + "–" + shortMonthDay(last);
    }
    var startClock = clockOf(start);
    if (!startClock) {
      var t = start.replace("T", " ").replace(/Z$/, " UTC");
      var m = t.match(/\d{2}:\d{2}/);
      return m ? m[0] : t;
    }
    if (!end) return startClock;
    var endClock = clockOf(end);
    var sDay = ymdOf(start);
    var eDay = ymdOf(end);
    if (endClock && sDay && eDay && sDay === eDay) {
      return startClock + "–" + endClock;
    }
    if (endClock && eDay) {
      return startClock + "–" + shortWeekday(eDay) + " " + endClock;
    }
    return startClock;
  }

  /** Strip tags/entities for safe peek text (no HTML in card). */
  function descriptionPlain(raw) {
    var s = String(raw || "");
    s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n");
    s = s.replace(/<[^>]+>/g, " ");
    s = s
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, function (_, n) {
        return String.fromCharCode(Number(n));
      });
    s = s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n");
    s = s.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
    return s;
  }

  function shouldShowDescription(event) {
    var plain = descriptionPlain(event.description);
    if (!plain) return false;
    var url = String(event.url || "").trim();
    if (url && plain === url) return false;
    if (/^https?:\/\/\S+$/i.test(plain)) return false;
    return true;
  }

  function formatDayHeading(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || "")) return "Pick a day";
    var parts = ymd.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(dt);
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
      var color = cal.colorForSourceId(s.id, catalog);
      var swatch =
        '<span class="cal-swatch" style="background:' +
        escapeHtml(color) +
        '" aria-hidden="true"></span>';
      if (href) {
        links.push(
          swatch +
            '<a href="' +
            escapeHtml(href) +
            '" rel="noopener noreferrer">' +
            escapeHtml(name) +
            "</a>"
        );
      } else {
        links.push(swatch + escapeHtml(name));
      }
    });
    if (links.length) {
      parts.push(
        '<p class="cal-attribution">Publishers: ' +
          links.join(" · ") +
          ". We don’t invent events.</p>"
      );
    }
    return parts.join("");
  }

  function emptyDayMessage(prefs) {
    return (
      "Nothing on " +
      formatDayHeading(prefs.selectedDay || selectedDay) +
      " for the sources you checked. Tap another day, or we only show what the public feeds returned."
    );
  }

  function paintSourceSwatches() {
    form.querySelectorAll('input[name="source"]').forEach(function (el) {
      var label = el.closest("label");
      if (!label) return;
      var existing = label.querySelector(".cal-swatch");
      if (existing) existing.remove();
      var sw = document.createElement("span");
      sw.className = "cal-swatch";
      sw.setAttribute("aria-hidden", "true");
      sw.style.background = cal.colorForSourceId(el.value, catalog);
      label.insertBefore(sw, label.firstChild);
    });
  }

  function shiftMonth(delta) {
    var parts = monthKey.split("-").map(Number);
    var y = parts[0];
    var m = parts[1] + delta;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    monthKey = y + "-" + String(m).padStart(2, "0");
  }

  function renderMonthPane(events) {
    var model = cal.buildMonthModel(monthKey, events);
    var today = cal.todayYmdNy();
    var counts = cal.countByDay(events);
    var openAttr = monthOpen ? " open" : "";
    var nav =
      '<div class="month-nav">' +
      '<button type="button" class="month-nav-btn" data-month-delta="-1" aria-label="Previous month">‹</button>' +
      '<span class="month-title">' +
      escapeHtml(model.label) +
      "</span>" +
      '<button type="button" class="month-nav-btn" data-month-delta="1" aria-label="Next month">›</button>' +
      "</div>";
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
            var classes = "month-cell month-cell--day";
            if (cell.ymd === today) classes += " month-cell--today";
            if (cell.ymd === selectedDay) classes += " month-cell--selected";
            var n = counts[cell.ymd] || 0;
            var countHtml =
              n > 0
                ? '<span class="month-count" aria-label="' +
                  n +
                  " events\">" +
                  n +
                  "</span>"
                : "";
            var dots = cal
              .sourceIdsOnDay(events, cell.ymd)
              .slice(0, 4)
              .map(function (id) {
                return (
                  '<span class="month-dot" style="background:' +
                  escapeHtml(cal.colorForSourceId(id, catalog)) +
                  '"></span>'
                );
              })
              .join("");
            return (
              '<button type="button" class="' +
              classes +
              '" data-day="' +
              escapeHtml(cell.ymd) +
              '" aria-pressed="' +
              (cell.ymd === selectedDay ? "true" : "false") +
              '" aria-label="' +
              escapeHtml(cell.ymd) +
              (n ? ", " + n + " events" : "") +
              '">' +
              '<span class="month-daynum">' +
              cell.day +
              "</span>" +
              countHtml +
              '<span class="month-dots">' +
              dots +
              "</span>" +
              "</button>"
            );
          })
          .join("");
      })
      .join("");
    return (
      '<details class="cal-month-pane"' +
      openAttr +
      ">" +
      "<summary>Month calendar</summary>" +
      '<div class="cal-month-body">' +
      nav +
      '<div class="month-grid month-grid--compact" role="grid" aria-label="' +
      escapeHtml(model.label) +
      '">' +
      dow +
      cells +
      "</div></div></details>"
    );
  }

  function renderDayAgenda(events, prefs) {
    var day = prefs.selectedDay || selectedDay;
    var dayEvents = cal
      .eventsOnDay(events, day)
      .slice()
      .sort(function (a, b) {
        return String(a.start || a.dtstart || "").localeCompare(
          String(b.start || b.dtstart || "")
        );
      });
    var head =
      '<div class="cal-day-head"><h2 class="cal-day-title">' +
      escapeHtml(formatDayHeading(day)) +
      "</h2>" +
      '<p class="cal-day-sub">' +
      dayEvents.length +
      " event" +
      (dayEvents.length === 1 ? "" : "s") +
      "</p></div>";
    if (!dayEvents.length) {
      return head + '<p class="cal-empty">' + escapeHtml(emptyDayMessage(prefs)) + "</p>";
    }
    var items = dayEvents
      .map(function (event) {
        var color = cal.colorForSourceId(event.sourceId, catalog);
        var source = event.sourceName
          ? '<p class="cal-agenda-source">' + escapeHtml(event.sourceName) + "</p>"
          : "";
        var title =
          '<h3 class="cal-agenda-title">' + escapeHtml(event.title || "Event") + "</h3>";
        var when = formatWhen(event);
        var where = cleanLocation(event.location);
        var metaParts = [];
        if (when) metaParts.push(when);
        if (where) metaParts.push(where);
        var meta = metaParts.length
          ? '<p class="cal-agenda-meta">' + escapeHtml(metaParts.join(" · ")) + "</p>"
          : "";
        var linkBits = [];
        if (shouldShowDescription(event)) {
          var body = escapeHtml(descriptionPlain(event.description)).replace(
            /\n/g,
            "<br>"
          );
          linkBits.push(
            '<details class="cal-agenda-desc"><summary>description</summary>' +
              '<div class="cal-agenda-desc-body">' +
              body +
              "</div></details>"
          );
        }
        if (event.url) {
          linkBits.push(
            '<a class="cal-agenda-original" href="' +
              escapeHtml(event.url) +
              '" rel="noopener noreferrer">Original event</a>'
          );
        }
        var links = linkBits.length
          ? '<p class="cal-agenda-links">' +
            linkBits.join('<span class="cal-agenda-links-sep"> · </span>') +
            "</p>"
          : "";
        return (
          '<li class="cal-agenda-item" style="border-left-color:' +
          escapeHtml(color) +
          '">' +
          source +
          title +
          meta +
          links +
          "</li>"
        );
      })
      .join("");
    return head + '<ol class="cal-agenda cal-agenda--day">' + items + "</ol>";
  }

  function render(events, prefs) {
    lastEvents = events || [];
    var attr = attributionHtml(prefs);
    results.innerHTML =
      attr + renderMonthPane(lastEvents) + renderDayAgenda(lastEvents, prefs);
    var pane = results.querySelector("details.cal-month-pane");
    if (pane) {
      pane.addEventListener("toggle", function () {
        monthOpen = pane.open;
        cal.savePrefs(window.localStorage, currentPrefs());
      });
    }
  }

  function onResultsClick(e) {
    var dayBtn = e.target.closest("[data-day]");
    if (dayBtn && results.contains(dayBtn)) {
      selectedDay = dayBtn.getAttribute("data-day");
      refresh();
      return;
    }
    var navBtn = e.target.closest("[data-month-delta]");
    if (navBtn && results.contains(navBtn)) {
      shiftMonth(Number(navBtn.getAttribute("data-month-delta")));
      refresh();
    }
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
    if (stored.selectedDay && /^\d{4}-\d{2}-\d{2}$/.test(stored.selectedDay)) {
      selectedDay = stored.selectedDay;
    } else {
      selectedDay = cal.todayYmdNy();
    }
    if (stored.monthKey && /^\d{4}-\d{2}$/.test(stored.monthKey)) {
      monthKey = stored.monthKey;
    } else {
      monthKey = selectedDay.slice(0, 7);
    }
    if (typeof stored.monthOpen === "boolean") monthOpen = stored.monthOpen;

    cal.savePrefs(window.localStorage, Object.assign({}, stored, {
      selectedDay: selectedDay,
      monthKey: monthKey,
      monthOpen: monthOpen,
      view: "teams",
    }));

    form.querySelectorAll('input[name="source"]').forEach(function (el) {
      el.checked = stored.enabled.indexOf(el.value) !== -1;
    });
    paintSourceSwatches();
    form.addEventListener("change", refresh);
    form.addEventListener("input", refresh);
    results.addEventListener("click", onResultsClick);

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
