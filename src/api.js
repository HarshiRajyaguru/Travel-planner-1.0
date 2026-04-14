import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db, firebaseConfigError } from './firebase'

const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

function toFriendlyError(error) {
  const code = error?.code || ''

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Invalid email or password'
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Email is already registered'
  }
  if (code.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters'
  }
  if (code.includes('auth/invalid-email')) {
    return 'Please enter a valid email address'
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network error: please check your internet connection'
  }
  if (code.includes('permission-denied')) {
    return 'Permission denied by Firestore rules'
  }

  return error?.message || 'Request failed'
}

function ensureFirebaseReady() {
  if (!auth || !db || firebaseConfigError) {
    const err = new Error(firebaseConfigError || 'Firebase is not configured')
    err.status = 500
    throw err
  }
}

function deriveRole(email, explicitRole, claims = {}) {
  if (claims?.admin === true) return 'admin'
  if (explicitRole === 'admin') return 'admin'
  if (ADMIN_EMAIL && String(email || '').toLowerCase() === ADMIN_EMAIL) return 'admin'
  return 'user'
}

function toUserView(authUser, profile = {}, claims = {}) {
  return {
    id: authUser.uid,
    name: profile.name || authUser.displayName || 'User',
    email: authUser.email,
    role: deriveRole(authUser.email, profile.role, claims),
    createdAt: profile.createdAt || new Date().toISOString(),
  }
}

async function ensureUserProfile(authUser, fallbackName = '') {
  ensureFirebaseReady()
  const ref = doc(db, 'users', authUser.uid)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) {
    return snapshot.data()
  }

  const payload = {
    name: fallbackName || authUser.displayName || 'User',
    email: authUser.email,
    role: deriveRole(authUser.email),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  }

  await setDoc(ref, payload)
  return payload
}

async function updateLastLogin(authUser) {
  ensureFirebaseReady()
  const ref = doc(db, 'users', authUser.uid)
  await setDoc(ref, { lastLoginAt: new Date().toISOString(), email: authUser.email }, { merge: true })
}

async function getAuthContext(options = {}) {
  ensureFirebaseReady()
  const { forceTokenRefresh = false, tolerateProfileFailure = false } = options

  const user = auth.currentUser
  if (!user) {
    const err = new Error('Please login first')
    err.status = 401
    throw err
  }

  const tokenResult = await user.getIdTokenResult(forceTokenRefresh)

  let profile = null
  if (tolerateProfileFailure) {
    try {
      profile = await ensureUserProfile(user)
    } catch {
      profile = {
        name: user.displayName || 'User',
        email: user.email,
        role: 'user',
        createdAt: new Date().toISOString(),
      }
    }
  } else {
    profile = await ensureUserProfile(user)
  }

  const claims = tokenResult?.claims || {}
  const role = deriveRole(user.email, profile.role, claims)

  return {
    authUser: user,
    profile,
    token: tokenResult.token,
    claims,
    role,
    userView: toUserView(user, profile, claims),
  }
}

async function requireAdminContext() {
  const ctx = await getAuthContext({ forceTokenRefresh: true })
  if (ctx.role !== 'admin') {
    const err = new Error('Admin access required')
    err.status = 403
    throw err
  }
  return ctx
}

