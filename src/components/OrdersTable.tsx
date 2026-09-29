import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, useEffect, useRef, useState } from 'react'
import { statusOf } from '../lib/allocate'
import { formatTHB } from '../lib/money'
import { unitPrice } from '../lib/pricing'
import { ANY_SUPPLIER, type Allocation, type Dataset, type SubOrder } from '../lib/types'
import { fmtDate, fmtInt } from '../format'
import { StatusText, TypeTag } from './bits'

const COLS = '150px 80px 64px 66px 66px 96px 88px 60px 150px 80px 100px 110px minmax(120px,1fr)'
const HEADERS = ['Sub order', 'Customer', 'Item', 'WH', 'SP', 'Type', 'Created', 'Req', 'Allocated', 'Unit', 'Amount', 'Status', 'Remark']
const RIGHT = new Set(['Req', 'Unit', 'Amount'])
const ROW_H = 34

interface Props {
  ds: Dataset
  rows: number[]
  allocs: Allocation[]
  remarks: string[]
  onCommit: (i: number, qty: number) => string | null
  onRemark: (i: number, text: string) => void
}

export function OrdersTable({ ds, rows, allocs, remarks, onCommit, onRemark }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const v = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  })

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
      <div style={{ minWidth: 1230 }}>
        <div
          className="sticky top-0 z-10 grid border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500"
          style={{ gridTemplateColumns: COLS }}
        >
          {HEADERS.map((h) => (
            <div key={h} className={`px-2 py-2 ${RIGHT.has(h) ? 'text-right' : ''}`}>
              {h}
            </div>
          ))}
        </div>

        {rows.length === 0 && <div className="p-8 text-center text-slate-400">No orders found</div>}

        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map((vr) => {
            const i = rows[vr.index]
            return (
              <Row
                key={i}
                i={i}
                top={vr.start}
                o={ds.orders[i]}
                a={allocs[i]}
                remark={remarks[i]}
                ds={ds}
                onCommit={onCommit}
                onRemark={onRemark}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  i: number
  top: number
  o: SubOrder
  a: Allocation
  remark: string
  ds: Dataset
  onCommit: (i: number, qty: number) => string | null
  onRemark: (i: number, text: string) => void
}

const Row = memo(function Row({ i, top, o, a, remark, ds, onCommit, onRemark }: RowProps) {
  let price: number | undefined
  if (a.parts.length) price = a.parts[0].unitPrice
  else if (o.supplierId !== ANY_SUPPLIER) price = unitPrice(ds.prices, o.itemId, o.supplierId, o.type)

  return (
    <div
      className="absolute left-0 grid w-full items-center border-b border-slate-100 hover:bg-slate-50"
      style={{ gridTemplateColumns: COLS, height: ROW_H, transform: `translateY(${top}px)` }}
    >
      <div className="truncate px-2 font-medium">{o.id}</div>
      <div className="px-2">{o.customerId}</div>
      <div className="px-2">{o.itemId}</div>
      <div className="px-2">{o.warehouseId}</div>
      <div className="px-2">{o.supplierId}</div>
      <div className="px-2">
        <TypeTag type={o.type} />
      </div>
      <div className="px-2 tabular-nums text-slate-600">{fmtDate(o.createdAt)}</div>
      <div className="px-2 text-right tabular-nums">{fmtInt(o.request)}</div>
      <div className="px-2">
        <QtyInput value={a.qty} onCommit={(q) => onCommit(i, q)} />
      </div>
      <div className="px-2 text-right tabular-nums text-slate-600">{price === undefined ? '-' : formatTHB(price)}</div>
      <div className="px-2 text-right tabular-nums">{a.amount ? formatTHB(a.amount) : '-'}</div>
      <div className="px-2">
        <StatusText status={statusOf(o, a)} reason={a.short} />
      </div>
      <div className="px-2">
        <RemarkInput value={remark} onCommit={(t) => onRemark(i, t)} />
      </div>
    </div>
  )
})

function RemarkInput({ value, onCommit }: { value: string; onCommit: (text: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim())
  }

  return (
    <input
      value={draft}
      title={draft || undefined}
      placeholder="-"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(value)
      }}
      className="h-6 w-full rounded border border-transparent px-1.5 text-slate-600 outline-none placeholder:text-slate-300 hover:border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
    />
  )
}

function QtyInput({ value, onCommit }: { value: number; onCommit: (qty: number) => string | null }) {
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(String(value))
    setError(null)
  }, [value])

  const commit = () => {
    if (draft.trim() === String(value)) return setError(null)
    setError(onCommit(draft.trim() === '' ? 0 : Number(draft)))
  }

  return (
    <div className="flex items-center gap-1.5" title={error ?? undefined}>
      <input
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(String(value))
            setError(null)
          }
        }}
        className={`h-6 w-16 rounded border px-1.5 text-right tabular-nums outline-none focus:ring-2 ${
          error ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
        }`}
      />
      {error && <span className="truncate text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
