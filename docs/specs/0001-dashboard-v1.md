---
status: ready-for-agent
---

# TR Finances: dashboard v1

## Problem Statement

We are two Account Holders in one household, and each of us has a Trade Republic Account. Trade Republic's app shows each Account on its own, and it gives little overview of cashflow, income, realised gains or tax over time. A third-party tool (kontoauszug.jonathanpagel.com) gives a good overview from the Transaction Export, but it has four problems for us:

- It can't combine our two Accounts into a Household view.
- It forgets everything between visits.
- It is built around card spending, which we don't use.
- It is someone else's code, and it handles our financial data.

We want our own dashboard that answers "how are our Trade Republic Accounts doing?" for each of us and for the Household, on our MacBooks and phones. Our data must never leave our devices.

## Solution

A static web app we host ourselves. It can be installed on a phone's Home Screen, and it does all processing in the browser. Each Account Holder downloads a Transaction Export from Trade Republic and imports it on any of our devices; files are exchanged by AirDrop. The app keeps a Transaction History for each Account on that device and shows a dashboard with six tabs:

- **Overview**
- **Transactions**
- **Portfolio**
- **Income**
- **Cashflow**
- **Tax**

It can show the Household or either Account. The only network traffic is fetching Market Prices by ISIN from public quote sources. See ADR 0001 and ADR 0002.

## User Stories

### Setup and importing

1. As an Account Holder, I want to register each Account with a holder name and its Trade Republic IBAN, so that the app knows whose data is whose and can recognise Internal Transfers.
2. As an Account Holder, I want to import a Transaction Export and choose which Account it belongs to, so that the export's Transactions go into the right Transaction History.
3. As an Account Holder, I want to import my partner's Transaction Export on my own device, so that I can see the Household view without asking them.
4. As an Account Holder, I want to import an export that overlaps with one I imported before, so that I can top up my Transaction History without getting duplicate Transactions.
5. As an Account Holder, I want to be told how many Transactions an import added and how many it skipped as already known, so that I can trust the merge.
6. As an Account Holder, I want a warning if the export I'm importing looks like it belongs to the other Account, based on overlapping transaction ids, so that I don't mix up our data.
7. As an Account Holder, I want a warning when the earliest Transaction in a Transaction History doesn't look like the Account's opening, so that I know balances may be wrong until I import a full-history export.
8. As an Account Holder, I want a clear error when a file isn't a valid Transaction Export (wrong columns or unreadable), so that I don't end up with a broken dashboard.
9. As an Account Holder, I want my imported Transaction Histories to still be there the next time I open the app on the same device, so that I don't have to re-import every visit.
10. As an Account Holder, I want to delete an Account's Transaction History from the device, so that I can start again or remove data.
11. As an Account Holder, I want to install the app on my iPhone Home Screen, so that it opens like an app and iOS keeps its stored data.
12. As an Account Holder, I want the app to work offline once it's loaded, apart from refreshing Market Prices, so that I can look at my finances anywhere.
13. As an Account Holder, I want to see when each Account's Transaction History was last imported and which Transaction Date range it covers, so that I know how current the dashboard is.

### Views and filters

14. As an Account Holder, I want the app to open on the Household view, so that I see our combined position first.
15. As an Account Holder, I want to switch between the Household and each individual Account, so that I can look at my own or my partner's figures.
16. As an Account Holder, I want Internal Transfers between our Accounts to cancel out in the Household view, so that moving money between us doesn't look like money coming in or going out.
17. As an Account Holder, I want Internal Transfers to still show as a Deposit or Withdrawal in each Account's own view, so that each Account adds up on its own.
18. As an Account Holder, I want quick date filters (30 days, 90 days, YTD, 1 year, All) plus a custom from/to range, so that I can focus on a period.
19. As an Account Holder, I want the date filter to apply to every tab except Tax, so that all the figures I see cover the same period.
20. As an Account Holder, I want all figures dated by Transaction Date, so that month and year totals match what Trade Republic reports.

### Overview

21. As an Account Holder, I want headline figures: cash balance, Invested Capital, portfolio value at Market Price, Unrealised Gain, Net Contributions and total Realised Gain, so that I can take in the position at a glance.
22. As an Account Holder, I want a monthly cashflow chart of Deposits, Withdrawals, money spent on Trades, and Payouts plus Interest plus Coupons, so that I can see where money went each month.
23. As an Account Holder, I want a chart of cash balance over time calculated from Cash Effects, so that I can see how much sat uninvested and when.
24. As an Account Holder, I want charts of Invested Capital and Net Contributions over time, so that I can see how my saving and investing built up.
25. As an Account Holder, I want an asset-class breakdown (fund, stock, bond) by value at Market Price, so that I can see how the portfolio is split.
26. As an Account Holder, I want monthly Savings Plan Buy totals shown separately from one-off buys, so that I know how much I invest automatically.

