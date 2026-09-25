import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildDashboard, importTransactionExport, type AccountRegistration, type DashboardOptions, type Histories } from './index'

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`../../test/fixtures/${name}`, import.meta.url)), 'utf-8')

export const accountA: AccountRegistration = { id: 'A', holderName: 'Alex Example', iban: 'DE11000000000000000001' }
export const accountB: AccountRegistration = { id: 'B', holderName: 'Sam Example', iban: 'DE22000000000000000002' }
export const exportA = () => fixture('account-a.csv')
export const exportB = () => fixture('account-b.csv')

export const importOk = (text: string, accountId: string, histories: Histories = {}, now = '2025-06-01T00:00:00.000Z') => {
  const outcome = importTransactionExport(text, accountId, histories, now)
  if (!outcome.ok) throw new Error(`import failed: ${outcome.error}`)
  return outcome
}

export const bothHistories = (): Histories => {
  const a = importOk(exportA(), 'A')
  return importOk(exportB(), 'B', a.histories).histories
}

export const dashboardFor = (options: Partial<DashboardOptions> = {}, histories: Histories = bothHistories()) =>
  buildDashboard({
    accounts: [accountA, accountB],
    histories,
    marketPrices: {},
    allowanceSplits: {},
    options: { scope: 'household', range: { kind: 'all' }, today: '2025-06-01', ...options },
  })
