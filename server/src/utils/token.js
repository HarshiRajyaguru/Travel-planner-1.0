const crypto = require('crypto')
const { TOKEN_SECRET, TOKEN_TTL_MS } = require('../config/env')

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function signToken(payload) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64Url(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `${header}.${body}.${signature}`
}

function verifyToken(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) return null

  const [header, body, signature] = parts
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  if (signature !== expected) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf-8'))
    if (!payload.exp || Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

function makeAuthPayload(user) {
  const exp = Date.now() + TOKEN_TTL_MS
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
    exp,
  }
}

module.exports = { signToken, verifyToken, makeAuthPayload }
