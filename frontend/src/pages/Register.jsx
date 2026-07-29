import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { redirectByRole } from './Login.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass]               = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [error, setError]                     = useState('')
  const [submitting, setSubmitting]           = useState(false)

  const strength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : 3

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400']

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.')
      return
    }

    setSubmitting(true)
    try {
      const user = await register(fullName, email, password)
      redirectByRole(user.role, navigate)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
          src="https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&h=900&fit=crop&q=85"
          alt="Baby holding parent's finger"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/55 to-brand-800/20" />

        {/* Text over photo */}
        <div className="relative z-10 p-10 w-full">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-2">Join the Platform</p>
          <h2 className="text-3xl font-extrabold text-white font-display leading-snug mb-3">
            Register Your<br />New Arrival Online
          </h2>
          <p className="text-brand-200/80 text-sm leading-relaxed mb-6">
            Create your account and apply for a birth certificate — from anywhere, at any time. No queues, no hassle.
          </p>

          {/* Benefits list */}
          <div className="space-y-3">
            {[
              { icon: '✓', text: 'No physical visits required' },
              { icon: '✓', text: 'Secure document uploads' },
              { icon: '✓', text: 'Real-time application tracking' },
              { icon: '✓', text: 'Fast digital approval process' },
            ].map((point) => (
              <div key={point.text} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs flex-shrink-0">
                  {point.icon}
                </span>
                <span className="text-brand-200 text-sm">{point.text}</span>
              </div>
            ))}
          </div>

          {/* Photo credit badge */}
          <div className="mt-8 flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=80&h=80&fit=crop&q=80"
                alt="Newborn baby"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Every baby deserves a record 💙</p>
              <p className="text-brand-300 text-[10px]">Official government e-governance portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-scale-in">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full mb-3">
              🆕 New Account
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 font-display">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Citizen accounts only — staff accounts are created by admins.</p>
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
              <label className="label">Full Name</label>
              <input
                id="register-full-name"
                className="input"
                placeholder="e.g. Ram Bahadur Thapa"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                id="register-email"
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
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          lvl <= strength ? strengthColor[strength] : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength === 1 ? 'text-red-500'
                    : strength === 2 ? 'text-amber-500'
                    : 'text-emerald-500'
                  }`}>
                    {strengthLabel[strength]} password
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPass
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs font-medium mt-1.5 ${password === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-base rounded-xl mt-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
