const logger = require('../utils/logger')

function notFoundHandler(req, res, _next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
}

function errorHandler(err, _req, res, _next) {
  const status = Number(err.status || 500)
  const message = status >= 500 ? 'Internal server error' : err.message

  if (status >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
    })
  }

  res.status(status).json({
    error: message,
    ...(status < 500 && err.details ? { details: err.details } : {}),
  })
}

module.exports = { notFoundHandler, errorHandler }
