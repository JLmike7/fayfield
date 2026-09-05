(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FayfieldCalendar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var STORAGE_KEY = "fayfield-calendar-prefs";
  var SNAPSHOT_URL = "data/calendar-snapshot.json";
  var PROTO_ID = "calendar-snap-proto-20260905";

  var CATALOG = {
    sources: [
      {
        id: "fayfield-community",
        name: "Fayfield Community",
        group: "Fayfield Community",
        defaultEnabled: true,
        sourceHomepage:
          "https://calendar.google.com/calendar/embed?src=fayfieldcommunity%40gmail.com&ctz=America/New_York",
        icsUrl:
          "https://calendar.google.com/calendar/ical/fayfieldcommunity%40gmail.com/public/basic.ics",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: true,
        notes: "Public ICS via same-origin snapshot. Fail closed.",
      },
      {
        id: "york-county-main",
        name: "York County Main",
        group: "York County",
        defaultEnabled: false,
        sourceHomepage: "https://yorkcountypa.gov/calendar.aspx",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=14&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: false,
        notes: "Opt-in. Public ICS via same-origin snapshot.",
      },
      {
        id: "york-county-parks",
        name: "York County Parks",
        group: "York County",
        defaultEnabled: false,
        sourceHomepage: "https://www.yorkcountypa.gov/568/Parks-Recreation",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=27&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: false,
        notes: "Opt-in. Public ICS via same-origin snapshot.",
      },
      {
        id: "york-county-commissioners",
        name: "York County Commissioners",
        group: "York County",
        defaultEnabled: false,
        sourceHomepage: "https://yorkcountypa.gov/calendar.aspx",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=32&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: false,
        notes: "Opt-in. Public ICS via same-origin snapshot.",
      },
      {
        id: "york-county-human-services",
        name: "York County Human Services",
        group: "York County",
        defaultEnabled: false,
        sourceHomepage: "https://yorkcountypa.gov/278/County-Human-Services",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=29&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: false,
        notes: "Opt-in. Public ICS via same-origin snapshot.",
      },
      {
        id: "york-county-aging",
        name: "York County Aging",
        group: "York County",
        defaultEnabled: false,
        sourceHomepage: "https://yorkcountypa.gov/calendar.aspx",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=33&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: false,
        notes: "Opt-in. Public ICS via same-origin snapshot.",
      },
      {
        id: "york-county-court",
        name: "York County Court",
        group: "York County",
        defaultEnabled: true,
        sourceHomepage: "https://yorkcountypa.gov/calendar.aspx",
        icsUrl:
          "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=30&feed=calendar",
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: "America/New_York",
        enabled: true,
        notes: "Demo Source. Public ICS (Civil & Family Court catID=30) via same-origin snapshot.",
      },
    ],
  };

  function defaultSelection(catalog) {
    return {
      enabled: catalog.sources.filter(function (s) { return s.defaultEnabled; }).map(function (s) { return s.id; }),
      view: "agenda",
    };
  }

  function sourceMetaFromSnapshot(snapshot, sourceId) {
    if (!snapshot || !Array.isArray(snapshot.sources)) return null;
    for (var i = 0; i < snapshot.sources.length; i++) {
      if (snapshot.sources[i].id === sourceId) return snapshot.sources[i];
    }
    return null;
  }

  function eventsForSource(snapshot, sourceId) {
    if (!snapshot || !Array.isArray(snapshot.events)) return [];
    return snapshot.events.filter(function (e) { return e.sourceId === sourceId; });
  }

  function mapSnapshotEvent(raw, source) {
    return {
      id: raw.uid,
      uid: raw.uid,
      title: raw.title || "",
      start: raw.dtstart || "",
      end: raw.dtend || "",
      dtstart: raw.dtstart || "",
      dtend: raw.dtend || "",
      allDay: !!raw.allDay,
      location: raw.location || "",
      description: raw.description || "",
      url: raw.url || "",
      sourceId: source.id,
      sourceName: source.name,
      sourceHomepage: source.sourceHomepage || source.homepage || null,
      retrievedAt: raw.retrievedAt || "",
    };
  }

  /**
   * Fail closed: missing source, ok===false, or no snapshot → hidden, no events.
   * opts.snapshot: preloaded snapshot object (preferred in UI).
   * opts.fetchImpl: optional fetch for tests.
   */
  function loadSource(source, opts) {
    opts = opts || {};
    if (!source || !source.id) {
      return Promise.resolve({ hidden: true, events: [], publicError: false });
    }

    function fromSnapshot(snapshot) {
      var meta = sourceMetaFromSnapshot(snapshot, source.id);
      if (!meta || meta.ok !== true) {
        return { hidden: true, events: [], publicError: false, sourceMeta: meta || null };
      }
      var raws = eventsForSource(snapshot, source.id);
      var events = raws.map(function (raw) { return mapSnapshotEvent(raw, source); });
      return { hidden: false, events: events, publicError: false, sourceMeta: meta };
    }

    if (opts.snapshot) {
      return Promise.resolve(fromSnapshot(opts.snapshot));
    }

    var url = opts.snapshotUrl || source.endpoint || SNAPSHOT_URL;
    if (!url) {
      return Promise.resolve({ hidden: true, events: [], publicError: false });
    }

    var fetchFn = opts.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (!fetchFn) {
      return Promise.resolve({ hidden: true, events: [], publicError: false });
    }

    return fetchFn(url, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("snapshot HTTP " + res.status);
        return res.json();
      })
      .then(function (snapshot) {
        return fromSnapshot(snapshot);
      })
      .catch(function () {
        return { hidden: true, events: [], publicError: false };
      });
  }


  function todayYmdNy(d) {
    d = d || new Date();
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }

  function eventDayKey(event) {
    return String(event.start || event.dtstart || "").slice(0, 10);
  }

  /** Pick YYYY-MM to display: current NY month if it has events, else earliest event month. */
  function pickMonthKey(events, todayYmd) {
    todayYmd = todayYmd || todayYmdNy();
    var currentMonth = todayYmd.slice(0, 7);
    var days = (events || [])
      .map(eventDayKey)
      .filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); })
      .sort();
    if (!days.length) return currentMonth;
    for (var i = 0; i < days.length; i++) {
      if (days[i].slice(0, 7) === currentMonth) return currentMonth;
    }
    return days[0].slice(0, 7);
  }

  /**
   * Build a Sunday-start month grid model.
   * year/month from monthKey "YYYY-MM". Cells: { ymd|null, day|null, inMonth, events[] }.
   */
  function buildMonthModel(monthKey, events) {
    var parts = String(monthKey || "").split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]); // 1-12
    if (!year || !month) {
      var today = todayYmdNy();
      year = Number(today.slice(0, 4));
      month = Number(today.slice(5, 7));
      monthKey = today.slice(0, 7);
    }
    var byDay = {};
    (events || []).forEach(function (ev) {
      var day = eventDayKey(ev);
      if (day.slice(0, 7) !== monthKey) return;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(ev);
    });
    Object.keys(byDay).forEach(function (d) {
      byDay[d].sort(function (a, b) {
        return eventDayKey(a).localeCompare(eventDayKey(b)) ||
          String(a.title || "").localeCompare(String(b.title || ""));
      });
    });
    var first = new Date(Date.UTC(year, month - 1, 1));
    var startPad = first.getUTCDay(); // 0=Sun
    var daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    var cells = [];
    var i;
    for (i = 0; i < startPad; i++) {
      cells.push({ ymd: null, day: null, inMonth: false, events: [] });
    }
    for (i = 1; i <= daysInMonth; i++) {
      var ymd =
        year +
        "-" +
        String(month).padStart(2, "0") +
        "-" +
        String(i).padStart(2, "0");
      cells.push({
        ymd: ymd,
        day: i,
        inMonth: true,
        events: byDay[ymd] || [],
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ ymd: null, day: null, inMonth: false, events: [] });
    }
    var weeks = [];
    for (i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    var outside = (events || []).filter(function (ev) {
      return eventDayKey(ev).slice(0, 7) !== monthKey;
    }).length;
    return {
      monthKey: monthKey,
      year: year,
      month: month,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, 1))),
      weekdayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      weeks: weeks,
      outsideCount: outside,
    };
  }

  function filterEvents(events, opts) {
    opts = opts || {};
    var query = (opts.query || "").trim().toLowerCase();
    var start = opts.start || "";
    var end = opts.end || "";
    return events.filter(function (event) {
      if (query && String(event.title || "").toLowerCase().indexOf(query) === -1) return false;
      var day = String(event.start || event.dtstart || "").slice(0, 10);
      if (start && day < start) return false;
      if (end && day > end) return false;
      return true;
    });
  }

  function savePrefs(store, prefs) {
    store[STORAGE_KEY] = JSON.stringify(prefs);
  }

  function readPrefs(store) {
    var raw = store[STORAGE_KEY];
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /**
   * Merge stored prefs with catalog: newly introduced defaultEnabled sources
   * are opted in once. User unchecks stay respected via seenSourceIds.
   */
  function mergePrefsWithCatalog(stored, catalog) {
    if (!stored || !Array.isArray(stored.enabled)) {
      var fresh = defaultSelection(catalog);
      fresh.seenSourceIds = catalog.sources.map(function (s) { return s.id; });
      return fresh;
    }
    var enabled = stored.enabled.slice();
    var seen = Array.isArray(stored.seenSourceIds)
      ? stored.seenSourceIds.slice()
      : enabled.slice();
    catalog.sources.forEach(function (s) {
      if (seen.indexOf(s.id) !== -1) return;
      seen.push(s.id);
      if (s.defaultEnabled && enabled.indexOf(s.id) === -1) {
        enabled.push(s.id);
      }
    });
    return {
      enabled: enabled,
      view: stored.view || "agenda",
      seenSourceIds: seen,
    };
  }

  function groupSources(catalog) {
    var groups = {};
    catalog.sources.forEach(function (source) {
      var name = source.group || source.name;
      if (!groups[name]) groups[name] = [];
      groups[name].push(source);
    });
    return groups;
  }

  async function loadEnabledEvents(catalog, selection, opts) {
    opts = opts || {};
    var enabled = selection.enabled || [];
    var all = [];
    for (var i = 0; i < catalog.sources.length; i++) {
      var source = catalog.sources[i];
      if (enabled.indexOf(source.id) === -1) continue;
      var result = await loadSource(source, opts);
      if (result.hidden) continue;
      all = all.concat(result.events);
    }
    return all;
  }

  function catalogFromSnapshot(snapshot, baseCatalog) {
    baseCatalog = baseCatalog || CATALOG;
    if (!snapshot || !Array.isArray(snapshot.sources)) return baseCatalog;
    var byId = {};
    baseCatalog.sources.forEach(function (s) { byId[s.id] = s; });
    var sources = snapshot.sources.map(function (meta) {
      var base = byId[meta.id] || {};
      return {
        id: meta.id,
        name: meta.name || base.name || meta.id,
        group: base.group || meta.name || meta.id,
        defaultEnabled: typeof meta.defaultEnabled === "boolean" ? meta.defaultEnabled : !!base.defaultEnabled,
        sourceHomepage: meta.homepage || base.sourceHomepage || null,
        homepage: meta.homepage || base.sourceHomepage || null,
        icsUrl: meta.icsUrl || base.icsUrl || null,
        transport: "snapshot",
        endpoint: SNAPSHOT_URL,
        parser: "ics-snapshot",
        timezone: base.timezone || "America/New_York",
        enabled: typeof meta.defaultEnabled === "boolean" ? meta.defaultEnabled : !!base.defaultEnabled,
        ok: meta.ok === true,
        notes: base.notes || "",
      };
    });
    return { sources: sources };
  }


  var SOURCE_COLOR_PALETTE = [
    "#2f6b3a",
    "#1d4e89",
    "#8b5a2b",
    "#6b3a6b",
    "#b45309",
    "#0f766e",
    "#9f1239",
    "#334155",
  ];

  function colorForSourceId(sourceId, catalog) {
    catalog = catalog || CATALOG;
    var sources = (catalog && catalog.sources) || [];
    var idx = -1;
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].id === sourceId) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      var h = 0;
      var s = String(sourceId || "");
      for (var j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) >>> 0;
      idx = h % SOURCE_COLOR_PALETTE.length;
    }
    return SOURCE_COLOR_PALETTE[idx % SOURCE_COLOR_PALETTE.length];
  }

  function eventsOnDay(events, ymd) {
    ymd = String(ymd || "").slice(0, 10);
    return (events || []).filter(function (ev) {
      return eventDayKey(ev) === ymd;
    });
  }

  function countByDay(events) {
    var map = {};
    (events || []).forEach(function (ev) {
      var d = eventDayKey(ev);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }

  function sourceIdsOnDay(events, ymd) {
    var seen = {};
    var out = [];
    eventsOnDay(events, ymd).forEach(function (ev) {
      var id = ev.sourceId || "";
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  return {
    CATALOG: CATALOG,
    STORAGE_KEY: STORAGE_KEY,
    SNAPSHOT_URL: SNAPSHOT_URL,
    PROTO_ID: PROTO_ID,
    defaultSelection: defaultSelection,
    loadSource: loadSource,
    filterEvents: filterEvents,
    todayYmdNy: todayYmdNy,
    eventDayKey: eventDayKey,
    pickMonthKey: pickMonthKey,
    buildMonthModel: buildMonthModel,
    SOURCE_COLOR_PALETTE: SOURCE_COLOR_PALETTE,
    colorForSourceId: colorForSourceId,
    eventsOnDay: eventsOnDay,
    countByDay: countByDay,
    sourceIdsOnDay: sourceIdsOnDay,
    savePrefs: savePrefs,
    readPrefs: readPrefs,
    mergePrefsWithCatalog: mergePrefsWithCatalog,
    groupSources: groupSources,
    loadEnabledEvents: loadEnabledEvents,
    catalogFromSnapshot: catalogFromSnapshot,
  };
});
