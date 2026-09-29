const num = new Intl.NumberFormat('en-US')

export const fmtInt = (n: number) => num.format(n)

export function fmtDate(ms: number) {
  const d = new Date(ms)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}
