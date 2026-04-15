# Travel Planner

Travel planner web app with React + Vite frontend and API backend support.

## Project Structure

- `frontend/` - React + Vite app
- `backend/` - Express REST API
- `runlogs/` - runtime logs

## Quick Run (Dev)

```bash
npm install
copy frontend\.env.example frontend\.env
npm run dev:all
```

`dev:all` starts both:
- Frontend (`frontend`, Vite) on `http://localhost:5173`
- Backend (`backend`, Express) on its configured port

If you prefer split terminals:
- `npm run dev:client`
- `npm run dev:server`

## Required Env (Render Backend + Google Login)

Frontend `.env` (in `frontend/.env`):
- `VITE_API_BASE_URL`: backend base URL (example: `https://travel-planner-1-0.onrender.com`)
- `VITE_ENABLE_GOOGLE_LOGIN`: `true` to show Google login button, `false` to hide

Backend env on Render must also be configured for Google OAuth if enabled:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (or backend-specific callback variable)
- `JWT_SECRET`
- CORS allowlist including your frontend origin

## Scripts

- `npm run dev` - frontend only
- `npm run start` - frontend only
- `npm run dev:client` - frontend only
- `npm run dev:server` - backend only
- `npm run dev:all` - frontend + backend together
- `npm run build` - frontend production build
- `npm run preview` - frontend preview build

## Deploy (Recommended: Vercel + Railway)

1. Deploy backend (`backend/`) on Railway
- Create new Railway project from GitHub repo.
- Set Root Directory to `backend`.
- Add environment variables:
  - `PORT=3001`
  - `NODE_ENV=production`
  - `TOKEN_SECRET=<strong-random-secret>`
  - `TOKEN_TTL_MS=604800000`
  - `GOOGLE_CLIENT_ID=<optional-if-google-login-enabled>`
  - `CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app`
- Deploy and copy backend public URL, e.g. `https://your-backend.up.railway.app`

2. Deploy frontend (`frontend/`) on Vercel
- Import the same GitHub repo in Vercel.
- Set Root Directory to `frontend`.
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL=https://your-backend.up.railway.app`
  - `VITE_ENABLE_GOOGLE_LOGIN=false` (or `true` if configured)
- Deploy and copy frontend URL.

3. Final CORS update on Railway
- Update backend `CLIENT_ORIGIN` to your exact Vercel URL.
- If you use preview deployments too, add them comma-separated:
  - `CLIENT_ORIGIN=https://app.vercel.app,https://app-git-main-user.vercel.app`
