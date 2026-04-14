import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { clearAuthData, getAuthData, setAuthData } from '../utils/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authData, setAuthDataState] = useState(() => getAuthData())
  const [initializing, setInitializing] = useState(true)
  const [bootError, setBootError] = useState('')

  const persist = (value) => {
    setAuthDataState(value)
    if (value) setAuthData(value)
    else clearAuthData()
  }

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const cached = getAuthData()
      if (!cached?.token) {
        if (active) {
          setInitializing(false)
          setBootError('')
        }
        return
      }

      try {
        const me = await api.me()
        if (!active) return
        persist({ token: cached.token, user: me.user })
        setBootError('')
      } catch (error) {
        if (!active) return
        persist(null)
        setBootError(error?.message || 'Session expired. Please login again.')
      } finally {
        if (active) setInitializing(false)
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  const login = async (email, password) => {
    const result = await api.login(email, password)
    persist(result)
    setBootError('')
    return result
  }

  const register = async (name, email, password) => {
    const result = await api.register(name, email, password)
    persist(result)
    setBootError('')
    return result
  }

  const googleLogin = async () => {
    const result = await api.loginWithGoogle()
    persist(result)
    setBootError('')
    return result
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      persist(null)
      setBootError('')
    }
  }

  const value = useMemo(() => ({
    token: authData?.token || null,
    user: authData?.user || null,
    isAuthenticated: Boolean(authData?.user),
    isAdmin: authData?.user?.role === 'admin',
    initializing,
    bootError,
    login,
    register,
    googleLogin,
    logout,
  }), [authData, initializing, bootError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
