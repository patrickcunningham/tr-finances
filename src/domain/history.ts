import { parseCsv } from './csv'
import { EXPORT_COLUMNS, type AccountId, type Histories, type RawTransaction } from './types'

export type ImportOutcome =
  | {
      ok: true
      histories: Histories
      added: number
      skipped: number
      /** Another Account whose Transaction History already has some of these Transactions, if any. */
      overlapsAccountId: AccountId | null
    }
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

  const incomingIds = new Set(incoming.map((t) => t.transaction_id))
  const other = Object.values(histories).find(
    (h) => h.accountId !== accountId && h.transactions.some((t) => incomingIds.has(t.transaction_id)),
  )

  const existing = histories[accountId]?.transactions ?? []
  const known = new Set(existing.map((t) => t.transaction_id))
  const added = incoming.filter((t) => !known.has(t.transaction_id))
  return {
    ok: true,
    histories: { ...histories, [accountId]: { accountId, transactions: [...existing, ...added], lastImportedAt: now } },
    added: added.length,
    skipped: incoming.length - added.length,
    overlapsAccountId: other?.accountId ?? null,
  }
}
