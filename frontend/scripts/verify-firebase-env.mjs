import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const envPath = path.join(root, '.env')

if (!fs.existsSync(envPath)) {
  console.error('Missing .env file. Create it from .env.example first.')
  process.exit(1)
}

const content = fs.readFileSync(envPath, 'utf-8')
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const map = new Map()
for (const line of content.split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const idx = t.indexOf('=')
  if (idx < 0) continue
  map.set(t.slice(0, idx).trim(), t.slice(idx + 1).trim())
}

const missing = required.filter((k) => !map.get(k) || map.get(k).includes('your_'))
if (missing.length > 0) {
  console.error('Firebase env is incomplete. Missing or placeholder values:')
  for (const item of missing) console.error(`- ${item}`)
  process.exit(1)
}

console.log('Firebase env looks good.')
if (!map.get('VITE_ADMIN_EMAIL')) {
  console.log('Tip: set VITE_ADMIN_EMAIL if you want admin panel access.')
}
