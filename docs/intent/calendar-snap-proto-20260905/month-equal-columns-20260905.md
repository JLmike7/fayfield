# Month equal columns — 2026-09-05

Critic reopen FAIL: `1fr` = minmax(auto,1fr); long Court titles blew Tue/Wed/Thu.

Fix: `repeat(7, minmax(0, 1fr))` + `min-width:0` / overflow on cells and DOW; event ellipsis.
