# 01: Repo, app shell and synthetic test file

**What to build:** Groundwork that makes every later ticket easier to start.
- Initialise a git repo. Real Transaction Exports (the samples folder) are excluded from version control.
- Set up Vite, React, TypeScript and Vitest.
- Deploy an empty app to GitHub Pages that can be installed on an iPhone Home Screen.
- Create a synthetic Transaction Export, committed as the shared test file. It has the same columns as the real export and covers two made-up Accounts.

See ADR 0001 and the spec at docs/specs/0001-dashboard-v1.md.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Git repo initialised, with real exports excluded from version control. Check that no file containing a real name or IBAN is tracked.
- [x] Project builds, and an empty Vitest suite runs green.
- [x] App deployed to GitHub Pages at https://patrickcunningham.github.io/tr-finances/, with an app manifest so it can be added to an iPhone Home Screen.
- [x] Synthetic Transaction Export matches the real export's header exactly: datetime through mcc_code, UTF-8, possibly starting with a byte-order mark.
- [x] Synthetic data covers every category/type pair seen in the real export: CUSTOMER_INBOUND, TRANSFER_INBOUND, TRANSFER_INSTANT_INBOUND, TRANSFER_OUTBOUND, BUY (including Savings Plan Buys), SELL, DIVIDEND, DISTRIBUTION, INTEREST_PAYMENT (on cash, on a bond, and a zero-amount tax correction), EARNINGS (Vorabpauschale), PRE_DETERMINED_TAX_BASE, TAX_OPTIMIZATION and SPLIT.
- [x] Synthetic data includes a bond buy with Accrued Interest, a Payout in a foreign currency, and a partial sell.
- [x] Two synthetic Accounts with fictitious names and IBANs, and at least one Internal Transfer in each direction between them.
