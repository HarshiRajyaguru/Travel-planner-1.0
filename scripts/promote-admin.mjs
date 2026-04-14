import admin from 'firebase-admin'

const email = process.argv[2]
if (!email || !email.includes('@')) {
  console.error('Usage: npm run promote-admin -- user@example.com')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path.')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp()
}

const auth = admin.auth()

try {
  const user = await auth.getUserByEmail(email)
  const existingClaims = user.customClaims || {}
  await auth.setCustomUserClaims(user.uid, { ...existingClaims, admin: true })
  console.log(`Admin claim set for ${email} (uid: ${user.uid})`)
} catch (error) {
  console.error('Failed to promote admin:', error.message)
  process.exit(1)
}
