import { monthOf } from './dates'
import { isIncome, type Transaction } from './transactions'
import { euros, sum, type Decimal } from './money'

export interface IncomeAmounts {
  gross: number
  withheldTax: number
  net: number
}

export interface IncomeView {
  totals: { payouts: IncomeAmounts; interest: IncomeAmounts; coupons: IncomeAmounts }
  months: ({ month: string } & IncomeView['totals'])[]
  /** Largest gross first. */
  payoutsBySecurity: { isin: string; name: string; count: number; gross: number; net: number }[]
  /** Newest first. */
  foreignCurrency: { date: string; kind: 'payout' | 'coupon'; name: string; gross: number; originalAmount: number; originalCurrency: string; fxRate: number }[]
}

const amounts = (transactions: Transaction[]): IncomeAmounts => {
  const gross: Decimal = sum(transactions.map((e) => e.amount))
  const tax: Decimal = sum(transactions.map((e) => e.withheldTax))
  return { gross: euros(gross), withheldTax: euros(tax), net: euros(gross.plus(tax)) }
}

const split = (transactions: Transaction[]) => ({
  payouts: amounts(transactions.filter((e) => e.kind === 'payout')),
  interest: amounts(transactions.filter((e) => e.kind === 'interest')),
  coupons: amounts(transactions.filter((e) => e.kind === 'coupon')),
})

/** `inRange` is oldest first. Tax-only corrections are Tax Events, so they never appear here. */
export function incomeOf(inRange: Transaction[], months: string[]): IncomeView {
  const payouts = inRange.filter((e) => e.kind === 'payout')
  const bySecurity = new Map<string, Transaction[]>()
  for (const p of payouts) bySecurity.set(p.isin, [...(bySecurity.get(p.isin) ?? []), p])

  return {
    totals: split(inRange),
    months: months.map((month) => ({ month, ...split(inRange.filter((e) => monthOf(e.date) === month)) })),
    payoutsBySecurity: [...bySecurity.values()]
      .map((list) => {
        const { gross, net } = amounts(list)
        return { isin: list[0].isin, name: list.at(-1)!.name, count: list.length, gross, net }
      })
      .sort((a, b) => b.gross - a.gross),
    foreignCurrency: inRange
      .filter((e): e is Transaction & { kind: 'payout' | 'coupon' } => isIncome(e) && e.kind !== 'interest' && e.originalCurrency !== '' && e.originalCurrency !== 'EUR')
      .reverse()
      .map((e) => ({
        date: e.date,
        kind: e.kind,
        name: e.name,
        gross: euros(e.amount),
        originalAmount: Number(e.originalAmount),
        originalCurrency: e.originalCurrency,
        fxRate: Number(e.fxRate),
      })),
  }
}
