# Deploy Now (Railway + Vercel)

## What is already done

- Repo is pushed to GitHub with frontend/backend split.
- Backend is deployment-ready for Railway.
- Frontend has `vercel.json` SPA rewrite config.

## Manual Steps (Railway Backend)

1. Open [https://railway.app](https://railway.app), login, click `New Project`.
2. Select `Deploy from GitHub repo`.
3. Choose repo: `HarshiRajyaguru/Travel-planner-1.0`.
4. Set **Root Directory** to `backend`.
5. Add these Railway environment variables:

```env
NODE_ENV=production
PORT=3001
TOKEN_SECRET=replace-with-a-long-random-secret
TOKEN_TTL_MS=604800000
CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app
GOOGLE_CLIENT_ID=
```

6. Deploy and copy Railway public URL:
   `https://<your-railway-service>.up.railway.app`

## Manual Steps (Vercel Frontend)

1. Open [https://vercel.com/new](https://vercel.com/new), import same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add Vercel environment variables:

```env
VITE_API_BASE_URL=https://<your-railway-service>.up.railway.app
VITE_ENABLE_GOOGLE_LOGIN=false
```

5. Deploy and copy Vercel URL:
   `https://<your-vercel-app>.vercel.app`

## Final Link Step (Important)

1. Go back to Railway env vars.
2. Update `CLIENT_ORIGIN` with exact Vercel URL.
3. If needed, include preview domain too (comma-separated):

```env
CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app,https://<your-vercel-preview>.vercel.app
```

4. Redeploy Railway.

## Quick Verification

1. Open backend health URL:
   `https://<your-railway-service>.up.railway.app/api/health`
2. Open frontend URL and test login/trips flow.