function normalizeTrip(id, data) {
  return {
    id,
    userId: data.userId,
    destination: data.destination,
    country: data.country,
    type: data.type || 'City',
    startDate: data.startDate,
    endDate: data.endDate,
    budget: Number(data.budget || 0),
    currency: data.currency || 'USD',
    notes: data.notes || '',
    favorite: Boolean(data.favorite),
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

function sortTripsNewest(trips) {
  return trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

async function withFriendlyErrors(task) {
  try {
    return await task()
  } catch (error) {
    if (error?.status) throw error
    throw new Error(toFriendlyError(error))
  }
}

export const api = {
  register: (name, email, password) => withFriendlyErrors(async () => {
    ensureFirebaseReady()
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() })
    }

    const profile = {
      name: name?.trim() || credential.user.displayName || 'User',
      email: credential.user.email,
      role: deriveRole(credential.user.email),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }

    await setDoc(doc(db, 'users', credential.user.uid), profile, { merge: true })
    const tokenResult = await credential.user.getIdTokenResult(true)
    return {
      token: tokenResult.token,
      user: toUserView(credential.user, profile, tokenResult.claims || {}),
    }
  }),

  login: (email, password) => withFriendlyErrors(async () => {
    ensureFirebaseReady()
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const profile = await ensureUserProfile(credential.user)
    await updateLastLogin(credential.user)
    const tokenResult = await credential.user.getIdTokenResult(true)

    return {
      token: tokenResult.token,
      user: toUserView(credential.user, profile, tokenResult.claims || {}),
    }
  }),

  loginWithGoogle: () => withFriendlyErrors(async () => {
    ensureFirebaseReady()
    const credential = await signInWithPopup(auth, googleProvider)
    const profile = await ensureUserProfile(credential.user, credential.user.displayName || 'User')
    await updateLastLogin(credential.user)
    const tokenResult = await credential.user.getIdTokenResult(true)

    return {
      token: tokenResult.token,
      user: toUserView(credential.user, profile, tokenResult.claims || {}),
    }
  }),

  logout: () => withFriendlyErrors(async () => {
    ensureFirebaseReady()
    await signOut(auth)
    return { success: true }
  }),

  me: () => withFriendlyErrors(async () => {
    const ctx = await getAuthContext({ forceTokenRefresh: true, tolerateProfileFailure: true })
    return { token: ctx.token, user: ctx.userView }
  }),

  getTrips: () => withFriendlyErrors(async () => {
    const ctx = await getAuthContext()
    const q = query(collection(db, 'trips'), where('userId', '==', ctx.authUser.uid))
    const snap = await getDocs(q)
    return sortTripsNewest(snap.docs.map((d) => normalizeTrip(d.id, d.data())))
  }),

  addTrip: (trip) => withFriendlyErrors(async () => {
    const ctx = await getAuthContext()
    const payload = {
      userId: ctx.authUser.uid,
      destination: String(trip.destination || '').trim(),
      country: String(trip.country || '').trim(),
      type: trip.type || 'City',
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: Number(trip.budget) || 0,
      currency: trip.currency || 'USD',
      notes: String(trip.notes || ''),
      favorite: Boolean(trip.favorite),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const ref = await addDoc(collection(db, 'trips'), payload)
    return normalizeTrip(ref.id, payload)
  }),

  updateTrip: (id, trip) => withFriendlyErrors(async () => {
    const ctx = await getAuthContext()
    const ref = doc(db, 'trips', id)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const err = new Error('Trip not found')
      err.status = 404
      throw err
    }

    const existing = snap.data()
    const isOwner = existing.userId === ctx.authUser.uid

    if (!isOwner && ctx.role !== 'admin') {
      const err = new Error('You can only edit your own trips')
      err.status = 403
      throw err
    }

    const updatePayload = {
      destination: String(trip.destination || '').trim(),
      country: String(trip.country || '').trim(),
      type: trip.type || 'City',
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: Number(trip.budget) || 0,
      currency: trip.currency || 'USD',
      notes: String(trip.notes || ''),
      favorite: Boolean(trip.favorite),
      updatedAt: new Date().toISOString(),
    }

    await updateDoc(ref, updatePayload)
    return normalizeTrip(id, { ...existing, ...updatePayload })
  }),

  deleteTrip: (id) => withFriendlyErrors(async () => {
    const ctx = await getAuthContext()
    const ref = doc(db, 'trips', id)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const err = new Error('Trip not found')
      err.status = 404
      throw err
    }

    const existing = snap.data()
    const isOwner = existing.userId === ctx.authUser.uid

    if (!isOwner && ctx.role !== 'admin') {
      const err = new Error('You can only delete your own trips')
      err.status = 403
      throw err
    }

    await deleteDoc(ref)
    return { success: true }
  }),

  getAdminStats: () => withFriendlyErrors(async () => {
    await requireAdminContext()
    const [usersSnap, tripsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'trips')),
    ])

    const users = usersSnap.docs.map((d) => d.data())
    const trips = tripsSnap.docs.map((d) => d.data())

    return {
      users: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      trips: trips.length,
      totalBudget: trips.reduce((sum, t) => sum + Number(t.budget || 0), 0),
    }
  }),

  getAdminUsers: () => withFriendlyErrors(async () => {
    await requireAdminContext()
    const [usersSnap, tripsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'trips')),
    ])

    const tripsByUser = {}
    tripsSnap.docs.forEach((tripDoc) => {
      const tripData = tripDoc.data()
      const key = tripData.userId
      if (!tripsByUser[key]) tripsByUser[key] = []
      tripsByUser[key].push(tripData)
    })

    return usersSnap.docs.map((userDoc) => {
      const userData = userDoc.data()
      const userTrips = tripsByUser[userDoc.id] || []
      return {
        id: userDoc.id,
        name: userData.name || 'User',
        email: userData.email || '',
        role: userData.role || 'user',
        createdAt: userData.createdAt || '',
        tripCount: userTrips.length,
        totalBudget: userTrips.reduce((sum, t) => sum + Number(t.budget || 0), 0),
      }
    })
  }),

  getAdminTrips: () => withFriendlyErrors(async () => {
    await requireAdminContext()
    const [usersSnap, tripsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'trips')),
    ])

    const userMap = {}
    usersSnap.docs.forEach((u) => {
      userMap[u.id] = u.data()
    })

    const trips = tripsSnap.docs.map((tripDoc) => {
      const trip = normalizeTrip(tripDoc.id, tripDoc.data())
      const owner = userMap[trip.userId]
      return {
        ...trip,
        ownerName: owner?.name || 'Unassigned',
        ownerEmail: owner?.email || 'Unassigned',
      }
    })

    return sortTripsNewest(trips)
  }),
}



