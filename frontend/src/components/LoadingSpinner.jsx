export default function LoadingSpinner({ fullPage = false, size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`${sizes[size]} rounded-full border-brand-200 border-t-brand-500 animate-spin`}
          style={{ animationDuration: '0.7s' }}
        />
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full border-transparent border-t-brand-300/40 animate-spin`}
          style={{ animationDuration: '1.4s', animationDirection: 'reverse' }}
        />
      </div>
      {text && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16">
      {spinner}
    </div>
  )
}
