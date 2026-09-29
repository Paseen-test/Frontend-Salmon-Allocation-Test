import { applyPercent } from './money'
import type { OrderType } from './types'

export const TIER_PERCENT: Record<OrderType, number> = {
  EMERGENCY: 125,
  OVERDUE: 100,
  DAILY: 90,
}

export function priceKey(itemId: string, supplierId: string) {
  return `${itemId}|${supplierId}`
}

export function unitPrice(
  prices: Map<string, number>,
  itemId: string,
  supplierId: string,
  type: OrderType,
): number | undefined {
  const base = prices.get(priceKey(itemId, supplierId))
  if (base === undefined) return undefined
  return applyPercent(base, TIER_PERCENT[type])
}
