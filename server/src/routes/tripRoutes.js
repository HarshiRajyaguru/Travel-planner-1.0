const express = require('express')
const { asyncHandler } = require('../utils/asyncHandler')
const tripController = require('../controllers/tripController')
const { requireAuth } = require('../middlewares/authMiddleware')

const router = express.Router()

router.get('/', requireAuth, asyncHandler(tripController.listTrips))
router.post('/', requireAuth, asyncHandler(tripController.createTrip))
router.put('/:id', requireAuth, asyncHandler(tripController.updateTrip))
router.delete('/:id', requireAuth, asyncHandler(tripController.removeTrip))

module.exports = router
