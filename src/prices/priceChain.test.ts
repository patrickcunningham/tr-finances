import { describe, expect, it } from 'vitest'
import type { MarketPrice } from '../domain'
import { refreshMarketPrices, type Instrument, type PriceSource } from './priceChain'

const NOW = '2025-06-01T10:00:00.000Z'
const world: Instrument = { isin: 'IE0000000001', assetClass: 'FUND' }
const bond: Instrument = { isin: 'XS0000000001', assetClass: 'BOND' }

const source = (name: 'onvista' | 'tradegate', prices: Record<string, number | 'throws'>): PriceSource => ({
  name,
  async quote(instrument) {
    const result = prices[instrument.isin]
    if (result === 'throws') throw new Error('network down')
    return result === undefined ? null : { price: result, venue: `${name} venue` }
  },
})

const earlier: MarketPrice = { isin: 'XS0000000001', price: 0.8, source: 'onvista', fetchedAt: '2025-05-01T10:00:00.000Z', venue: 'Frankfurt' }

describe('refreshing Market Prices', () => {
  it('takes the price from the first source that has one', async () => {
    const result = await refreshMarketPrices([world], [source('onvista', { IE0000000001: 130 }), source('tradegate', { IE0000000001: 131 })], {}, NOW)
    expect(result.prices.IE0000000001).toEqual({ isin: 'IE0000000001', price: 130, source: 'onvista', venue: 'onvista venue', fetchedAt: NOW })
    expect(result.failedIsins).toEqual([])
  })

  it('falls back to the next source when one has no price or fails', async () => {
    const result = await refreshMarketPrices(
      [world, bond],
      [source('onvista', { IE0000000001: 'throws' }), source('tradegate', { IE0000000001: 131, XS0000000001: 0.79 })],
      {},
      NOW,
    )
    expect(result.prices.IE0000000001).toMatchObject({ price: 131, source: 'tradegate' })
    expect(result.prices.XS0000000001).toMatchObject({ price: 0.79, source: 'tradegate' })
  })

  it('keeps the last known price, with its original time, when every source fails', async () => {
    const result = await refreshMarketPrices([bond], [source('onvista', { XS0000000001: 'throws' }), source('tradegate', {})], { XS0000000001: earlier }, NOW)
    expect(result.prices.XS0000000001).toEqual(earlier)
    expect(result.failedIsins).toEqual(['XS0000000001'])
  })

  it('reports an instrument no source could price and that has no earlier price', async () => {
    const result = await refreshMarketPrices([bond], [source('onvista', {})], {}, NOW)
    expect(result.prices).toEqual({})
    expect(result.failedIsins).toEqual(['XS0000000001'])
  })

  it('keeps prices for instruments it was not asked about', async () => {
    const result = await refreshMarketPrices([world], [source('onvista', { IE0000000001: 130 })], { XS0000000001: earlier }, NOW)
    expect(result.prices.XS0000000001).toEqual(earlier)
  })
})
