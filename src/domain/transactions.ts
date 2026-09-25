import { dec, type Decimal } from './money'
import type { AccountId, AccountRegistration, Histories, RawTransaction } from './types'

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

/** Trade Republic's asset class; other values may appear in future exports. */
export type AssetClass = 'FUND' | 'STOCK' | 'BOND' | (string & {})

/** A Transaction with its kind worked out and its numbers parsed. */
export interface Transaction {
  id: string
  accountId: AccountId
  date: string
  datetime: string
  kind: TransactionKind
  tradeSide?: 'buy' | 'sell'
  /** Trade Republic's own type, e.g. EARNINGS. */
  type: string
  name: string
  isin: string
  assetClass: AssetClass
  shares: Decimal
  price: Decimal
  amount: Decimal
  fee: Decimal
  withheldTax: Decimal
  cashEffect: Decimal
  originalAmount: string
  originalCurrency: string
  fxRate: string
  description: string
  counterpartyName: string
  counterpartyIban: string
  /** Money moved between the two registered Accounts. */
  internalTransfer: boolean
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

export function toTransaction(raw: RawTransaction, accountId: AccountId): Transaction {
  const amount = dec(raw.amount)
  const fee = dec(raw.fee)
  const tax = dec(raw.tax)
  return {
    id: raw.transaction_id,
    accountId,
    date: raw.date,
    datetime: raw.datetime,
    ...classify(raw),
    type: raw.type,
    name: raw.name,
    isin: raw.symbol,
    assetClass: raw.asset_class,
    shares: dec(raw.shares),
    price: dec(raw.price),
    amount,
    fee,
    withheldTax: tax,
    cashEffect: amount.plus(fee).plus(tax),
    originalAmount: raw.original_amount,
    originalCurrency: raw.original_currency,
    fxRate: raw.fx_rate,
    description: raw.description,
    counterpartyName: raw.counterparty_name,
    counterpartyIban: raw.counterparty_iban,
    internalTransfer: false,
  }
}

export type IncomeKind = 'payout' | 'interest' | 'coupon'
export const INCOME_KINDS: readonly IncomeKind[] = ['payout', 'interest', 'coupon']
export const isIncome = (t: Transaction): t is Transaction & { kind: IncomeKind } => (INCOME_KINDS as readonly string[]).includes(t.kind)

/** Oldest first: by Transaction Date, then by booking time within a day. */
export const chronological = (a: Transaction, b: Transaction) =>
  a.date === b.date ? a.datetime.localeCompare(b.datetime) : a.date.localeCompare(b.date)

export function transactionsOf(histories: Histories, accounts: AccountRegistration[]): Transaction[] {
  const transactions = Object.values(histories)
    .flatMap((h) => h.transactions.map((t) => toTransaction(t, h.accountId)))
    .sort(chronological)
  markInternalTransfers(transactions, accounts)
  return transactions
}

const PAIRING_WINDOW_DAYS = 3
const daysBetween = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000

/**
 * An Internal Transfer is recognised when the counterparty IBAN is the other registered Account's IBAN,
 * or when a Withdrawal is matched by a Deposit of the same amount into the other Account within a few days.
 * Trade Republic leaves the IBAN off outgoing transfers, so the pairing catches that side.
 */
function markInternalTransfers(transactions: Transaction[], accounts: AccountRegistration[]) {
  const otherIbans = (accountId: AccountId) =>
    new Set(accounts.filter((a) => a.id !== accountId && a.iban).map((a) => a.iban.replace(/\s+/g, '').toUpperCase()))
  const transfers = transactions.filter((e) => e.kind === 'deposit' || e.kind === 'withdrawal')

  for (const e of transfers) {
    if (e.counterpartyIban && otherIbans(e.accountId).has(e.counterpartyIban.toUpperCase())) e.internalTransfer = true
  }

  const paired = new Set<Transaction>()
  for (const out of transfers.filter((e) => e.kind === 'withdrawal')) {
    const match = transfers.find(
      (d) =>
        d.kind === 'deposit' &&
        !paired.has(d) &&
        d.accountId !== out.accountId &&
        d.amount.equals(out.amount.negated()) &&
        daysBetween(d.date, out.date) <= PAIRING_WINDOW_DAYS &&
        // Where either side names an IBAN, it must be the other Account's.
        (!d.counterpartyIban || otherIbans(d.accountId).has(d.counterpartyIban.toUpperCase())) &&
        (!out.counterpartyIban || otherIbans(out.accountId).has(out.counterpartyIban.toUpperCase())),
    )
    if (match) {
      paired.add(match)
      out.internalTransfer = true
      match.internalTransfer = true
    }
  }
}
