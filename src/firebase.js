import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missing = requiredVars.filter((key) => !import.meta.env[key])
const firebaseConfigError = missing.length > 0
  ? `Firebase env missing: ${missing.join(', ')}. Fill .env from .env.example and restart Vite.`
  : null

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = firebaseConfigError ? null : initializeApp(firebaseConfig)
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null

const analytics = app && typeof window !== 'undefined'
  ? analyticsSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null)
  : Promise.resolve(null)

export { app, auth, db, analytics, firebaseConfigError }
