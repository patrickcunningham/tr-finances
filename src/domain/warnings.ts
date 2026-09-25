import { ZERO } from './money'
import type { Transaction } from './transactions'
import type { AccountId, TransactionHistory } from './types'

export type DashboardWarning =
  | { type: 'unclassifiedTransactions'; accountId: AccountId; count: number }
  /** The earliest Transaction doesn't look like the Account's opening, so balances may be wrong. */
  | { type: 'historyMayBeIncomplete'; accountId: AccountId }

export interface AccountSummary {
  accountId: AccountId
  transactionCount: number
  firstDate: string
  lastDate: string
  lastImportedAt: string
}

/** `own` is one Account's Transactions, oldest first. */
export function warningsFor(accountId: AccountId, own: Transaction[]): DashboardWarning[] {
  const warnings: DashboardWarning[] = []
  const unclassified = own.filter((t) => t.kind === 'unclassified').length
  if (unclassified > 0) warnings.push({ type: 'unclassifiedTransactions', accountId, count: unclassified })

  // A Trade Republic Account opens with a Deposit, and its cash can never go below zero.
  let cash = ZERO
  let negative = false
  for (const t of own) {
    cash = cash.plus(t.cashEffect)
    if (cash.lessThan(-0.005)) negative = true
  }
  if (own[0]?.kind !== 'deposit' || negative) warnings.push({ type: 'historyMayBeIncomplete', accountId })
  return warnings
}

/** `own` is one Account's Transactions, oldest first, and never empty. */
export const summaryOf = (history: TransactionHistory, own: Transaction[]): AccountSummary => ({
  accountId: history.accountId,
  transactionCount: own.length,
  firstDate: own[0].date,
  lastDate: own[own.length - 1].date,
  lastImportedAt: history.lastImportedAt,
})
