import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import { OrdersTable } from './components/OrdersTable'
import { generate } from './data/generate'
import { fmtInt } from './format'
import { autoAllocate, buildIndex, queue, setManual, statusOf } from './lib/allocate'

type Status = '' | 'full' | 'partial' | 'none'

const ds = generate({ lines: 10_000 })
const idx = buildIndex(ds)
const order = queue(ds.orders)
const haystack = ds.orders.map((o) => `${o.id} ${o.customerId}`.toLowerCase())

export default function App() {
  const [state, setState] = useState(() => autoAllocate(ds, idx))
  const stateRef = useRef(state)
  stateRef.current = state

  const [remarks, setRemarks] = useState(() => ds.orders.map((o) => o.remark))
  const onRemark = useCallback((i: number, text: string) => {
    setRemarks((r) => {
      const next = r.slice()
      next[i] = text
      return next
    })
  }, [])

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<Status>('')
  const query = useDeferredValue(q)

  const rows = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return order.filter(
      (i) =>
        (!status || statusOf(ds.orders[i], state.allocs[i]) === status) &&
        terms.every((t) => haystack[i].includes(t) || remarks[i].toLowerCase().includes(t)),
    )
  }, [query, status, state.allocs, remarks])

  const commit = useCallback((i: number, qty: number) => {
    const r = setManual(ds, idx, stateRef.current, i, qty)
    if (!r.ok) return `${r.error}, max ${r.max}`
    stateRef.current = r.state
    setState(r.state)
    return null
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <h1 className="mr-4 text-[15px] font-semibold">Salmon allocation</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order / customer / remark"
          className="h-7 w-64 rounded border border-slate-200 px-2 outline-none focus:border-sky-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="h-7 rounded border border-slate-200 bg-white px-1.5 outline-none focus:border-sky-400"
        >
          <option value="">All status</option>
          <option value="full">Full</option>
          <option value="partial">Partial</option>
          <option value="none">None</option>
        </select>
        <span className="ml-auto text-slate-500 tabular-nums">
          {fmtInt(rows.length)} / {fmtInt(ds.orders.length)} lines
        </span>
      </header>
      <OrdersTable ds={ds} rows={rows} allocs={state.allocs} remarks={remarks} onCommit={commit} onRemark={onRemark} />
    </div>
  )
}
