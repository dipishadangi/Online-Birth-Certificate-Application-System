import { Link } from 'react-router-dom'

const ICONS = {
  empty: (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
      <circle cx="40" cy="40" r="38" fill="#eef2ff" />
      <rect x="22" y="24" width="36" height="44" rx="4" fill="#c7d2fe" />
      <rect x="27" y="32" width="20" height="3" rx="1.5" fill="#6366f1" opacity="0.5"/>
      <rect x="27" y="39" width="26" height="3" rx="1.5" fill="#6366f1" opacity="0.5"/>
      <rect x="27" y="46" width="16" height="3" rx="1.5" fill="#6366f1" opacity="0.5"/>
      <circle cx="52" cy="52" r="12" fill="#f0f4ff" stroke="#6366f1" strokeWidth="2"/>
      <path d="M48 52h8M52 48v8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
      <circle cx="40" cy="40" r="38" fill="#eef2ff" />
      <circle cx="36" cy="35" r="14" stroke="#6366f1" strokeWidth="2.5" fill="#c7d2fe" opacity="0.6"/>
      <path d="M47 46l10 10" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  done: (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
      <circle cx="40" cy="40" r="38" fill="#ecfdf5" />
      <circle cx="40" cy="40" r="18" fill="#a7f3d0"/>
      <path d="M30 40l7 7 13-13" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export default function EmptyState({ icon = 'empty', title = 'Nothing here yet', description, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 animate-slide-up">
      <div className="animate-float mb-5">
        {ICONS[icon] || ICONS.empty}
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>}
      {actionLabel && actionTo && <Link to={actionTo} className="btn-primary">{actionLabel}</Link>}
      {actionLabel && onAction && <button onClick={onAction} className="btn-primary">{actionLabel}</button>}
    </div>
  )
}
