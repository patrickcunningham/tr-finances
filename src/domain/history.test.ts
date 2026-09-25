import { describe, expect, it } from 'vitest'
import { dashboardFor, exportA, importOk } from './testSupport'

const firstRows = (text: string, n: number) => text.split('\n').slice(0, n + 1).join('\n') + '\n'
const withoutRow = (text: string, index: number) => text.split('\n').filter((_, i) => i !== index + 1).join('\n')

describe('merging Transaction Exports into a Transaction History', () => {
  it('adds nothing when the same export is imported twice', () => {
    const first = importOk(exportA(), 'A')
    const second = importOk(exportA(), 'A', first.histories)
    expect([first.added, first.skipped]).toEqual([19, 0])
    expect([second.added, second.skipped]).toEqual([0, 19])
    expect(second.histories.A.transactions).toHaveLength(19)
  })

  it('adds only the new Transactions from an overlapping export', () => {
    const first = importOk(firstRows(exportA(), 10), 'A')
    const second = importOk(exportA(), 'A', first.histories)
    expect([second.added, second.skipped]).toEqual([9, 10])
    expect(dashboardFor({ scope: 'A' }, second.histories).headline.cashBalance).toBe(7186.34)
  })

  it('points out when an export looks like it belongs to the other Account', () => {
    const intoA = importOk(exportA(), 'A')
    const intoB = importOk(exportA(), 'B', intoA.histories)
    expect(intoB.overlapsAccountId).toBe('A')
    expect(intoA.overlapsAccountId).toBeNull()
  })

  it('warns when a Transaction History does not start at the Account opening', () => {
    const { histories } = importOk(withoutRow(exportA(), 0), 'A')
    expect(dashboardFor({ scope: 'A' }, histories).warnings).toContainEqual({ type: 'historyMayBeIncomplete', accountId: 'A' })
    expect(dashboardFor({ scope: 'A' }).warnings).toEqual([])
  })

  it('reports when each Account was last imported and which dates it covers', () => {
    const { histories } = importOk(exportA(), 'A', {}, '2025-05-31T18:00:00.000Z')
    expect(dashboardFor({ scope: 'A' }, histories).accountSummaries).toEqual([
      { accountId: 'A', transactionCount: 19, firstDate: '2024-01-02', lastDate: '2025-04-03', lastImportedAt: '2025-05-31T18:00:00.000Z' },
    ])
  })
})
