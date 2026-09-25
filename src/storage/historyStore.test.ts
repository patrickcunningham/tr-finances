import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { accountA, importOk, exportA } from '../domain/testSupport'
import { openHistoryStore } from './historyStore'

describe('history store', () => {
  it('returns exactly what was saved, after reopening', async () => {
    const { histories } = importOk(exportA(), 'A')
    const saved = {
      accounts: [accountA],
      histories,
      allowanceSplits: { '2024': { A: 1200 } },
      marketPrices: { IE0000000001: { isin: 'IE0000000001', price: 130, source: 'manual' as const, fetchedAt: '2025-06-01T10:00:00.000Z' } },
    }
    const store = await openHistoryStore('test-roundtrip')
    await store.save(saved)
    const reopened = await openHistoryStore('test-roundtrip')
    expect(await reopened.load()).toEqual(saved)
  })

  it('starts empty', async () => {
    const store = await openHistoryStore('test-empty')
    expect(await store.load()).toEqual({ accounts: [], histories: {}, allowanceSplits: {}, marketPrices: {} })
  })
})
