import { entriesOf, type AssetClass, type Entry, type TransactionKind } from './entries'
import { FifoLedger, type Holding } from './fifo'
import { Decimal, euros, sum, ZERO } from './money'
import type { AccountId, AccountRegistration, AllowanceSplits, Histories, MarketPrice, MarketPrices } from './types'

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
  investedCapital: number
}

export interface PositionView {
  isin: string
  name: string
  assetClass: AssetClass
  /** For a bond, the nominal amount. */
  quantity: number
  averageCost: number
  investedCapital: number
  marketPrice: MarketPrice | null
  marketValue: number | null
  unrealisedGain: number | null
}

export interface SaleView {
  accountId: AccountId
  date: string
  isin: string
  name: string
  assetClass: AssetClass
  quantity: number
  cost: number
  proceeds: number
  realisedGain: number
}

export interface AccruedInterestView {
  accountId: AccountId
  date: string
  isin: string
  name: string
  amount: number
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
  headline: { cashBalance: number; netContributions: number; deposits: number; withdrawals: number; investedCapital: number
    realisedGain: number
    /** Null while any open Position has no Market Price. */
    portfolioValue: number | null
    unrealisedGain: number | null
  }
  overview: {
    months: MonthlyCashflow[]
    /** One point per Transaction Date in the range, as of the end of that day. */
    balances: BalancePoint[]
  }
  portfolio: {
    /** Largest Invested Capital first. */
    positions: PositionView[]
    /** Newest first, only sales inside the range. */
    realisedSales: SaleView[]
    accruedInterest: AccruedInterestView[]
    /** By market value, falling back to Invested Capital for unpriced Positions. Largest first. */
    assetClasses: { assetClass: AssetClass; value: number }[]
    unpricedIsins: string[]
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
  const ledger = new FifoLedger()
  const balances = balanceSeries(upToEnd, from, crossesBoundary, ledger)
  const salesInRange = ledger.sales.filter((s) => s.entry.date >= from)
  const positions = positionsOf(ledger, input.marketPrices)
  const unpriced = positions.filter((p) => p.marketValue === null)
  const valued = (pick: (p: PositionView) => number | null) =>
    unpriced.length > 0 ? null : Math.round(positions.reduce((total, p) => total + (pick(p) ?? 0), 0) * 100) / 100

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
      investedCapital: euros(ledger.investedCapital()),
      realisedGain: euros(sum(salesInRange.map((s) => s.realisedGain))),
      portfolioValue: valued((p) => p.marketValue),
      unrealisedGain: valued((p) => p.unrealisedGain),
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
      balances,
    },
    portfolio: {
      positions,
      assetClasses: assetClassesOf(positions),
      unpricedIsins: unpriced.map((p) => p.isin),
      realisedSales: salesInRange.reverse().map((s) => ({
        accountId: s.entry.accountId,
        date: s.entry.date,
        isin: s.entry.isin,
        name: s.entry.name,
        assetClass: s.entry.assetClass,
        quantity: s.quantity.toNumber(),
        cost: euros(s.cost),
        proceeds: euros(s.proceeds),
        realisedGain: euros(s.realisedGain),
      })),
      accruedInterest: ledger.accruedInterest
        .filter((a) => a.entry.date >= from)
        .map((a) => ({ accountId: a.entry.accountId, date: a.entry.date, isin: a.entry.isin, name: a.entry.name, amount: euros(a.amount) })),
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

/**
 * Walks `entries` (start of history to end of range) through the ledger, emitting a point per day from `from`.
 * Leaves the ledger in its end-of-range state.
 */
function balanceSeries(entries: Entry[], from: string, contributes: (e: Entry) => boolean, ledger: FifoLedger): BalancePoint[] {
  const points: BalancePoint[] = []
  let cash = ZERO
  let contributions = ZERO
  entries.forEach((e, i) => {
    cash = cash.plus(e.cashEffect)
    ledger.apply(e)
    if (contributes(e)) contributions = contributions.plus(e.cashEffect)
    const lastOfDay = entries[i + 1]?.date !== e.date
    if (lastOfDay && e.date >= from) points.push({ date: e.date, cash: euros(cash), netContributions: euros(contributions), investedCapital: euros(ledger.investedCapital()) })
  })
  return points
}

/** Merges holdings of the same ISIN across Accounts (only one Account is in scope unless it's the Household). */
function positionsOf(ledger: FifoLedger, prices: MarketPrices): PositionView[] {
  const byIsin = new Map<string, { h: Holding; quantity: Decimal; cost: Decimal }>()
  for (const h of ledger.openHoldings()) {
    const current = byIsin.get(h.isin) ?? { h, quantity: ZERO, cost: ZERO }
    current.quantity = current.quantity.plus(sum(h.lots.map((l) => l.quantity)))
    current.cost = current.cost.plus(sum(h.lots.map((l) => l.cost)))
    byIsin.set(h.isin, current)
  }
  return [...byIsin.values()]
    .map(({ h, quantity, cost }) => {
      const marketPrice = prices[h.isin] ?? null
      const value = marketPrice ? quantity.times(marketPrice.price) : null
      return {
        isin: h.isin,
        name: h.name,
        assetClass: h.assetClass,
        quantity: quantity.toDecimalPlaces(6).toNumber(),
        averageCost: cost.dividedBy(quantity).toDecimalPlaces(4).toNumber(),
        investedCapital: euros(cost),
        marketPrice,
        marketValue: value ? euros(value) : null,
        unrealisedGain: value ? euros(value.minus(cost)) : null,
      }
    })
    .sort((a, b) => b.investedCapital - a.investedCapital)
}

function assetClassesOf(positions: PositionView[]) {
  const totals = new Map<AssetClass, number>()
  for (const p of positions) totals.set(p.assetClass, (totals.get(p.assetClass) ?? 0) + (p.marketValue ?? p.investedCapital))
  return [...totals]
    .map(([assetClass, value]) => ({ assetClass, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}
