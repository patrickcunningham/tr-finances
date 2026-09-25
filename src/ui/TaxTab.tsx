import type { AccountRegistration, AccountTaxYear, Dashboard } from '../domain'
import { money } from './format'

interface Props {
  dashboard: Dashboard
  accounts: AccountRegistration[]
  year: string
  onYearChange: (year: string) => void
  onAllowanceChange: (year: string, accountId: string, amount: number) => void
}

const ROWS: { label: string; pick: (a: AccountTaxYear) => number; note?: string }[] = [
  { label: 'Payouts', pick: (a) => a.payouts },
  { label: 'Interest on cash', pick: (a) => a.interest },
  { label: 'Coupons', pick: (a) => a.coupons },
  { label: 'Share gains', pick: (a) => a.shareGains },
  { label: 'Share losses', pick: (a) => -a.shareLosses },
  { label: 'Other gains', pick: (a) => a.otherGains },
  { label: 'Other losses', pick: (a) => -a.otherLosses },
  { label: 'Accrued Interest paid', pick: (a) => -a.accruedInterestPaid, note: 'negative capital income' },
  { label: 'Accrued Interest received', pick: (a) => a.accruedInterestReceived, note: 'on bond sales' },
  { label: 'Share Loss Pot carried in', pick: (a) => a.sharePotCarriedIn },
  { label: 'General Loss Pot carried in', pick: (a) => a.generalPotCarriedIn },
  { label: 'Taxable income after Loss Pots', pick: (a) => a.taxableIncome },
  { label: 'Share Loss Pot carried out', pick: (a) => a.sharePotCarriedOut },
  { label: 'General Loss Pot carried out', pick: (a) => a.generalPotCarriedOut },
  { label: 'Withheld Tax on Vorabpauschale', pick: (a) => a.vorabpauschaleTax },
  { label: 'Withheld Tax from other Tax Events', pick: (a) => a.otherTaxEventsTax, note: 'tax optimisations and corrections' },
  { label: 'Withheld Tax (Trade Republic, authoritative)', pick: (a) => a.withheldTax },
  { label: 'Estimated tax (cross-check only)', pick: (a) => -a.estimatedTax, note: 'flat 26.375 %, no church tax or Teilfreistellung' },
]

export function TaxTab({ dashboard, accounts, year, onYearChange, onAllowanceChange }: Props) {
  const { tax } = dashboard
  const holder = (id: string) => accounts.find((a) => a.id === id)?.holderName ?? id
  const years = tax.years.includes(year) ? tax.years : [year, ...tax.years]
  const usedShare = tax.household.allowance ? Math.min(1, tax.household.allowanceUsed / tax.household.allowance) : 0

  return (
    <>
      <div className="warning">
        This is a helper for Anlage KAP, not an official tax certificate. Rely on Trade Republic's annual tax statement (Jahressteuerbescheinigung). Trade
        Republic's Withheld Tax is authoritative; the app's own figures are estimates. The Vorabpauschale base amount isn't in the export, so only its tax is
        shown, and fund Teilfreistellung isn't applied.
      </div>
      <div className="card row">
        <label>
          Tax year{' '}
          <select value={year} onChange={(e) => onYearChange(e.target.value)}>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="card">
        <h2>Freistellungsauftrag {year}</h2>
        <p className="muted">
          Household (both Accounts): {money(tax.household.allowanceUsed)} used of {money(tax.household.allowance)} jointly assessed allowance.
        </p>
        <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${usedShare * 100}%`, height: '100%', background: 'var(--accent)' }} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th className="num">Share of allowance</th>
                <th className="num">Used</th>
                <th className="num">Left</th>
              </tr>
            </thead>
            <tbody>
              {tax.accounts.map((a) => (
                <tr key={a.accountId}>
                  <td>{holder(a.accountId)}</td>
                  <td className="num">
                    <input
                      aria-label={`Allowance for ${holder(a.accountId)}`}
                      type="number"
                      min={0}
                      step={1}
                      style={{ width: 100 }}
                      defaultValue={a.allowance}
                      key={`${year}:${a.allowance}`}
                      onBlur={(e) => {
                        const amount = Number(e.target.value)
                        if (Number.isFinite(amount) && amount >= 0 && amount !== a.allowance) onAllowanceChange(year, a.accountId, amount)
                      }}
                    />
                    {a.allowanceIsDefault && <div className="muted">even split, not set yet</div>}
                  </td>
                  <td className="num">{money(a.allowanceUsed)}</td>
                  <td className="num">{money(Math.max(0, a.allowance - a.allowanceUsed))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Yearly summary {year}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                {tax.accounts.map((a) => (
                  <th key={a.accountId} className="num">
                    {holder(a.accountId)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td>
                    {row.label}
                    {row.note && <div className="muted">{row.note}</div>}
                  </td>
                  {tax.accounts.map((a) => (
                    <td key={a.accountId} className="num">
                      {money(row.pick(a))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
