# SchoolLinks token scrub — 2026-09-12

Critic soft flag: SchoolLinks CCW URL shipped `token=` in public `calendar.js` / snapshot (green bar: no secrets in git).

**Verdict:** Treat as privileged-looking share token — remove from public repo.

**Fix:** Point `yssd-schoolinks-ccw` at Finalsite token-free ICS
`https://www.yssd.org/fs/calendar-manager/events.ics?feed_id=fa08eed1-5920-47f6-b13c-5eeb3ea46253`
(same CCW calendar element; ~44 VEVENTs). Reseed + redeploy. Source id unchanged for prefs.
