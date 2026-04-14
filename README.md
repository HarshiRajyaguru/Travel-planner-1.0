# Travel Planner (React + Firebase)

Travel planner with Firebase Authentication, Firestore trip storage, and admin dashboard support.

## Stack

- React + Vite
- Firebase Auth (Email/Password)
- Firestore
- Firebase Admin SDK helper script (custom admin claims)

## Setup

1. Install deps
```bash
npm install
```

2. Create env file
```bash
copy .env.example .env
```

3. Fill `.env` values from Firebase Web App config.

4. Verify env values
```bash
npm run verify:firebase
```

5. In Firebase Console:
- Enable Email/Password sign-in
- Create Firestore database
- Publish rules from `firestore.rules`

6. Run app
```bash
npm run dev
```

Open: `http://localhost:5173`

## Admin Access

### Option A (quick)
Set `VITE_ADMIN_EMAIL` in `.env`.

### Option B (recommended secure)
Use Firebase custom claims.

1. Download Firebase service-account JSON from Firebase Console.
2. Set environment variable:
```bash
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
```
3. Promote user:
```bash
npm run promote-admin -- user@example.com
```
4. Re-login that user.

## Firebase Rules/Deploy Files

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `.firebaserc.example`

## Useful Scripts

- `npm run dev`
- `npm run build`
- `npm run verify:firebase`
- `npm run promote-admin -- user@example.com`
- `npm run firebase:login`
- `npm run firebase:emulators`
- `npm run firebase:deploy`

## Notes

- Frontend is fully Firebase-driven now.
- Express backend files remain in repo but are not required for auth/trip flow.
