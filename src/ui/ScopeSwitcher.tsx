import type { AccountRegistration, Scope } from '../domain'

export function ScopeSwitcher({ scope, accounts, onChange }: { scope: Scope; accounts: AccountRegistration[]; onChange: (scope: Scope) => void }) {
  const options = [{ id: 'household', label: 'Household' }, ...accounts.map((a) => ({ id: a.id, label: a.holderName }))]
  return (
    <div className="row" role="tablist" aria-label="View">
      {options.map((o) => (
        <button key={o.id} className={scope === o.id ? 'active' : ''} aria-pressed={scope === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
