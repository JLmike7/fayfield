#!/usr/bin/env node
/**
 * calendar-snap-proto-20260905
 * Fetch public ICS feeds → same-origin snapshot JSON. Fail closed. No invented events.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROTO_ID = "calendar-snap-proto-20260905";
const HORIZON_DAYS = 90;
const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT =
  "FayfieldCommunityCalendarSnapshot/1.0 (+https://jlmike7.github.io/fayfield/; public ICS only)";

const SOURCE_DEFS = [
  {
    id: "fayfield-community",
    name: "Fayfield Community",
    defaultEnabled: true,
    homepage:
      "https://calendar.google.com/calendar/embed?src=fayfieldcommunity%40gmail.com&ctz=America/New_York",
    icsUrl:
      "https://calendar.google.com/calendar/ical/fayfieldcommunity%40gmail.com/public/basic.ics",
  },
  {
    id: "york-county-main",
    name: "York County Main",
    defaultEnabled: false,
    homepage: "https://yorkcountypa.gov/calendar.aspx",
    icsUrl:
      "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=14&feed=calendar",
  },
  {
    id: "york-county-parks",
    name: "York County Parks",
    defaultEnabled: false,
    homepage: "https://www.yorkcountypa.gov/568/Parks-Recreation",
    icsUrl:
      "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=27&feed=calendar",
  },
  {
    id: "york-county-commissioners",
    name: "York County Commissioners",
    defaultEnabled: false,
    homepage: "https://yorkcountypa.gov/calendar.aspx",
    icsUrl:
      "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=32&feed=calendar",
  },
  {
    id: "york-county-human-services",
    name: "York County Human Services",
    defaultEnabled: false,
    homepage: "https://yorkcountypa.gov/278/County-Human-Services",
    icsUrl:
      "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=29&feed=calendar",
  },
  {
    id: "york-county-aging",
    name: "York County Aging",
    defaultEnabled: false,
    homepage: "https://yorkcountypa.gov/calendar.aspx",
    icsUrl:
      "https://www.yorkcountypa.gov/common/modules/iCalendar/iCalendar.aspx?catID=33&feed=calendar",
  },
];

function nowIso() {
  return new Date().toISOString();
}

/** YYYY-MM-DD for America/New_York "today" */
function todayInNy(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function unfoldIcs(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function parsePropLine(line) {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const parts = left.split(";");
  const name = parts[0].toUpperCase();
  const params = {};
  for (let i = 1; i < parts.length; i++) {
    const eq = parts[i].indexOf("=");
    if (eq === -1) continue;
    params[parts[i].slice(0, eq).toUpperCase()] = parts[i].slice(eq + 1);
  }
  return { name, params, value };
}

function unescapeIcs(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * Parse DTSTART/DTEND lightly.
 * Returns { isoOrDate, allDay } where isoOrDate is YYYY-MM-DD or ISO-8601.
 */
function parseDateValue(params, value) {
  const v = String(value || "").trim();
  const valueParam = (params.VALUE || "").toUpperCase();
  if (valueParam === "DATE" || (/^\d{8}$/.test(v) && !v.includes("T"))) {
    const ymd = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
    return { isoOrDate: ymd, allDay: true };
  }
  // DATE-TIME: 20260905T183000Z or 20260905T143000 (with optional TZID)
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) {
    if (/^\d{8}$/.test(v)) {
      const ymd = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
      return { isoOrDate: ymd, allDay: true };
    }
    return { isoOrDate: v, allDay: false };
  }
  const [, Y, Mo, D, H, Mi, S, Z] = m;
  if (Z) {
    return {
      isoOrDate: `${Y}-${Mo}-${D}T${H}:${Mi}:${S}Z`,
      allDay: false,
    };
  }
  // Floating / TZID: keep as local wall time without inventing offset
  const tzid = params.TZID || "";
  if (tzid) {
    return {
      isoOrDate: `${Y}-${Mo}-${D}T${H}:${Mi}:${S}`,
      allDay: false,
    };
  }
  return {
    isoOrDate: `${Y}-${Mo}-${D}T${H}:${Mi}:${S}`,
    allDay: false,
  };
}

function dayKey(isoOrDate) {
  return String(isoOrDate || "").slice(0, 10);
}

function parseVevents(icsText) {
  const unfolded = unfoldIcs(icsText);
  const lines = unfolded.split(/\n/);
  const events = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.uid && cur.dtstart) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const prop = parsePropLine(line);
    if (!prop) continue;
    switch (prop.name) {
      case "UID":
        cur.uid = unescapeIcs(prop.value);
        break;
      case "SUMMARY":
        cur.title = unescapeIcs(prop.value);
        break;
      case "DTSTART": {
        const parsed = parseDateValue(prop.params, prop.value);
        cur.dtstart = parsed.isoOrDate;
        cur.allDay = parsed.allDay;
        break;
      }
      case "DTEND": {
        const parsed = parseDateValue(prop.params, prop.value);
        cur.dtend = parsed.isoOrDate;
        break;
      }
      case "LOCATION":
        cur.location = unescapeIcs(prop.value);
        break;
      case "DESCRIPTION":
        cur.description = unescapeIcs(prop.value);
        break;
      case "URL":
        cur.url = unescapeIcs(prop.value);
        break;
      default:
        break;
    }
  }
  return events;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/calendar, text/plain, */*",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function inWindow(event, windowStart, windowEnd) {
  const day = dayKey(event.dtstart);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day >= windowStart && day <= windowEnd;
}

async function pullSource(def, windowStart, windowEnd, retrievedAt) {
  const base = {
    id: def.id,
    name: def.name,
    defaultEnabled: def.defaultEnabled,
    homepage: def.homepage,
    icsUrl: def.icsUrl,
    ok: false,
    error: null,
    retrievedAt,
    eventCount: 0,
  };
  try {
    const text = await fetchText(def.icsUrl);
    const parsed = parseVevents(text);
    const kept = parsed.filter((e) => inWindow(e, windowStart, windowEnd));
    const events = kept.map((e) => ({
      uid: e.uid,
      sourceId: def.id,
      title: e.title || "(untitled)",
      dtstart: e.dtstart,
      dtend: e.dtend || "",
      allDay: !!e.allDay,
      location: e.location || "",
      description: e.description || "",
      url: e.url || "",
      retrievedAt,
    }));
    base.ok = true;
    base.error = null;
    base.eventCount = events.length;
    return { source: base, events };
  } catch (err) {
    base.ok = false;
    base.error = String(err && err.message ? err.message : err);
    base.eventCount = 0;
    return { source: base, events: [] };
  }
}

async function main() {
  const retrievedAt = nowIso();
  const windowStart = todayInNy();
  const windowEnd = addDaysYmd(windowStart, HORIZON_DAYS);
  const sources = [];
  const events = [];

  for (const def of SOURCE_DEFS) {
    const result = await pullSource(def, windowStart, windowEnd, retrievedAt);
    sources.push(result.source);
    for (const ev of result.events) events.push(ev);
  }

  const snapshot = {
    protoId: PROTO_ID,
    retrievedAt,
    horizonDays: HORIZON_DAYS,
    windowStart,
    windowEnd,
    sources,
    events,
  };

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.join(__dirname, "..", "data", "calendar-snapshot.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${outPath} sources=${sources.length} events=${events.length} ok=${sources.filter((s) => s.ok).length}`
  );
  for (const s of sources) {
    console.log(`  ${s.id}: ok=${s.ok} count=${s.eventCount}${s.error ? " err=" + s.error : ""}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
