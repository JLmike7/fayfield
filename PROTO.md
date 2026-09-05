# PROTO — calendar-snap-proto-20260905

Throwaway prototype. Not accepted. No ADRs.

## What
GitHub Action fetches 6 public ICS feeds → `data/calendar-snapshot.json` (same-origin) → `/calendar/` Sources UI.

## Branch
`proto/calendar-snap-20260905` (also previewed on `gh-pages` for Michael).

## Live
https://jlmike7.github.io/fayfield/calendar/

## Re-run Action
1. GitHub → Actions → **calendar-snapshot**
2. Run workflow → branch **proto/calendar-snap-20260905**
3. Nightly cron `30 6 * * *` UTC is declared; prefer workflow_dispatch on the proto branch.

## Abandon / rollback
- Delete branch `proto/calendar-snap-20260905`, or stop using it.
- Restore previous Pages tip:
  `git push origin b722c35c16e6775c9648bd0ebf08d38c97ba6a09:gh-pages`
- Previous `gh-pages` SHA (before this proto): `b722c35c16e6775c9648bd0ebf08d38c97ba6a09`

## Rejected on purpose
No CORS proxies, no private ICS, no scrape, no multi-src Google embed combiner, no ADRs.

## Workflow install note
OAuth token lacked `workflow` scope at push time. Workflow YAML lives at `docs-proto/calendar-snapshot.yml`. Move to `.github/workflows/calendar-snapshot.yml` (or re-push with workflow scope) to enable Actions.
