import { monthOf } from './dates'
import type { FifoLedger } from './fifo'
import { ZERO, euros, sum } from './money'
import { isIncome, type Transaction } from './transactions'

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

export interface OverviewView {
  months: MonthlyCashflow[]
  /** One point per Transaction Date in the range, as of the end of that day. */
  balances: BalancePoint[]
}

/** Deposits and Withdrawals that crossed the scope's boundary (Internal Transfers stay inside the Household). */
export interface Contributions {
  isDeposit: (t: Transaction) => boolean
  isWithdrawal: (t: Transaction) => boolean
}

export const cashTotal = (list: Transaction[], pick: (t: Transaction) => boolean) => sum(list.filter(pick).map((t) => t.cashEffect))

export function monthlyCashflow(inRange: Transaction[], months: string[], { isDeposit, isWithdrawal }: Contributions): MonthlyCashflow[] {
  return months.map((month) => {
    const own = inRange.filter((t) => monthOf(t.date) === month)
    return {
      month,
      deposits: euros(cashTotal(own, isDeposit)),
      withdrawals: euros(cashTotal(own, isWithdrawal).negated()),
      bought: euros(cashTotal(own, (t) => t.tradeSide === 'buy').negated()),
      sold: euros(cashTotal(own, (t) => t.tradeSide === 'sell')),
      income: euros(cashTotal(own, isIncome)),
      savingsPlanBuys: euros(cashTotal(own, (t) => t.kind === 'savingsPlanBuy').negated()),
      oneOffBuys: euros(cashTotal(own, (t) => t.kind === 'trade' && t.tradeSide === 'buy').negated()),
    }
  })
}

/**
 * Walks `upToEnd` (start of history to end of range) through the ledger, emitting a point per day from `from`.
 * Leaves the ledger in its end-of-range state.
 */
export function balanceSeries(upToEnd: Transaction[], from: string, { isDeposit, isWithdrawal }: Contributions, ledger: FifoLedger): BalancePoint[] {
  const points: BalancePoint[] = []
  let cash = ZERO
  let contributions = ZERO
  upToEnd.forEach((t, i) => {
    cash = cash.plus(t.cashEffect)
    ledger.apply(t)
    if (isDeposit(t) || isWithdrawal(t)) contributions = contributions.plus(t.cashEffect)
    const lastOfDay = upToEnd[i + 1]?.date !== t.date
    if (lastOfDay && t.date >= from)
      points.push({ date: t.date, cash: euros(cash), netContributions: euros(contributions), investedCapital: euros(ledger.investedCapital()) })
  })
  return points
}
