import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'

const QUEUE_CONFIG = {
  ward: {
    badge: 'Ward Office',
    title: 'Ward Review Queue',
    subtitle: 'Applications waiting for your review and decision.',
    icon: '🏛️',
    color: 'from-blue-500 to-blue-600',
  },
  district: {
    badge: 'District Office',
    title: 'District Review Queue',
    subtitle: 'Forwarded applications awaiting final district approval.',
    icon: '🏢',
    color: 'from-violet-500 to-violet-600',
  },
}

function getDaysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function StaffDashboard({ queue }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const cfg = QUEUE_CONFIG[queue]

  useEffect(() => {
    api.get(`/applications/queue/${queue}`)
      .then((res) => setApplications(res.data))
      .catch(() => setError('Could not load queue.'))
      .finally(() => setLoading(false))
  }, [queue])

  return (
    <div className="page-section max-w-4xl">
      <PageHeader
        badge={cfg.badge}
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <div className={`flex items-center gap-2 bg-gradient-to-br ${cfg.color} text-white text-sm font-bold px-4 py-2 rounded-xl shadow`}>
            <span>{cfg.icon}</span>
            {applications.length} pending
          </div>
        }
      />

      {error && <div className="alert-error mb-6">{error}</div>}
      {loading && <LoadingSpinner text="Loading queue…" />}

      {!loading && applications.length === 0 && (
        <EmptyState
          icon="done"
          title="Queue is clear!"
          description="No applications are waiting for review right now. Check back later."
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app, i) => {
            const daysAgo = getDaysAgo(app.created_at)
            const isUrgent = (Date.now() - new Date(app.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000

            return (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                id={`queue-app-${app.id}`}
                className="card-hover flex items-center justify-between p-5 animate-slide-up group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Urgency indicator */}
                  <div className={`w-1 h-12 rounded-full flex-shrink-0 ${isUrgent ? 'bg-red-400' : 'bg-brand-300'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors truncate">{app.child_name}</p>
                      {isUrgent && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-md flex-shrink-0">URGENT</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      <span className="ml-1.5 text-slate-300">·</span>
                      <span className={`ml-1.5 ${isUrgent ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{daysAgo}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={app.status} />
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
