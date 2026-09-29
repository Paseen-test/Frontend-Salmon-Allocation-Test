import type { OrderType, ShortReason } from '../lib/types'

const TYPE_STYLE: Record<OrderType, string> = {
  EMERGENCY: 'text-red-700 bg-red-50',
  OVERDUE: 'text-amber-700 bg-amber-50',
  DAILY: 'text-slate-600 bg-slate-100',
}

export function TypeTag({ type }: { type: OrderType }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_STYLE[type]}`}>{type}</span>
}

export function StatusText({ status, reason }: { status: 'full' | 'partial' | 'none'; reason: ShortReason }) {
  if (status === 'full') return <span className="text-emerald-700">Full</span>
  const color = status === 'none' ? 'text-red-600' : 'text-amber-700'
  return (
    <span className={color}>
      {status === 'none' ? 'None' : 'Partial'}
      {reason && <span className="text-slate-400"> · {reason}</span>}
    </span>
  )
}
