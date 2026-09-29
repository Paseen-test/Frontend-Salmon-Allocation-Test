import { toSatang } from '../lib/money'
import { parseOrder } from '../lib/parse'
import { priceKey } from '../lib/pricing'
import {
  ANY_SUPPLIER,
  ANY_WAREHOUSE,
  type Customer,
  type Dataset,
  type Lot,
  type OrderType,
  type SubOrder,
} from '../lib/types'
import { SAMPLE_ORDERS, SAMPLE_PRICES } from './sample'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number, w: number) => String(n).padStart(w, '0')

const ITEMS = Array.from({ length: 8 }, (_, i) => `Item-${i + 1}`)
const WAREHOUSES = Array.from({ length: 6 }, (_, i) => `WH-${pad(i + 1, 3)}`)
const SUPPLIERS = Array.from({ length: 5 }, (_, i) => `SP-${pad(i + 1, 3)}`)

const REQUIRED_LOTS = ['Item-1|WH-001|SP-001', 'Item-1|WH-001|SP-002', 'Item-2|WH-002|SP-001', 'Item-2|WH-002|SP-003']

export interface GenerateOptions {
  lines: number
  seed?: number
  stockRatio?: number
}

export function generate({ lines, seed = 7, stockRatio = 0.7 }: GenerateOptions): Dataset {
  const rand = mulberry32(seed)
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

  const prices = new Map<string, number>()
  for (const item of ITEMS) {
    const base = int(80, 160)
    for (const sp of SUPPLIERS) prices.set(priceKey(item, sp), toSatang(base + rand() * 30 - 15))
  }
  for (const [item, sp, thb] of SAMPLE_PRICES) prices.set(priceKey(item, sp), toSatang(thb))

  const lotKeys = new Set(REQUIRED_LOTS)
  for (const item of ITEMS)
    for (const wh of WAREHOUSES)
      for (const sp of SUPPLIERS) if (rand() < 0.3) lotKeys.add(`${item}|${wh}|${sp}`)

  const lots: Lot[] = [...lotKeys].map((k) => {
    const [itemId, warehouseId, supplierId] = k.split('|')
    return { itemId, warehouseId, supplierId, qty: 0 }
  })
  const lotsByItem = new Map<string, Lot[]>()
  for (const l of lots) lotsByItem.set(l.itemId, [...(lotsByItem.get(l.itemId) ?? []), l])

  const orders: SubOrder[] = SAMPLE_ORDERS.map(parseOrder)
  const customerCount = Math.max(50, Math.round(lines / 8))
  const start = Date.UTC(2025, 0, 1)
  const span = Date.UTC(2025, 8, 30) - start

  let orderNo = 3
  while (orders.length < lines) {
    const orderId = `ORDER-${pad(orderNo++, 4)}`
    const customerId = `CT-${pad(int(1, customerCount), 4)}`
    const r = rand()
    const type: OrderType = r < 0.1 ? 'EMERGENCY' : r < 0.35 ? 'OVERDUE' : 'DAILY'
    const createdAt = start + Math.floor(rand() * span / 60000) * 60000
    const n = Math.min(int(1, 4), lines - orders.length)
    const items = [...ITEMS]
    for (let k = items.length - 1; k > 0; k--) {
      const j = int(0, k)
      ;[items[k], items[j]] = [items[j], items[k]]
    }
    items.length = n

    items.forEach((itemId, k) => {
      const lot = pick(lotsByItem.get(itemId)!)
      const w = rand()
      orders.push({
        id: `${orderId}-${pad(k + 1, 3)}`,
        orderId,
        itemId,
        warehouseId: w < 0.2 ? ANY_WAREHOUSE : lot.warehouseId,
        supplierId: w < 0.1 || w > 0.9 ? ANY_SUPPLIER : lot.supplierId,
        request: type === 'EMERGENCY' ? int(20, 250) : int(5, 150),
        type,
        createdAt,
        customerId,
        remark: type === 'EMERGENCY' && rand() < 0.2 ? 'Rush' : '',
      })
    })
  }

  const demand = new Map<string, number>()
  for (const o of orders) demand.set(o.itemId, (demand.get(o.itemId) ?? 0) + o.request)
  for (const [itemId, itemLots] of lotsByItem) {
    const total = Math.round((demand.get(itemId) ?? 0) * stockRatio)
    const weights = itemLots.map(() => 0.3 + rand())
    const sum = weights.reduce((a, b) => a + b, 0)
    itemLots.forEach((l, i) => (l.qty = Math.floor((total * weights[i]) / sum)))
  }

  const customers: Customer[] = Array.from({ length: customerCount }, (_, i) => ({
    id: `CT-${pad(i + 1, 4)}`,
    creditLimit: int(15, 200) * 1000 * 100,
  }))
  customers[1].creditLimit = 1_000_000 * 100

  return { orders, lots, customers, prices }
}
