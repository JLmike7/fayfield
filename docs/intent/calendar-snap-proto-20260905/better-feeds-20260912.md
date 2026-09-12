# Better calendar feeds — 2026-09-12

**Tag:** calendar-snap-proto-20260905 (temp notes; not an ADR)  
**Ask:** Empty York County category ICS shells (Main/Parks/Commissioners/HS/Aging) are useless — find better public sources.  
**Rules:** No HTML scrape. Public ICS / RSS / JSON / APIs only. No live Sources change until Manager green-lights.

**Method:** Re-fetched county iCalendar index + category ICS; probed City of York (The Events Calendar), nearby townships (`?ical=1`), Explore York, colleges, York County Libraries, county RSS. Horizon for “current” = next **90 days** from 2026-09-12.

---

## Baseline (still true)

| Publisher | URL | HTTP | VEVENT | Notes |
| --- | --- | ---: | ---: | --- |
| York County Main | `…/iCalendar.aspx?catID=14&feed=calendar` | 200 `text/calendar` | **0** | Valid empty shell |
| Parks | catID=27 | 200 | **0** | same |
| Commissioners | catID=32 | 200 | **0** | same |
| Human Services | catID=29 | 200 | **0** | same |
| Agency on Aging | catID=33 | 200 | **0** | same |
| Sheriff / HR / Crisis / YADAC | 23 / 31 / 34 / 35 | 200 | **0** | All other county category ICS also empty |
| **Civil & Family Court** | catID=**30** | 200 | **11** | Still the only county category with events (e.g. Family Motions Court Custody/Divorce) |
| Court Calendar RSS | `RSSFeed.aspx?ModID=58&CID=Civil-and-Family-Court-Calendar-30` | 200 `text/xml` | 8 `<item>` | Structured `calendarEvent:EventDates` — alternate to ICS |
| Fayfield Community Google public ICS | `…/fayfieldcommunity@gmail.com/public/basic.ics` | 429 this run | — | Prior probes: valid empty calendar; Google rate-limit intermittent |

---

## Evidence — feeds with real upcoming structure

### A. City of York, PA — **recommended**

| Field | Value |
| --- | --- |
| Publisher | City of York, Pennsylvania (municipal) |
| Homepage | https://www.yorkcity.org/calendar/ |
| **ICS (official `<link rel="alternate" type="text/calendar">`)** | https://www.yorkcity.org/calendar/?ical=1 |
| HTTP / type | **200** `text/calendar; charset=UTF-8` |
| VEVENT (ICS fetch) | **11** — all inside next 90 days |
| Sample | 2026-09-14 Planning Commission; 2026-09-15 City Council Meeting; 2026-09-17 Zoning Hearing Board; 2026-09-23 City Council Committee Meeting |
| **JSON API (public Tribe REST)** | https://www.yorkcity.org/wp-json/tribe/events/v1/events?per_page=50&start_date=2026-09-12&end_date=2026-12-12 |
| API count | **39** events in window (ICS appears truncated vs API) |
| Why better | Neighbor city (~10–15 min); civic meetings neighbors actually attend/watch; official ICS + richer public JSON; not an empty shell |

### B. Hellam Township — **optional / secondary**

| Field | Value |
| --- | --- |
| Publisher | Hellam Township |
| ICS | https://www.hellamtownship.com/calendar/?ical=1 |
| HTTP / type | **200** `text/calendar` |
| VEVENT | **153** total; **6** in next 90 days (mostly Board of Supervisors) |
| Sample (90d) | 2026-09-17 / 10-01 / 10-15 Board of Supervisors Meeting |
| Why weaker than City | Farther from Fayfield/East York; thin upcoming set; still a real ICS |

### C. York County Court — **keep**

Already on proto (`york-county-court`, catID 30). ICS VEVENT=11; RSS also works. Best county feed that is not empty.

---

## Webpage-only / no verified subscription feed (fail closed)

| Publisher | What we found | Verdict |
| --- | --- | --- |
| Springettsbury Township calendar | https://springettsbury.com/calendar-events/ — captcha to curl; `?ical=1` not confirmed `text/calendar` (prior research + this pass) | **Webpage only** |
| York Suburban SD calendars | https://www.yssd.org/calendars — PDF + HTML tabs; no ICS verified | **Webpage only** |
| Explore York (yorkpa.org) events | HTML events; `/event/rss/` **403** from this host; guessed ICS paths 404 | **No verified public feed** here |
| York County Libraries (events.yorklibraries.org) | Rich HTML calendar; day HTML feed; **per-event** `…/node/{id}/export.ics` only — no site-wide ICS subscribe URL found | **No catalog ICS**; Useful Links / per-event only |
| YCP / Penn State York | Academic calendar pages; guessed `.ics` / `/events/ical` → 404 | **Webpage only** |
| West Manchester / York Twp / Dover `?ical=1` | 404 or HTML | **No feed** |
| County Main/Parks/etc. | Official ICS URLs, empty | **Drop for Sources** |

---

## Ranked swap proposal (for Manager / Michael)

Do **not** apply until green-light.

| Rank | Action | Source | Feed | Default |
| ---: | --- | --- | --- | --- |
| 1 | **Keep** | Fayfield Community | Google public ICS | on (when events exist) |
| 2 | **Keep** | York County Court | County ICS catID=30 (RSS backup) | on |
| 3 | **Add** | City of York | `https://www.yorkcity.org/calendar/?ical=1` (consider Tribe JSON later if ICS stays truncated) | on or opt-in |
| 4 | **Optional add** | Hellam Township | `https://www.hellamtownship.com/calendar/?ical=1` | opt-in |
| 5 | **Drop** | York County Main / Parks / Commissioners / Human Services / Aging | empty shells | — |

**Not proposed as Sources:** Springettsbury, YSSD, Explore York, Libraries catalog — until a real public ICS/JSON appears; keep as Useful Links.

**Implementation note (when approved):** Snapshot script already ICS-shaped; City + Hellam are drop-in `icsUrl`s. City Tribe JSON would need a small JSON→events mapper (still structured, not scrape).

---

## Stopped here

Research + proposal only. Awaiting Manager / Michael pick before changing live Sources or reseed.
