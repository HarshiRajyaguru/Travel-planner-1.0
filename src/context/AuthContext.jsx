import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { api } from '../api'
import { auth } from '../firebase'
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
    if (!auth) {
      setBootError('Firebase Auth is not initialized. Check your .env and restart dev server.')
      setInitializing(false)
      return () => {}
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        persist(null)
        setBootError('')
        setInitializing(false)
        return
      }

      try {
        const me = await api.me()
        persist(me)
        setBootError('')
      } catch (error) {
        // Keep Firebase session; just surface an explicit boot error.
        setBootError(error?.message || 'Could not restore your profile session')
      } finally {
        setInitializing(false)
      }
    })

    return () => unsub()
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

