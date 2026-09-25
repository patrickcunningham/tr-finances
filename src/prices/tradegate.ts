import type { Instrument, PriceSource } from './priceChain'

// Undocumented public endpoint (see ADR 0002). Stocks and ETFs only, prices in EUR.
// Use the tradegatebsx.com host: tradegate.de redirects without CORS headers.
const URL = 'https://www.tradegatebsx.com/refresh.php?isin='

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>

/** Fields come back either as numbers or as German-formatted strings like "105,10". */
const number = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value.replace(/\./g, '').replace(',', '.'))
  return null
}

export function tradegateSource(fetchJson: Fetch = (url) => fetch(url)): PriceSource {
  return {
    name: 'tradegate',
    async quote({ isin, assetClass }: Instrument) {
      if (assetClass !== 'FUND' && assetClass !== 'STOCK') return null
      const response = await fetchJson(URL + encodeURIComponent(isin))
      if (!response.ok) return null
      const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
      if (!body) return null
      const last = number(body.last)
      if (last) return { price: last, venue: 'Tradegate' }
      const bid = number(body.bid)
      const ask = number(body.ask)
      return bid && ask ? { price: (bid + ask) / 2, venue: 'Tradegate (mid)' } : null
    },
  }
}
