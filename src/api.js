import { getAuthData } from './utils/authStorage'

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || 'https://travel-planner-1-0.onrender.com').replace(/\/+$/, '')

function normalizeTrip(data) {
  return {
    ...data,
    id: data.id,
    budget: Number(data.budget || 0),
    favorite: Boolean(data.favorite),
  }
}

function toFriendlyError(error, fallback = 'Request failed') {
  const message = String(error?.message || '')
  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach backend. Check VITE_API_BASE_URL and backend status.'
  }
  return message || fallback
}

async function request(path, options = {}) {
  const { auth = true, body, headers = {}, method = 'GET' } = options
  const authData = getAuthData()

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (auth && authData?.token) {
    finalHeaders.Authorization = `Bearer ${authData.token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return data
}

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
    return request('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: { name, email, password },
    })
  }),

  login: (email, password) => withFriendlyErrors(async () => {
    return request('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    })
  }),

  loginWithGoogle: () => withFriendlyErrors(async () => {
    const payload = await request('/api/auth/google', {
      method: 'POST',
      auth: false,
      body: {},
    }).catch((err) => {
      if (err?.status === 404 || err?.status === 405) {
        const unsupported = new Error('Google login is not enabled on this backend yet.')
        unsupported.status = err.status
        throw unsupported
      }
      throw err
    })

    return payload
  }),

  logout: () => Promise.resolve({ success: true }),

  me: () => withFriendlyErrors(async () => {
    const data = await request('/api/auth/me')
    const authData = getAuthData()
    return { token: authData?.token || null, user: data.user }
  }),

  getTrips: () => withFriendlyErrors(async () => {
    const data = await request('/api/trips')
    return Array.isArray(data) ? data.map(normalizeTrip) : []
  }),

  addTrip: (trip) => withFriendlyErrors(async () => {
    const data = await request('/api/trips', {
      method: 'POST',
      body: trip,
    })
    return normalizeTrip(data)
  }),

  updateTrip: (id, trip) => withFriendlyErrors(async () => {
    const data = await request(`/api/trips/${id}`, {
      method: 'PUT',
      body: trip,
    })
    return normalizeTrip(data)
  }),

  deleteTrip: (id) => withFriendlyErrors(async () => {
    return request(`/api/trips/${id}`, {
      method: 'DELETE',
    })
  }),

  getAdminStats: () => withFriendlyErrors(async () => {
    return request('/api/admin/stats')
  }),

  getAdminUsers: () => withFriendlyErrors(async () => {
    return request('/api/admin/users')
  }),

  getAdminTrips: () => withFriendlyErrors(async () => {
    const data = await request('/api/admin/trips')
    return Array.isArray(data) ? data.map(normalizeTrip) : []
  }),
}
