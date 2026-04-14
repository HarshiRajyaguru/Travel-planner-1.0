const { HttpError } = require('../utils/httpError')
const { hashPassword } = require('../utils/password')
const { signToken, makeAuthPayload } = require('../utils/token')
const { ensureData, persist, sanitizeUser, normalizeEmail } = require('../models/dbStore')

function validateAuthInput(email, password) {
  if (!email || !String(email).includes('@')) {
    throw new HttpError(400, 'Valid email is required')
  }
  if (!password || String(password).length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters')
  }
}

function register({ name, email, password }) {
  const trimmedName = String(name || '').trim()
  if (!trimmedName) throw new HttpError(400, 'Name is required')

  const normalizedEmail = normalizeEmail(email)
  validateAuthInput(normalizedEmail, password)

  const data = ensureData()
  if (data.users.some((u) => normalizeEmail(u.email) === normalizedEmail)) {
    throw new HttpError(409, 'Email is already registered')
  }

  const { salt, hash } = hashPassword(password)
  const user = {
    id: data.nextUserId++,
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: hash,
    salt,
    role: 'user',
    createdAt: new Date().toISOString(),
  }

  data.users.push(user)
  persist(data)

  const payload = makeAuthPayload(user)
  return {
    token: signToken(payload),
    user: sanitizeUser(user),
  }
}

function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  validateAuthInput(normalizedEmail, password)

  const data = ensureData()
  const user = data.users.find((u) => normalizeEmail(u.email) === normalizedEmail)
  if (!user) throw new HttpError(401, 'Invalid email or password')

  const { hash } = hashPassword(password, user.salt)
  if (hash !== user.passwordHash) throw new HttpError(401, 'Invalid email or password')

  const payload = makeAuthPayload(user)
  return {
    token: signToken(payload),
    user: sanitizeUser(user),
  }
}

function getMe(user) {
  return { user: sanitizeUser(user) }
}

module.exports = { register, login, getMe }
