const express = require('express')
const cors = require('cors')
const { CLIENT_ORIGIN } = require('./config/env')
const { requestLogger } = require('./middlewares/requestLogger')
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware')

const healthRoutes = require('./routes/healthRoutes')
const authRoutes = require('./routes/authRoutes')
const tripRoutes = require('./routes/tripRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
