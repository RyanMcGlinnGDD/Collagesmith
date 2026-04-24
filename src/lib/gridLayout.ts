export interface GridLayout {
  cols: number
  rows: number
}

export function gridLayout(n: number): GridLayout {
  if (n === 0) return { cols: 0, rows: 0 }
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return { cols, rows }
}
