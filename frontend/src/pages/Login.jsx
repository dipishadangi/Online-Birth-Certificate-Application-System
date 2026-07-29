import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function redirectByRole(role, navigate) {
  if (role === 'citizen')             navigate('/dashboard')
  else if (role === 'ward_staff')     navigate('/staff/ward')
  else if (role === 'district_staff') navigate('/staff/district')
  else if (role === 'admin')          navigate('/admin')
  else                                navigate('/')
}

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      redirectByRole(user.role, navigate)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">

      {/* ── Left photo panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col items-center justify-end">
        {/* Full-bleed photo */}
        <img
          src="https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&h=900&fit=crop&q=85"
          alt="Mother holding newborn baby"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/60 to-brand-800/30" />

        {/* Text over photo */}
        <div className="relative z-10 p-10 w-full">
          <div className="mb-4">
            <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-2">E-Governance Portal</p>
            <h2 className="text-3xl font-extrabold text-white font-display leading-snug mb-3">
              Welcome Back to<br />Birth Certificate Portal
            </h2>
            <p className="text-brand-200/80 text-sm leading-relaxed">
              Sign in to track your applications, upload documents, and manage your submissions — all online.
            </p>
          </div>

          {/* Floating quote card */}
          <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-white/90 text-sm italic leading-relaxed mb-2">
              &ldquo;The birth certificate is a child&apos;s first document of identity. Register yours online today.&rdquo;
            </p>
            <p className="text-brand-300 text-xs font-semibold">— E-Governance Portal</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-scale-in">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full mb-3">
              👋 Welcome back
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 font-display">Sign in to your account</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="alert-error mb-5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-base rounded-xl"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
