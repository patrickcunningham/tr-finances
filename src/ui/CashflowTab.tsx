import type { Dashboard } from '../domain'
import { Chart } from './Chart'
import { money } from './format'

const HUB = 'Account'

export function CashflowTab({ dashboard, household }: { dashboard: Dashboard; household: boolean }) {
  const { sources, destinations } = dashboard.cashflow
  // Source and destination names can coincide ("Other"), so give each side its own node id.
  const nodes = [
    ...sources.map((f) => ({ name: `in:${f.name}`, label: f.name })),
    { name: HUB, label: household ? 'Household' : 'Account' },
    ...destinations.map((f) => ({ name: `out:${f.name}`, label: f.name })),
  ]
  const links = [
    ...sources.map((f) => ({ source: `in:${f.name}`, target: HUB, value: f.value })),
    ...destinations.map((f) => ({ source: HUB, target: `out:${f.name}`, value: f.value })),
  ]
  const labels = Object.fromEntries(nodes.map((n) => [n.name, n.label]))

  return (
    <div className="card">
      <h2>Where the money came from and went</h2>
      {household && <p className="muted">Internal Transfers between your Accounts are left out.</p>}
      {links.length === 0 ? (
        <p className="muted">No Transactions in this period.</p>
      ) : (
        <Chart
          height={Math.max(360, 36 * Math.max(sources.length, destinations.length))}
          option={{
            tooltip: {
              trigger: 'item',
              confine: true,
              formatter: (p: { dataType: string; data: { source?: string; target?: string; value: number }; name: string; value: number }) =>
                p.dataType === 'edge'
                  ? `${labels[p.data.source!]} → ${labels[p.data.target!]}: ${money(p.data.value)}`
                  : `${labels[p.name]}: ${money(p.value)}`,
            },
            series: [
              {
                type: 'sankey',
                left: 8,
                right: 120,
                nodeGap: 12,
                data: nodes.map((n) => ({ name: n.name })),
                links,
                label: { formatter: (p: { name: string }) => labels[p.name] },
                lineStyle: { color: 'gradient', opacity: 0.4 },
                emphasis: { focus: 'adjacency' },
              },
            ],
          }}
        />
      )}
    </div>
  )
}
