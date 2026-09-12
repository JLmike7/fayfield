# YSSD public calendar feeds — deep probe 2026-09-12

**District:** York Suburban School District (YSSD) — Springettsbury / East York area (correct for Fayfield).  
**Site:** https://www.yssd.org  
**Scope:** Public ICS/RSS/JSON/API only. No HTML scrape into snapshot Sources. No live Source changes. Not CYSD.

**Verdict:** **YES — multiple populated public ICS feeds (VEVENT>0) with upcoming events in next ~90 days.**  
Prior probe’s empty `https://www.yssd.org/calendar/calendar_{id}.ics` shells are **legacy dead ends**. Real subscribe URLs are Finalsite Calendar Manager `events.ics?feed_id=…` / `calendar_ids=…`, which mirror **Google Calendar public basic.ics** live URLs (and one SchoolLinks ICS).

---

## 1. Pages fetched

| Page | HTTP | Notes |
|------|------|-------|
| https://www.yssd.org/calendars | 200 | Official calendars hub (not `/calendar`) |
| https://www.yssd.org/departments/ysathletics/athletics-calendar | 200 | Athletics calendar element |
| https://www.yssd.org/school-board/sb-meeting-schedule | 200 | SB meetings + “Calendar RSS Feeds” UI affordance |
| https://www.yssd.org/calendar | 404 | Wrong path |

PDF academic calendars exist (English/Spanish 2026–27) via Finalsite resource-manager — **not** event ICS.

---

## 2. Calendar elements discovered in HTML

| Element | `data-calendar-ids` | `data-calendars-feed-uuid` | Role |
|---------|---------------------|----------------------------|------|
| District & Building Events | `23,19,17,16,21,15,14,20,24` | `e1593953-be32-4318-96ab-54824f430f98` | Main hub |
| Athletic Events | `22` | `9638a4e2-596b-4f59-b4c4-ec3153987f27` (hub) / `7dc8cbf8-b526-43ad-acbb-4fcf3ca13a4c` (athletics page) | Athletics |
| Career / College / Workforce | `25,18` | `fa08eed1-5920-47f6-b13c-5eeb3ea46253` | CCW |
| School Board Meeting Schedule | `21` | `a9c2d8c6-eeb9-4145-b147-f6a8f3c16621` | Board |

Filter labels (building calendars):

| ID | Name |
|----|------|
| 14 | East York Elementary *(Fayfield-relevant)* |
| 15 | Indian Rock Elementary |
| 16 | Valley View Elementary |
| 17 | York Suburban High School |
| 18 | High School Career, College, and Workforce Events |
| 19 | York Suburban Middle School |
| 20 | District-Wide |
| 21 | School Board Meetings |
| 22 | Trojan Athletics |
| 23 | Yorkshire Elementary |
| 24 | Cycle Days |
| 25 | Career, College, and Workforce SchoolLinks |

All of 14–24 are Finalsite `calendartype=live` pointing at Google public ICS. ID 25 is a SchoolLinks ICS URL with embedded public token.

`data-teams-feed-uuid` values resolve to **empty** ICS (VEVENT=0) — athletics are under calendar id 22 / calendars feed_id, not teams feeds.

---

## 3. URL pattern results

### 3a. Legacy (prior probe) — empty shells

`https://www.yssd.org/calendar/calendar_{id}.ics` → HTTP 200 `text/calendar`, **VEVENT=0**, empty `X-WR-CALNAME` for ids 14–25.

`https://www.yssd.org/calendar/calendar_{id}.rss` → HTTP 200 `application/rss+xml`, empty channel (no `<item>`).

Date query params (`?start=` / `?from=`) on legacy `.ics` → **404**.

### 3b. Working Finalsite subscribe pattern (from site JS)

Discovered in `/assets/application-*.js`:

- `https://www.yssd.org/fs/calendar-manager/events.ics?feed_id={calendars-feed-uuid}`
- `https://www.yssd.org/fs/calendar-manager/events.ics?calendar_ids={id}`
- `webcal://www.yssd.org/fs/calendar-manager/events.ics?...` (same path)

