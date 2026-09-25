import type { Dashboard, IncomeAmounts } from '../domain'
import { Chart, euroAxis } from './Chart'
import { money } from './format'

const AmountsTile = ({ label, amounts }: { label: string; amounts: IncomeAmounts }) => (
  <div className="tile">
    <div className="label">{label}</div>
    <div className="value">{money(amounts.net)}</div>
    <div className="muted">
      {money(amounts.gross)} before {money(-amounts.withheldTax)} Withheld Tax
    </div>
  </div>
)

export function IncomeTab({ dashboard }: { dashboard: Dashboard }) {
  const { totals, months, payoutsBySecurity, foreignCurrency } = dashboard.income
  const labels = months.map((m) => m.month)
  let running = 0
  const cumulativeInterest = months.map((m) => (running = Math.round((running + m.interest.net) * 100) / 100))

  return (
    <>
      <div className="tiles">
        <AmountsTile label="Payouts (after tax)" amounts={totals.payouts} />
        <AmountsTile label="Interest (after tax)" amounts={totals.interest} />
        <AmountsTile label="Coupons (after tax)" amounts={totals.coupons} />
      </div>
      <div className="grid">
        <div className="card">
          <h2>Income per month (before tax)</h2>
          <Chart
            option={{
              grid: { left: 70, right: 16, top: 40, bottom: 30 },
              xAxis: { type: 'category', data: labels },
              yAxis: euroAxis,
              series: [
                { name: 'Payouts', type: 'bar', stack: 'income', data: months.map((m) => m.payouts.gross) },
                { name: 'Interest', type: 'bar', stack: 'income', data: months.map((m) => m.interest.gross) },
                { name: 'Coupons', type: 'bar', stack: 'income', data: months.map((m) => m.coupons.gross) },
              ],
            }}
          />
        </div>
        <div className="card">
          <h2>Interest on cash</h2>
          <Chart
            option={{
              grid: { left: 70, right: 70, top: 40, bottom: 30 },
              xAxis: { type: 'category', data: labels },
              yAxis: [euroAxis, { ...euroAxis, splitLine: { show: false } }],
              series: [
                { name: 'Monthly (after tax)', type: 'bar', data: months.map((m) => m.interest.net) },
                { name: 'Cumulative (after tax)', type: 'line', yAxisIndex: 1, showSymbol: false, data: cumulativeInterest },
              ],
            }}
          />
        </div>
      </div>
      <div className="card">
        <h2>Payouts by security</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ISIN</th>
                <th className="num">Payouts</th>
                <th className="num">Before tax</th>
                <th className="num">After tax</th>
              </tr>
            </thead>
            <tbody>
              {payoutsBySecurity.map((p) => (
                <tr key={p.isin}>
                  <td>{p.name}</td>
                  <td>{p.isin}</td>
                  <td className="num">{p.count}</td>
                  <td className="num">{money(p.gross)}</td>
                  <td className="num">{money(p.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {foreignCurrency.length > 0 && (
        <div className="card">
          <h2>Received in a foreign currency</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th className="num">Original</th>
                  <th className="num">FX rate</th>
                  <th className="num">In EUR</th>
                </tr>
              </thead>
              <tbody>
                {foreignCurrency.map((f, i) => (
                  <tr key={i}>
                    <td>{f.date}</td>
                    <td>
                      {f.name} <span className="muted">{f.kind === 'coupon' ? 'Coupon' : 'Payout'}</span>
                    </td>
                    <td className="num">
                      {f.originalAmount.toFixed(2)} {f.originalCurrency}
                    </td>
                    <td className="num">{f.fxRate}</td>
                    <td className="num">{money(f.gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
