import { isIncome, type IncomeKind, type Transaction } from './transactions'
import { Decimal, ZERO, euros } from './money'

export interface Flow {
  name: string
  value: number
}

/** Where money came from and where it went. Sources and destinations always add up to the same total. */
export interface CashflowView {
  /** Largest first. */
  sources: Flow[]
  destinations: Flow[]
}

const INCOME_SOURCES: Record<IncomeKind, string> = { payout: 'Payouts', interest: 'Interest', coupon: 'Coupons' }

/**
 * Splits each Transaction's Cash Effect into its parts: the amount, the fee and the Withheld Tax. What's left over
 * is the change in cash over the period, shown as "Added to cash" or "From cash".
 */
export function cashflowOf(inRange: Transaction[], leaveOut: (e: Transaction) => boolean): CashflowView {
  const sources = new Map<string, Decimal>()
  const destinations = new Map<string, Decimal>()
  const add = (to: Map<string, Decimal>, name: string, value: Decimal) => {
    if (!value.isZero()) to.set(name, (to.get(name) ?? ZERO).plus(value))
  }

  for (const e of inRange) {
    if (leaveOut(e)) continue
    if (e.tradeSide === 'buy') add(destinations, `Bought ${e.assetClass || 'other'}`, e.amount.plus(e.fee).negated())
    else {
      if (e.tradeSide === 'sell') add(sources, 'Sale proceeds', e.amount)
      else if (e.kind === 'deposit') add(sources, 'Deposits', e.amount)
      else if (e.kind === 'withdrawal') add(destinations, 'Withdrawals', e.amount.negated())
      else if (isIncome(e)) add(sources, INCOME_SOURCES[e.kind], e.amount)
      else if (e.amount.greaterThan(0)) add(sources, 'Other', e.amount)
      else add(destinations, 'Other', e.amount.negated())
      add(destinations, 'Fees', e.fee.negated())
    }
    if (e.withheldTax.lessThan(0)) add(destinations, 'Withheld Tax', e.withheldTax.negated())
    else add(sources, 'Tax refunds', e.withheldTax)
  }

  const total = (m: Map<string, Decimal>) => [...m.values()].reduce((a, b) => a.plus(b), ZERO)
  const change = total(sources).minus(total(destinations))
  if (change.greaterThan(0)) add(destinations, 'Added to cash', change)
  if (change.lessThan(0)) add(sources, 'From cash', change.negated())

  const flows = (m: Map<string, Decimal>) =>
    [...m].map(([name, value]) => ({ name, value: euros(value) })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
  return { sources: flows(sources), destinations: flows(destinations) }
}
