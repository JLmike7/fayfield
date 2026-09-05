# Month view — 2026-09-05

Critic FAIL: Month radio rendered empty `.month-grid` stub.

Fix: `buildMonthModel` / `pickMonthKey` in calendar.js; `renderMonthHtml` in ui.js; CSS for dow/cells/events. Shows NY current month when it has events, else earliest event month. Agenda unchanged.
