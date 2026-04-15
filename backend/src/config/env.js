const fs = require('fs')
const path = require('path')

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq < 0) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

const envPath = path.join(__dirname, '../../.env')
loadDotEnv(envPath)

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'travel-planner-change-this-secret',
  TOKEN_TTL_MS: Number(process.env.TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 7),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
}
