import { useState } from 'react'
import type { AccountRegistration, Dashboard, PositionView } from '../domain'
import { age } from './age'
import { Chart, euroAxis } from './Chart'
import { money, quantity, signClass } from './format'

interface Props {
  dashboard: Dashboard
  accounts: AccountRegistration[]
  showAccount: boolean
  onRefreshPrices: (positions: PositionView[]) => void
  refreshing: boolean
  failedIsins: string[]
  onManualPrice: (isin: string, price: number) => void
}

const unitPrice = (p: PositionView, value: number) => (p.assetClass === 'BOND' ? `${(value * 100).toFixed(2)} %` : money(value))

function ManualPrice({ position, onSave }: { position: PositionView; onSave: (price: number) => void }) {
  const [text, setText] = useState('')
  const bond = position.assetClass === 'BOND'
  return (
    <span className="row" style={{ flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
      <input
        aria-label={`Price for ${position.name}`}
        inputMode="decimal"
        placeholder={bond ? '% of nominal, in EUR' : 'EUR'}
        style={{ width: 110 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={() => {
          const value = Number(text.replace(',', '.'))
          if (value > 0) onSave(bond ? value / 100 : value)
          setText('')
        }}
      >
        Set
      </button>
    </span>
  )
}

export function PortfolioTab({ dashboard, accounts, showAccount, onRefreshPrices, refreshing, failedIsins, onManualPrice }: Props) {
  const { positions, realisedSales } = dashboard.portfolio
  const holder = (id: string) => accounts.find((a) => a.id === id)?.holderName ?? id
  let running = 0
  const cumulative = [...realisedSales].reverse().map((s) => [s.date, (running = Math.round((running + s.realisedGain) * 100) / 100)])

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Open Positions</h2>
          <button className="primary" disabled={refreshing || positions.length === 0} onClick={() => onRefreshPrices(positions)}>
            {refreshing ? 'Refreshing…' : 'Refresh Market Prices'}
          </button>
        </div>
        {failedIsins.length > 0 && (
          <div className="warning">
            No source had a price for {failedIsins.join(', ')}. The last known price is kept where there is one, or you can enter one by hand.
          </div>
        )}
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
                <th className="num">Market Price</th>
                <th className="num">Value</th>
                <th className="num">Unrealised Gain</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.isin}>
                  <td>{p.name}</td>
                  <td>{p.isin}</td>
                  <td>{p.assetClass}</td>
                  <td className="num">{quantity(p.quantity)}</td>
                  <td className="num">{unitPrice(p, p.averageCost)}</td>
                  <td className="num">{money(p.investedCapital)}</td>
                  <td className="num">
                    {p.marketPrice ? (
                      <>
                        {unitPrice(p, p.marketPrice.price)}
                        <div className="muted">
                          {p.marketPrice.source === 'manual' ? 'entered by hand' : p.marketPrice.venue ?? p.marketPrice.source} · {age(p.marketPrice.fetchedAt)}
                        </div>
                      </>
                    ) : (
                      <ManualPrice position={p} onSave={(price) => onManualPrice(p.isin, price)} />
                    )}
                  </td>
                  <td className="num">{money(p.marketValue)}</td>
                  <td className={`num ${p.unrealisedGain != null ? signClass(p.unrealisedGain) : ''}`}>{money(p.unrealisedGain)}</td>
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
