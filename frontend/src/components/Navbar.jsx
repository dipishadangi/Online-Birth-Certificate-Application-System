import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const NAV_LINKS = {
  citizen:       [{ to: '/dashboard', label: 'My Applications', icon: '📋' }, { to: '/apply', label: 'Apply Now', icon: '➕' }],
  ward_staff:    [{ to: '/staff/ward', label: 'Ward Queue', icon: '🏛️' }],
  district_staff:[{ to: '/staff/district', label: 'District Queue', icon: '🏢' }],
  admin:         [{ to: '/admin', label: 'Admin Panel', icon: '⚙️' }],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = user ? (NAV_LINKS[user.role] || []) : []

  return (
    <nav className="glass-dark sticky top-0 z-40 animate-slide-down">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            <span className="text-white text-lg">📜</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight font-display">Birth Certificate</div>
            <div className="text-brand-300 text-[10px] font-medium leading-tight tracking-wide uppercase">E-Governance Portal</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-150"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {!user && (
            <>
              <Link to="/login" className="text-sm font-medium text-brand-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-150">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm ml-1 py-2 px-4">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* User avatar / logout */}
        {user && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-white text-sm font-semibold leading-tight truncate max-w-[140px]">{user.full_name}</p>
              <p className="text-brand-300 text-[11px] capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0 ring-2 ring-brand-300/40">
              {getInitials(user.full_name)}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-brand-200 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all duration-150"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-white p-2 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden glass-dark border-t border-white/10 px-4 pb-4 pt-2 animate-slide-down">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-brand-200 hover:text-white py-2.5"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-brand-200 hover:text-white py-2.5">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-sm text-brand-200 hover:text-white py-2.5">Register</Link>
            </>
          )}
          {user && (
            <div className="pt-2 border-t border-white/10 mt-2">
              <p className="text-white text-sm font-semibold">{user.full_name}</p>
              <p className="text-brand-300 text-xs capitalize mb-2">{user.role.replace('_', ' ')}</p>
              <button onClick={handleLogout} className="text-red-300 text-sm font-medium hover:text-red-200">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
