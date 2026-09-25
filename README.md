# TR Finances

A private dashboard for a two-person household's Trade Republic Accounts. Import each Account's Transaction Export (Trade Republic app → Profile → Account Statements → Transaction export) and see the Overview, Transactions, Portfolio, Income, Cashflow and Tax tabs, for the Household or either Account.

Everything runs in the browser, and imported data stays on the device (see `docs/adr/0001-client-only-static-site.md`). The only network requests fetch Market Prices by ISIN (see `docs/adr/0002-unofficial-price-sources.md`). On an iPhone, add the site to the Home Screen so iOS keeps its data.

- Vocabulary: `CONTEXT.md`
- Spec: `docs/specs/0001-dashboard-v1.md`

## Development

```sh
npm install
npm run dev            # local dev server
npm test               # unit and smoke tests (synthetic test files only)
npm run typecheck
npm run build          # static site in dist/
npm run smoke:prices   # manual check against the live price endpoints; never in CI
```

Real Transaction Exports hold personal data. Keep them in `samples/`, which git ignores. If `samples/Transaction export.csv` and `samples/expected-cash-balance.txt` exist, a local-only test checks that the calculated cash balance matches the one in the Trade Republic app.

## Deploying

Pushing to `main` runs `.github/workflows/pages.yml`, which tests, builds and publishes to GitHub Pages. The site expects to be served from `/tr-finances/`; change `base` in `vite.config.ts` if the repo has a different name.
