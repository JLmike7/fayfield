(function () {
  var cal = globalThis.FayfieldCalendar;
  if (!cal) return;
  var form = document.getElementById("cal-controls");
  var results = document.getElementById("cal-results");
  if (!form || !results) return;

  function currentPrefs() {
    var enabled = [];
    form.querySelectorAll('input[name="source"]:checked').forEach(function (el) {
      enabled.push(el.value);
    });
    var viewEl = form.querySelector('input[name="view"]:checked');
    return { enabled: enabled, view: viewEl ? viewEl.value : "agenda" };
  }

  function render(events, view) {
    if (!events.length) {
      results.innerHTML = '<p class="cal-empty">No events to show. Fayfield Community does not have a public calendar ID yet, so this source is hidden (fail closed). Nearby publisher pages that are not browser-readable feeds are on Useful Links.</p>';
      return;
    }
    if (view === "month") {
      results.innerHTML = '<div class="month-grid"></div>';
      return;
    }
    var items = events.map(function (event) {
      var label = event.sourceName ? '<span class="source">' + event.sourceName + "</span>" : "";
      var link = event.url ? ' <a href="' + event.url + '">Original event</a>' : "";
      return "<li>" + label + " <strong>" + event.title + "</strong> " + (event.start || "") + link + "</li>";
    }).join("");
    results.innerHTML = '<ol class="cal-agenda">' + items + "</ol>";
  }

  async function refresh() {
    var prefs = currentPrefs();
    cal.savePrefs(window.localStorage, prefs);
    var loaded = await cal.loadEnabledEvents(cal.CATALOG, prefs);
    var filtered = cal.filterEvents(loaded, {
      query: document.getElementById("cal-query").value,
      start: document.getElementById("cal-start").value,
      end: document.getElementById("cal-end").value,
    });
    render(filtered, prefs.view);
  }

  var stored = cal.readPrefs(window.localStorage) || cal.defaultSelection(cal.CATALOG);
  form.querySelectorAll('input[name="source"]').forEach(function (el) {
    el.checked = stored.enabled.indexOf(el.value) !== -1;
  });
  form.querySelectorAll('input[name="view"]').forEach(function (el) {
    el.checked = el.value === stored.view;
  });
  form.addEventListener("change", refresh);
  form.addEventListener("input", refresh);
  refresh();
})();
