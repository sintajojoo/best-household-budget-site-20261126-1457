# best-household-budget-site-20261126-1457

[![Bounty](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/sintajojoo/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/sintajojoo/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

Alvarez Family Budget — a household budget site for November 2026.
The Alvarez family (2 adults, 2 kids) takes home $6,850 a month; every
dollar has a job. Six pages (Dashboard, Budget, Transactions, Bills,
Goals, Reports), plain static files, no framework, no network — all
numbers come from one coherent dataset in `app/data.js`.

`main.ts` (Node 22 stdlib) copies `app/` and `screenshots/` to
`$MAKEFUN_OUTPUT_DIR` and writes `dossier.json` with the vendored
make.fun library.

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
