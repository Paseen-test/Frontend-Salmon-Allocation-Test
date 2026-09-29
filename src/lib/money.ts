export function roundHalfEven(value: number, decimals = 2): number {
  const f = 10 ** decimals
  const x = +(value * f).toFixed(8)
  const floor = Math.floor(x)
  const diff = x - floor
  let r: number
  if (Math.abs(diff - 0.5) < 1e-8) r = floor % 2 === 0 ? floor : floor + 1
  else r = Math.round(x)
  return r / f
}

export function applyPercent(base: number, pct: number): number {
  const n = base * pct
  const q = Math.floor(n / 100)
  const rem = n - q * 100
  if (rem > 50) return q + 1
  if (rem < 50) return q
  return q % 2 === 0 ? q : q + 1
}

export function toSatang(thb: number): number {
  return Math.round(roundHalfEven(thb, 2) * 100)
}

const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatTHB(satang: number): string {
  return fmt.format(satang / 100)
}
