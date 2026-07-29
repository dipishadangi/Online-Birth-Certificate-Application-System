const CONFIG = {
  pending: {
    styles: 'bg-amber-50 text-amber-700 border border-amber-200 ring-0',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Pending',
    icon: '⏳',
  },
  under_review: {
    styles: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    label: 'Under Review',
    icon: '🔍',
  },
  forwarded: {
    styles: 'bg-violet-50 text-violet-700 border border-violet-200',
    dot: 'bg-violet-500',
    label: 'Forwarded',
    icon: '↗️',
  },
  approved: {
    styles: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Approved',
    icon: '✅',
  },
  rejected: {
    styles: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
    label: 'Rejected',
    icon: '❌',
  },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = CONFIG[status] || {
    styles: 'bg-slate-50 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
    label: status,
    icon: '•',
  }

  const padding = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${cfg.styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
