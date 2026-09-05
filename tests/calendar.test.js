const test = require("node:test");
const assert = require("node:assert/strict");
const cal = require("../calendar.js");

test("Fayfield Community and Court are default-on among seven catalog entries", () => {
  const defaults = cal.defaultSelection(cal.CATALOG);
  assert.deepEqual(defaults.enabled, ["fayfield-community", "york-county-court"]);
  assert.equal(defaults.view, "agenda");
  assert.equal(cal.CATALOG.sources.length, 7);
  const src = cal.CATALOG.sources.find((s) => s.id === "fayfield-community");
  assert.equal(src.defaultEnabled, true);
  assert.equal(src.endpoint, cal.SNAPSHOT_URL);
  const court = cal.CATALOG.sources.find((s) => s.id === "york-county-court");
  assert.equal(court.defaultEnabled, true);
  const county = cal.CATALOG.sources.filter((s) => s.id.startsWith("york-county-"));
  assert.equal(county.length, 6);
  for (const s of county) {
    if (s.id === "york-county-court") continue;
    assert.equal(s.defaultEnabled, false);
  }
});

test("mergePrefsWithCatalog opts in new defaultEnabled sources once", () => {
  const stale = { enabled: ["fayfield-community"], view: "agenda" };
  const merged = cal.mergePrefsWithCatalog(stale, cal.CATALOG);
  assert.ok(merged.enabled.includes("fayfield-community"));
  assert.ok(merged.enabled.includes("york-county-court"));
  assert.ok(merged.seenSourceIds.includes("york-county-court"));
  // User unchecked Court after seeing it — do not re-force
  const afterUncheck = {
    enabled: ["fayfield-community"],
    view: "agenda",
    seenSourceIds: merged.seenSourceIds,
  };
  const again = cal.mergePrefsWithCatalog(afterUncheck, cal.CATALOG);
  assert.ok(!again.enabled.includes("york-county-court"));
});

test("loadSource fail-closes when snapshot source ok is false", async () => {
  const src = cal.CATALOG.sources.find((s) => s.id === "fayfield-community");
  const snapshot = {
    sources: [{ id: "fayfield-community", ok: false, error: "HTTP 500", eventCount: 0 }],
    events: [
      {
        uid: "should-not-appear",
        sourceId: "fayfield-community",
        title: "Invented",
        dtstart: "2026-09-10",
      },
    ],
  };
  const result = await cal.loadSource(src, { snapshot });
  assert.equal(result.hidden, true);
  assert.deepEqual(result.events, []);
  assert.equal(result.publicError, false);
});

test("loadSource fail-closes when source is missing from snapshot", async () => {
  const src = cal.CATALOG.sources.find((s) => s.id === "york-county-main");
  const snapshot = { sources: [], events: [] };
  const result = await cal.loadSource(src, { snapshot });
  assert.equal(result.hidden, true);
  assert.deepEqual(result.events, []);
});

test("loadSource returns snapshot events for an ok source and never invents", async () => {
  const src = cal.CATALOG.sources.find((s) => s.id === "fayfield-community");
  const snapshot = {
    sources: [{ id: "fayfield-community", ok: true, eventCount: 1 }],
    events: [
      {
        uid: "evt-1",
        sourceId: "fayfield-community",
        title: "Block party",
        dtstart: "2026-09-12T18:00:00",
        dtend: "2026-09-12T20:00:00",
        allDay: false,
        location: "Park",
        description: "",
        url: "https://example.com/event",
        retrievedAt: "2026-09-05T12:00:00.000Z",
      },
      {
        uid: "other",
        sourceId: "york-county-main",
        title: "Other",
        dtstart: "2026-09-13",
      },
    ],
  };
  const result = await cal.loadSource(src, { snapshot });
  assert.equal(result.hidden, false);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, "Block party");
  assert.equal(result.events[0].sourceName, "Fayfield Community");
  assert.equal(result.events[0].start, "2026-09-12T18:00:00");
});

test("loadSource without snapshot and without fetch fail-closes", async () => {
  const result = await cal.loadSource({
    id: "imaginary",
    name: "Imaginary",
    endpoint: null,
  });
  assert.equal(result.hidden, true);
  assert.deepEqual(result.events, []);
});

test("filterEvents matches keyword and date range without merging", () => {
  const events = [
    { id: "a", title: "Picnic", start: "2026-09-10", sourceName: "A" },
    { id: "b", title: "Meeting", start: "2026-09-12", sourceName: "B" },
    { id: "c", title: "Picnic", start: "2026-09-12", sourceName: "A" },
  ];
  const picnic = cal.filterEvents(events, { query: "picnic" });
  assert.equal(picnic.length, 2);
  const ranged = cal.filterEvents(events, { start: "2026-09-11", end: "2026-09-12" });
  assert.deepEqual(ranged.map((e) => e.id), ["b", "c"]);
});

test("prefs round-trip in a storage object", () => {
  const store = {};
  const prefs = { enabled: ["fayfield-community"], view: "month" };
  cal.savePrefs(store, prefs);
  assert.deepEqual(cal.readPrefs(store), prefs);
});
