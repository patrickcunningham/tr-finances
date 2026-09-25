import { parseCsv } from './csv'
import { EXPORT_COLUMNS, type AccountId, type Histories, type RawTransaction } from './types'

export type ImportOutcome =
  | { ok: true; histories: Histories; added: number; skipped: number }
  | { ok: false; error: string }

export function importTransactionExport(text: string, accountId: AccountId, histories: Histories, now: string): ImportOutcome {
  const rows = parseCsv(text)
  const [header, ...body] = rows
  const missing = header ? EXPORT_COLUMNS.filter((c) => !header.includes(c)) : [...EXPORT_COLUMNS]
  if (missing.length > 0) return { ok: false, error: `This isn't a Trade Republic Transaction Export (missing columns: ${missing.join(', ')}).` }

  const incoming: RawTransaction[] = body.map((cells) => {
    const tx = {} as RawTransaction
    for (const column of EXPORT_COLUMNS) tx[column] = cells[header.indexOf(column)] ?? ''
    return tx
  })

  const existing = histories[accountId]?.transactions ?? []
  const known = new Set(existing.map((t) => t.transaction_id))
  const added = incoming.filter((t) => !known.has(t.transaction_id))
  return {
    ok: true,
    histories: { ...histories, [accountId]: { accountId, transactions: [...existing, ...added], lastImportedAt: now } },
    added: added.length,
    skipped: incoming.length - added.length,
  }
}
