import { describe, expect, it } from 'vitest'
import { buildDashboard, type MarketPrices } from './index'
import { accountA, accountB, bothHistories } from './testSupport'

const price = (isin: string, value: number) => ({ isin, price: value, source: 'onvista' as const, fetchedAt: '2025-06-01T09:00:00.000Z', venue: 'LS Exchange' })
const allPrices: MarketPrices = {
  IE0000000001: price('IE0000000001', 130),
  IE0000000002: price('IE0000000002', 52),
  XS0000000001: price('XS0000000001', 0.8),
}

const dashboard = (scope: string, marketPrices: MarketPrices) =>
  buildDashboard({
    accounts: [accountA, accountB],
    histories: bothHistories(),
    marketPrices,
    allowanceSplits: {},
    options: { scope, range: { kind: 'all' }, today: '2025-06-01' },
  })

describe('valuing Positions at Market Price', () => {
  it('values each Position and its Unrealised Gain, bonds by nominal amount', () => {
    const positions = dashboard('A', allPrices).portfolio.positions
    expect(positions.map((p) => [p.isin, p.marketValue, p.unrealisedGain, p.marketPrice?.fetchedAt])).toEqual([
      ['IE0000000002', 1040, 39, '2025-06-01T09:00:00.000Z'],
      ['XS0000000001', 800, -101, '2025-06-01T09:00:00.000Z'],
      ['IE0000000001', 390, 60, '2025-06-01T09:00:00.000Z'],
    ])
  })

  it('adds up portfolio value, Unrealised Gain and the asset-class breakdown', () => {
    const d = dashboard('A', allPrices)
    expect(d.headline).toMatchObject({ portfolioValue: 2230, unrealisedGain: -2 })
    expect(d.portfolio.assetClasses).toEqual([
      { assetClass: 'FUND', value: 1430 },
      { assetClass: 'BOND', value: 800 },
    ])
    expect(dashboard('household', allPrices).headline).toMatchObject({ portfolioValue: 4830, unrealisedGain: 597 })
  })

  it('leaves the totals open, and lists what is missing, while any Position has no Market Price', () => {
    const { XS0000000001: _bond, ...withoutBond } = allPrices
    const d = dashboard('A', withoutBond)
    expect(d.headline).toMatchObject({ portfolioValue: null, unrealisedGain: null })
    expect(d.portfolio.unpricedIsins).toEqual(['XS0000000001'])
    expect(d.portfolio.positions.find((p) => p.isin === 'XS0000000001')).toMatchObject({ marketPrice: null, marketValue: null, unrealisedGain: null })
  })
})
