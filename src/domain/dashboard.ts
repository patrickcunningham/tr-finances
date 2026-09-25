import { cashflowOf, type CashflowView } from './cashflow'
import { monthsBetween, resolveRange, taxYearOf, type DateRange } from './dates'
import { FifoLedger } from './fifo'
import { incomeOf, type IncomeView } from './income'
import { euros, sum } from './money'
import { balanceSeries, cashTotal, monthlyCashflow, type Contributions, type OverviewView } from './overview'
import { portfolioOf, totalAtMarket, type PortfolioView } from './portfolio'
import { taxOf, type TaxView } from './tax'
import { transactionsOf, type AssetClass, type Transaction, type TransactionKind } from './transactions'
import type { AccountId, AccountRegistration, AllowanceSplits, Histories, MarketPrices } from './types'
import { summaryOf, warningsFor, type AccountSummary, type DashboardWarning } from './warnings'

export type Scope = 'household' | AccountId

export interface TransactionFilter {
  kinds?: TransactionKind[]
  search?: string
}

export interface DashboardOptions {
  scope: Scope
  range: DateRange
  today: string
  transactionFilter?: TransactionFilter
  /** Defaults to the latest year with Transactions. */
  taxYear?: string
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
  withheldTax: number
  cashEffect: number
  description: string
  originalAmount: string
  originalCurrency: string
  fxRate: string
  internalTransfer: boolean
}

export interface Dashboard {
  warnings: DashboardWarning[]
  accountSummaries: AccountSummary[]
  headline: {
    cashBalance: number
    netContributions: number
    deposits: number
    withdrawals: number
    investedCapital: number
    realisedGain: number
    /** Null while any open Position has no Market Price. */
    portfolioValue: number | null
    unrealisedGain: number | null
  }
  overview: OverviewView
  portfolio: PortfolioView
  income: IncomeView
  cashflow: CashflowView
  /** By tax year; ignores the date range. */
  tax: TaxView
  /** Newest first. */
  transactions: TransactionView[]
}

const view = (t: Transaction): TransactionView => ({
  id: t.id,
  accountId: t.accountId,
  date: t.date,
  kind: t.kind,
  name: t.name,
  isin: t.isin,
  assetClass: t.assetClass,
  amount: euros(t.amount),
  fee: euros(t.fee),
  withheldTax: euros(t.withheldTax),
  cashEffect: euros(t.cashEffect),
  description: t.description,
  originalAmount: t.originalAmount,
  originalCurrency: t.originalCurrency,
  fxRate: t.fxRate,
  internalTransfer: t.internalTransfer,
})

export function buildDashboard(input: DashboardInput): Dashboard {
  const { histories, options } = input
  const household = options.scope === 'household'
  const all = transactionsOf(histories, input.accounts)
  const scoped = all.filter((t) => household || t.accountId === options.scope)
  const { from, to } = resolveRange(options.range, options.today)
  /** Everything up to the end of the range: balances are stated as of that day. */
  const upToEnd = scoped.filter((t) => t.date <= to)
  /** Only the range itself: flows during the period. */
  const inRange = upToEnd.filter((t) => t.date >= from)
  const crossesBoundary = (t: Transaction) => !(household && t.internalTransfer)
  const contributions: Contributions = {
    isDeposit: (t) => t.kind === 'deposit' && crossesBoundary(t),
    isWithdrawal: (t) => t.kind === 'withdrawal' && crossesBoundary(t),
  }
  const accountIds = [...new Set(scoped.map((t) => t.accountId))]
  const own = (id: AccountId) => scoped.filter((t) => t.accountId === id)

  const ledger = new FifoLedger()
  const balances = balanceSeries(upToEnd, from, contributions, ledger)
  const portfolio = portfolioOf(ledger, input.marketPrices, from)
  const months = monthsBetween(inRange[0]?.date, inRange.at(-1)?.date)

  return {
    warnings: accountIds.flatMap((id) => warningsFor(id, own(id))),
    accountSummaries: accountIds.map((id) => summaryOf(histories[id], own(id))),
    headline: {
      cashBalance: euros(sum(upToEnd.map((t) => t.cashEffect))),
      netContributions: euros(cashTotal(upToEnd, (t) => contributions.isDeposit(t) || contributions.isWithdrawal(t))),
      deposits: euros(cashTotal(inRange, contributions.isDeposit)),
      withdrawals: euros(cashTotal(inRange, contributions.isWithdrawal).negated()),
      investedCapital: euros(ledger.investedCapital()),
      realisedGain: euros(sum(ledger.sales.filter((s) => s.transaction.date >= from).map((s) => s.realisedGain))),
      portfolioValue: totalAtMarket(portfolio.positions, (p) => p.marketValue),
      unrealisedGain: totalAtMarket(portfolio.positions, (p) => p.unrealisedGain),
    },
    overview: { months: monthlyCashflow(inRange, months, contributions), balances },
    portfolio,
    income: incomeOf(inRange, months),
    cashflow: cashflowOf(inRange, (t) => !crossesBoundary(t)),
    tax: taxOf({
      transactions: all,
      shownAccountIds: accountIds,
      householdAccountIds: input.accounts.map((a) => a.id),
      year: options.taxYear ?? (scoped.length ? taxYearOf(scoped[scoped.length - 1].date) : taxYearOf(options.today)),
      splits: input.allowanceSplits,
    }),
    transactions: inRange.filter(matches(options.transactionFilter)).reverse().map(view),
  }
}

const matches = (filter: TransactionFilter | undefined) => (t: Transaction) => {
  if (filter?.kinds?.length && !filter.kinds.includes(t.kind)) return false
  const needle = filter?.search?.trim().toLowerCase()
  if (needle && ![t.name, t.isin, t.description].some((field) => field.toLowerCase().includes(needle))) return false
  return true
}
