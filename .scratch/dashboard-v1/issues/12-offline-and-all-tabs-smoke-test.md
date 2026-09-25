# 12: Offline support and smoke test across all tabs

**What to build:** Once installed, the app works offline apart from refreshing Market Prices. An automated smoke test shows that every tab renders.

**Blocked by:** 03, 06, 08, 10, 11

**Status:** ready-for-agent

- [ ] After the first load, the app opens and shows stored data with no network connection.
- [ ] While offline, a Market Price refresh fails gracefully and shows the last fetched prices with their age.
- [ ] The smoke test imports the synthetic test file for both Accounts and renders Overview, Transactions, Portfolio, Income, Cashflow and Tax, in both the Household and single-Account views, with no errors.
- [ ] Tested manually on an iPhone added to the Home Screen: install, import both exports by AirDrop, close the app, reopen it offline.
