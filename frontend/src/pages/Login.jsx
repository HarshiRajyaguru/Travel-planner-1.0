import { useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth, firebaseConfigError } from '../firebase'
import { useAuth } from '../context/AuthContext'

function mapGoogleAuthError(err) {
  const code = String(err?.code || '')
  if (code === 'auth/popup-closed-by-user') return 'Google popup was closed before sign in finished.'
  if (code === 'auth/cancelled-popup-request') return 'Another Google sign-in popup is already open.'
  if (code === 'auth/network-request-failed') return 'Network error during Google sign-in. Please check your connection.'
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Auth settings.'
  if (code === 'auth/operation-not-allowed') return 'Google login is not enabled in Firebase Authentication.'
  return err?.message || 'Google login failed.'
}

export default function Login() {
  const { login, register, googleLogin } = useAuth()
  const googleEnabled = String(import.meta.env.VITE_ENABLE_GOOGLE_LOGIN || 'false') === 'true'
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from || '/dashboard'
  const googleProvider = useMemo(() => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    return provider
  }, [])

  const exchangeGoogleCredential = async (result) => {
    const googleUser = result?.user
    if (!googleUser) {
      throw new Error('Google sign-in did not return a user. Please try again.')
    }

    const idToken = await googleUser.getIdToken()
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken || null

    await googleLogin({
      idToken,
      accessToken,
      email: googleUser.email || null,
      name: googleUser.displayName || null,
      photoURL: googleUser.photoURL || null,
    })
  }

  useEffect(() => {
    if (!googleEnabled || !auth) return

    let active = true
    const handleGoogleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (!active || !result) return

        setLoading(true)
        setError('')
        setSuccess('')
        await exchangeGoogleCredential(result)
        setSuccess('Logged in with Google.')
        navigate(destination, { replace: true })
      } catch (err) {
        if (!active) return
        setError(mapGoogleAuthError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    handleGoogleRedirectResult()
    return () => {
      active = false
    }
  }, [destination, googleEnabled, googleProvider, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        setSuccess('Login successful.')
      } else {
        await register(form.name, form.email, form.password)
        setSuccess('Account created successfully.')
      }
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    if (firebaseConfigError || !auth) {
      setError(firebaseConfigError || 'Firebase auth is not initialized. Cannot continue with Google.')
      setLoading(false)
      return
    }

    try {
      const popupResult = await signInWithPopup(auth, googleProvider)
      await exchangeGoogleCredential(popupResult)
      setSuccess('Logged in with Google.')
      navigate(destination, { replace: true })
    } catch (err) {
      const code = String(err?.code || '')
      const shouldFallbackToRedirect = (
        code === 'auth/popup-blocked'
        || code === 'auth/operation-not-supported-in-this-environment'
      )

      if (shouldFallbackToRedirect) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectErr) {
          setError(mapGoogleAuthError(redirectErr))
          setLoading(false)
          return
        }
      }

      setError(mapGoogleAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1>Travel Planner</h1>
        <p>{mode === 'login' ? 'Sign in to continue your journey' : 'Create your account to start planning'}</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('login')
              setError('')
              setSuccess('')
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('register')
              setError('')
              setSuccess('')
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Your full name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
            {loading ? (
              <span className="loading-inline">
                <span className="loading-dot" />
                Please wait...
              </span>
            ) : mode === 'login' ? 'Login' : 'Create Account'}
          </button>

          {googleEnabled && (
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="auth-google-btn__icon">G</span>
              Continue with Google
            </button>
          )}

          {googleEnabled && (
            <p className="auth-google-note">
              Secure Google sign-in with backend token exchange.
            </p>
          )}
        </form>

        <div className="auth-help">
          <p>Admin email is controlled by VITE_ADMIN_EMAIL in your env</p>
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
