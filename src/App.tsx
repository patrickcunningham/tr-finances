import { useMemo } from 'react'
import { buildDashboard } from './domain'
import { AccountsPanel } from './ui/AccountsPanel'
import { money } from './ui/format'
import { TransactionsTab } from './ui/TransactionsTab'
import { useStoredState } from './ui/useStoredState'

const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const { state, update, loaded, storageError } = useStoredState()
  const dashboard = useMemo(
    () =>
      buildDashboard({
        accounts: state.accounts,
        histories: state.histories,
        marketPrices: state.marketPrices,
        allowanceSplits: state.allowanceSplits,
        options: { scope: 'household', range: { kind: 'all' }, today: today() },
      }),
    [state],
  )
  if (!loaded) return null

  return (
    <>
      <div className="header">
        <h1>TR Finances</h1>
      </div>
      {storageError && <div className="warning">{storageError}</div>}
      <AccountsPanel state={state} update={update} />
      <div className="tiles">
        <div className="tile">
          <div className="label">Cash balance</div>
          <div className="value">{money(dashboard.headline.cashBalance)}</div>
        </div>
      </div>
      <TransactionsTab transactions={dashboard.transactions} accounts={state.accounts} showAccount />
    </>
  )
}
