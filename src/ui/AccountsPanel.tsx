import { useState } from 'react'
import { importTransactionExport, type StoredState } from '../domain'

interface Props {
  state: StoredState
  update: (change: (current: StoredState) => StoredState) => void
}

export function AccountsPanel({ state, update }: Props) {
  const [holderName, setHolderName] = useState('')
  const [iban, setIban] = useState('')
  const [target, setTarget] = useState('')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const targetId = target || state.accounts[0]?.id || ''

  const addAccount = () => {
    const cleanIban = iban.replace(/\s+/g, '').toUpperCase()
    if (!holderName.trim() || !cleanIban) return
    const id = crypto.randomUUID()
    update((s) => ({ ...s, accounts: [...s.accounts, { id, holderName: holderName.trim(), iban: cleanIban }] }))
    setHolderName('')
    setIban('')
    setTarget(id)
  }

  const importFile = async (file: File) => {
    const text = await file.text()
    const outcome = importTransactionExport(text, targetId, state.histories, new Date().toISOString())
    if (!outcome.ok) {
      setMessage({ text: outcome.error, error: true })
      return
    }
    update((s) => ({ ...s, histories: outcome.histories }))
    setMessage({ text: `Imported ${file.name}: ${outcome.added} new Transactions, ${outcome.skipped} already known.` })
  }

  return (
    <div className="card">
      <h2>Accounts</h2>
      {state.accounts.map((a) => (
        <div key={a.id} className="row muted">
          <strong>{a.holderName}</strong> <span>{a.iban}</span>
        </div>
      ))}
      <div className="row" style={{ marginTop: 12 }}>
        <input placeholder="Holder name" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        <input placeholder="Trade Republic IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
        <button onClick={addAccount}>Add Account</button>
      </div>
      {state.accounts.length > 0 && (
        <div className="row" style={{ marginTop: 12 }}>
          <label>
            Import a Transaction Export into{' '}
            <select value={targetId} onChange={(e) => setTarget(e.target.value)}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.holderName}
                </option>
              ))}
            </select>
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importFile(file)
              e.target.value = ''
            }}
          />
        </div>
      )}
      {message && <p className={message.error ? 'error' : 'muted'}>{message.text}</p>}
    </div>
  )
}
