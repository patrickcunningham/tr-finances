# 04: Household view and Internal Transfers

**What to build:** The app opens on the Household view, which combines both Accounts, and can switch to either Account. Money moved between the two Accounts cancels out in the Household view.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The app opens on the Household view, and a switcher chooses the Household, Account A or Account B.
- [ ] In the Household view the Transactions table shows each Transaction's Account.
- [ ] A Deposit or Withdrawal whose counterparty IBAN matches the other registered Account's IBAN is identified as an Internal Transfer.
- [ ] Internal Transfers are left out of Household totals, and the Household cash balance equals the sum of both Accounts' balances.
- [ ] Internal Transfers still count as a Deposit or Withdrawal in each Account's own view.
- [ ] Domain-core tests use the two synthetic Accounts and cover transfers in both directions.
