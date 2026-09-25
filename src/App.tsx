import { useMemo, useState } from 'react'
import { buildDashboard, type Scope } from './domain'
import { AccountsPanel } from './ui/AccountsPanel'
import { money } from './ui/format'
import { ScopeSwitcher } from './ui/ScopeSwitcher'
import { TransactionsTab } from './ui/TransactionsTab'
import { useStoredState } from './ui/useStoredState'
import { Warnings } from './ui/Warnings'

const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const { state, update, loaded, storageError } = useStoredState()
  const [chosenScope, setScope] = useState<Scope>('household')
  // Fall back to the Household if the chosen Account has been removed.
  const scope = chosenScope === 'household' || state.accounts.some((a) => a.id === chosenScope) ? chosenScope : 'household'
  const dashboard = useMemo(
    () =>
      buildDashboard({
        accounts: state.accounts,
        histories: state.histories,
        marketPrices: state.marketPrices,
        allowanceSplits: state.allowanceSplits,
        options: { scope, range: { kind: 'all' }, today: today() },
      }),
    [state, scope],
  )
  if (!loaded) return null

  return (
    <>
      <div className="header">
        <h1>TR Finances</h1>
        <ScopeSwitcher scope={scope} accounts={state.accounts} onChange={setScope} />
      </div>
      {storageError && <div className="warning">{storageError}</div>}
      <Warnings warnings={dashboard.warnings} accounts={state.accounts} />
      <AccountsPanel state={state} summaries={dashboard.accountSummaries} update={update} />
      <div className="tiles">
        <div className="tile">
          <div className="label">Cash balance</div>
          <div className="value">{money(dashboard.headline.cashBalance)}</div>
        </div>
      </div>
      <TransactionsTab transactions={dashboard.transactions} accounts={state.accounts} showAccount={scope === 'household'} />
    </>
  )
}
