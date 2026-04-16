import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db, firebaseConfigError } from './firebase'

const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

function requireFirebase() {
  if (firebaseConfigError || !auth || !db) {
    throw new Error(firebaseConfigError || 'Firebase is not configured. Update frontend/.env and restart Vite.')
  }
}

function requireUser() {
  requireFirebase()
  const user = auth.currentUser
  if (!user) {
    const error = new Error('Please login first.')
    error.status = 401
    throw error
  }
  return user
}

function normalizeTrip(docSnap) {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    destination: data.destination || '',
    country: data.country || '',
    type: data.type || 'City',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    budget: Number(data.budget || 0),
    currency: data.currency || 'USD',
    notes: data.notes || '',
    favorite: Boolean(data.favorite),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
    userId: data.userId || '',
    ownerEmail: data.ownerEmail || '',
    ownerName: data.ownerName || '',
  }
}

function roleForEmail(email) {
  return email && ADMIN_EMAIL && String(email).trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
}

async function ensureUserProfile(firebaseUser, extra = {}) {
  requireFirebase()
  if (!firebaseUser?.uid) {
    throw new Error('No authenticated Firebase user found.')
  }

  const userRef = doc(db, 'users', firebaseUser.uid)
  const existing = await getDoc(userRef)
  const baseData = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: extra.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Traveler'),
    role: existing.data()?.role || roleForEmail(firebaseUser.email),
    provider: extra.provider || firebaseUser.providerData?.[0]?.providerId || 'password',
    photoURL: extra.photoURL || firebaseUser.photoURL || '',
    lastLoginAt: serverTimestamp(),
  }

  if (!existing.exists()) {
    await setDoc(userRef, {
      ...baseData,
      createdAt: serverTimestamp(),
    })
  } else {
    await setDoc(userRef, baseData, { merge: true })
  }

  const saved = await getDoc(userRef)
  const profile = saved.data() || baseData
  return {
    uid: firebaseUser.uid,
    email: profile.email || firebaseUser.email || '',
    name: profile.name || firebaseUser.displayName || 'Traveler',
    role: profile.role || 'user',
    provider: profile.provider || 'password',
    photoURL: profile.photoURL || firebaseUser.photoURL || '',
    createdAt: profile.createdAt?.toDate?.()?.toISOString?.() || profile.createdAt || new Date().toISOString(),
  }
}

function validateTrip(input) {
  if (!String(input?.destination || '').trim()) throw new Error('Destination is required')
  if (!String(input?.country || '').trim()) throw new Error('Country is required')
  if (!String(input?.startDate || '').trim()) throw new Error('Start date is required')
  if (!String(input?.endDate || '').trim()) throw new Error('End date is required')
  if (new Date(input.endDate) < new Date(input.startDate)) {
    throw new Error('End date must be after start date')
  }
}

export const api = {
  register: async (name, email, password) => {
    requireFirebase()
    if (!String(name || '').trim()) throw new Error('Name is required')

    const result = await createUserWithEmailAndPassword(auth, email, password)
    if (String(name).trim()) {
      await updateProfile(result.user, { displayName: String(name).trim() })
    }
    const user = await ensureUserProfile(result.user, {
      name: String(name).trim(),
      provider: 'password',
    })
    const token = await result.user.getIdToken()
    return { token, user }
  },

  login: async (email, password) => {
    requireFirebase()
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = await ensureUserProfile(result.user)
    const token = await result.user.getIdToken()
    return { token, user }
  },

  loginWithGoogle: async (googlePayload = {}) => {
    const firebaseUser = requireUser()
    const user = await ensureUserProfile(firebaseUser, {
      name: googlePayload.name || firebaseUser.displayName || '',
      photoURL: googlePayload.photoURL || firebaseUser.photoURL || '',
      provider: 'google.com',
    })
    const token = await firebaseUser.getIdToken()
    return { token, user }
  },

  logout: async () => {
    requireFirebase()
    await signOut(auth)
    return { success: true }
  },

  me: async () => {
    const firebaseUser = requireUser()
    const user = await ensureUserProfile(firebaseUser)
    const token = await firebaseUser.getIdToken()
    return { token, user }
  },

  getTrips: async () => {
    const firebaseUser = requireUser()
    const tripsRef = collection(db, 'trips')
    const tripsQuery = query(tripsRef, where('userId', '==', firebaseUser.uid), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(tripsQuery)
    return snapshot.docs.map(normalizeTrip)
  },

  addTrip: async (trip) => {
    const firebaseUser = requireUser()
    validateTrip(trip)
    const user = await ensureUserProfile(firebaseUser)
    const tripsRef = collection(db, 'trips')
    const payload = {
      userId: firebaseUser.uid,
      ownerEmail: user.email,
      ownerName: user.name,
      destination: String(trip.destination).trim(),
      country: String(trip.country).trim(),
      type: trip.type || 'City',
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: Number(trip.budget) || 0,
      currency: trip.currency || 'USD',
      notes: String(trip.notes || ''),
      favorite: Boolean(trip.favorite),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const created = await addDoc(tripsRef, payload)
    const snap = await getDoc(created)
    return normalizeTrip(snap)
  },

  updateTrip: async (id, trip) => {
    requireUser()
    validateTrip(trip)
    const tripRef = doc(db, 'trips', String(id))
    await updateDoc(tripRef, {
      destination: String(trip.destination).trim(),
      country: String(trip.country).trim(),
      type: trip.type || 'City',
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: Number(trip.budget) || 0,
      currency: trip.currency || 'USD',
      notes: String(trip.notes || ''),
      favorite: Boolean(trip.favorite),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(tripRef)
    return normalizeTrip(snap)
  },

  deleteTrip: async (id) => {
    requireUser()
    await deleteDoc(doc(db, 'trips', String(id)))
    return { success: true }
  },

  getAdminStats: async () => {
    requireUser()
    const [usersSnapshot, tripsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'trips')),
    ])
    const trips = tripsSnapshot.docs.map((tripDoc) => tripDoc.data())
    const users = usersSnapshot.docs.map((userDoc) => userDoc.data())
    return {
      users: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      trips: trips.length,
      totalBudget: trips.reduce((sum, trip) => sum + Number(trip.budget || 0), 0),
    }
  },

  getAdminUsers: async () => {
    requireUser()
    const [usersSnapshot, tripsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'trips')),
    ])
    const trips = tripsSnapshot.docs.map((tripDoc) => tripDoc.data())
    return usersSnapshot.docs.map((userDoc) => {
      const user = userDoc.data()
      const userTrips = trips.filter((trip) => trip.userId === userDoc.id)
      return {
        id: userDoc.id,
        name: user.name || 'Traveler',
        email: user.email || '',
        role: user.role || 'user',
        createdAt: user.createdAt?.toDate?.()?.toISOString?.() || user.createdAt || '',
        tripCount: userTrips.length,
        totalBudget: userTrips.reduce((sum, trip) => sum + Number(trip.budget || 0), 0),
      }
    })
  },

  getAdminTrips: async () => {
    requireUser()
    const snapshot = await getDocs(query(collection(db, 'trips'), orderBy('createdAt', 'desc')))
    return snapshot.docs.map(normalizeTrip)
  },
}
