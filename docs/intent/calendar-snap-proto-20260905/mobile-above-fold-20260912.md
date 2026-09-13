# Mobile above-fold calendar — 2026-09-12

Critic FAIL: ~390 first paint was header + h1 + intro before Filters/month.

**Fix:** Wrap intro in `.cal-page-intro`. On `max-width: 40rem`, `main.cal-page` flex-orders Filter bar (1) → `#cal-results` (2) → intro (3). Desktop DOM order unchanged visually (no order rules). Soft: `cleanLocation` strips leading `-` from ICS LOCATION. Tag calendar-snap-proto-20260905.
