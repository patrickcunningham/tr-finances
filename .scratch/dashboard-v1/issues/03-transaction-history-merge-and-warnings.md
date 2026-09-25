# 03: Merging Transaction Histories and import warnings

**What to build:** An Account Holder can import new or overlapping Transaction Exports at any time. The Transaction History grows without duplicates, and the app warns about likely mistakes.

**Blocked by:** 02

**Status:** done

- [x] Re-importing an overlapping or identical export adds no duplicates. Transactions are keyed by transaction_id per Account.
- [x] After an import, the Account Holder sees how many Transactions were added and how many were skipped as already known.
- [x] Importing an export whose transaction ids overlap the other Account's Transaction History gives a warning and asks for confirmation.
- [x] A warning is shown when the earliest Transaction in a Transaction History doesn't look like the Account's opening (for example, the history doesn't start with a Deposit and the balances would go negative).
- [x] Each Account shows when it was last imported and the Transaction Date range it covers.
- [x] An Account Holder can delete an Account's Transaction History from the device.
- [x] Domain-core tests cover idempotent re-import, partial overlap and both warnings.
