import { useState } from 'react'
import type { AccountRegistration, TransactionFilter, TransactionKind, TransactionView } from '../domain'
import { KIND_LABELS, money, signClass } from './format'

const PAGE_SIZE = 50

interface Props {
  transactions: TransactionView[]
  accounts: AccountRegistration[]
  showAccount: boolean
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  onReset: () => void
}

export function TransactionsTab({ transactions, accounts, showAccount, filter, onFilterChange, onReset }: Props) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = transactions.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const holder = (id: string) => accounts.find((a) => a.id === id)?.holderName ?? id

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12 }}>
        <select
          aria-label="Transaction kind"
          value={filter.kinds?.[0] ?? ''}
          onChange={(e) => {
            setPage(0)
            onFilterChange({ ...filter, kinds: e.target.value ? [e.target.value as TransactionKind] : undefined })
          }}
        >
          <option value="">All kinds</option>
          {Object.entries(KIND_LABELS).map(([kind, label]) => (
            <option key={kind} value={kind}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search name, ISIN, description"
          value={filter.search ?? ''}
          onChange={(e) => {
            setPage(0)
            onFilterChange({ ...filter, search: e.target.value })
          }}
        />
        <button onClick={onReset}>Reset filters</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              {showAccount && <th>Account</th>}
              <th>Kind</th>
              <th>Name</th>
              <th>ISIN</th>
              <th className="num">Amount</th>
              <th className="num">Fee</th>
              <th className="num">Withheld Tax</th>
              <th className="num">Cash Effect</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={`${t.accountId}:${t.id}`}>
                <td>{t.date}</td>
                {showAccount && <td>{holder(t.accountId)}</td>}
                <td>{KIND_LABELS[t.kind]}</td>
                <td>{t.name}</td>
                <td>{t.isin}</td>
                <td className="num">{money(t.amount)}</td>
                <td className="num">{t.fee ? money(t.fee) : ''}</td>
                <td className="num">{t.withheldTax ? money(t.withheldTax) : ''}</td>
                <td className={`num ${signClass(t.cashEffect)}`}>{money(t.cashEffect)}</td>
                <td className="muted">
                  {t.description}
                  {t.originalCurrency && ` (${t.originalAmount} ${t.originalCurrency} @ ${t.fxRate})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={current === 0} onClick={() => setPage(current - 1)}>
          Previous
        </button>
        <span className="muted">
          Page {current + 1} of {pages} · {transactions.length} Transactions
        </span>
        <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
