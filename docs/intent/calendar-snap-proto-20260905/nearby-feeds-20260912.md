# Nearby calendar feeds — 2026-09-12

**Tag:** calendar-snap-proto-20260905 (research only; not an ADR)  
**Ask:** Find more public ICS/RSS/JSON/API feeds within ~10 minutes’ drive of Fayfield (East York / Springettsbury Twp, York County PA), including edge cases.  
**Rules:** Public structured feeds only. No HTML scrape. No inventing URLs that don’t exist. Do **not** change live Sources. Horizon = next **90 days** from 2026-09-12.  
**Prior:** [better-feeds-20260912.md](./better-feeds-20260912.md)

**Already LIVE (do not re-propose):** fayfield-community (Google ICS), york-county-court (catID=30), city-of-york (`yorkcity.org/calendar/?ical=1`), hellam-township (`hellamtownship.com/calendar/?ical=1`).

**Method:** WebSearch + curl of candidate pages; for each candidate: HTTP status, Content-Type, VEVENT (or JSON/RSS count), 1–3 samples, radius note. Fail closed when feed missing/empty/unverifiable.

---

## Evidence table (this pass)

| Publisher | URL | HTTP | Type | Event count (90d) | Sample titles/dates | Why better / radius note |
| --- | --- | ---: | --- | ---: | --- | --- |
| **York Township** | `https://yorktownshippa.gov/events/?ical=1` | **200** | `text/calendar` | **ICS 4** (API **22**) | 2026-09-15 Planning Commission; 2026-09-17 EMA; 2026-09-21 Water & Sewer Authority | **NEW — top add.** South of Fayfield (~10–15 min / edge of drive radius). Civic meetings + Fall Fun Fest. Tribe JSON richer than ICS. |
| **York Township (API)** | `https://yorktownshippa.gov/wp-json/tribe/events/v1/events?per_page=50&start_date=2026-09-12&end_date=2026-12-12` | **200** | `application/json` | **22** | 2026-10-10 Annual Fall Fun Fest; 2026-12-04 Tree Lighting | Same publisher; prefer if ICS stays truncated (same pattern as City of York). |
| **Central York SD — School Board** | `https://www.cysd.k12.pa.us/calendar/calendar_349.ics` | **200** | `text/calendar` | **17** / 19 total | 2026-09-14 Curriculum Committee; 2026-09-14 Planning Discussion; 2026-09-28 Policy / Regular Action | **NEW — strong add.** District borders Springettsbury/East York; Finalsite URLs discovered on official calendars page. |
| **Central York SD — Instructional** | `https://www.cysd.k12.pa.us/calendar/calendar_404.ics` (also `…finalsite.com/calendar/calendar_404.ics`) | **200** | `text/calendar` | **9** / 31 total | 2026-09-18 No School / Teacher Inservice; 2026-10-08–09 PT Conferences | Closures/days-off neighbors care about. |
| **Central York SD — High School** | `https://www.cysd.k12.pa.us/calendar/calendar_359.ics` | **200** | `text/calendar` | **20** / 75 total | 2026-09-15 Picture Day; 2026-09-15 Panther Pantry; 2026-09-25 Band Day | Building events; opt-in. |
| **Central York SD — Athletics** | `https://www.cysd.k12.pa.us/calendar/calendar_376.ics` | **200** | `text/calendar` | **246** / 1051 total | 2026-09-12 Girls VB @ Dallastown; 2026-09-14 JV Football vs Manheim Twp | Dense sports feed; opt-in / noisy for default snap. |
| **Central York SD — Performing Arts** | `https://www.cysd.k12.pa.us/calendar/calendar_405.ics` | **200** | `text/calendar` | **5** / 28 total | 2026-09-25 Band Day; 2026-10-14 Fall Pops Concert | Thin but real. |
| **Crispus Attucks York** | `https://crispusattucks.org/events/?ical=1` (same as `/events/list/?ical=1`) | **200** | `text/calendar` | **2** | 2026-09-23 Veterans Stand Down; 2026-10-22 Legacy Gala | **NEW — opt-in.** Downtown York community center (~10–15 min). Tribe API also 2. |
| **Crispus Attucks (API)** | `https://crispusattucks.org/wp-json/tribe/events/v1/events?per_page=50&start_date=2026-09-12&end_date=2026-12-12` | **200** | `application/json` | **2** | same as ICS | Backup to ICS. |
| Explore York RSS | `https://www.yorkpa.org/event/rss/` | **200** | `application/rss+xml` | **30 `<item>`** but weak dates | Titles e.g. “2nd Saturday”, “Brewery Tours: York City Walkabout”; only ~6 items have `Starting MM/DD/YYYY` in description (often old) | **Not proposed as Source.** Tourism DMO / marketing; Useful Links only. Prior pass saw 403; now 200 — still poor event-date structure vs VEVENT. Site tests forbid `visityork.org`. |
| City of York *(already live)* | `https://www.yorkcity.org/calendar/?ical=1` | **200** | `text/calendar` | **11** | Planning Commission; City Council; Redevelopment Authority | Baseline reconfirm. |
| Hellam Township *(already live)* | `https://www.hellamtownship.com/calendar/?ical=1` | **200** | `text/calendar` | **6** / 153 total | Board of Supervisors 09-17 / 10-01 / 10-15 | Edge east; already live. |
| York County Court *(already live)* | catID=**30** ICS | **200** | `text/calendar` | **11** | Family/Civil Motions Court | Keep. |
| York County Parks | catID=27 ICS | **200** | `text/calendar` | **0** | — | Empty shell; still reject. |

