# 07: Portfolio: Positions, FIFO and Realised Gains

**What to build:** The Portfolio tab shows what each Account holds at FIFO cost, and the result of every sale.

**Blocked by:** 04, 05

**Status:** done

- [x] Open Positions table showing name, ISIN, asset class, quantity, FIFO average cost and Invested Capital.
- [x] FIFO lots are kept per Account per ISIN. Partial and full sells use up the earliest lots first.
- [x] A SPLIT's shares value is treated as the change in quantity and spread across the existing lots in proportion. Total cost stays the same.
- [x] For bonds, quantity is the nominal amount and price is a fraction of nominal.
- [x] Accrued Interest on a bond buy (|amount| minus quantity × price) is recorded on its own and not included in the lot's cost.
- [x] Realised sales table showing Transaction Date, security, quantity, FIFO cost, proceeds and Realised Gain, plus a Realised Gain over time chart.
- [x] Invested Capital over time appears on the Overview.
- [x] In the Household view, Positions in the same ISIN are combined across Accounts.
- [x] Domain-core tests cover multi-lot FIFO, partial sells, a split followed by a full sell, bond cost and Accrued Interest, and the Household merge.
