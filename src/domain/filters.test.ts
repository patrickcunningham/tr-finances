import { describe, expect, it } from 'vitest'
import { dashboardFor } from './testSupport'

const ids = (d: ReturnType<typeof dashboardFor>) => d.transactions.map((t) => `${t.accountId}-${t.id.slice(-2)}`)

describe('date filters', () => {
  it('uses the Transaction Date, not the booking time, at month boundaries', () => {
    // Interest dated 29 February but booked on 1 March.
    const february = dashboardFor({ scope: 'A', range: { kind: 'custom', from: '2024-02-01', to: '2024-02-29' } })
    expect(ids(february)).toEqual(['A-04', 'A-03'])
  })

  it('offers quick ranges counted back from today', () => {
    const today = '2025-04-03'
    expect(ids(dashboardFor({ scope: 'A', today, range: { kind: 'lastDays', days: 30 } }))).toEqual(['A-19'])
    expect(ids(dashboardFor({ scope: 'A', today, range: { kind: 'yearToDate' } }))).toEqual(['A-19', 'A-18', 'A-17', 'A-16', 'A-15'])
    expect(dashboardFor({ scope: 'A', today, range: { kind: 'lastYear' } }).transactions).toHaveLength(13)
  })

  it('keeps balances as of the end of the range', () => {
    const toEndOf2024 = dashboardFor({ scope: 'B', range: { kind: 'custom', to: '2024-10-31' } })
    expect(toEndOf2024.headline.cashBalance).toBe(3499)
  })
})

describe('Transaction filters', () => {
  it('filters by Transaction kind', () => {
    const d = dashboardFor({ scope: 'household', transactionFilter: { kinds: ['payout', 'coupon'] } })
    expect(ids(d)).toEqual(['A-17', 'A-08', 'A-07'])
  })

  it('searches name, ISIN and description', () => {
    expect(ids(dashboardFor({ scope: 'A', transactionFilter: { search: 'income etf' } }))).toEqual(['A-15', 'A-08', 'A-06'])
    expect(ids(dashboardFor({ scope: 'A', transactionFilter: { search: 'xs0000000001' } }))).toEqual(['A-17', 'A-14'])
    expect(ids(dashboardFor({ scope: 'A', transactionFilter: { search: 'tax correction' } }))).toEqual(['A-19'])
  })
})

describe('quick ranges include today and cover exactly the stated length', () => {
  it('counts "last 33 days" as today and the 32 days before it', () => {
    // 33 days ending 3 April 2025 start on 2 March, so the 1 March Transaction is outside.
    expect(ids(dashboardFor({ scope: 'A', today: '2025-04-03', range: { kind: 'lastDays', days: 33 } }))).toEqual(['A-19'])
  })

  it('starts "last year" the day after the same date a year ago', () => {
    // A-06 is dated 2 April 2024, exactly a year before; it falls outside.
    expect(dashboardFor({ scope: 'A', today: '2025-04-02', range: { kind: 'lastYear' } }).transactions).toHaveLength(12)
  })
})
