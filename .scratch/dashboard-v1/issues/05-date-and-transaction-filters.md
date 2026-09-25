# 05: Date and Transaction filters

**What to build:** An Account Holder can narrow what they see to a period and find specific Transactions.

**Blocked by:** 02

**Status:** done

- [x] A global date filter offers 30 days, 90 days, YTD, 1 year, All, and a custom from/to range, all based on Transaction Date.
- [x] The date filter is a view option that every tab will share. The Tax tab (ticket 11) will ignore it.
- [x] The Transactions table can be filtered by Transaction kind.
- [x] Text search matches name, ISIN and description.
- [x] A reset control clears all filters.
- [x] Domain-core tests cover date-range boundaries, including a Transaction whose Transaction Date and booking datetime fall in different months.
