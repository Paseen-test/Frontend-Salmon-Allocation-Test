import { unitPrice } from './pricing'
import {
  ANY_SUPPLIER,
  ANY_WAREHOUSE,
  TYPE_PRIORITY,
  type Allocation,
  type Dataset,
  type ShortReason,
  type SubOrder,
} from './types'

export interface Index {
  customerOf: Int32Array
  lotsByItem: Map<string, number[]>
}

export interface AllocState {
  stock: number[]
  credit: number[]
  allocs: Allocation[]
}

export const EMPTY: Allocation = { qty: 0, amount: 0, parts: [], short: null }

export function buildIndex(ds: Dataset): Index {
  const customerById = new Map<string, number>()
  ds.customers.forEach((c, i) => customerById.set(c.id, i))

  const customerOf = new Int32Array(ds.orders.length)
  ds.orders.forEach((o, i) => {
    const c = customerById.get(o.customerId)
    if (c === undefined) throw new Error(`Unknown customer ${o.customerId} on ${o.id}`)
    customerOf[i] = c
  })

  const lotsByItem = new Map<string, number[]>()
  ds.lots.forEach((l, i) => {
    const list = lotsByItem.get(l.itemId)
    if (list) list.push(i)
    else lotsByItem.set(l.itemId, [i])
  })

  return { customerOf, lotsByItem }
}

export function queue(orders: SubOrder[]): number[] {
  const ids = orders.map((_, i) => i)
  ids.sort((a, b) => {
    const A = orders[a]
    const B = orders[b]
    return (
      TYPE_PRIORITY[A.type] - TYPE_PRIORITY[B.type] ||
      A.createdAt - B.createdAt ||
      (A.id < B.id ? -1 : A.id > B.id ? 1 : 0)
    )
  })
  return ids
}

function sourcesFor(ds: Dataset, idx: Index, o: SubOrder, stock: number[]): number[] {
  const lots = idx.lotsByItem.get(o.itemId)
  if (!lots) return []
  const anyWh = o.warehouseId === ANY_WAREHOUSE
  const anySp = o.supplierId === ANY_SUPPLIER
  const out: number[] = []
  for (const l of lots) {
    const lot = ds.lots[l]
    if (!anyWh && lot.warehouseId !== o.warehouseId) continue
    if (!anySp && lot.supplierId !== o.supplierId) continue
    if (stock[l] > 0) out.push(l)
  }
  if (out.length > 1) out.sort((a, b) => stock[b] - stock[a])
  return out
}

function fill(ds: Dataset, idx: Index, o: SubOrder, want: number, stock: number[], credit: number): Allocation {
  const parts: Allocation['parts'] = []
  let qty = 0
  let amount = 0
  let hitCredit = false
  let hitPrice = false

  for (const l of sourcesFor(ds, idx, o, stock)) {
    if (qty >= want) break
    const price = unitPrice(ds.prices, o.itemId, ds.lots[l].supplierId, o.type)
    if (price === undefined) {
      hitPrice = true
      continue
    }
    const affordable = Math.floor((credit - amount) / price)
    const take = Math.min(want - qty, stock[l], affordable)
    if (affordable < want - qty && affordable < stock[l]) hitCredit = true
    if (take <= 0) continue
    parts.push({ lot: l, qty: take, unitPrice: price })
    qty += take
    amount += take * price
  }

  let short: ShortReason = null
  if (qty < want) short = hitCredit ? 'credit' : hitPrice && qty === 0 ? 'price' : 'stock'
  return { qty, amount, parts, short }
}

function take(state: AllocState, idx: Index, i: number, a: Allocation) {
  for (const p of a.parts) state.stock[p.lot] -= p.qty
  state.credit[idx.customerOf[i]] -= a.amount
  state.allocs[i] = a
}

export function autoAllocate(ds: Dataset, idx: Index): AllocState {
  const s: AllocState = {
    stock: ds.lots.map((l) => l.qty),
    credit: ds.customers.map((c) => c.creditLimit),
    allocs: new Array(ds.orders.length).fill(EMPTY),
  }
  for (const i of queue(ds.orders)) {
    const o = ds.orders[i]
    take(s, idx, i, fill(ds, idx, o, o.request, s.stock, s.credit[idx.customerOf[i]]))
  }
  return s
}

export type ManualResult = { ok: true; state: AllocState } | { ok: false; error: string; max: number }

export function setManual(ds: Dataset, idx: Index, state: AllocState, i: number, qty: number): ManualResult {
  const o = ds.orders[i]
  const c = idx.customerOf[i]

  const cur = state.allocs[i]
  const stock = state.stock.slice()
  for (const p of cur.parts) stock[p.lot] += p.qty
  const credit = state.credit[c] + cur.amount
  const max = () => fill(ds, idx, o, o.request, stock, credit).qty

  if (!Number.isInteger(qty) || qty < 0) return { ok: false, error: 'Whole numbers only', max: max() }
  if (qty > o.request) return { ok: false, error: `Only ${o.request} requested`, max: max() }

  const a = fill(ds, idx, o, qty, stock, credit)
  if (a.qty < qty) {
    const why = a.short === 'credit' ? 'credit' : a.short === 'price' ? 'price for supplier' : 'stock'
    return { ok: false, error: `Not enough ${why}`, max: max() }
  }

  for (const p of a.parts) stock[p.lot] -= p.qty
  const next: AllocState = { stock, credit: state.credit.slice(), allocs: state.allocs.slice() }
  next.credit[c] = credit - a.amount
  next.allocs[i] = { ...a, short: null }
  return { ok: true, state: next }
}

export function statusOf(o: SubOrder, a: Allocation): 'full' | 'partial' | 'none' {
  if (a.qty >= o.request) return 'full'
  return a.qty === 0 ? 'none' : 'partial'
}
