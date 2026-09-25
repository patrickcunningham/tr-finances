import type { AssetClass, Transaction } from './transactions'
import { Decimal, ZERO, sum } from './money'
import type { AccountId } from './types'

interface Lot {
  quantity: Decimal
  cost: Decimal
}

export interface PositionLots {
  accountId: AccountId
  isin: string
  name: string
  assetClass: AssetClass
  lots: Lot[]
}

export interface Sale {
  transaction: Transaction
  quantity: Decimal
  cost: Decimal
  proceeds: Decimal
  realisedGain: Decimal
}

/** Positive when paid on a bond buy, negative when received on a bond sale. */
export interface AccruedInterest {
  transaction: Transaction
  amount: Decimal
}

const positionKey = (e: Transaction) => `${e.accountId}|${e.isin}`

/**
 * Keeps FIFO lots per Account and ISIN as Transactions are applied oldest first.
 * Costs include fees. For a bond, quantity is the nominal amount and price a fraction of it; anything paid or
 * received beyond quantity × price is Accrued Interest, which is neither cost nor sale proceeds.
 */
export class FifoLedger {
  readonly positions = new Map<string, PositionLots>()
  readonly sales: Sale[] = []
  readonly accruedInterest: AccruedInterest[] = []

  apply(e: Transaction) {
    if (e.tradeSide === 'buy') this.buy(e)
    else if (e.tradeSide === 'sell') this.sell(e)
    else if (e.kind === 'corporateAction' && e.isin && !e.shares.isZero()) this.split(e)
  }

  investedCapital(): Decimal {
    return sum([...this.positions.values()].flatMap((h) => h.lots.map((l) => l.cost)))
  }

  openPositions(): PositionLots[] {
    return [...this.positions.values()].filter((h) => h.lots.length > 0)
  }

  private positionFor(e: Transaction): PositionLots {
    const key = positionKey(e)
    let h = this.positions.get(key)
    if (!h) {
      h = { accountId: e.accountId, isin: e.isin, name: e.name, assetClass: e.assetClass, lots: [] }
      this.positions.set(key, h)
    }
    if (e.name) h.name = e.name
    return h
  }

  /** The trade's value without Accrued Interest, which is recorded on its own. */
  private cleanValue(e: Transaction): Decimal {
    if (e.assetClass !== 'BOND') return e.amount.abs()
    const clean = e.shares.abs().times(e.price)
    const accrued = e.amount.abs().minus(clean)
    if (accrued.greaterThan(0)) this.accruedInterest.push({ transaction: e, amount: e.tradeSide === 'buy' ? accrued : accrued.negated() })
    return clean
  }

  private buy(e: Transaction) {
    this.positionFor(e).lots.push({ quantity: e.shares, cost: this.cleanValue(e).plus(e.fee.abs()) })
  }

  private sell(e: Transaction) {
    const h = this.positionFor(e)
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
    const proceeds = this.cleanValue(e).minus(e.fee.abs())
    this.sales.push({ transaction: e, quantity: e.shares.abs(), cost, proceeds, realisedGain: proceeds.minus(cost) })
  }

  /** A split's shares are the change in quantity, spread across the lots in proportion; total cost stays the same. */
  private split(e: Transaction) {
    const h = this.positionFor(e)
    const before = sum(h.lots.map((l) => l.quantity))
    if (before.isZero()) return
    const factor = before.plus(e.shares).dividedBy(before)
    for (const lot of h.lots) lot.quantity = lot.quantity.times(factor)
  }
}
