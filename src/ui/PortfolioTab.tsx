import type { AccountRegistration, Dashboard } from '../domain'
import { Chart, euroAxis } from './Chart'
import { money, quantity, signClass } from './format'

interface Props {
  dashboard: Dashboard
  accounts: AccountRegistration[]
  showAccount: boolean
}

export function PortfolioTab({ dashboard, accounts, showAccount }: Props) {
  const { positions, realisedSales } = dashboard.portfolio
  const holder = (id: string) => accounts.find((a) => a.id === id)?.holderName ?? id
  let running = 0
  const cumulative = [...realisedSales].reverse().map((s) => [s.date, (running = Math.round((running + s.realisedGain) * 100) / 100)])

  return (
    <>
      <div className="card">
        <h2>Open Positions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ISIN</th>
                <th>Asset class</th>
                <th className="num">Quantity</th>
                <th className="num">FIFO average cost</th>
                <th className="num">Invested Capital</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.isin}>
                  <td>{p.name}</td>
                  <td>{p.isin}</td>
                  <td>{p.assetClass}</td>
                  <td className="num">{quantity(p.quantity)}</td>
                  <td className="num">{p.assetClass === 'BOND' ? `${(p.averageCost * 100).toFixed(2)} %` : money(p.averageCost)}</td>
                  <td className="num">{money(p.investedCapital)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Realised Gain over time</h2>
        <Chart
          option={{
            grid: { left: 70, right: 16, top: 40, bottom: 30 },
            xAxis: { type: 'time' },
            yAxis: euroAxis,
            series: [{ name: 'Cumulative Realised Gain', type: 'line', step: 'end', data: cumulative }],
          }}
        />
      </div>
      <div className="card">
        <h2>Realised sales</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {showAccount && <th>Account</th>}
                <th>Name</th>
                <th>ISIN</th>
                <th className="num">Quantity</th>
                <th className="num">FIFO cost</th>
                <th className="num">Proceeds</th>
                <th className="num">Realised Gain</th>
              </tr>
            </thead>
            <tbody>
              {realisedSales.map((s, i) => (
                <tr key={i}>
                  <td>{s.date}</td>
                  {showAccount && <td>{holder(s.accountId)}</td>}
                  <td>{s.name}</td>
                  <td>{s.isin}</td>
                  <td className="num">{quantity(s.quantity)}</td>
                  <td className="num">{money(s.cost)}</td>
                  <td className="num">{money(s.proceeds)}</td>
                  <td className={`num ${signClass(s.realisedGain)}`}>{money(s.realisedGain)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
