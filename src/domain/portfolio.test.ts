import { describe, expect, it } from 'vitest'
import { dashboardFor } from './testSupport'

describe('Positions at FIFO cost', () => {
  it('lists Positions by Invested Capital, keeping what is left after a partial sell from the earliest lots first, and bonds by nominal amount', () => {
    expect(dashboardFor({ scope: 'A' }).portfolio.positions).toMatchObject([
      { isin: 'IE0000000002', name: 'Income ETF (Dist)', assetClass: 'FUND', quantity: 20, averageCost: 50.05, investedCapital: 1001 },
      { isin: 'XS0000000001', name: 'Feb. 2034', assetClass: 'BOND', quantity: 1000, averageCost: 0.901, investedCapital: 901 },
      { isin: 'IE0000000001', name: 'World ETF (Acc)', assetClass: 'FUND', quantity: 3, averageCost: 110, investedCapital: 330 },
    ])
    expect(dashboardFor({ scope: 'A' }).headline.investedCapital).toBe(2232)
  })

  it('combines the same security across both Accounts in the Household view', () => {
    const world = dashboardFor({ scope: 'household' }).portfolio.positions.find((p) => p.isin === 'IE0000000001')
    expect(world).toMatchObject({ isin: 'IE0000000001', name: 'World ETF (Acc)', assetClass: 'FUND', quantity: 23, averageCost: 101.3478, investedCapital: 2331 })
    expect(dashboardFor({ scope: 'household' }).headline.investedCapital).toBe(4233)
  })

  it('tracks Invested Capital over time, through a split and both sells', () => {
    const at = (date: string) => dashboardFor({ scope: 'A' }).overview.balances.find((p) => p.date === date)?.investedCapital
    expect(at('2024-06-10')).toBe(3353)
    expect(at('2024-07-01')).toBe(2132)
    expect(at('2024-08-01')).toBe(1331)
    expect(at('2024-12-02')).toBe(2232)
  })
})

describe('Realised Gains', () => {
  it('measures each sale against the FIFO cost of the units sold, fees included', () => {
    expect(dashboardFor({ scope: 'A' }).portfolio.realisedSales).toEqual([
      { accountId: 'A', date: '2024-08-01', isin: 'US0000000001', name: 'Example Corp', assetClass: 'STOCK', quantity: 10, cost: 801, proceeds: 499, realisedGain: -302 },
      { accountId: 'A', date: '2024-07-01', isin: 'IE0000000001', name: 'World ETF (Acc)', assetClass: 'FUND', quantity: 12, cost: 1221, proceeds: 1439, realisedGain: 218 },
    ])
    expect(dashboardFor({ scope: 'A' }).headline.realisedGain).toBe(-84)
  })

  it('counts only sales inside the date range', () => {
    const d = dashboardFor({ scope: 'A', range: { kind: 'custom', from: '2024-07-15' } })
    expect(d.portfolio.realisedSales.map((s) => s.realisedGain)).toEqual([-302])
    expect(d.headline.realisedGain).toBe(-302)
  })
})

describe('Accrued Interest', () => {
  it('separates the Accrued Interest paid on a bond buy from its cost', () => {
    expect(dashboardFor({ scope: 'household' }).portfolio.accruedInterest).toEqual([
      { accountId: 'A', date: '2024-12-02', isin: 'XS0000000001', name: 'Feb. 2034', amount: 10 },
    ])
  })
})
