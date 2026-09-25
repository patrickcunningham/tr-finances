import { describe, expect, it } from 'vitest'
import { dashboardFor } from './testSupport'

const total = (flows: { value: number }[]) => Math.round(flows.reduce((t, f) => t + f.value, 0) * 100) / 100

describe('Cashflow', () => {
  it('traces every euro from where it came from to where it went', () => {
    const { sources, destinations } = dashboardFor({ scope: 'A' }).cashflow
    expect(sources).toEqual([
      { name: 'Deposits', value: 10500 },
      { name: 'Sale proceeds', value: 1940 },
      { name: 'Coupons', value: 40 },
      { name: 'Interest', value: 20 },
      { name: 'Tax refunds', value: 20 },
      { name: 'Payouts', value: 13 },
    ])
    expect(destinations).toEqual([
      { name: 'Added to cash', value: 7186.34 },
      { name: 'Bought FUND', value: 2552 },
      { name: 'Withdrawals', value: 1000 },
      { name: 'Bought BOND', value: 911 },
      { name: 'Bought STOCK', value: 801 },
      { name: 'Withheld Tax', value: 80.66 },
      { name: 'Fees', value: 2 },
    ])
    expect(total(sources)).toBe(total(destinations))
  })

  it('leaves Internal Transfers out of the Household', () => {
    const { sources, destinations } = dashboardFor({ scope: 'household' }).cashflow
    expect(sources.find((f) => f.name === 'Deposits')?.value).toBe(15000)
    expect(destinations.find((f) => f.name === 'Withdrawals')?.value).toBe(200)
    expect(destinations.find((f) => f.name === 'Added to cash')?.value).toBe(10492.7)
    expect(total(sources)).toBe(total(destinations))
  })

  it('shows cash that was already there when a period spends more than comes in', () => {
    const { sources, destinations } = dashboardFor({ scope: 'B', range: { kind: 'custom', from: '2024-01-06', to: '2024-01-06' } }).cashflow
    expect(sources).toEqual([{ name: 'From cash', value: 2001 }])
    expect(destinations).toEqual([{ name: 'Bought FUND', value: 2001 }])
  })
})
