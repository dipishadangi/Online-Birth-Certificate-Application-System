import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    // Backend expects OAuth2 form fields: username + password
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const res = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
    return res.data.user
  }

  async function register(fullName, email, password) {
    await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
    })
    // auto-login after registering
    return login(email, password)
  }

  function logout() {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
