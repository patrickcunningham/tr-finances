export const EXPORT_COLUMNS = [
  'datetime', 'date', 'account_type', 'category', 'type', 'asset_class', 'name', 'symbol', 'shares', 'price',
  'amount', 'fee', 'tax', 'currency', 'original_amount', 'original_currency', 'fx_rate', 'description',
  'transaction_id', 'counterparty_name', 'counterparty_iban', 'payment_reference', 'mcc_code',
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** A Transaction exactly as it appears in a Transaction Export. Stored raw so the format can evolve. */
export type RawTransaction = Record<ExportColumn, string>

export type AccountId = string

export interface AccountRegistration {
  id: AccountId
  holderName: string
  /** The Account's own Trade Republic IBAN. */
  iban: string
}

export interface TransactionHistory {
  accountId: AccountId
  transactions: RawTransaction[]
  lastImportedAt: string
}

export type Histories = Record<AccountId, TransactionHistory>

/** Where a Market Price came from. */
export type PriceOrigin = 'onvista' | 'tradegate' | 'manual'

/**
 * The latest known price of one unit of a Position, in EUR. For a bond one unit is one unit of nominal,
 * so a price of 93.6 % of nominal becomes 0.936 (after converting into EUR).
 */
export interface MarketPrice {
  isin: string
  price: number
  source: PriceOrigin
  fetchedAt: string
  venue?: string
}

export type MarketPrices = Record<string, MarketPrice>

/** Each Account's share of the Household's Freistellungsauftrag, per tax year, in EUR. */
export type AllowanceSplits = Record<string, Record<AccountId, number>>

/** Everything the app keeps on a device. */
export interface StoredState {
  accounts: AccountRegistration[]
  histories: Histories
  allowanceSplits: AllowanceSplits
  marketPrices: MarketPrices
}
