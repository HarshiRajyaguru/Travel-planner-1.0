const express = require('express')
const { asyncHandler } = require('../utils/asyncHandler')
const tripController = require('../controllers/tripController')
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(requireAuth, requireAdmin)
router.get('/stats', asyncHandler(tripController.adminStats))
router.get('/users', asyncHandler(tripController.adminUsers))
router.get('/trips', asyncHandler(tripController.adminTrips))

module.exports = router
