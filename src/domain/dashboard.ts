import { entriesOf, type AssetClass, type Entry, type TransactionKind } from './entries'
import { euros, sum, ZERO } from './money'
import type { AccountId, AccountRegistration, AllowanceSplits, Histories, MarketPrices } from './types'

export type Scope = 'household' | AccountId

export type DateRange =
  | { kind: 'all' }
  | { kind: 'lastDays'; days: number }
  | { kind: 'yearToDate' }
  | { kind: 'lastYear' }
  | { kind: 'custom'; from?: string; to?: string }

export interface TransactionFilter {
  kinds?: TransactionKind[]
  search?: string
}

export interface DashboardOptions {
  scope: Scope
  range: DateRange
  today: string
  transactionFilter?: TransactionFilter
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

export interface MonthlyCashflow {
  month: string
  deposits: number
  withdrawals: number
  /** Cash spent on buys, including fees. */
  bought: number
  /** Cash received from sells, after fees and Withheld Tax. */
  sold: number
  /** Payouts, Interest and Coupons after Withheld Tax. */
  income: number
  savingsPlanBuys: number
  oneOffBuys: number
}

export interface BalancePoint {
  date: string
  cash: number
  netContributions: number
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
  headline: { cashBalance: number; netContributions: number; deposits: number; withdrawals: number }
  overview: {
    months: MonthlyCashflow[]
    /** One point per Transaction Date in the range, as of the end of that day. */
    balances: BalancePoint[]
  }
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
  const scoped = entriesOf(histories, input.accounts).filter((e) => household || e.accountId === options.scope)
  const { from, to } = resolveRange(options.range, options.today)
  /** Everything up to the end of the range: balances are stated as of that day. */
  const upToEnd = scoped.filter((e) => e.date <= to)
  /** Only the range itself: flows during the period. */
  const inRange = upToEnd.filter((e) => e.date >= from)
  /** Money that crossed the scope's boundary: Internal Transfers stay inside the Household. */
  const crossesBoundary = (e: Entry) => (e.kind === 'deposit' || e.kind === 'withdrawal') && !(household && e.internalTransfer)
  const accountIds = [...new Set(scoped.map((e) => e.accountId))]
  const isDeposit = (e: Entry) => e.kind === 'deposit' && crossesBoundary(e)
  const isWithdrawal = (e: Entry) => e.kind === 'withdrawal' && crossesBoundary(e)
  const total = (list: Entry[], pick: (e: Entry) => boolean) => sum(list.filter(pick).map((e) => e.cashEffect))

  return {
    warnings: accountIds.flatMap((id) => warningsFor(id, scoped.filter((e) => e.accountId === id))),
    accountSummaries: accountIds.map((id) => {
      const own = scoped.filter((e) => e.accountId === id)
      return {
        accountId: id,
        transactionCount: own.length,
        firstDate: own[0].date,
        lastDate: own[own.length - 1].date,
        lastImportedAt: histories[id].lastImportedAt,
      }
    }),
    headline: {
      cashBalance: euros(sum(upToEnd.map((e) => e.cashEffect))),
      netContributions: euros(sum(upToEnd.filter(crossesBoundary).map((e) => e.cashEffect))),
      deposits: euros(total(inRange, isDeposit)),
      withdrawals: euros(total(inRange, isWithdrawal).negated()),
    },
    overview: {
      months: monthsBetween(inRange[0]?.date, inRange.at(-1)?.date).map((month) => {
        const own = inRange.filter((e) => e.date.startsWith(month))
        return {
          month,
          deposits: euros(total(own, isDeposit)),
          withdrawals: euros(total(own, isWithdrawal).negated()),
          bought: euros(total(own, (e) => e.tradeSide === 'buy').negated()),
          sold: euros(total(own, (e) => e.tradeSide === 'sell')),
          income: euros(total(own, isIncome)),
          savingsPlanBuys: euros(total(own, (e) => e.kind === 'savingsPlanBuy').negated()),
          oneOffBuys: euros(total(own, (e) => e.kind === 'trade' && e.tradeSide === 'buy').negated()),
        }
      }),
      balances: balanceSeries(upToEnd, from, crossesBoundary),
    },
    transactions: inRange.filter(matches(options.transactionFilter)).reverse().map(view),
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

const shiftDate = (date: string, { days = 0, years = 0 }) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() - years)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Both ends inclusive, as Transaction Dates. */
export function resolveRange(range: DateRange, today: string): { from: string; to: string } {
  switch (range.kind) {
    case 'all':
      return { from: '0000-01-01', to: today }
    case 'lastDays':
      return { from: shiftDate(today, { days: range.days }), to: today }
    case 'yearToDate':
      return { from: `${today.slice(0, 4)}-01-01`, to: today }
    case 'lastYear':
      return { from: shiftDate(today, { years: 1 }), to: today }
    case 'custom':
      return { from: range.from || '0000-01-01', to: range.to || today }
  }
}

const matches = (filter: TransactionFilter | undefined) => (e: Entry) => {
  if (filter?.kinds?.length && !filter.kinds.includes(e.kind)) return false
  const needle = filter?.search?.trim().toLowerCase()
  if (needle && ![e.name, e.isin, e.description].some((field) => field.toLowerCase().includes(needle))) return false
  return true
}

const isIncome = (e: Entry) => e.kind === 'payout' || e.kind === 'interest' || e.kind === 'coupon'

/** Every calendar month from the first date to the last, as YYYY-MM. */
function monthsBetween(first: string | undefined, last: string | undefined): string[] {
  if (!first || !last) return []
  const months: string[] = []
  let [year, month] = first.slice(0, 7).split('-').map(Number)
  const end = last.slice(0, 7)
  for (;;) {
    const current = `${year}-${String(month).padStart(2, '0')}`
    months.push(current)
    if (current >= end) return months
    month = month === 12 ? 1 : month + 1
    if (month === 1) year++
  }
}

/** `entries` runs from the start of history to the end of the range; points are only emitted from `from`. */
function balanceSeries(entries: Entry[], from: string, contributes: (e: Entry) => boolean): BalancePoint[] {
  const points: BalancePoint[] = []
  let cash = ZERO
  let contributions = ZERO
  entries.forEach((e, i) => {
    cash = cash.plus(e.cashEffect)
    if (contributes(e)) contributions = contributions.plus(e.cashEffect)
    const lastOfDay = entries[i + 1]?.date !== e.date
    if (lastOfDay && e.date >= from) points.push({ date: e.date, cash: euros(cash), netContributions: euros(contributions) })
  })
  return points
}
