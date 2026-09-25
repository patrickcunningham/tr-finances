import { describe, expect, it } from 'vitest'
import { dashboardFor } from './testSupport'

const month = (scope: string, m: string) => dashboardFor({ scope }).overview.months.find((row) => row.month === m)

describe('Overview: cash side', () => {
  it('totals each month of cashflow', () => {
    expect(month('A', '2024-01')).toEqual({ month: '2024-01', deposits: 10000, withdrawals: 0, bought: 1001, sold: 0, income: 0, savingsPlanBuys: 0, oneOffBuys: 1001 })
    // Interest dated 29 February counts in February; the Savings Plan Buy is kept apart from one-off buys.
    expect(month('A', '2024-02')).toEqual({ month: '2024-02', deposits: 0, withdrawals: 0, bought: 550, sold: 0, income: 14.72, savingsPlanBuys: 550, oneOffBuys: 0 })
    expect(month('A', '2024-07')).toMatchObject({ sold: 1381.5 })
    expect(month('A', '2025-02')).toMatchObject({ income: 29.45 })
  })

  it('includes months without Transactions so the chart has no gaps', () => {
    const months = dashboardFor({ scope: 'A' }).overview.months.map((m) => m.month)
    expect(months).toHaveLength(16)
    expect(months[0]).toBe('2024-01')
    expect(months.at(-1)).toBe('2025-04')
  })

  it('leaves Internal Transfers out of Household Deposits and Withdrawals', () => {
    expect(month('A', '2024-09')).toMatchObject({ withdrawals: 1000 })
    expect(month('household', '2024-09')).toMatchObject({ deposits: 0, withdrawals: 0 })
    expect(dashboardFor({ scope: 'household' }).headline).toMatchObject({ deposits: 15000, withdrawals: 200 })
    expect(dashboardFor({ scope: 'B' }).headline).toMatchObject({ deposits: 6000, withdrawals: 700 })
  })

  it('tracks cash balance and Net Contributions over time', () => {
    expect(dashboardFor({ scope: 'B' }).overview.balances).toEqual([
      { date: '2024-01-05', cash: 5000, netContributions: 5000 },
      { date: '2024-01-06', cash: 2999, netContributions: 5000 },
      { date: '2024-09-01', cash: 3999, netContributions: 6000 },
      { date: '2024-10-01', cash: 3499, netContributions: 5500 },
      { date: '2024-11-01', cash: 3299, netContributions: 5300 },
      { date: '2024-12-01', cash: 3306.36, netContributions: 5300 },
    ])
  })

  it('shows only the flows inside the chosen range', () => {
    const d = dashboardFor({ scope: 'B', range: { kind: 'custom', from: '2024-09-01', to: '2024-10-31' } })
    expect(d.overview.months.map((m) => m.month)).toEqual(['2024-09', '2024-10'])
    expect(d.headline).toMatchObject({ deposits: 1000, withdrawals: 500, cashBalance: 3499 })
    expect(d.overview.balances[0]).toEqual({ date: '2024-09-01', cash: 3999, netContributions: 6000 })
  })
})
