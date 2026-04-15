const { OAuth2Client } = require('google-auth-library')
const { HttpError } = require('../utils/httpError')
const { GOOGLE_CLIENT_ID } = require('../config/env')
const { hashPassword } = require('../utils/password')
const { signToken, makeAuthPayload } = require('../utils/token')
const { ensureData, persist, sanitizeUser, normalizeEmail } = require('../models/dbStore')

const googleClient = new OAuth2Client()

function validateAuthInput(email, password) {
  if (!email || !String(email).includes('@')) {
    throw new HttpError(400, 'Valid email is required')
  }
  if (!password || String(password).length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters')
  }
}

function sanitizeGoogleInput({ idToken }) {
  const token = String(idToken || '').trim()
  if (!token) {
    throw new HttpError(400, 'Google ID token is required')
  }
  if (!GOOGLE_CLIENT_ID) {
    throw new HttpError(500, 'Google auth is not configured. Missing GOOGLE_CLIENT_ID on server.')
  }
  return token
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
    provider: 'local',
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
  if (!user.passwordHash || !user.salt) throw new HttpError(401, 'Use Google login for this account')

  const { hash } = hashPassword(password, user.salt)
  if (hash !== user.passwordHash) throw new HttpError(401, 'Invalid email or password')

  const payload = makeAuthPayload(user)
  return {
    token: signToken(payload),
    user: sanitizeUser(user),
  }
}

async function loginWithGoogle({ idToken }) {
  const token = sanitizeGoogleInput({ idToken })

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch (_err) {
    throw new HttpError(401, 'Invalid or expired Google token')
  }

  const email = normalizeEmail(payload?.email)
  if (!email || !payload?.email_verified) {
    throw new HttpError(401, 'Google account email is missing or not verified')
  }

  const data = ensureData()
  let user = data.users.find((u) => normalizeEmail(u.email) === email)

  if (!user) {
    const displayName = String(payload?.name || payload?.given_name || email.split('@')[0]).trim()
    user = {
      id: data.nextUserId++,
      name: displayName || 'Traveler',
      email,
      passwordHash: null,
      salt: null,
      role: 'user',
      provider: 'google',
      googleSub: String(payload?.sub || ''),
      avatarUrl: payload?.picture || '',
      createdAt: new Date().toISOString(),
    }
    data.users.push(user)
  } else {
    if (!user.provider) user.provider = 'local'
    if (payload?.picture && !user.avatarUrl) user.avatarUrl = payload.picture
    if (payload?.sub && !user.googleSub) user.googleSub = String(payload.sub)
  }

  persist(data)

  const authPayload = makeAuthPayload(user)
  return {
    token: signToken(authPayload),
    user: sanitizeUser(user),
  }
}

function getMe(user) {
  return { user: sanitizeUser(user) }
}

module.exports = { register, login, loginWithGoogle, getMe }
