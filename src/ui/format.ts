const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })
export const money = (value: number | null | undefined) => (value == null ? '–' : eur.format(value))
export const signClass = (value: number) => (value < 0 ? 'neg' : value > 0 ? 'pos' : '')
export const quantity = (value: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 6 }).format(value)

export const KIND_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  trade: 'Trade',
  savingsPlanBuy: 'Savings Plan Buy',
  payout: 'Payout',
  interest: 'Interest',
  coupon: 'Coupon',
  taxEvent: 'Tax Event',
  corporateAction: 'Corporate Action',
  unclassified: 'Unclassified',
}
