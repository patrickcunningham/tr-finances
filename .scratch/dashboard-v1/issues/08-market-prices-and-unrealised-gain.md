# 08: Market Prices and Unrealised Gain

**What to build:** An Account Holder can refresh Market Prices and see what their Positions are worth now. The only data sent over the network is ISINs. See ADR 0002.

**Blocked by:** 07

**Status:** done

- [x] A price source interface takes ISINs and returns a Market Price or a failure for each one. It sits outside the domain core.
- [x] The onvista adapter prefers the LS Exchange quote, falling back to Xetra. Bond quotes are converted from % of a USD nominal into EUR using onvista's EUR/USD rate.
- [x] The Tradegate adapter is the fallback for stocks and ETFs.
- [x] The source chain is onvista, then Tradegate, then a price typed in by hand for any ISIN still missing.
- [x] Each Market Price shows its source and fetch time. The last successful price for each ISIN is kept, and shown with its age when a refresh fails.
- [x] Portfolio shows Market Price, value and Unrealised Gain for each Position. The Overview adds portfolio value, Unrealised Gain and the asset-class breakdown by market value.
- [x] Price-chain tests use fake adapters and cover fallback order, keeping the last price, and failure reporting. Real endpoints are covered only by a manual smoke check, never in CI.
- [x] Domain-core tests check valuation and Unrealised Gain with given Market Prices, including a bond.
