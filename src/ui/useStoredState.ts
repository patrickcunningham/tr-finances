import { useCallback, useEffect, useState } from 'react'
import type { StoredState } from '../domain'
import { openHistoryStore, type HistoryStore } from '../storage/historyStore'

const EMPTY: StoredState = { accounts: [], histories: {}, allowanceSplits: {}, marketPrices: {} }

/** Loads StoredState from the device and writes every change back. Keeps working in memory if storage fails. */
export function useStoredState() {
  const [state, setState] = useState<StoredState>(EMPTY)
  const [store, setStore] = useState<HistoryStore | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    openHistoryStore()
      .then(async (s) => {
        setStore(s)
        setState(await s.load())
      })
      .catch(() => setStorageError("This browser won't let the app save data, so imports will be lost when you close it."))
      .finally(() => setLoaded(true))
  }, [])

  const update = useCallback(
    (change: (current: StoredState) => StoredState) => {
      setState((current) => {
        const next = change(current)
        store?.save(next).catch(() => setStorageError("Couldn't save to this device. Your latest change will be lost when you close the app."))
        return next
      })
    },
    [store],
  )

  return { state, update, loaded, storageError }
}
