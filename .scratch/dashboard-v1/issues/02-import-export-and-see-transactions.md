# 02: Import a Transaction Export and see its Transactions

**What to build:** The first working end-to-end path.
- An Account Holder registers an Account with a holder name and Trade Republic IBAN.
- They import a Transaction Export into it.
- They see a paginated Transactions table and the current cash balance. Everything is still there after reloading the page.

This introduces the domain core, a pure module with no browser, storage or network dependencies, which takes export text and returns a view model. It also introduces the history store interface, backed by IndexedDB.

**Blocked by:** 01

**Status:** done

- [x] An Account can be registered with a holder name and IBAN.
- [x] Importing a Transaction Export into a chosen Account shows its Transactions: Transaction Date, kind, name, ISIN, amount, fee, Withheld Tax, Cash Effect and description.
- [x] Every Trade Republic type is classified into its Transaction kind as the spec sets out: Deposit, Withdrawal, Trade, Savings Plan Buy, Payout, Interest, Coupon, Tax Event or Corporate Action.
- [x] Cash Effect = amount + fee + tax, using exact decimal arithmetic. The cash balance equals the sum of Cash Effects.
- [x] Transactions are ordered by Transaction Date, then by datetime within a day.
- [x] An unknown category/type shows as "unclassified" and produces a warning, and the import still succeeds.
- [x] A file that isn't a Transaction Export (wrong header, unreadable) shows a clear error and changes nothing.
- [x] The Transaction History and account register are still there after a reload. Browser-storage failures show a message rather than crashing the app.
- [x] Domain-core tests use the synthetic test file and check the classification of every kind and the cash balance.
- [x] A local-only check (not in CI) confirms that the real sample reproduces the cash balance shown in the Trade Republic app. The expected figure is stored locally next to the sample, never committed.
