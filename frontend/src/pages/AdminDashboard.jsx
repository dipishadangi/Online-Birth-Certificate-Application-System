import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import PageHeader from '../components/PageHeader.jsx'

const ROLE_BADGE = {
  admin:          { label: 'Admin',          color: 'bg-red-100 text-red-700 border-red-200' },
  ward_staff:     { label: 'Ward Staff',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  district_staff: { label: 'District Staff', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  citizen:        { label: 'Citizen',        color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const STAT_CONFIG = [
  { key: 'total',        label: 'Total',        icon: '📊', color: 'from-slate-500 to-slate-600' },
  { key: 'pending',      label: 'Pending',       icon: '⏳', color: 'from-amber-500 to-amber-600' },
  { key: 'under_review', label: 'Under Review',  icon: '🔍', color: 'from-blue-500 to-blue-600' },
  { key: 'forwarded',    label: 'Forwarded',     icon: '↗️', color: 'from-violet-500 to-violet-600' },
  { key: 'approved',     label: 'Approved',      icon: '✅', color: 'from-emerald-500 to-emerald-600' },
  { key: 'rejected',     label: 'Rejected',      icon: '❌', color: 'from-red-500 to-red-600' },
]

const TABS = [
  { key: 'overview',     label: 'Overview',     icon: '📊' },
  { key: 'applications', label: 'Applications', icon: '📋' },
  { key: 'users',        label: 'Users',        icon: '👥' },
]

const EMPTY_USER_FORM = {
  full_name: '',
  email: '',
  password: '',
  role: 'ward_staff',
}

export default function AdminDashboard() {
  const [stats, setStats]                 = useState(null)
  const [applications, setApplications]   = useState([])
  const [users, setUsers]                 = useState([])
  const [tab, setTab]                     = useState('overview')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(true)
  const [statusFilter, setStatusFilter]   = useState('all')

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [userForm, setUserForm]             = useState(EMPTY_USER_FORM)
  const [createError, setCreateError]       = useState('')
  const [createSuccess, setCreateSuccess]   = useState('')
  const [creating, setCreating]             = useState(false)

  // Toggle active state
  const [togglingId, setTogglingId] = useState(null)

  function loadData() {
    Promise.all([
      api.get('/admin/stats').then((r) => setStats(r.data)),
      api.get('/admin/applications').then((r) => setApplications(r.data)),
      api.get('/admin/users').then((r) => setUsers(r.data)),
    ])
      .catch(() => setError('Could not load admin data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function handleCreateUser(e) {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreating(true)
    try {
      const res = await api.post('/admin/users', userForm)
      setUsers((prev) => [res.data, ...prev])
      setCreateSuccess(`✅ Account created for ${res.data.full_name} (${res.data.role.replace('_', ' ')})`)
      setUserForm(EMPTY_USER_FORM)
      setShowCreateForm(false)
      setTimeout(() => setCreateSuccess(''), 4000)
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(userId) {
    setTogglingId(userId)
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-active`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)))
    } catch {
      // silent fail
    } finally {
      setTogglingId(null)
    }
  }

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter)

  return (
    <div className="page-section max-w-5xl">
      <PageHeader
        badge="System Administration"
        title="Admin Dashboard"
        subtitle="Oversee all applications, users, and system activity."
      />

      {error && <div className="alert-error mb-6">{error}</div>}

      {/* Global success toast for user creation */}
      {createSuccess && (
        <div className="alert-success mb-5 animate-slide-down">
          {createSuccess}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl mb-8 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            id={`admin-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? 'tab-btn-active' : 'tab-btn'}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner text="Loading admin data…" />}

      {/* ── Overview ── */}
      {!loading && tab === 'overview' && stats && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {STAT_CONFIG.map((s, i) => (
              <div
                key={s.key}
                className="card p-5 flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-800 font-display leading-none">{stats[s.key]}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Applications</h2>
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-xl px-3 py-2.5 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">{app.child_name}</p>
                    <p className="text-xs text-slate-400">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))}
              {applications.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">No applications yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Applications ── */}
      {!loading && tab === 'applications' && (
        <div className="animate-fade-in">
          <div className="flex flex-wrap gap-2 mb-5">
            {['all', 'pending', 'under_review', 'forwarded', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                id={`filter-${s}`}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 capitalize ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {s.replace('_', ' ')}
                {s !== 'all' && stats && (
                  <span className="ml-1.5 opacity-70">({stats[s] ?? 0})</span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredApps.map((app, i) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                id={`admin-app-${app.id}`}
                className="card-hover flex items-center justify-between p-5 animate-slide-up group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors truncate">{app.child_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={app.status} />
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {filteredApps.length === 0 && (
              <div className="card text-center py-12 text-slate-400">No applications match this filter.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {!loading && tab === 'users' && (
        <div className="animate-fade-in">

          {/* Header row with Create button */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-slate-700">All Accounts</h2>
              <p className="text-xs text-slate-400">{users.length} total users in the system</p>
            </div>
            <button
              id="create-user-btn"
              onClick={() => { setShowCreateForm(!showCreateForm); setCreateError('') }}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Staff Account
            </button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div className="card p-6 mb-6 border-l-4 border-brand-400 animate-scale-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-xl shadow">👤</div>
                <div>
                  <h3 className="font-bold text-slate-800 font-display">New Staff Account</h3>
                  <p className="text-xs text-slate-400">Creates a ward staff, district staff, or admin account.</p>
                </div>
              </div>

              {createError && (
                <div className="alert-error mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {createError}
                </div>
              )}

              <form id="create-user-form" onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      id="new-user-name"
                      required
                      className="input"
                      placeholder="e.g. Sita Thapa"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      id="new-user-email"
                      type="email"
                      required
                      className="input"
                      placeholder="staff@example.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      id="new-user-password"
                      type="password"
                      required
                      minLength={6}
                      className="input"
                      placeholder="Min. 6 characters"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      id="new-user-role"
                      required
                      className="select"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="ward_staff">Ward Staff</option>
                      <option value="district_staff">District Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="create-user-submit"
                    type="submit"
                    disabled={creating}
                    className="btn-primary"
                  >
                    {creating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Creating…
                      </>
                    ) : 'Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setCreateError('') }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Name</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Email</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Role</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, i) => {
                    const roleCfg = ROLE_BADGE[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-600 border-slate-200' }
                    const isToggling = togglingId === u.id
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {u.full_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleCfg.color}`}>
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            id={`toggle-user-${u.id}`}
                            onClick={() => handleToggleActive(u.id)}
                            disabled={isToggling}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 disabled:opacity-50 ${
                              u.is_active
                                ? 'text-red-600 border-red-200 hover:bg-red-50 bg-white'
                                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white'
                            }`}
                          >
                            {isToggling ? (
                              <svg className="w-3 h-3 animate-spin inline" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                              </svg>
                            ) : u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No users found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
