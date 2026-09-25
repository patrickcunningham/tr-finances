import { describe, expect, it } from 'vitest'
import { dashboardFor } from './testSupport'

describe('Income', () => {
  it('totals Payouts, Interest and Coupons before and after Withheld Tax', () => {
    expect(dashboardFor({ scope: 'household' }).income.totals).toEqual({
      payouts: { gross: 13, withheldTax: -3.43, net: 9.57 },
      interest: { gross: 30, withheldTax: -7.92, net: 22.08 },
      coupons: { gross: 40, withheldTax: -10.55, net: 29.45 },
    })
  })

  it('breaks income down by month', () => {
    const months = dashboardFor({ scope: 'A' }).income.months
    expect(months.find((m) => m.month === '2024-02')).toEqual({
      month: '2024-02',
      payouts: { gross: 0, withheldTax: 0, net: 0 },
      interest: { gross: 20, withheldTax: -5.28, net: 14.72 },
      coupons: { gross: 0, withheldTax: 0, net: 0 },
    })
    expect(months.find((m) => m.month === '2024-05')?.payouts).toEqual({ gross: 10, withheldTax: -2.64, net: 7.36 })
  })

  it('breaks Payouts down by security, largest first', () => {
    expect(dashboardFor({ scope: 'household' }).income.payoutsBySecurity).toEqual([
      { isin: 'IE0000000002', name: 'Income ETF (Dist)', count: 1, gross: 10, net: 7.36 },
      { isin: 'US0000000001', name: 'Example Corp', count: 1, gross: 3, net: 2.21 },
    ])
  })

  it('shows the original amount and FX rate of Payouts received in a foreign currency', () => {
    expect(dashboardFor({ scope: 'A' }).income.foreignCurrency).toEqual([
      { date: '2025-02-01', kind: 'coupon', name: 'Feb. 2034', gross: 40, originalAmount: 44, originalCurrency: 'USD', fxRate: 1.1 },
      { date: '2024-05-05', kind: 'payout', name: 'Income ETF (Dist)', gross: 10, originalAmount: 11, originalCurrency: 'USD', fxRate: 1.1 },
      { date: '2024-04-10', kind: 'payout', name: 'Example Corp', gross: 3, originalAmount: 3.3, originalCurrency: 'USD', fxRate: 1.1 },
    ])
  })

  it('does not count a tax-only interest correction as income', () => {
    const april = dashboardFor({ scope: 'A' }).income.months.find((m) => m.month === '2025-04')
    expect(april?.interest).toEqual({ gross: 0, withheldTax: 0, net: 0 })
  })
})
