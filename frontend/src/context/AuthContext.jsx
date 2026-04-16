import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { api } from '../api'
import { auth, firebaseConfigError } from '../firebase'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [authData, setAuthData] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    if (firebaseConfigError || !auth) {
      setBootError(firebaseConfigError || 'Firebase auth is not initialized.')
      setInitializing(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthData(null)
        setBootError('')
        setInitializing(false)
        return
      }

      try {
        const me = await api.me()
        setAuthData(me)
        setBootError('')
      } catch (error) {
        setAuthData(null)
        setBootError(error?.message || 'Could not restore session.')
      } finally {
        setInitializing(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const result = await api.login(email, password)
    setAuthData(result)
    setBootError('')
    return result
  }

  const register = async (name, email, password) => {
    const result = await api.register(name, email, password)
    setAuthData(result)
    setBootError('')
    return result
  }

  const googleLogin = async (googlePayload) => {
    const result = await api.loginWithGoogle(googlePayload)
    setAuthData(result)
    setBootError('')
    return result
  }

  const logout = async () => {
    await api.logout()
    setAuthData(null)
    setBootError('')
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
