import type { Instrument, PriceAdapter } from './priceChain'

// Undocumented public API (see ADR 0002). Keyless and CORS-enabled; may change without notice.
const BASE = 'https://api.onvista.de/api/v1'

/** LS Exchange (where Trade Republic executes), then Lang & Schwarz, then Xetra. */
const PREFERRED_MARKETS = ['_LSX', '_LUSG', '_GER']
const MAX_QUOTE_AGE_DAYS = 7

/** One venue's entry in onvista's quoteList (their term), from which a Market Price is taken. */
interface OnvistaQuote {
  market?: { name?: string; codeMarket?: string }
  isoCurrency?: string
  unitType?: string
  last?: number
  datetimeLast?: string
}

interface OnvistaSnapshot {
  quoteList?: { list?: OnvistaQuote[] }
  bondsBaseData?: { isoCurrencyCapital?: string }
}

const PATHS: Record<string, string> = { FUND: 'funds', STOCK: 'stocks', BOND: 'bonds' }

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>

export function onvistaSource(fetchJson: Fetch = (url) => fetch(url)): PriceAdapter {
  const get = async <T>(path: string): Promise<T | null> => {
    const response = await fetchJson(`${BASE}/${path}`)
    return response.ok ? ((await response.json()) as T) : null
  }

  const eurPer = async (currency: string): Promise<number | null> => {
    if (currency === 'EUR') return 1
    const snapshot = await get<{ quote?: { last?: number } }>(`currencies/${currency}EUR/snapshot`)
    return snapshot?.quote?.last ?? null
  }

  return {
    name: 'onvista',
    async fetchPrice({ isin, assetClass }: Instrument) {
      const path = PATHS[assetClass]
      if (!path) return null
      const snapshot = await get<OnvistaSnapshot>(`${path}/ISIN:${isin}/snapshot`)
      const quotes = (snapshot?.quoteList?.list ?? []).filter(isFresh)

      if (assetClass === 'BOND') {
        // Bond quotes are % of nominal. Some venues label them EUR, but the nominal is in the bond's own currency.
        const quote = pick(quotes.filter((q) => q.unitType === 'PCT'))
        const capitalCurrency = snapshot?.bondsBaseData?.isoCurrencyCapital || quote?.isoCurrency
        if (!quote?.last || !capitalCurrency) return null
        const fx = await eurPer(capitalCurrency)
        return fx ? { price: (quote.last / 100) * fx, venue: quote.market?.name } : null
      }

      const quote = pick(quotes.filter((q) => q.isoCurrency === 'EUR' && q.unitType !== 'PCT'))
      return quote?.last ? { price: quote.last, venue: quote.market?.name } : null
    },
  }
}

const isFresh = (q: OnvistaQuote) =>
  q.datetimeLast !== undefined && Date.now() - Date.parse(q.datetimeLast) < MAX_QUOTE_AGE_DAYS * 86_400_000

function pick(quotes: OnvistaQuote[]): OnvistaQuote | undefined {
  for (const code of PREFERRED_MARKETS) {
    const preferred = quotes.find((q) => q.market?.codeMarket === code)
    if (preferred) return preferred
  }
  return [...quotes].sort((a, b) => (b.datetimeLast ?? '').localeCompare(a.datetimeLast ?? ''))[0]
}
