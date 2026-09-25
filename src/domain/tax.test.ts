import { describe, expect, it } from 'vitest'
import { buildDashboard, type AllowanceSplits } from './index'
import { accountA, accountB, bothHistories } from './testSupport'

const taxFor = (scope: string, taxYear: string, allowanceSplits: AllowanceSplits = { '2024': { A: 1200, B: 800 } }) =>
  buildDashboard({
    accounts: [accountA, accountB],
    histories: bothHistories(),
    marketPrices: {},
    allowanceSplits,
    // The date range must not affect the Tax tab.
    options: { scope, range: { kind: 'lastDays', days: 30 }, today: '2025-06-01', taxYear },
  }).tax

describe('yearly tax summary', () => {
  it('lists the tax years that have Transactions, newest first', () => {
    expect(taxFor('household', '2024').years).toEqual(['2025', '2024'])
  })

  it('summarises an Account’s capital income, gains, losses and Withheld Tax for the year', () => {
    expect(taxFor('A', '2024').accounts).toEqual([
      {
        accountId: 'A',
        payouts: 13,
        interest: 20,
        coupons: 0,
        shareGains: 0,
        shareLosses: 302,
        otherGains: 218,
        otherLosses: 0,
        accruedInterestPaid: 10,
        vorabpauschaleTax: 0,
        withheldTax: -66.21,
        sharePotCarriedIn: 0,
        generalPotCarriedIn: 0,
        sharePotCarriedOut: 302,
        generalPotCarriedOut: 0,
        taxableIncome: 241,
        allowance: 1200,
        allowanceIsDefault: false,
        allowanceUsed: 241,
        estimatedTax: 0,
      },
    ])
  })

  it('carries a share Loss Pot into the next year, where only share gains can use it', () => {
    const [a] = taxFor('A', '2025').accounts
    expect(a).toMatchObject({ coupons: 40, interest: 0, sharePotCarriedIn: 302, sharePotCarriedOut: 302, taxableIncome: 40 })
    // Tax refunds count against Withheld Tax: -0.40 - 1.50 - 10.55 + 20 - 2.00.
    expect(a).toMatchObject({ withheldTax: 5.55, vorabpauschaleTax: -1.9 })
  })

  it('splits the joint Freistellungsauftrag evenly until the Account Holders set a split', () => {
    const [a] = taxFor('A', '2025').accounts
    expect(a).toMatchObject({ allowance: 1000, allowanceIsDefault: true, allowanceUsed: 40 })
    expect(taxFor('A', '2022', {}).household.allowance).toBe(1602)
  })

  it('tracks the Household’s use of its joint Freistellungsauftrag', () => {
    expect(taxFor('household', '2024').household).toEqual({ allowance: 2000, allowanceUsed: 251, withheldTax: -68.85, estimatedTax: 0 })
    expect(taxFor('household', '2024').accounts.map((a) => a.accountId)).toEqual(['A', 'B'])
  })
})

describe('Loss Pots', () => {
  it('lets general losses offset share gains, but never share losses offset other income', () => {
    // Account B sells World ETF at a loss: a general loss that can offset its Interest.
    const histories = bothHistories()
    histories.B.transactions.push({
      ...histories.B.transactions[1],
      datetime: '2024-12-10T10:00:00.000Z',
      date: '2024-12-10',
      type: 'SELL',
      shares: '-20.0000000000',
      price: '90.000000',
      amount: '1800.00',
      fee: '-1.00',
      description: 'Sell trade IE0000000001 Example World ETF, quantity: 20',
      transaction_id: 'b0000000-0000-4000-8000-000000000099',
    })
    const tax = buildDashboard({
      accounts: [accountA, accountB],
      histories,
      marketPrices: {},
      allowanceSplits: {},
      options: { scope: 'B', range: { kind: 'all' }, today: '2025-06-01', taxYear: '2024' },
    }).tax
    // Loss 2001 - 1799 = 202 offsets Interest of 10; 192 carries forward in the general pot.
    expect(tax.accounts[0]).toMatchObject({ otherLosses: 202, taxableIncome: 0, generalPotCarriedOut: 192, sharePotCarriedOut: 0 })
  })
})
