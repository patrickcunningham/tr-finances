import type { AssetClass, MarketPrice, MarketPrices } from '../domain'

export interface Instrument {
  isin: string
  assetClass: AssetClass
}

/** A price in EUR per unit (per unit of nominal for a bond), or null when the source has none. */
export interface PriceSource {
  name: 'onvista' | 'tradegate'
  quote(instrument: Instrument): Promise<{ price: number; venue?: string } | null>
}

export interface RefreshResult {
  prices: MarketPrices
  /** Instruments no source could price this time; any earlier price for them is kept. */
  failedIsins: string[]
}

/** Asks each source in turn for every instrument. A source that throws counts as having no price. */
export async function refreshMarketPrices(instruments: Instrument[], sources: PriceSource[], previous: MarketPrices, now: string): Promise<RefreshResult> {
  const prices: MarketPrices = { ...previous }
  const failedIsins: string[] = []
  await Promise.all(
    instruments.map(async (instrument) => {
      for (const source of sources) {
        const quote = await source.quote(instrument).catch(() => null)
        if (quote && Number.isFinite(quote.price) && quote.price > 0) {
          const price: MarketPrice = { isin: instrument.isin, price: quote.price, source: source.name, fetchedAt: now }
          if (quote.venue) price.venue = quote.venue
          prices[instrument.isin] = price
          return
        }
      }
      failedIsins.push(instrument.isin)
    }),
  )
  return { prices, failedIsins: failedIsins.sort() }
}
