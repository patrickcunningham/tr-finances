import type { DateRange } from '../domain'

const QUICK: { label: string; range: DateRange }[] = [
  { label: '30D', range: { kind: 'lastDays', days: 30 } },
  { label: '90D', range: { kind: 'lastDays', days: 90 } },
  { label: 'YTD', range: { kind: 'yearToDate' } },
  { label: '1Y', range: { kind: 'lastYear' } },
  { label: 'All', range: { kind: 'all' } },
]

export function DateFilter({ range, onChange }: { range: DateRange; onChange: (range: DateRange) => void }) {
  const custom = range.kind === 'custom' ? range : { from: '', to: '' }
  return (
    <div className="row">
      {QUICK.map((q) => (
        <button key={q.label} className={JSON.stringify(q.range) === JSON.stringify(range) ? 'active' : ''} onClick={() => onChange(q.range)}>
          {q.label}
        </button>
      ))}
      <label className="muted">
        From <input type="date" value={custom.from ?? ''} onChange={(e) => onChange({ kind: 'custom', from: e.target.value, to: custom.to })} />
      </label>
      <label className="muted">
        To <input type="date" value={custom.to ?? ''} onChange={(e) => onChange({ kind: 'custom', from: custom.from, to: e.target.value })} />
      </label>
    </div>
  )
}
