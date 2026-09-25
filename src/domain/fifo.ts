import type { Entry } from './entries'
import { Decimal, ZERO, sum } from './money'
import type { AccountId } from './types'

interface Lot {
  quantity: Decimal
  cost: Decimal
}

export interface Holding {
  accountId: AccountId
  isin: string
  name: string
  assetClass: string
  lots: Lot[]
}

export interface Sale {
  entry: Entry
  quantity: Decimal
  cost: Decimal
  proceeds: Decimal
  realisedGain: Decimal
}

export interface AccruedInterestPaid {
  entry: Entry
  amount: Decimal
}

const holdingKey = (e: Entry) => `${e.accountId}|${e.isin}`

/**
 * Keeps FIFO lots per Account and ISIN as Transactions are applied oldest first.
 * Costs include fees. For a bond, quantity is the nominal amount and price a fraction of it; whatever the buyer
 * paid beyond quantity × price is Accrued Interest, which is not part of the cost.
 */
export class FifoLedger {
  readonly holdings = new Map<string, Holding>()
  readonly sales: Sale[] = []
  readonly accruedInterest: AccruedInterestPaid[] = []

  apply(e: Entry) {
    if (e.tradeSide === 'buy') this.buy(e)
    else if (e.tradeSide === 'sell') this.sell(e)
    else if (e.kind === 'corporateAction' && e.isin && !e.shares.isZero()) this.split(e)
  }

  investedCapital(): Decimal {
    return sum([...this.holdings.values()].flatMap((h) => h.lots.map((l) => l.cost)))
  }

  openHoldings(): Holding[] {
    return [...this.holdings.values()].filter((h) => h.lots.length > 0)
  }

  private holding(e: Entry): Holding {
    const key = holdingKey(e)
    let h = this.holdings.get(key)
    if (!h) {
      h = { accountId: e.accountId, isin: e.isin, name: e.name, assetClass: e.assetClass, lots: [] }
      this.holdings.set(key, h)
    }
    if (e.name) h.name = e.name
    return h
  }

  private buy(e: Entry) {
    let price = e.amount.abs()
    if (e.assetClass === 'BOND') {
      price = e.shares.times(e.price)
      const accrued = e.amount.abs().minus(price)
      if (accrued.greaterThan(0)) this.accruedInterest.push({ entry: e, amount: accrued })
    }
    this.holding(e).lots.push({ quantity: e.shares, cost: price.plus(e.fee.abs()) })
  }

  private sell(e: Entry) {
    const h = this.holding(e)
    let remaining = e.shares.abs()
    let cost = ZERO
    while (remaining.greaterThan(0) && h.lots.length > 0) {
      const lot = h.lots[0]
      if (lot.quantity.lessThanOrEqualTo(remaining)) {
        cost = cost.plus(lot.cost)
        remaining = remaining.minus(lot.quantity)
        h.lots.shift()
      } else {
        const part = lot.cost.times(remaining).dividedBy(lot.quantity)
        cost = cost.plus(part)
        lot.cost = lot.cost.minus(part)
        lot.quantity = lot.quantity.minus(remaining)
        remaining = ZERO
      }
    }
    const proceeds = e.amount.minus(e.fee.abs())
    this.sales.push({ entry: e, quantity: e.shares.abs(), cost, proceeds, realisedGain: proceeds.minus(cost) })
  }

  /** A split's shares are the change in quantity, spread across the lots in proportion; total cost stays the same. */
  private split(e: Entry) {
    const h = this.holding(e)
    const before = sum(h.lots.map((l) => l.quantity))
    if (before.isZero()) return
    const factor = before.plus(e.shares).dividedBy(before)
    for (const lot of h.lots) lot.quantity = lot.quantity.times(factor)
  }
}
