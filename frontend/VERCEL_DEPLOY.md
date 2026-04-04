# Deploying GigInsure Frontend to Vercel

## One-time setup (do this before importing to Vercel)

### 1. Import the project
- Go to https://vercel.com/new
- Connect your GitHub repo (or upload the folder)
- **Set Root Directory to `frontend`** ← very important

### 2. Build settings (Vercel auto-detects these from vercel.json)
| Setting | Value |
|---|---|
| Framework Preset | Create React App |
| Root Directory | `frontend` |
| Build Command | `yarn build` |
| Output Directory | `build` |
| Install Command | `yarn install` |

### 3. Environment variables
In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `https://your-deployed-backend.com` | Production, Preview, Development |

> ⚠️ No trailing slash on the URL. Example: `https://giginsure-api.onrender.com`

### 4. Backend CORS — required for cookies to work
Your backend uses `withCredentials: true` (session cookies). For this to work cross-origin, your Python backend **must** allow the Vercel domain.

In `backend/server.py`, update your CORS middleware to include your Vercel URL:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                    # local dev
        "https://your-app.vercel.app",             # Vercel production URL
        "https://your-custom-domain.com",          # if you added a custom domain
    ],
    allow_credentials=True,   # ← must be True for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> Without `allow_credentials=True` and the correct origin, login will silently fail.

---

## Changes made to the frontend for Vercel compatibility

| File | Change | Why |
|---|---|---|
| `vercel.json` | Created | SPA rewrites (React Router), caching headers, CI=false |
| `package.json` | Removed `@emergentbase/visual-edits` | Private platform package; breaks Vercel `yarn install` |
| `package.json` | Added `dotenv` to devDeps | Was used in craco.config.js but not listed |
| `package.json` | Build script uses `GENERATE_SOURCEMAP=false` | Avoids OOM on Vercel's free tier |
| `craco.config.js` | Removed health-check plugin + visual-edits | Dev-platform tooling not needed in production |
| `.env.example` | Created | Documents required environment variables |

---

## Local development (unchanged)
```bash
cd frontend
cp .env.example .env.local
# edit .env.local and set REACT_APP_BACKEND_URL=http://localhost:8000
yarn install
yarn start
```
