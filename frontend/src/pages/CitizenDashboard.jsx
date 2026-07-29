import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const STATUS_ORDER = ['pending', 'under_review', 'forwarded', 'approved', 'rejected']

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/applications/my')
      .then((res) => setApplications(res.data))
      .catch(() => setError('Could not load your applications.'))
      .finally(() => setLoading(false))
  }, [])

  const total    = applications.length
  const pending  = applications.filter((a) => ['pending', 'under_review', 'forwarded'].includes(a.status)).length
  const approved = applications.filter((a) => a.status === 'approved').length

  return (
    <div className="page-section max-w-4xl">
      <PageHeader
        badge="Citizen Portal"
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Citizen'} 👋`}
        subtitle="Track and manage your birth certificate applications."
        actions={
          <Link to="/apply" id="new-application-btn" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Application
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total', value: total, icon: '📋', color: 'from-brand-500 to-brand-600' },
          { label: 'In Progress', value: pending, icon: '⏳', color: 'from-amber-500 to-amber-600' },
          { label: 'Approved', value: approved, icon: '✅', color: 'from-emerald-500 to-emerald-600' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="card p-5 flex items-center gap-4 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg shadow flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800 font-display leading-none">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <div className="alert-error mb-6">{error}</div>}

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading your applications…" />}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <EmptyState
          icon="empty"
          title="No applications yet"
          description="Submit your first birth certificate application to get started."
          actionLabel="+ New Application"
          actionTo="/apply"
        />
      )}

      {/* Application list */}
      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Applications</h2>
          {applications.map((app, i) => (
            <Link
              key={app.id}
              to={`/applications/${app.id}`}
              id={`application-${app.id}`}
              className="card-hover flex items-center justify-between p-5 animate-slide-up group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Status color left-border accent */}
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                  app.status === 'approved' ? 'bg-emerald-400'
                  : app.status === 'rejected' ? 'bg-red-400'
                  : app.status === 'forwarded' ? 'bg-violet-400'
                  : app.status === 'under_review' ? 'bg-blue-400'
                  : 'bg-amber-400'
                }`} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors truncate">{app.child_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
          ))}
        </div>
      )}
    </div>
  )
}
