# Agenda actions one-line fix — 2026-09-12

Critic FAIL: `<details>` put peek body between summary and Original event.

**Fix:** checkbox + label `description` and Original event share one `.cal-agenda-links` row; panel is a sibling under `.cal-agenda-actions`, shown via `:has(:checked)`. Soft: omit same-day `23:59`/`00:00` ends.
