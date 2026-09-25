# 05: Date and Transaction filters

**What to build:** An Account Holder can narrow what they see to a period and find specific Transactions.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A global date filter offers 30 days, 90 days, YTD, 1 year, All, and a custom from/to range, all based on Transaction Date.
- [ ] The date filter is a view option that every tab will share. The Tax tab (ticket 11) will ignore it.
- [ ] The Transactions table can be filtered by Transaction kind.
- [ ] Text search matches name, ISIN and description.
- [ ] A reset control clears all filters.
- [ ] Domain-core tests cover date-range boundaries, including a Transaction whose Transaction Date and booking datetime fall in different months.
