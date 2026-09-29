import type { OrderType, SubOrder } from './types'

export function parseOrderType(raw: string): OrderType {
  const t = raw.trim().toUpperCase().replace(/[\s_-]/g, '')
  if (t === 'EMERGENCY') return 'EMERGENCY'
  if (t === 'OVERDUE') return 'OVERDUE'
  if (t === 'DAILY') return 'DAILY'
  throw new Error(`Unknown order type: ${raw}`)
}

export function parseDate(raw: string): number {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (!m) throw new Error(`Bad date: ${raw}`)
  const day = Number(m[1])
  const month = Number(m[2])
  let year = Number(m[3])
  if (m[3].length === 2) year += 2000
  return Date.UTC(year, month - 1, day)
}

export interface RawOrder {
  order: string
  subOrder: string
  itemId: string
  warehouseId: string
  supplierId: string
  request: number | string
  type: string
  createDate: string
  customerId: string
  remark?: string
}

export function parseOrder(r: RawOrder): SubOrder {
  const request = Number(r.request)
  if (!Number.isFinite(request) || request < 0) throw new Error(`Bad request qty on ${r.subOrder}`)
  return {
    id: r.subOrder.trim(),
    orderId: r.order.trim(),
    itemId: r.itemId.trim(),
    warehouseId: r.warehouseId.trim(),
    supplierId: r.supplierId.trim(),
    request,
    type: parseOrderType(r.type),
    createdAt: parseDate(r.createDate),
    customerId: r.customerId.trim(),
    remark: r.remark?.trim() ?? '',
  }
}
