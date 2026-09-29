import type { RawOrder } from '../lib/parse'

export const SAMPLE_ORDERS: RawOrder[] = [
  { order: 'ORDER-0001', subOrder: 'ORDER-0001-001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', request: 11, type: 'DAILY', createDate: '1/1/25', customerId: 'CT-0001' },
  { order: 'ORDER-0001', subOrder: 'ORDER-0001-002', itemId: 'Item-2', warehouseId: 'WH-002', supplierId: 'SP-000', request: 20, type: 'DAILY', createDate: '01/01/2025', customerId: 'CT-0001' },
  { order: 'ORDER-0002', subOrder: 'ORDER-0002-001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-002', request: 300, type: 'EMERGENCY', createDate: '03/01/2025', customerId: 'CT-0002', remark: 'Special for VIP' },
  { order: 'ORDER-0002', subOrder: 'ORDER-0002-002', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', request: 100, type: 'EMERGENCY', createDate: '03/01/2025', customerId: 'CT-0002', remark: 'Special for VIP' },
]

export const SAMPLE_PRICES: [item: string, supplier: string, thb: number][] = [
  ['Item-1', 'SP-001', 123.49],
  ['Item-1', 'SP-002', 99.75],
]
