import { openDB } from 'idb'
import type { StoredState } from '../domain'

export interface HistoryStore {
  load(): Promise<StoredState>
  save(state: StoredState): Promise<void>
}

const EMPTY: StoredState = { accounts: [], histories: {}, allowanceSplits: {}, marketPrices: {} }
const KEY = 'state'

/** Keeps the whole StoredState as one IndexedDB record. It is small (thousands of rows at most). */
export async function openHistoryStore(dbName = 'tr-finances'): Promise<HistoryStore> {
  const db = await openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore('state')
    },
  })
  return {
    async load() {
      const stored = (await db.get('state', KEY)) as Partial<StoredState> | undefined
      return { ...EMPTY, ...stored }
    },
    async save(state) {
      await db.put('state', state, KEY)
    },
  }
}
