import { describe, expect, it } from 'vitest'
import { bothHistories, dashboardFor, exportB, importOk } from './testSupport'

const internalIds = (scope: string) =>
  dashboardFor({ scope })
    .transactions.filter((t) => t.internalTransfer)
    .map((t) => `${t.accountId}-${t.id.slice(-2)}`)
    .sort()

describe('Household view and Internal Transfers', () => {
  it('adds up both Accounts', () => {
    expect(dashboardFor({ scope: 'household' }).headline.cashBalance).toBe(10492.7)
    expect(dashboardFor({ scope: 'household' }).transactions).toHaveLength(25)
  })

  it('recognises Internal Transfers in both directions, by IBAN or by a matching transfer on the other side', () => {
    expect(internalIds('household')).toEqual(['A-12', 'A-13', 'B-03', 'B-04'])
  })

  it('recognises an Internal Transfer by IBAN even when only one Account is imported', () => {
    const { histories } = importOk(exportB(), 'B')
    const flagged = dashboardFor({ scope: 'B' }, histories).transactions.filter((t) => t.internalTransfer)
    expect(flagged.map((t) => t.id.slice(-2))).toEqual(['03'])
  })

  it('leaves Internal Transfers out of Household Net Contributions but keeps them in each Account', () => {
    expect(dashboardFor({ scope: 'household' }).headline.netContributions).toBe(14800)
    expect(dashboardFor({ scope: 'A' }).headline.netContributions).toBe(9500)
    expect(dashboardFor({ scope: 'B' }).headline.netContributions).toBe(5300)
  })
})

describe('Internal Transfer pairing', () => {
  it('never pairs a Withdrawal to an outside bank account with a Deposit into the other Account', () => {
    const histories = bothHistories()
    // Alex receives 200 from outside a day after Sam sends 200 to Sam's own outside bank account.
    histories.A.transactions.push({
      ...histories.A.transactions[12],
      datetime: '2024-11-02T09:00:00.000000Z',
      date: '2024-11-02',
      amount: '200.000000',
      description: 'Incoming transfer from Alex Example',
      transaction_id: 'a0000000-0000-4000-8000-000000000099',
    })
    const flagged = dashboardFor({ scope: 'household' }, histories).transactions.filter((t) => t.internalTransfer)
    expect(flagged.map((t) => `${t.accountId}-${t.id.slice(-2)}`).sort()).toEqual(['A-12', 'A-13', 'B-03', 'B-04'])
  })
})