### Transactions

27. As an Account Holder, I want a paginated table of Transactions showing Transaction Date, kind, security name, ISIN, Cash Effect and detail, so that I can check any single event.
28. As an Account Holder, I want to filter Transactions by kind: Deposit, Withdrawal, Trade, Savings Plan Buy, Payout, Interest, Coupon, Tax Event and Corporate Action, so that I can find what I'm looking for.
29. As an Account Holder, I want to search Transactions by text (name, ISIN, description), so that I can find a particular security or transfer.
30. As an Account Holder, I want the Account shown on each Transaction in the Household view, so that I know whose it is.
31. As an Account Holder, I want each Transaction's amount, fee and Withheld Tax shown separately alongside its Cash Effect, so that I can reconcile it with Trade Republic.

### Portfolio

32. As an Account Holder, I want a table of open Positions showing name, ISIN, asset class, quantity, FIFO average cost, Invested Capital, Market Price, value and Unrealised Gain, so that I know what I hold and how it's doing.
33. As an Account Holder, I want bond Positions shown by nominal amount, with the Market Price as a percentage of nominal converted into EUR, so that bond values are correct.
34. As an Account Holder, I want stock splits applied to Positions, so that quantities and average costs are right after a Corporate Action.
35. As an Account Holder, I want a table of realised sales showing Transaction Date, security, quantity, FIFO cost, proceeds and Realised Gain, so that I can see the result of each sale.
36. As an Account Holder, I want a chart of Realised Gain over time, so that I can see when I took profits or losses.
37. As an Account Holder, I want Market Prices refreshed when I ask, showing when each price was fetched, so that I know how current the values are.
38. As an Account Holder, I want to type in a Market Price by hand when no quote source returns one, so that every Position can be valued.
39. As an Account Holder, I want the last fetched Market Price kept and shown, with its age, when a refresh fails, so that the dashboard stays usable offline or when a source breaks.
40. As an Account Holder, I want Positions I hold in both Accounts shown combined in the Household view, so that I see our total exposure to each security.

### Income

41. As an Account Holder, I want monthly Payout totals, so that I can see my dividend and distribution income over time.
42. As an Account Holder, I want Payouts broken down by security, so that I know which holdings pay me.
43. As an Account Holder, I want monthly and cumulative Interest on cash, so that I can see what my uninvested cash earns.
44. As an Account Holder, I want monthly Coupons from bonds, so that I can see my bond income separately from Interest on cash.
45. As an Account Holder, I want income shown before and after Withheld Tax, so that I know what I actually received.
46. As an Account Holder, I want Payouts received in a foreign currency to show the original amount and FX rate, so that I understand how the EUR figure was worked out.

### Cashflow

47. As an Account Holder, I want a Sankey diagram from sources (Deposits, Payouts, Interest, Coupons, Trade sale proceeds) to destinations (Trade purchases by asset class, Withdrawals, Withheld Tax, remaining cash), so that I can see how money moved through the Account over the chosen period.
48. As an Account Holder, I want the Household Sankey to leave out Internal Transfers, so that the diagram shows only money actually entering and leaving the Household.

### Tax

49. As an Account Holder, I want a yearly summary for each Account showing Payouts, Interest, Coupons, Realised Gains and losses, Accrued Interest paid, Vorabpauschale, Tax Events and total Withheld Tax, so that I have a helper when filling in Anlage KAP.
50. As an Account Holder, I want Realised Gains split into share gains and losses and other gains and losses, with separate Loss Pots, so that the summary reflects German loss-offset rules.
51. As an Account Holder, I want Accrued Interest paid on bond purchases treated as negative capital income in the year it was paid, so that bond years are right.
52. As an Account Holder, I want Trade Republic's Withheld Tax treated as authoritative, with the app's own calculation shown only as a cross-check, so that I never trust a guess over the broker's figure.
53. As an Account Holder, I want to set how much of our jointly assessed Freistellungsauftrag is assigned to each Account for each year, so that the tracker matches what we set with Trade Republic.
54. As an Account Holder, I want a Freistellungsauftrag tracker for each Account and for the Household, showing capital income used against the allowance in the selected tax year, so that I know how much tax-free room is left.
55. As an Account Holder, I want the Tax tab to work by tax year instead of the date filter, so that the figures line up with the tax return.
56. As an Account Holder, I want a clear disclaimer that the Tax tab is only a helper and not an official tax certificate, so that I know to rely on Trade Republic's annual tax statement.