Metadata (public with `legacy_element=true`):

- `https://www.yssd.org/fs/calendar-manager/calendars.json?legacy_element=true&calendar_ids={id}` → JSON with `liveURL` Google ICS.

Auth-walled (not usable as public feed):

- `/fs/calendar-manager/events/{uuid}` → 401 JSON `{}`
- `/fs/calendar-manager/events.json?...` → 401
- `/fs/calendar-manager/calendars.json` without `legacy_element=true` → 401
- Classic `/api/calendars/calendarevents.cfm?...` → 200 XML but empty / token-gated style result (no usable public events)

RSS: `/fs/calendar-manager/events.rss?...` → **404**. No public RSS counterpart for the new path.

**Note:** Repeated `calendar_ids=` query params appear to honor **only the last** id (multi-id via repeated keys is unreliable). Prefer `feed_id=` for aggregates, or one `calendar_ids=` per feed. Comma-separated `calendar_ids=23,19,…` also under-returned vs feed_id (probe: 13 VEVENT vs 393).

### 3c. Aggregate Finalsite ICS (probed 2026-09-12)

| Rank | Feed | HTTP | CT | VEVENT total | VEVENT ~90d (2026-09-12→12-11) | Sample titles |
|------|------|------|----|--------------|--------------------------------|---------------|
| 1 | Athletics `feed_id=9638a4e2-596b-4f59-b4c4-ec3153987f27` *(same body as athletics-page uuid `7dc8cbf8-…` and `calendar_ids=22`)* | 200 | text/calendar | 617 | **159** | York Suburban Boys Soccer Tournament; Boys Varsity Golf @ Dallastown; Girls JV Field Hockey @ Biglerville |
| 2 | District+Building `feed_id=e1593953-be32-4318-96ab-54824f430f98` | 200 | text/calendar | 393 | **132** | Cycle Day #6; (SB) School Board Planning Meeting; Cycle Day #1 |
| 3 | CCW `feed_id=fa08eed1-5920-47f6-b13c-5eeb3ea46253` | 200 | text/calendar | 44 | **39** | Shenandoah University; Temple University; Financial Aid Info Night - Dallastown |
| 4 | School Board `feed_id=a9c2d8c6-eeb9-4145-b147-f6a8f3c16621` *(= `calendar_ids=21`)* | 200 | text/calendar | 23 | **7** | (SB) School Board Planning Meeting; Regular Monthly Meeting |

Teams `feed_id`s → VEVENT=0 (empty VTIMEZONE-only shells).

---

## 4. Upstream Google / SchoolLinks ICS (canonical live URLs)

From `calendars.json?legacy_element=true&calendar_ids={id}`:

