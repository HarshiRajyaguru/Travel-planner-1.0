const path = require('path')
const { read, write } = require('../../db')
const { hashPassword } = require('../utils/password')

const DEFAULT_ADMIN_EMAIL = 'admin@travelplanner.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

function sanitizeUser(user) {
  const { passwordHash, salt, ...safe } = user
  return safe
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function ensureData() {
  const data = read()

  if (!Array.isArray(data.trips)) data.trips = []
  if (!Number.isFinite(data.nextId)) {
    const maxTripId = data.trips.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0)
    data.nextId = maxTripId + 1
  }

  if (!Array.isArray(data.users)) data.users = []
  if (!Number.isFinite(data.nextUserId)) {
    const maxUserId = data.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0)
    data.nextUserId = maxUserId + 1
  }

  if (data.users.length === 0) {
    const { salt, hash } = hashPassword(DEFAULT_ADMIN_PASSWORD)
    data.users.push({
      id: data.nextUserId++,
      name: 'Administrator',
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: hash,
      salt,
      role: 'admin',
      createdAt: new Date().toISOString(),
    })
  }

  const fallbackAdmin = data.users.find((u) => u.role === 'admin') || data.users[0]
  for (const trip of data.trips) {
    if (!('userId' in trip) || trip.userId == null) {
      trip.userId = fallbackAdmin ? fallbackAdmin.id : null
    }
    trip.favorite = trip.favorite ? 1 : 0
  }

  write(data)
  return data
}

function persist(data) {
  write(data)
}

module.exports = {
  DATA_FILE: path.join(__dirname, '../../data.json'),
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  ensureData,
  persist,
  sanitizeUser,
  normalizeEmail,
}
