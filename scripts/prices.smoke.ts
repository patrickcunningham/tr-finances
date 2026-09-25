// Manual smoke check against the real, unofficial price endpoints. Never run in CI (see ADR 0002).
// Run with: npm run smoke:prices
import { expect, it } from 'vitest'
import { onvistaSource } from '../src/prices/onvista'
import { refreshMarketPrices } from '../src/prices/priceChain'
import { tradegateSource } from '../src/prices/tradegate'

// Public ISINs of widely held securities: an ETF, a stock and a USD bond.
const instruments = [
  { isin: 'IE00B4K48X80', assetClass: 'FUND' },
  { isin: 'US67066G1040', assetClass: 'STOCK' },
  { isin: 'US298785KA31', assetClass: 'BOND' },
]

it('prices an ETF, a stock and a bond through onvista', async () => {
  const result = await refreshMarketPrices(instruments, [onvistaSource()], {}, new Date().toISOString())
  console.table(Object.values(result.prices))
  expect(result.failedIsins).toEqual([])
  expect(result.prices.US298785KA31.price).toBeGreaterThan(0.3)
  expect(result.prices.US298785KA31.price).toBeLessThan(1.5)
})

it('prices an ETF and a stock through Tradegate', async () => {
  const result = await refreshMarketPrices(instruments.slice(0, 2), [tradegateSource()], {}, new Date().toISOString())
  console.table(Object.values(result.prices))
  expect(result.failedIsins).toEqual([])
})
