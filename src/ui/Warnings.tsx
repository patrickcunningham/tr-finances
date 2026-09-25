import type { AccountRegistration, DashboardWarning } from '../domain'

export function Warnings({ warnings, accounts }: { warnings: DashboardWarning[]; accounts: AccountRegistration[] }) {
  const holder = (id: string) => accounts.find((a) => a.id === id)?.holderName ?? id
  return (
    <>
      {warnings.map((w) => (
        <div key={`${w.type}:${w.accountId}`} className="warning">
          {w.type === 'unclassifiedTransactions'
            ? `${holder(w.accountId)}: ${w.count} Transactions have a type this app doesn't recognise. They're listed as Unclassified and left out of the totals by kind.`
            : `${holder(w.accountId)}: the Transaction History doesn't seem to start when the Account was opened, so balances may be wrong. Import an export covering the full history.`}
        </div>
      ))}
    </>
  )
}
