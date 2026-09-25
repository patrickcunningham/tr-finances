import type { AssetClass, MarketPrice, MarketPrices } from '../domain'

export interface Instrument {
  isin: string
  assetClass: AssetClass
}

/** A price in EUR per unit (per unit of nominal for a bond), or null when the source has none. */
export interface PriceAdapter {
  name: 'onvista' | 'tradegate'
  fetchPrice(instrument: Instrument): Promise<{ price: number; venue?: string } | null>
}

export interface RefreshResult {
  prices: MarketPrices
  /** Instruments no source could price this time; any earlier price for them is kept. */
  failedIsins: string[]
}

/** Asks each source in turn for every instrument. A source that throws counts as having no price. */
export async function refreshMarketPrices(instruments: Instrument[], adapters: PriceAdapter[], previous: MarketPrices, now: string): Promise<RefreshResult> {
  const prices: MarketPrices = { ...previous }
  const failedIsins: string[] = []
  await Promise.all(
    instruments.map(async (instrument) => {
      for (const adapter of adapters) {
        const found = await adapter.fetchPrice(instrument).catch(() => null)
        if (found && Number.isFinite(found.price) && found.price > 0) {
          const price: MarketPrice = { isin: instrument.isin, price: found.price, source: adapter.name, fetchedAt: now }
          if (found.venue) price.venue = found.venue
          prices[instrument.isin] = price
          return
        }
      }
      failedIsins.push(instrument.isin)
    }),
  )
  return { prices, failedIsins: failedIsins.sort() }
}
