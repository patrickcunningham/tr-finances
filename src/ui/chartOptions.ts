export const SERIES_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777']

export const euroAxis = { type: 'value', axisLabel: { formatter: (v: number) => `€${Math.round(v).toLocaleString('en-IE')}` } }

/** Running totals, rounded to cents. */
export const cumulative = (values: number[]): number[] =>
  values.reduce<number[]>((totals, v) => [...totals, Math.round(((totals.at(-1) ?? 0) + v) * 100) / 100], [])