### Privacy

57. As an Account Holder, I want my Transaction Exports processed only in my browser and never uploaded, so that my financial data stays private.
58. As an Account Holder, I want only ISINs sent over the network, and only when fetching Market Prices, so that nothing identifying about me leaves the device.

## Implementation Decisions

- **Architecture:** a static site hosted from a public repo on GitHub Pages and installable on a phone's Home Screen. It has no backend and no sync between devices (ADR 0001). The public repo contains only code and synthetic data, and real Transaction Exports are excluded from version control.
- **Stack:** Vite, TypeScript, React, Apache ECharts (charts, including Sankey), IndexedDB (storage) and Vitest (tests).
- **Domain core:** one pure module with no browser, storage or network dependencies.
  - **Input:** the raw Transaction Export text for each Account, the account register (holder name and IBAN for each Account), the Freistellungsauftrag split for each Account and year, a set of Market Prices, and view options (Household or a single Account, date range, tax year).
  - **Output:** a single view model with everything every tab needs, including import results and warnings.
  - **Structure:** internally it may split into parsing, merging, classification, FIFO position-keeping and tax, but callers and tests only see this one interface.
- **Transaction Export parsing:**
  - The file is comma-separated, UTF-8 and possibly starts with a byte-order mark, with a fixed header row. Columns: datetime, date, account_type, category, type, asset_class, name, symbol (ISIN), shares, price, amount, fee, tax, currency, original_amount, original_currency, fx_rate, description, transaction_id, counterparty_name, counterparty_iban, payment_reference and mcc_code.
  - All money uses exact decimal arithmetic, never floating point.
  - Unknown category/type pairs must not break the import. They are shown as an "unclassified" kind and reported as a warning.
- **Transaction History merge:** keyed by transaction_id, per Account. Re-importing is idempotent.
- **Cash Effect:** amount + fee + tax. This rule reproduces the real Account's cash balance exactly.
- **Transaction Date:** the date column is used for all reporting. datetime only orders Transactions within a single day.
- **Classification of Trade Republic types into Transaction kinds:**
  - **Deposit:** CUSTOMER_INBOUND, TRANSFER_INBOUND and TRANSFER_INSTANT_INBOUND
  - **Withdrawal:** TRANSFER_OUTBOUND
  - **Trade:** BUY and SELL. A BUY whose description starts with "Savings plan execution" is a Savings Plan Buy.
  - **Payout:** DIVIDEND and DISTRIBUTION
  - **Interest:** INTEREST_PAYMENT without an ISIN
  - **Coupon:** INTEREST_PAYMENT with an ISIN
  - **Tax Event:** EARNINGS (Vorabpauschale), PRE_DETERMINED_TAX_BASE, TAX_OPTIMIZATION, and any INTEREST_PAYMENT with a zero amount and non-zero tax (a tax correction)
  - **Corporate Action:** the CORPORATE_ACTION category (SPLIT seen so far)
- **Internal Transfer detection:** a Deposit or Withdrawal whose counterparty IBAN matches the other registered Account's IBAN. In the Household view both sides are removed from flows and totals.
- **Positions and FIFO:**
  - Lots are kept per Account per ISIN. SELL quantities are negative in the export.
  - A SPLIT's shares value is the change in quantity, not the new total. It is spread across the existing lots in proportion and leaves total cost unchanged.
  - For bonds, quantity is the nominal amount and price is a fraction of nominal.
- **Accrued Interest:** on a bond BUY, the difference between |amount| and quantity × price. It is recorded as Accrued Interest in that Transaction Date's tax year and is not included in the lot's cost.
- **Loss Pots:** Realised Gains on STOCK asset-class sales go in the share pot, and all other Realised Gains in the general pot. Pots are tracked per Account per tax year.
- **Withheld Tax:** always taken from the tax column. The app's own tax calculation is only a labelled cross-check.
- **Freistellungsauftrag:** a joint Household allowance (€2,000 from 2023, €1,602 before), with a per-Account split per year entered by the Account Holder. Usage counts capital income subject to German withholding tax: Payouts, Interest, Coupons, Vorabpauschale and Realised Gains, net of losses where the pots allow.
- **Market Prices (ADR 0002):**
  - Order of sources: onvista's snapshot API first, then Tradegate for stocks and ETFs, then a price typed in by hand.
  - The LS Exchange quote is preferred, falling back to Xetra.
  - Bond quotes are a percentage of a USD nominal and are converted into EUR using onvista's EUR/USD rate.
  - Every Market Price carries its source and fetch time. The last successful price for each ISIN is kept.
