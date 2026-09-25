import type { Dashboard } from '../domain'
import { Chart, euroAxis } from './Chart'
import { money, signClass } from './format'

const Tile = ({ label, value, signed }: { label: string; value: number | null; signed?: boolean }) => (
  <div className="tile">
    <div className="label">{label}</div>
    <div className={`value ${signed && value != null ? signClass(value) : ''}`}>{money(value)}</div>
  </div>
)

export function OverviewTab({ dashboard }: { dashboard: Dashboard }) {
  const { headline, overview } = dashboard
  const months = overview.months.map((m) => m.month)
  const bar = (name: string, values: number[], stack?: string) => ({ name, type: 'bar', stack, data: values })

  return (
    <>
      <div className="tiles">
        <Tile label="Cash balance" value={headline.cashBalance} />
        <Tile label="Portfolio value" value={headline.portfolioValue} />
        <Tile label="Unrealised Gain" value={headline.unrealisedGain} signed />
        <Tile label="Invested Capital" value={headline.investedCapital} />
        <Tile label="Net Contributions" value={headline.netContributions} />
        <Tile label="Realised Gain in period" value={headline.realisedGain} signed />
        <Tile label="Deposits in period" value={headline.deposits} />
        <Tile label="Withdrawals in period" value={headline.withdrawals} />
      </div>
      <div className="grid">
        <div className="card">
          <h2>Monthly cashflow</h2>
          <Chart
            option={{
              grid: { left: 70, right: 16, top: 40, bottom: 30 },
              xAxis: { type: 'category', data: months },
              yAxis: euroAxis,
              series: [
                bar('Deposits', overview.months.map((m) => m.deposits), 'in'),
                bar('Sold', overview.months.map((m) => m.sold), 'in'),
                bar('Income', overview.months.map((m) => m.income), 'in'),
                bar('Bought', overview.months.map((m) => -m.bought), 'out'),
                bar('Withdrawals', overview.months.map((m) => -m.withdrawals), 'out'),
              ],
            }}
          />
        </div>
        <div className="card">
          <h2>Balances over time</h2>
          <Chart
            option={{
              grid: { left: 70, right: 16, top: 40, bottom: 30 },
              xAxis: { type: 'time' },
              yAxis: euroAxis,
              series: [
                { name: 'Cash balance', type: 'line', step: 'end', showSymbol: false, data: overview.balances.map((p) => [p.date, p.cash]) },
                { name: 'Net Contributions', type: 'line', step: 'end', showSymbol: false, data: overview.balances.map((p) => [p.date, p.netContributions]) },
                { name: 'Invested Capital', type: 'line', step: 'end', showSymbol: false, data: overview.balances.map((p) => [p.date, p.investedCapital]) },
              ],
            }}
          />
        </div>
        <div className="card">
          <h2>Asset classes</h2>
          {dashboard.portfolio.unpricedIsins.length > 0 && <p className="muted">Unpriced Positions are shown at Invested Capital.</p>}
          <Chart
            option={{
              tooltip: { trigger: 'item', confine: true },
              series: [
                {
                  type: 'pie',
                  radius: ['45%', '70%'],
                  data: dashboard.portfolio.assetClasses.map((a) => ({ name: a.assetClass, value: a.value })),
                  label: { formatter: '{b}: {d}%' },
                },
              ],
            }}
          />
        </div>
        <div className="card">
          <h2>Buys per month</h2>
          <Chart
            option={{
              grid: { left: 70, right: 16, top: 40, bottom: 30 },
              xAxis: { type: 'category', data: months },
              yAxis: euroAxis,
              series: [
                bar('Savings Plan Buys', overview.months.map((m) => m.savingsPlanBuys), 'buys'),
                bar('One-off buys', overview.months.map((m) => m.oneOffBuys), 'buys'),
              ],
            }}
          />
        </div>
      </div>
    </>
  )
}
