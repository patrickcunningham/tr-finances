import Decimal from 'decimal.js'

export { Decimal }
export const ZERO = new Decimal(0)
export const dec = (value: string | undefined): Decimal => (value ? new Decimal(value) : ZERO)
export const sum = (values: Decimal[]): Decimal => values.reduce((a, b) => a.plus(b), ZERO)
/** Money leaves the domain core as a number rounded to cents. */
export const euros = (value: Decimal): number => value.toDecimalPlaces(2).toNumber() + 0 // + 0 turns -0 into 0
/** For figures already out of Decimal (sums of view numbers): rounds to cents the same way. */
export const roundCents = (value: number): number => Math.round(value * 100) / 100 + 0
