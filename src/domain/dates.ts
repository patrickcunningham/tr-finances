/** Transaction Dates are ISO calendar dates (YYYY-MM-DD); these helpers keep the string slicing in one place. */

export type DateRange =
  | { kind: 'all' }
  | { kind: 'lastDays'; days: number }
  | { kind: 'yearToDate' }
  | { kind: 'lastYear' }
  | { kind: 'custom'; from?: string; to?: string }

const BEGINNING = '0000-01-01'

export const taxYearOf = (date: string) => date.slice(0, 4)
export const monthOf = (date: string) => date.slice(0, 7)

const shiftDate = (date: string, { days = 0, years = 0 }) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Both ends inclusive. Quick ranges end today and cover exactly their stated length. */
export function resolveRange(range: DateRange, today: string): { from: string; to: string } {
  switch (range.kind) {
    case 'all':
      return { from: BEGINNING, to: today }
    case 'lastDays':
      return { from: shiftDate(today, { days: 1 - range.days }), to: today }
    case 'yearToDate':
      return { from: `${taxYearOf(today)}-01-01`, to: today }
    case 'lastYear':
      return { from: shiftDate(today, { years: -1, days: 1 }), to: today }
    case 'custom':
      return { from: range.from || BEGINNING, to: range.to || today }
  }
}

/** Every calendar month from the first date to the last, as YYYY-MM. */
export function monthsBetween(first: string | undefined, last: string | undefined): string[] {
  if (!first || !last) return []
  const months: string[] = []
  let [year, month] = monthOf(first).split('-').map(Number)
  const end = monthOf(last)
  for (;;) {
    const current = `${year}-${String(month).padStart(2, '0')}`
    months.push(current)
    if (current >= end) return months
    month = month === 12 ? 1 : month + 1
    if (month === 1) year++
  }
}
