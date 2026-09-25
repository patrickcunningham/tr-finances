import type { AccruedInterest, FifoLedger, Sale } from './fifo'
import { Decimal, ZERO, euros, roundCents, sum } from './money'
import type { AssetClass, Transaction } from './transactions'
import type { AccountId, MarketPrice, MarketPrices } from './types'

/** Which Account, security and day a portfolio event belongs to. */
export interface SecurityEvent {
  accountId: AccountId
  date: string
  isin: string
  name: string
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

export interface SaleView extends SecurityEvent {
  assetClass: AssetClass
  quantity: number
  cost: number
  proceeds: number
  realisedGain: number
}

export interface AccruedInterestView extends SecurityEvent {
  /** Positive when paid on a bond buy, negative when received on a bond sale. */
  amount: number
}

export interface PortfolioView {
  /** Largest Invested Capital first. */
  positions: PositionView[]
  /** Newest first, only sales inside the range. */
  realisedSales: SaleView[]
  accruedInterest: AccruedInterestView[]
  /** By market value, falling back to Invested Capital for unpriced Positions. Largest first. */
  assetClasses: { assetClass: AssetClass; value: number }[]
  unpricedIsins: string[]
}

const securityEvent = (t: Transaction): SecurityEvent => ({ accountId: t.accountId, date: t.date, isin: t.isin, name: t.name })

const saleView = (s: Sale): SaleView => ({
  ...securityEvent(s.transaction),
  assetClass: s.transaction.assetClass,
  quantity: s.quantity.toNumber(),
  cost: euros(s.cost),
  proceeds: euros(s.proceeds),
  realisedGain: euros(s.realisedGain),
})

const accruedView = (a: AccruedInterest): AccruedInterestView => ({ ...securityEvent(a.transaction), amount: euros(a.amount) })

/** `ledger` is in its end-of-range state; only sales and Accrued Interest from `from` are listed. */
export function portfolioOf(ledger: FifoLedger, prices: MarketPrices, from: string): PortfolioView {
  const positions = positionsOf(ledger, prices)
  return {
    positions,
    realisedSales: ledger.sales.filter((s) => s.transaction.date >= from).reverse().map(saleView),
    accruedInterest: ledger.accruedInterest.filter((a) => a.transaction.date >= from).map(accruedView),
    assetClasses: assetClassesOf(positions),
    unpricedIsins: positions.filter((p) => p.marketValue === null).map((p) => p.isin),
  }
}

/** Merges each ISIN's lots across Accounts (only one Account is in scope unless it's the Household). */
function positionsOf(ledger: FifoLedger, prices: MarketPrices): PositionView[] {
  const byIsin = new Map<string, { isin: string; name: string; assetClass: AssetClass; quantity: Decimal; cost: Decimal }>()
  for (const p of ledger.openPositions()) {
    const current = byIsin.get(p.isin) ?? { isin: p.isin, name: p.name, assetClass: p.assetClass, quantity: ZERO, cost: ZERO }
    current.quantity = current.quantity.plus(sum(p.lots.map((l) => l.quantity)))
    current.cost = current.cost.plus(sum(p.lots.map((l) => l.cost)))
    byIsin.set(p.isin, current)
  }
  return [...byIsin.values()]
    .map(({ isin, name, assetClass, quantity, cost }) => {
      const marketPrice = prices[isin] ?? null
      const value = marketPrice ? quantity.times(marketPrice.price) : null
      return {
        isin,
        name,
        assetClass,
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
  return [...totals].map(([assetClass, value]) => ({ assetClass, value: roundCents(value) })).sort((a, b) => b.value - a.value)
}

/** Null while any Position has no Market Price. */
export function totalAtMarket(positions: PositionView[], pick: (p: PositionView) => number | null): number | null {
  if (positions.some((p) => p.marketValue === null)) return null
  return roundCents(positions.reduce((total, p) => total + (pick(p) ?? 0), 0))
}
