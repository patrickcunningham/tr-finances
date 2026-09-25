import type { Entry } from './entries'
import { FifoLedger } from './fifo'
import { Decimal, ZERO, euros, sum } from './money'
import type { AccountId, AllowanceSplits } from './types'

/** Kapitalertragsteuer 25 % plus 5.5 % Solidaritätszuschlag on it. Church tax is ignored. */
const FLAT_TAX_RATE = new Decimal('0.26375')
const VORABPAUSCHALE_TYPES = new Set(['EARNINGS', 'PRE_DETERMINED_TAX_BASE'])

/** The joint (married) Sparerpauschbetrag behind the Freistellungsauftrag. */
export const jointAllowance = (year: string) => (Number(year) >= 2023 ? 2000 : 1602)

export interface AccountTaxYear {
  accountId: AccountId
  payouts: number
  interest: number
  coupons: number
  shareGains: number
  shareLosses: number
  otherGains: number
  otherLosses: number
  /** Paid on bond purchases; negative capital income in the year it was paid. */
  accruedInterestPaid: number
  vorabpauschaleTax: number
  /** Everything Trade Republic withheld (negative) or refunded (positive) in the year. Authoritative. */
  withheldTax: number
  sharePotCarriedIn: number
  generalPotCarriedIn: number
  sharePotCarriedOut: number
  generalPotCarriedOut: number
  /** After Loss Pots, before the Freistellungsauftrag. */
  taxableIncome: number
  allowance: number
  /** True when no split has been set for the year and the joint allowance is shared evenly. */
  allowanceIsDefault: boolean
  allowanceUsed: number
  /** The app's own cross-check at the flat rate. Not authoritative. */
  estimatedTax: number
}

export interface TaxView {
  years: string[]
  accounts: AccountTaxYear[]
  household: { allowance: number; allowanceUsed: number; withheldTax: number; estimatedTax: number }
}

interface YearFigures {
  payouts: Decimal
  interest: Decimal
  coupons: Decimal
  shareGains: Decimal
  shareLosses: Decimal
  otherGains: Decimal
  otherLosses: Decimal
  accrued: Decimal
  vorabpauschaleTax: Decimal
  withheldTax: Decimal
}

function figuresFor(own: Entry[], ledger: FifoLedger, accountId: AccountId, year: string): YearFigures {
  const inYear = own.filter((e) => e.date.startsWith(year))
  const amountOf = (kind: Entry['kind']) => sum(inYear.filter((e) => e.kind === kind).map((e) => e.amount))
  const sales = ledger.sales.filter((s) => s.entry.accountId === accountId && s.entry.date.startsWith(year))
  const gains = (share: boolean, sign: 1 | -1) =>
    sum(sales.filter((s) => (s.entry.assetClass === 'STOCK') === share && s.realisedGain.times(sign).greaterThan(0)).map((s) => s.realisedGain.abs()))
  return {
    payouts: amountOf('payout'),
    interest: amountOf('interest'),
    coupons: amountOf('coupon'),
    shareGains: gains(true, 1),
    shareLosses: gains(true, -1),
    otherGains: gains(false, 1),
    otherLosses: gains(false, -1),
    accrued: sum(ledger.accruedInterest.filter((a) => a.entry.accountId === accountId && a.entry.date.startsWith(year)).map((a) => a.amount)),
    vorabpauschaleTax: sum(inYear.filter((e) => VORABPAUSCHALE_TYPES.has(e.type)).map((e) => e.tax)),
    withheldTax: sum(inYear.map((e) => e.tax)),
  }
}

/**
 * Share losses go in the share pot and only offset share gains. Every other loss, and Accrued Interest paid,
 * goes in the general pot, which offsets any capital income including share gains. Both pots carry forward.
 */
function applyLossPots(f: YearFigures, sharePotIn: Decimal, generalPotIn: Decimal) {
  let shareResult = f.shareGains.minus(f.shareLosses).minus(sharePotIn)
  const sharePotOut = shareResult.lessThan(0) ? shareResult.negated() : ZERO
  shareResult = Decimal.max(shareResult, ZERO)

  const generalResult = f.payouts.plus(f.interest).plus(f.coupons).plus(f.otherGains).minus(f.otherLosses).minus(f.accrued).minus(generalPotIn)
  let generalPotOut = ZERO
  if (generalResult.lessThan(0)) {
    const offset = Decimal.min(generalResult.negated(), shareResult)
    shareResult = shareResult.minus(offset)
    generalPotOut = generalResult.negated().minus(offset)
  }
  return { sharePotOut, generalPotOut, taxable: shareResult.plus(Decimal.max(generalResult, ZERO)) }
}

export function taxOf(scoped: Entry[], accountIds: AccountId[], allAccountIds: AccountId[], year: string, splits: AllowanceSplits): TaxView {
  const ledger = new FifoLedger()
  scoped.forEach((e) => ledger.apply(e))
  const years = [...new Set(scoped.map((e) => e.date.slice(0, 4)))].sort().reverse()
  const joint = jointAllowance(year)
  const split = splits[year]

  const accounts = accountIds.map((accountId): AccountTaxYear => {
    const own = scoped.filter((e) => e.accountId === accountId)
    let sharePot = ZERO
    let generalPot = ZERO
    // Run the pots forward through every earlier year so this year starts with what was carried in.
    const earlier = [...new Set(own.map((e) => e.date.slice(0, 4)))].filter((y) => y < year).sort()
    for (const y of earlier) {
      const pots = applyLossPots(figuresFor(own, ledger, accountId, y), sharePot, generalPot)
      sharePot = pots.sharePotOut
      generalPot = pots.generalPotOut
    }
    const f = figuresFor(own, ledger, accountId, year)
    const pots = applyLossPots(f, sharePot, generalPot)
    const allowance = split?.[accountId] ?? joint / Math.max(allAccountIds.length, 1)
    const allowanceUsed = Decimal.min(pots.taxable, allowance)
    return {
      accountId,
      payouts: euros(f.payouts),
      interest: euros(f.interest),
      coupons: euros(f.coupons),
      shareGains: euros(f.shareGains),
      shareLosses: euros(f.shareLosses),
      otherGains: euros(f.otherGains),
      otherLosses: euros(f.otherLosses),
      accruedInterestPaid: euros(f.accrued),
      vorabpauschaleTax: euros(f.vorabpauschaleTax),
      withheldTax: euros(f.withheldTax),
      sharePotCarriedIn: euros(sharePot),
      generalPotCarriedIn: euros(generalPot),
      sharePotCarriedOut: euros(pots.sharePotOut),
      generalPotCarriedOut: euros(pots.generalPotOut),
      taxableIncome: euros(pots.taxable),
      allowance,
      allowanceIsDefault: split?.[accountId] === undefined,
      allowanceUsed: euros(allowanceUsed),
      estimatedTax: euros(pots.taxable.minus(allowanceUsed).times(FLAT_TAX_RATE)),
    }
  })

  const total = (pick: (a: AccountTaxYear) => number) => Math.round(accounts.reduce((t, a) => t + pick(a), 0) * 100) / 100
  return {
    years,
    accounts,
    household: { allowance: joint, allowanceUsed: total((a) => a.allowanceUsed), withheldTax: total((a) => a.withheldTax), estimatedTax: total((a) => a.estimatedTax) },
  }
}
