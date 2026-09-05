# Prefs merge — 2026-09-05

Critic soft flag after Court PASS: stale `fayfield-calendar-prefs` could hide new defaultEnabled Sources.

Fix: `mergePrefsWithCatalog` opts in unseen `defaultEnabled` sources once via `seenSourceIds`; user unchecks respected.
