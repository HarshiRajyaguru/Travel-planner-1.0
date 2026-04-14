const tripService = require('../services/tripService')

async function listTrips(req, res) {
  res.status(200).json(tripService.getTrips(req.user, req.query))
}

async function createTrip(req, res) {
  res.status(201).json(tripService.createTrip(req.user, req.body))
}

async function updateTrip(req, res) {
  res.status(200).json(tripService.updateTrip(req.user, req.params.id, req.body))
}

async function removeTrip(req, res) {
  res.status(200).json(tripService.deleteTrip(req.user, req.params.id))
}

async function adminStats(req, res) {
  res.status(200).json(tripService.getAdminStats())
}

async function adminUsers(req, res) {
  res.status(200).json(tripService.getAdminUsers())
}

async function adminTrips(req, res) {
  res.status(200).json(tripService.getAdminTrips())
}

module.exports = {
  listTrips,
  createTrip,
  updateTrip,
  removeTrip,
  adminStats,
  adminUsers,
  adminTrips,
}
