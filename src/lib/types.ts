export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY'

export const TYPE_PRIORITY: Record<OrderType, number> = { EMERGENCY: 0, OVERDUE: 1, DAILY: 2 }

export const ANY_WAREHOUSE = 'WH-000'
export const ANY_SUPPLIER = 'SP-000'

export interface SubOrder {
  id: string
  orderId: string
  itemId: string
  warehouseId: string
  supplierId: string
  request: number
  type: OrderType
  createdAt: number
  customerId: string
  remark: string
}

export interface Lot {
  itemId: string
  warehouseId: string
  supplierId: string
  qty: number
}

export interface Customer {
  id: string
  creditLimit: number
}

export interface Dataset {
  orders: SubOrder[]
  lots: Lot[]
  customers: Customer[]
  prices: Map<string, number>
}

export interface Part {
  lot: number
  qty: number
  unitPrice: number
}

export type ShortReason = 'stock' | 'credit' | 'price' | null

export interface Allocation {
  qty: number
  amount: number
  parts: Part[]
  short: ShortReason
}
