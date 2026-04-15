const authService = require('../services/authService')

async function register(req, res) {
  const result = authService.register(req.body)
  res.status(201).json(result)
}

async function login(req, res) {
  const result = authService.login(req.body)
  res.status(200).json(result)
}

async function google(req, res) {
  const result = await authService.loginWithGoogle(req.body || {})
  res.status(200).json(result)
}

async function me(req, res) {
  res.status(200).json(authService.getMe(req.user))
}

module.exports = { register, login, google, me }
