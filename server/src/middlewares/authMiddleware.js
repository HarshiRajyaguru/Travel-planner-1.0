const { verifyToken } = require('../utils/token')
const { ensureData } = require('../models/dbStore')
const { HttpError } = require('../utils/httpError')

function requireAuth(req, _res, next) {
  const auth = req.headers.authorization || ''
  const [scheme, token] = auth.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authorization token missing'))
  }

  const payload = verifyToken(token)
  if (!payload) {
    return next(new HttpError(401, 'Invalid or expired token'))
  }

  const data = ensureData()
  const user = data.users.find((u) => u.id === payload.sub)
  if (!user) {
    return next(new HttpError(401, 'User no longer exists'))
  }

  req.user = user
  next()
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Admin access required'))
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
