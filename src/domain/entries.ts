import { dec, type Decimal } from './money'
import type { AccountId, Histories, RawTransaction } from './types'

export type TransactionKind =
  | 'deposit'
  | 'withdrawal'
  | 'trade'
  | 'savingsPlanBuy'
  | 'payout'
  | 'interest'
  | 'coupon'
  | 'taxEvent'
  | 'corporateAction'
  | 'unclassified'

export type AssetClass = 'FUND' | 'STOCK' | 'BOND' | string

/** A Transaction with its kind worked out and its numbers parsed. */
export interface Entry {
  id: string
  accountId: AccountId
  date: string
  datetime: string
  kind: TransactionKind
  tradeSide?: 'buy' | 'sell'
  name: string
  isin: string
  assetClass: AssetClass
  shares: Decimal
  price: Decimal
  amount: Decimal
  fee: Decimal
  tax: Decimal
  cashEffect: Decimal
  originalAmount: string
  originalCurrency: string
  fxRate: string
  description: string
  counterpartyName: string
  counterpartyIban: string
}

export function classify(raw: RawTransaction): { kind: TransactionKind; tradeSide?: 'buy' | 'sell' } {
  const { category, type } = raw
  if (category === 'CORPORATE_ACTION') return { kind: 'corporateAction' }
  if (category === 'TRADING' && type === 'BUY')
    return { kind: raw.description.startsWith('Savings plan execution') ? 'savingsPlanBuy' : 'trade', tradeSide: 'buy' }
  if (category === 'TRADING' && type === 'SELL') return { kind: 'trade', tradeSide: 'sell' }
  if (category !== 'CASH') return { kind: 'unclassified' }
  switch (type) {
    case 'CUSTOMER_INBOUND':
    case 'TRANSFER_INBOUND':
    case 'TRANSFER_INSTANT_INBOUND':
      return { kind: 'deposit' }
    case 'TRANSFER_OUTBOUND':
      return { kind: 'withdrawal' }
    case 'DIVIDEND':
    case 'DISTRIBUTION':
      return { kind: 'payout' }
    case 'EARNINGS':
    case 'PRE_DETERMINED_TAX_BASE':
    case 'TAX_OPTIMIZATION':
      return { kind: 'taxEvent' }
    case 'INTEREST_PAYMENT':
      if (dec(raw.amount).isZero() && !dec(raw.tax).isZero()) return { kind: 'taxEvent' }
      return { kind: raw.symbol ? 'coupon' : 'interest' }
    default:
      return { kind: 'unclassified' }
  }
}

export function toEntry(raw: RawTransaction, accountId: AccountId): Entry {
  const amount = dec(raw.amount)
  const fee = dec(raw.fee)
  const tax = dec(raw.tax)
  return {
    id: raw.transaction_id,
    accountId,
    date: raw.date,
    datetime: raw.datetime,
    ...classify(raw),
    name: raw.name,
    isin: raw.symbol,
    assetClass: raw.asset_class,
    shares: dec(raw.shares),
    price: dec(raw.price),
    amount,
    fee,
    tax,
    cashEffect: amount.plus(fee).plus(tax),
    originalAmount: raw.original_amount,
    originalCurrency: raw.original_currency,
    fxRate: raw.fx_rate,
    description: raw.description,
    counterpartyName: raw.counterparty_name,
    counterpartyIban: raw.counterparty_iban,
  }
}

/** Oldest first: by Transaction Date, then by booking time within a day. */
export const chronological = (a: Entry, b: Entry) =>
  a.date === b.date ? a.datetime.localeCompare(b.datetime) : a.date.localeCompare(b.date)

export function entriesOf(histories: Histories): Entry[] {
  return Object.values(histories)
    .flatMap((h) => h.transactions.map((t) => toEntry(t, h.accountId)))
    .sort(chronological)
}