Additional CYSD calendars discovered on the same page (not fully counted this pass; same Finalsite pattern): Middle School `calendar_363`, elementaries `358/360/361/362/364` — available if Manager wants building-level opt-ins.

---

## Ranked candidates for Manager (new only; skip already-live)

| Rank | Action | Source | Feed | Suggested default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | **Add** | York Township | ICS `…/events/?ical=1` (consider Tribe JSON if ICS truncates) | **on** or opt-in | Best new civic neighbor in drive radius; 22 API events / 4 ICS in 90d |
| 2 | **Add** | Central York SD — School Board | `calendar_349.ics` | **opt-in** (or on) | Clean civic meetings; 17 in 90d |
| 3 | **Add** | Central York SD — Instructional | `calendar_404.ics` | **opt-in** | No-school / conference days |
| 4 | **Optional add** | Central York SD — HS / Arts | `359` / `405` | opt-in | Family-relevant; thinner |
| 5 | **Optional add** | Central York SD — Athletics | `376` | opt-in only | 246 in 90d — noisy for snap default |
| 6 | **Optional add** | Crispus Attucks York | `…/events/?ical=1` | opt-in | 2 events; community relevance |
| — | **Do not add** | Explore York RSS | `yorkpa.org/event/rss/` | — | Marketing/DMO; weak dates; keep Useful Links |
| — | **Do not add** | YSSD Finalsite `calendar_{id}.ics` | ids from page `23,19,17,…` | — | **200 text/calendar but VEVENT=0** empty shells |
| — | **Do not add** | County Main/Parks/etc. | empty catIDs | — | Still empty |

**Implementation note:** York Township + Crispus Attucks are Tribe drop-in `icsUrl`s (same as City/Hellam). CYSD are Finalsite `.ics` drop-ins. Tribe JSON mapper still optional for richer counts.

---

## Explicit rejects / webpage-only / blocked