| ID | Name | VEVENT total | VEVENT ~90d | liveURL |
|----|------|--------------|-------------|---------|
| 22 | Trojan Athletics | 1496 | **159** | `https://calendar.google.com/calendar/ical/yssd.org_672nu723v7mel9a0re15sd7o28%40group.calendar.google.com/public/basic.ics` |
| 24 | Cycle Days | 214 | **57** | `https://calendar.google.com/calendar/ical/c_86e8ef56991f1644a939f496afa4cba81f3ebd95451085165f2f3cb24157d2eb%40group.calendar.google.com/public/basic.ics` |
| 25 | SchoolLinks CCW | 46 | **39** | `https://app.schoolinks.com/api/v1/event-scheduler/k12-admin/events/calendar-events/?token=9c0b355f81991ec2385ce276f05e666df8f3e659&schools=83129` |
| 17 | York Suburban High School | 957 | **26** | `https://calendar.google.com/calendar/ical/yssd.org_b8r6hafv39r0gmoigp58e40ltc%40group.calendar.google.com/public/basic.ics` |
| 14 | East York Elementary | 251 | **12** | `https://calendar.google.com/calendar/ical/yssd.org_udf88lnqvkan76522ggr996rd0%40group.calendar.google.com/public/basic.ics` |
| 20 | District-Wide | 681 | **10** | `https://calendar.google.com/calendar/ical/yssd.org_d7ka4jjf6bcudvt1eblq2qlb7o%40group.calendar.google.com/public/basic.ics` |
| 15 | Indian Rock Elementary | 246 | **9** | `https://calendar.google.com/calendar/ical/yssd.org_bqaso9fts96a4dv6mnols3e4bs%40group.calendar.google.com/public/basic.ics` |
| 21 | School Board Meetings | 530 | **7** | `https://calendar.google.com/calendar/ical/yssd.org_pl41ed9flvfe3bsmub8kob662s%40group.calendar.google.com/public/basic.ics` |
| 19 | York Suburban Middle School | 300 | **7** | `https://calendar.google.com/calendar/ical/yssd.org_775fo5qis250rk7arpr2pdanbc%40group.calendar.google.com/public/basic.ics` |
| 23 | Yorkshire Elementary | 245 | **3** | `https://calendar.google.com/calendar/ical/yssd.org_n2umdue00auiprgg6l3mmrmsck%40group.calendar.google.com/public/basic.ics` |
| 16 | Valley View Elementary | 220 | **1** | `https://calendar.google.com/calendar/ical/yssd.org_nf5g09r4gnqc0j8h7nugtantk4%40group.calendar.google.com/public/basic.ics` |
| 18 | HS CCW Events (Google) | 141 | **0** *(in window; historical present)* | `https://calendar.google.com/calendar/ical/c_8710c646aa158040c797649ae3fcbd0f1a8405d5becea317f7e784d81b530e89%40group.calendar.google.com/public/basic.ics` |

East York ~90d samples: `(EY) Fall Picture Day` 2026-09-18; `(EY) Ninja Warrior` 2026-10-02; `EY PTO Meeting` 2026-10-05; `(EY) PM Conferences` 2026-10-08.

District-Wide ~90d samples: `(DW) Professional Development Day - No School for Students` 2026-09-28; `(DW) Special Presentation: Keeping Our Children Safe Online` 2026-09-30; early dismissal / conference / PD days in October.

All Google URLs returned HTTP 200 `text/calendar; charset=utf-8` on GET.

---

## 5. Ranked proposal (for future Source wiring — not applied)

Prefer **direct Google public ICS** (or SchoolLinks) as source of truth; Finalsite `events.ics?feed_id=` is a working district-hosted mirror for aggregates.

1. **Trojan Athletics** — Google id 22 / Finalsite `feed_id=9638a4e2-…` — densest upcoming (159/90d).  
2. **District+Building aggregate** — Finalsite `feed_id=e1593953-…` — cycle days + buildings + board in one feed (132/90d).  
3. **East York Elementary** — Google id 14 — Fayfield neighborhood school (12/90d).  
4. **District-Wide** — Google id 20 — closures / PD / district events (10/90d).  
5. **School Board** — Google id 21 / `feed_id=a9c2d8c6-…` (7/90d).  
6. **SchoolLinks CCW** — id 25 URL (39/90d) if career events wanted.  
7. **Cycle Days** — Google id 24 (57/90d) if schedule rhythm is useful (noisy alone).

**Do not use:** `/calendar/calendar_{id}.ics` or `.rss` (empty); teams `feed_id`s (empty); Finalsite JSON event APIs (401).

---

## 6. Blocker status

**Cleared.** YSSD **does** expose populated public ICS. Empty legacy paths were a false negative from Finalsite’s old `/calendar/calendar_N.ics` export; live calendars sync from Google (and SchoolLinks for id 25).

---

## 7. Probe method notes

- Window for “~90d”: 2026-09-12 → 2026-12-11 UTC (date-level filter on DTSTART).  
- No HTML event scraping into Sources; HTML used only to discover feed UUIDs / calendar ids / `liveURL`s.  
- Research-only; live Sources untouched.
