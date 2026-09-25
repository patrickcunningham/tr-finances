import { chronological, entriesOf, type AssetClass, type Entry, type TransactionKind } from './entries'
import { euros, sum, ZERO } from './money'
import type { AccountId, AccountRegistration, AllowanceSplits, Histories, MarketPrices } from './types'

export type Scope = 'household' | AccountId

export type DateRange = { kind: 'all' } | { kind: 'custom'; from?: string; to?: string }

export interface DashboardOptions {
  scope: Scope
  range: DateRange
  today: string
}

export interface DashboardInput {
  accounts: AccountRegistration[]
  histories: Histories
  marketPrices: MarketPrices
  allowanceSplits: AllowanceSplits
  options: DashboardOptions
}

export interface TransactionView {
  id: string
  accountId: AccountId
  date: string
  kind: TransactionKind
  name: string
  isin: string
  assetClass: AssetClass
  amount: number
  fee: number
  tax: number
  cashEffect: number
  description: string
  originalAmount: string
  originalCurrency: string
  fxRate: string
  internalTransfer: boolean
}

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

export interface Dashboard {
  warnings: DashboardWarning[]
  accountSummaries: AccountSummary[]
  headline: { cashBalance: number; netContributions: number }
  /** Newest first. */
  transactions: TransactionView[]
}

const view = (e: Entry): TransactionView => ({
  id: e.id,
  accountId: e.accountId,
  date: e.date,
  kind: e.kind,
  name: e.name,
  isin: e.isin,
  assetClass: e.assetClass,
  amount: euros(e.amount),
  fee: euros(e.fee),
  tax: euros(e.tax),
  cashEffect: euros(e.cashEffect),
  description: e.description,
  originalAmount: e.originalAmount,
  originalCurrency: e.originalCurrency,
  fxRate: e.fxRate,
  internalTransfer: e.internalTransfer,
})

export function buildDashboard(input: DashboardInput): Dashboard {
  const { histories, options } = input
  const household = options.scope === 'household'
  const entries = entriesOf(histories, input.accounts).filter((e) => household || e.accountId === options.scope)
  /** Money that crossed the scope's boundary: Internal Transfers stay inside the Household. */
  const crossesBoundary = (e: Entry) => (e.kind === 'deposit' || e.kind === 'withdrawal') && !(household && e.internalTransfer)
  const accountIds = [...new Set(entries.map((e) => e.accountId))]
  return {
    warnings: accountIds.flatMap((id) => warningsFor(id, entries.filter((e) => e.accountId === id))),
    accountSummaries: accountIds.map((id) => {
      const own = entries.filter((e) => e.accountId === id)
      return {
        accountId: id,
        transactionCount: own.length,
        firstDate: own[0].date,
        lastDate: own[own.length - 1].date,
        lastImportedAt: histories[id].lastImportedAt,
      }
    }),
    headline: {
      cashBalance: euros(sum(entries.map((e) => e.cashEffect))),
      netContributions: euros(sum(entries.filter(crossesBoundary).map((e) => e.cashEffect))),
    },
    transactions: [...entries].sort(chronological).reverse().map(view),
  }
}

/** `own` is one Account's entries, oldest first. */
function warningsFor(accountId: AccountId, own: Entry[]): DashboardWarning[] {
  const warnings: DashboardWarning[] = []
  const unclassified = own.filter((e) => e.kind === 'unclassified').length
  if (unclassified > 0) warnings.push({ type: 'unclassifiedTransactions', accountId, count: unclassified })

  // A Trade Republic Account opens with a Deposit, and its cash can never go below zero.
  let cash = ZERO
  let negative = false
  for (const e of own) {
    cash = cash.plus(e.cashEffect)
    if (cash.lessThan(-0.005)) negative = true
  }
  if (own[0]?.kind !== 'deposit' || negative) warnings.push({ type: 'historyMayBeIncomplete', accountId })
  return warnings
}
