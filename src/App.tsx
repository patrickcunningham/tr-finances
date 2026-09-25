import { useMemo, useState } from 'react'
import { buildDashboard, type DateRange, type Scope, type TransactionFilter } from './domain'
import { AccountsPanel } from './ui/AccountsPanel'
import { DateFilter } from './ui/DateFilter'
import { money } from './ui/format'
import { ScopeSwitcher } from './ui/ScopeSwitcher'
import { TransactionsTab } from './ui/TransactionsTab'
import { useStoredState } from './ui/useStoredState'
import { Warnings } from './ui/Warnings'

const today = () => new Date().toISOString().slice(0, 10)

const TABS = ['Overview', 'Transactions', 'Portfolio', 'Income', 'Cashflow', 'Tax', 'Accounts'] as const
type Tab = (typeof TABS)[number]

export default function App() {
  const { state, update, loaded, storageError } = useStoredState()
  const [chosenScope, setScope] = useState<Scope>('household')
  const [tab, setTab] = useState<Tab>('Overview')
  const [range, setRange] = useState<DateRange>({ kind: 'all' })
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>({})
  // Fall back to the Household if the chosen Account has been removed.
  const scope = chosenScope === 'household' || state.accounts.some((a) => a.id === chosenScope) ? chosenScope : 'household'

  const dashboard = useMemo(
    () =>
      buildDashboard({
        accounts: state.accounts,
        histories: state.histories,
        marketPrices: state.marketPrices,
        allowanceSplits: state.allowanceSplits,
        options: { scope, range, today: today(), transactionFilter },
      }),
    [state, scope, range, transactionFilter],
  )
  if (!loaded) return null
  const hasData = Object.keys(state.histories).length > 0
  const activeTab: Tab = hasData ? tab : 'Accounts'

  return (
    <>
      <div className="header">
        <h1>TR Finances</h1>
        <ScopeSwitcher scope={scope} accounts={state.accounts} onChange={setScope} />
      </div>
      {storageError && <div className="warning">{storageError}</div>}
      <Warnings warnings={dashboard.warnings} accounts={state.accounts} />
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={activeTab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {activeTab !== 'Accounts' && activeTab !== 'Tax' && (
        <div className="card">
          <DateFilter range={range} onChange={setRange} />
        </div>
      )}
      {activeTab === 'Accounts' && <AccountsPanel state={state} summaries={dashboard.accountSummaries} update={update} />}
      {activeTab === 'Overview' && (
        <div className="tiles">
          <div className="tile">
            <div className="label">Cash balance</div>
            <div className="value">{money(dashboard.headline.cashBalance)}</div>
          </div>
          <div className="tile">
            <div className="label">Net Contributions</div>
            <div className="value">{money(dashboard.headline.netContributions)}</div>
          </div>
        </div>
      )}
      {activeTab === 'Transactions' && (
        <TransactionsTab
          transactions={dashboard.transactions}
          accounts={state.accounts}
          showAccount={scope === 'household'}
          filter={transactionFilter}
          onFilterChange={setTransactionFilter}
          onReset={() => {
            setTransactionFilter({})
            setRange({ kind: 'all' })
          }}
        />
      )}
    </>
  )
}
