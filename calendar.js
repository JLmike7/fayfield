(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FayfieldCalendar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var STORAGE_KEY = "fayfield-calendar-prefs";

  var CATALOG = {
    sources: [
      {
        id: "fayfield-community",
        name: "Fayfield Community",
        group: "Fayfield Community",
        defaultEnabled: true,
        sourceHomepage: null,
        transport: null,
        endpoint: null,
        parser: null,
        timezone: "America/New_York",
        enabled: true,
        notes: "No public calendar ID yet. Fail closed.",
      },
    ],
  };

  function defaultSelection(catalog) {
    return {
      enabled: catalog.sources.filter(function (s) { return s.defaultEnabled; }).map(function (s) { return s.id; }),
      view: "agenda",
    };
  }

  function loadSource(source) {
    if (!source || !source.endpoint) {
      return Promise.resolve({ hidden: true, events: [], publicError: false });
    }
    return Promise.resolve({ hidden: true, events: [], publicError: false });
  }

  function filterEvents(events, opts) {
    opts = opts || {};
    var query = (opts.query || "").trim().toLowerCase();
    var start = opts.start || "";
    var end = opts.end || "";
    return events.filter(function (event) {
      if (query && String(event.title || "").toLowerCase().indexOf(query) === -1) return false;
      var day = String(event.start || "").slice(0, 10);
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

  function groupSources(catalog) {
    var groups = {};
    catalog.sources.forEach(function (source) {
      var name = source.group || source.name;
      if (!groups[name]) groups[name] = [];
      groups[name].push(source);
    });
    return groups;
  }

  async function loadEnabledEvents(catalog, selection) {
    var enabled = selection.enabled || [];
    var all = [];
    for (var i = 0; i < catalog.sources.length; i++) {
      var source = catalog.sources[i];
      if (enabled.indexOf(source.id) === -1) continue;
      var result = await loadSource(source);
      if (result.hidden) continue;
      all = all.concat(result.events);
    }
    return all;
  }

  return {
    CATALOG: CATALOG,
    STORAGE_KEY: STORAGE_KEY,
    defaultSelection: defaultSelection,
    loadSource: loadSource,
    filterEvents: filterEvents,
    savePrefs: savePrefs,
    readPrefs: readPrefs,
    groupSources: groupSources,
    loadEnabledEvents: loadEnabledEvents,
  };
});
