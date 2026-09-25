import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildDashboard } from './index'
import { importOk } from './testSupport'

// The real export is never committed (it holds personal data), so this only runs on a machine that has it.
const samplePath = fileURLToPath(new URL('../../samples/Transaction export.csv', import.meta.url))
// The balance the Trade Republic app shows, kept next to the sample so it isn't committed either.
const expectedPath = fileURLToPath(new URL('../../samples/expected-cash-balance.txt', import.meta.url))

describe.skipIf(!existsSync(samplePath) || !existsSync(expectedPath))('the real Transaction Export (local only)', () => {
  it('reproduces the cash balance shown in the Trade Republic app', () => {
    const { histories } = importOk(readFileSync(samplePath, 'utf-8'), 'me')
    const dashboard = buildDashboard({
      accounts: [{ id: 'me', holderName: 'me', iban: '' }],
      histories,
      marketPrices: {},
      allowanceSplits: {},
      options: { scope: 'me', range: { kind: 'all' }, today: '2026-09-25' },
    })
    expect(dashboard.headline.cashBalance).toBe(Number(readFileSync(expectedPath, 'utf-8').trim()))
    expect(dashboard.warnings).toEqual([])
  })
})
