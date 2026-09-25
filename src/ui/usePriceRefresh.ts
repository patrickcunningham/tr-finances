import { useState } from 'react'
import type { PositionView, StoredState } from '../domain'
import { onvistaSource } from '../prices/onvista'
import { refreshMarketPrices } from '../prices/priceChain'
import { tradegateSource } from '../prices/tradegate'

const SOURCES = [onvistaSource(), tradegateSource()]

export function usePriceRefresh(update: (change: (s: StoredState) => StoredState) => void) {
  const [refreshing, setRefreshing] = useState(false)
  const [failedIsins, setFailedIsins] = useState<string[]>([])

  const refresh = async (positions: PositionView[], current: StoredState['marketPrices']) => {
    setRefreshing(true)
    try {
      const instruments = positions.map((p) => ({ isin: p.isin, assetClass: p.assetClass }))
      const result = await refreshMarketPrices(instruments, SOURCES, current, new Date().toISOString())
      setFailedIsins(result.failedIsins)
      update((s) => ({ ...s, marketPrices: { ...s.marketPrices, ...result.prices } }))
    } finally {
      setRefreshing(false)
    }
  }

  const setManualPrice = (isin: string, price: number) =>
    update((s) => ({ ...s, marketPrices: { ...s.marketPrices, [isin]: { isin, price, source: 'manual', fetchedAt: new Date().toISOString() } } }))

  return { refresh, refreshing, failedIsins, setManualPrice }
}
