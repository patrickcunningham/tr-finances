# 11: Tax tab

**What to build:** The Tax tab gives each Account and the Household a yearly helper for Anlage KAP, following German rules. Withheld Tax is always the authoritative figure.

**Blocked by:** 07, 09

**Status:** ready-for-agent

- [ ] A tax-year picker replaces the global date filter on this tab.
- [ ] Yearly summary for each Account: Payouts, Interest, Coupons, Realised Gains and losses, Accrued Interest paid (as negative capital income), Vorabpauschale, other Tax Events and total Withheld Tax.
- [ ] Realised Gains are split into share gains and losses and other gains and losses, with Loss Pots tracked per Account per year.
- [ ] Withheld Tax comes from the export and is labelled authoritative. The app's own calculation is shown only as a labelled cross-check.
- [ ] An Account Holder can set each Account's share of the jointly assessed Freistellungsauftrag for each year. The joint allowance is €2,000 from 2023 and €1,602 before.
- [ ] A Freistellungsauftrag tracker for each Account and for the Household shows the amount used against the allowance.
- [ ] A clear disclaimer says this is a helper, not an official tax certificate.
- [ ] Domain-core tests cover Loss Pot separation, Accrued Interest in the right year, Tax Events and Freistellungsauftrag usage.
