import { describe, expect, it } from 'vitest'
import { importTransactionExport } from './index'
import { dashboardFor, exportA, importOk } from './testSupport'

describe('importing a Transaction Export', () => {
  it('shows the cash balance as the sum of Cash Effects', () => {
    const { histories } = importOk(exportA(), 'A')
    const dashboard = dashboardFor({ scope: 'A' }, histories)
    expect(dashboard.headline.cashBalance).toBe(7186.34)
  })
})

describe('classifying Transactions', () => {
  it('gives every Transaction its kind', () => {
    const dashboard = dashboardFor({ scope: 'A' })
    const kinds = Object.fromEntries(dashboard.transactions.map((t) => [t.id.slice(-2), t.kind]))
    expect(kinds).toEqual({
      '01': 'deposit',
      '02': 'trade',
      '03': 'savingsPlanBuy',
      '04': 'interest',
      '05': 'trade',
      '06': 'trade',
      '07': 'payout',
      '08': 'payout',
      '09': 'corporateAction',
      '10': 'trade',
      '11': 'trade',
      '12': 'withdrawal',
      '13': 'deposit',
      '14': 'trade',
      '15': 'taxEvent',
      '16': 'taxEvent',
      '17': 'coupon',
      '18': 'taxEvent',
      '19': 'taxEvent',
    })
  })

  it('reads an export that starts with a byte-order mark, newest Transaction first', () => {
    const dashboard = dashboardFor({ scope: 'B' })
    expect(dashboard.transactions.map((t) => t.kind)).toEqual(['interest', 'withdrawal', 'withdrawal', 'deposit', 'trade', 'deposit'])
  })
})

describe('unexpected files', () => {
  it('rejects a file that is not a Transaction Export and changes nothing', () => {
    const outcome = importTransactionExport('Date,Payee,Amount\n2024-01-01,Shop,-5\n', 'A', {}, '2025-06-01T00:00:00.000Z')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.error).toMatch(/isn't a Trade Republic Transaction Export/)
  })

  it('keeps an unknown Transaction type as unclassified and warns about it', () => {
    const text = exportA().replace('"CASH","TAX_OPTIMIZATION"', '"CASH","SOMETHING_NEW"')
    const { histories } = importOk(text, 'A')
    const dashboard = dashboardFor({ scope: 'A' }, histories)
    expect(dashboard.transactions.find((t) => t.id.endsWith('18'))?.kind).toBe('unclassified')
    expect(dashboard.warnings).toContainEqual({ type: 'unclassifiedTransactions', accountId: 'A', count: 1 })
  })
})
