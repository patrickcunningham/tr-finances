import { chronological, entriesOf, type AssetClass, type Entry, type TransactionKind } from './entries'
import { euros, sum } from './money'
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
}

export type DashboardWarning = { type: 'unclassifiedTransactions'; accountId: AccountId; count: number }

export interface Dashboard {
  warnings: DashboardWarning[]
  headline: { cashBalance: number }
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
})

export function buildDashboard(input: DashboardInput): Dashboard {
  const { histories, options } = input
  const entries = entriesOf(histories).filter((e) => options.scope === 'household' || e.accountId === options.scope)
  const warnings: DashboardWarning[] = []
  for (const accountId of new Set(entries.map((e) => e.accountId))) {
    const count = entries.filter((e) => e.accountId === accountId && e.kind === 'unclassified').length
    if (count > 0) warnings.push({ type: 'unclassifiedTransactions', accountId, count })
  }
  return {
    warnings,
    headline: { cashBalance: euros(sum(entries.map((e) => e.cashEffect))) },
    transactions: [...entries].sort(chronological).reverse().map(view),
  }
}