| Publisher | What we found | Verdict |
| --- | --- | --- |
| **Springettsbury Township** | Tribe Events UI + `?ical=1` / `post_type=tribe_events&ical=1` / Tribe REST all return **HTTP 202** SiteGround **sg-captcha** from this host (`text/html`, not calendar). Search snippets show subscribe links exist in browser HTML. | **Unverified from automation** — treat as webpage/captcha-blocked until a captcha-free fetch returns `text/calendar` with VEVENT>0. Do not add yet. |
| **York Suburban SD (YSSD)** | Finalsite calendars page; `data-calendar-ids=23,19,17,16,21,15,14,20,24`. Probed `https://www.yssd.org/calendar/calendar_{id}.ics` → **200 `text/calendar` but VEVENT=0** for all nine. No populated subscribe URL in static HTML. | **Empty ICS shells** — webpage + empty feeds; fail closed. |
| **Manchester Township** | MEC Lite on `/calendar/`; `?ical=1` → HTML; Tribe REST 404. Meetings listed as HTML/PDF. | **Webpage only** |
| **West Manchester Township** | MEC Lite; `/calendar/?ical=1` 404; homepage `?ical=1` HTML. PDF meeting schedule. | **Webpage only** |
| **Spring Garden Township** | `/calendar/` HTML + Savvy Citizen; `?ical=1` HTML (MEC present). | **Webpage only** |
| **North York / West York / East Manchester boroughs** | Host resolve failures or captcha (North York 202); no verified ICS. | **No feed verified** |
| **Hallam Borough** | Community events page HTML; `?ical=1` → HTML. | **Webpage only** |
| **Wrightsville** | `/calendar/?ical=1` 404. | **No feed** |
| **Windsor Township (York Co.)** | `windsortwp.com` HTML/PDFs/newsletters; no ICS. | **Webpage / PDF only** |
| **Columbia PA** | `columbiapa.net/calendar_app/` HTML calendar app; no ICS/RSS found. | **Webpage only** (edge) |
| **Red Lion / Dallastown / Eastern York SD** | RLASD Edlio PDFs; EYSD Google Sites PDF calendar; no ICS verified this pass. | **Webpage / PDF only** |
| **York County Libraries** | Rich HTML calendar; `/events/feed`, `/events.ics`, `/export.ics`, `/jsonapi/node/event` → **404**. No site-wide catalog ICS. Prior: per-event export only. | **No catalog feed** |
| **York County Parks / Main / Commissioners / HS / Aging** | Official ICS empty (Parks reconfirm VEVENT=0). | **Empty — drop** |
| **Penn State York** | Events calendar page; `.json` / `.ics` guesses 404. | **Webpage only** |
| **York College** | `/events` HTML; `?ical=1` HTML; `/events/rss/` 404. | **Webpage only** |
| **Local churches** | No easily discoverable public Google/`basic.ics` this pass (St. Joseph host NXDOMAIN from probe; LCBC `?ical=1` 404). | **Not proposed** |
| **VisitYork / visityork.org** | Forbidden by site tests; Explore York (`yorkpa.org`) is the DMO. | **Do not use VisitYork brand URL** |

---

## Short recommendation

1. **Green-light add (opt-in or on):** **York Township** ICS (and optionally Tribe JSON). Highest-value new civic feed in the Fayfield drive radius after City of York.  
2. **Green-light add (opt-in):** **Central York SD** School Board (`349`) + Instructional (`404`); consider HS/Arts later; Athletics only as noisy opt-in.  
3. **Optional opt-in:** **Crispus Attucks** ICS (thin but real community events).  
4. **Skip:** Explore York RSS (marketing / weak dates — Useful Links only); YSSD empty shells; Springettsbury until captcha-free ICS verified; Manchester / West Manchester / Spring Garden / libraries / colleges / edge boroughs (webpage-only).  
5. **Do not change live Sources** until Manager picks.

---

## Probe inventory (what we tried)

Springettsbury Tribe ical + REST; YSSD Finalsite page + `calendar_{id}.ics`; Manchester / West Manchester / Spring Garden MEC/`?ical=1`; York Township Tribe ICS+API; Central York Finalsite ICS set; Crispus Attucks Tribe ICS+API; Explore York RSS + events page; Libraries catalog paths + jsonapi; County iCalendar index + Parks empty; Hellam/City/Court reconfirm; Penn State York / YCP guesses; Hallam / Wrightsville / Windsor / Columbia / Red Lion / Eastern York; church host probes; CivicEngage county cats (no new non-empty).

**Stopped:** research + proposal only. Awaiting Manager green-light before Sources / reseed.
