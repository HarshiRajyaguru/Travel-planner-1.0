const { HttpError } = require('../utils/httpError')
const { ensureData, persist } = require('../models/dbStore')

function isTripOwnerOrAdmin(user, trip) {
  return user.role === 'admin' || trip.userId === user.id
}

function validateTrip(input) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Invalid trip payload')
  if (!String(input.destination || '').trim()) throw new HttpError(400, 'Destination is required')
  if (!String(input.country || '').trim()) throw new HttpError(400, 'Country is required')
  if (!String(input.startDate || '').trim()) throw new HttpError(400, 'Start date is required')
  if (!String(input.endDate || '').trim()) throw new HttpError(400, 'End date is required')
  if (new Date(input.endDate) < new Date(input.startDate)) {
    throw new HttpError(400, 'End date must be after start date')
  }
}

function getTrips(user, query) {
  const data = ensureData()
  const trips = user.role === 'admin' && query?.all === 'true'
    ? data.trips
    : data.trips.filter((trip) => trip.userId === user.id)
  return [...trips].reverse()
}

function createTrip(user, input) {
  validateTrip(input)

  const data = ensureData()
  const trip = {
    id: data.nextId++,
    userId: user.id,
    destination: String(input.destination).trim(),
    country: String(input.country).trim(),
    type: input.type || 'City',
    startDate: input.startDate,
    endDate: input.endDate,
    budget: Number(input.budget) || 0,
    currency: input.currency || 'USD',
    notes: String(input.notes || ''),
    favorite: input.favorite ? 1 : 0,
    createdAt: new Date().toISOString(),
  }

  data.trips.push(trip)
  persist(data)
  return trip
}

function updateTrip(user, tripId, input) {
  validateTrip(input)

  const data = ensureData()
  const id = Number(tripId)
  const idx = data.trips.findIndex((trip) => trip.id === id)
  if (idx === -1) throw new HttpError(404, 'Trip not found')

  if (!isTripOwnerOrAdmin(user, data.trips[idx])) {
    throw new HttpError(403, 'You can only edit your own trips')
  }

  data.trips[idx] = {
    ...data.trips[idx],
    destination: String(input.destination).trim(),
    country: String(input.country).trim(),
    type: input.type || 'City',
    startDate: input.startDate,
    endDate: input.endDate,
    budget: Number(input.budget) || 0,
    currency: input.currency || 'USD',
    notes: String(input.notes || ''),
    favorite: input.favorite ? 1 : 0,
  }

  persist(data)
  return data.trips[idx]
}

function deleteTrip(user, tripId) {
  const data = ensureData()
  const id = Number(tripId)
  const idx = data.trips.findIndex((trip) => trip.id === id)
  if (idx === -1) throw new HttpError(404, 'Trip not found')

  if (!isTripOwnerOrAdmin(user, data.trips[idx])) {
    throw new HttpError(403, 'You can only delete your own trips')
  }

  data.trips.splice(idx, 1)
  persist(data)
  return { success: true }
}

function getAdminStats() {
  const data = ensureData()
  return {
    users: data.users.length,
    admins: data.users.filter((u) => u.role === 'admin').length,
    trips: data.trips.length,
    totalBudget: data.trips.reduce((sum, t) => sum + Number(t.budget || 0), 0),
  }
}

function getAdminUsers() {
  const data = ensureData()
  return data.users.map((user) => {
    const trips = data.trips.filter((trip) => trip.userId === user.id)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      tripCount: trips.length,
      totalBudget: trips.reduce((sum, t) => sum + Number(t.budget || 0), 0),
    }
  })
}

function getAdminTrips() {
  const data = ensureData()
  return data.trips
    .map((trip) => {
      const owner = data.users.find((user) => user.id === trip.userId)
      return {
        ...trip,
        ownerName: owner ? owner.name : 'Unassigned',
        ownerEmail: owner ? owner.email : 'Unassigned',
      }
    })
    .reverse()
}

module.exports = {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getAdminStats,
  getAdminUsers,
  getAdminTrips,
}