- **Price source interface:** takes a list of ISINs and returns a Market Price or a failure for each one. It is implemented by an onvista adapter, a Tradegate adapter and a chain that combines them, and it stays separate from the domain core.
- **History store interface:** saves and loads Transaction Histories, the account register, the Freistellungsauftrag split and the last Market Prices. It is implemented on IndexedDB, and browser-storage failures are handled gracefully.
- **Account register:** entered by the Account Holder on each device, because the Transaction Export contains no account id or own IBAN.
- **UI:** six tabs (Overview, Transactions, Portfolio, Income, Cashflow, Tax), a switch between the Household and each Account, and a global date filter that the Tax tab ignores in favour of a tax-year picker. The UI is English, but Trade Republic's German terms (Vorabpauschale, Freistellungsauftrag) are kept as-is. All vocabulary follows CONTEXT.md.

## Testing Decisions

- **What makes a good test:** tests exercise external behaviour through the highest seam and assert the figures the dashboard would show. They never assert on internal helpers, intermediate structures or how parsing is done, so the domain core can be restructured freely.
- **Primary seam, the domain core:** almost all tests feed synthetic Transaction Export text plus an account register and Market Prices into the domain core, then assert on the view model. Cases to cover:
  - parsing, including a byte-order mark, empty fields and number formats
  - classification of every Trade Republic type into its Transaction kind
  - Cash Effect and cash balance over time
  - idempotent overlapping imports, and the other-Account and incomplete-history warnings
  - Internal Transfer cancellation in the Household view but not per Account
  - FIFO lots, partial sells and Realised Gain
  - split handling
  - bond nominal and percentage pricing, and Accrued Interest extraction
  - Payout, Interest and Coupon totals with Withheld Tax
  - Tax Events and Vorabpauschale
  - Loss Pot separation
  - Freistellungsauftrag usage per Account and per Household
  - date filters and tax-year selection
  - Market Price valuation, Unrealised Gain and manually entered prices
- **Synthetic test file:** a synthetic Transaction Export with the same columns as the real one, containing every category/type pair seen in the real export, with fictitious names and IBANs. It is committed as the shared test file. Two synthetic Accounts, with Internal Transfers between them, cover the Household cases. Expected figures are worked out by hand in the test. The real sample stays local and out of version control. It may be used for a local-only check that the calculated cash balance matches the known real balance.
- **Price source seam:** the price chain is tested with fake adapters, covering fallback order, keeping the last successful price, and failure reporting. Real onvista and Tradegate endpoints are covered only by a manual smoke check, never in CI, because they are unofficial.
- **History store seam:** an in-memory fake implements the same interface. Tests check that data saved and then loaded comes back identical.
- **UI:** no component unit tests. A single smoke test loads the app with the synthetic test file and checks that each tab renders without errors.
- **Prior art:** none. This is a new codebase. These tests set the pattern.

## Out of Scope

- Card spending and everything derived from it: spending categories and MCC codes, merchants, Subscriptions, Travel detection, FX card spend, and Saveback.
- Detecting the bank behind inbound transfers.
- Exporting data from the app (CSV, Excel or JSON).
- Portfolio value over time from historical prices. v1 values Positions at today's Market Price only.
- Syncing between devices, a backend, user accounts or login.
- Brokers other than Trade Republic, and importing Trade Republic PDF statements.
- Official tax certificates. The Tax tab is a helper only.
- Non-EUR base currency.

## Further Notes

- Vocabulary is defined in CONTEXT.md. Decisions are recorded in ADR 0001 (client-only static site) and ADR 0002 (unofficial price sources).
- Trade Republic released the transaction export in April 2026. Its format may change, which is why unknown types produce warnings rather than failures.
- iOS may delete stored data for sites not added to the Home Screen. The recovery path is re-importing a full-history Transaction Export.
- The onvista API returns HTTP 429 to clients that send no browser User-Agent, so it is not suitable for automated tests.
- Suggested build order: domain core with the synthetic test file, then Overview and Transactions, Portfolio (with Market Prices), Income, Cashflow and finally Tax.
