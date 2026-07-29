export default function PageHeader({ title, subtitle, badge, actions, className = '' }) {
  return (
    <div className={`mb-8 animate-slide-up ${className}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {badge && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full mb-2">
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-display tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 mt-1 text-sm sm:text-base">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
