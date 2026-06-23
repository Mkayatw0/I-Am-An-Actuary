# Deployment Guide

## Overview

| Service | Platform | Directory |
|---------|----------|-----------|
| Frontend | Vercel | `apps/frontend` |
| Backend | Railway | `apps/backend` |
| Database | Supabase | N/A (managed) |

---

## 1. Supabase (Database)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   - `apps/backend/app/core/supabase_migration.sql` — creates `profiles` table
   - `apps/backend/app/core/chat_migration.sql` — creates `conversations` and `messages` tables
3. Copy the **Project URL**, **anon key**, and **service_role key** from **Settings → API**

---

## 2. Backend (Railway)

### Option A: Deploy from GitHub

1. Push the repo to GitHub
2. In Railway, click **New Project → Deploy from GitHub repo**
3. Set **Root Directory** to `apps/backend`
4. Add environment variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key |
| `QWEN3_API_KEY` | Your Qwen3 API key |
| `LLM_PROVIDER` | `qwen3` |
| `QWEN3_API_URL` | `https://api.qwen.ai/v1` |
| `QWEN3_MODEL` | `qwen3` |
| `INTERNAL_API_KEY` | A secure random string |
| `DEBUG` | `false` |

5. Railway automatically detects `railway.json` and `Dockerfile`

### Option B: Deploy using Railway CLI

```bash
cd apps/backend
railway login
railway init
railway up
railway variables set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... QWEN3_API_KEY=...
```

---

## 3. Frontend (Vercel)

### Option A: Deploy from GitHub

1. In Vercel, click **Add New → Project**
2. Import your GitHub repo
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `apps/frontend` (or the repo root — Vercel uses `vercel.json`)
5. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_BACKEND_INTERNAL_URL` | Your Railway backend URL (e.g. `https://backend.up.railway.app`) |
| `INTERNAL_API_KEY` | Same value as backend |

### Option B: Deploy using Vercel CLI

```bash
npx vercel --prod
```

---

## 4. CORS Configuration

Update the `allow_origins` list in `apps/backend/app/main.py` to include your production frontend URL:

```python
allow_origins=[
    "http://localhost:3000",
    "https://your-frontend.vercel.app",  # ← add this
    "https://iamanactuary.app",          # ← add this later
],
```

---

## 5. Verifying Deployment

### Health check

```bash
curl https://your-backend.up.railway.app/health
# {"status":"healthy","version":"0.1.0",...}

curl https://your-backend.up.railway.app/
# {"message":"I Am An Actuary API","version":"0.1.0"}
```

### Auth flow

1. Visit `https://your-frontend.vercel.app`
2. Click **Sign Up** → create account
3. You should be redirected to the dashboard
4. Click **Chat** → create a new conversation → send a message

---

## 6. Environment Variables Summary

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service_role key |
| `QWEN3_API_KEY` | ✅ | Qwen3 LLM API key |
| `LLM_PROVIDER` | ✅ | `qwen3` |
| `QWEN3_API_URL` | ❌ | Default: `https://api.qwen.ai/v1` |
| `QWEN3_MODEL` | ❌ | Default: `qwen3` |
| `INTERNAL_API_KEY` | ❌ | Default: `dev-api-key-change-in-production` |
| `DEBUG` | ❌ | Default: `true` |

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `NEXT_PUBLIC_BACKEND_INTERNAL_URL` | ✅ | Railway backend URL |
| `INTERNAL_API_KEY` | ❌ | Must match backend value |