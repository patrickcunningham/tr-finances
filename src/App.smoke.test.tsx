// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { accountA, accountB, bothHistories } from './domain/testSupport'
import { openHistoryStore } from './storage/historyStore'

// jsdom has no canvas, so charts render as placeholders. Their options are still built by each tab.
vi.mock('./ui/Chart', () => ({ Chart: () => <div data-testid="chart" /> }))

afterEach(cleanup)

const TABS = ['Overview', 'Transactions', 'Portfolio', 'Income', 'Cashflow', 'Tax', 'Accounts']

describe('the app, with both synthetic Accounts imported', () => {
  it('renders every tab in the Household view and in each Account’s view without errors', async () => {
    const store = await openHistoryStore()
    await store.save({ accounts: [accountA, accountB], histories: bothHistories(), allowanceSplits: {}, marketPrices: {} })
    const errors = vi.spyOn(console, 'error')

    render(<App />)
    await screen.findByRole('tab', { name: 'Overview' })

    for (const scope of ['Household', 'Alex Example', 'Sam Example']) {
      fireEvent.click(screen.getByRole('button', { name: scope }))
      for (const tab of TABS) {
        fireEvent.click(screen.getByRole('tab', { name: tab }))
        expect(screen.getByRole('tab', { name: tab, selected: true })).toBeTruthy()
      }
    }

    fireEvent.click(screen.getByRole('button', { name: 'Household' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Transactions' }))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(26)
    expect(errors).not.toHaveBeenCalled()
  })
})
