# I Am An Actuary

AI-powered actuarial study platform.

## Architecture

This monorepo contains two applications:

- **`apps/frontend`** — Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **`apps/backend`** — FastAPI (Python)
- **`packages/shared-types`** — Shared TypeScript type definitions

## Prerequisites

- Node.js >= 20.0.0
- Python >= 3.12
- Docker Desktop (for local PostgreSQL with pgvector)

## Quick Start

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Run the frontend (development mode)

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

- Homepage: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Health check (BFF): `http://localhost:3000/api/health`

### 3. Install backend dependencies

```bash
cd apps/backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

### 4. Start the backend

```bash
cd apps/backend
# Ensure virtual environment is activated
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

### 5. Start the database (optional — for local PostgreSQL)

```bash
docker compose -f docker/docker-compose.yml up postgres -d
```

### 6. Configure environment variables

```bash
# Copy the examples and fill in your values
cp .env.example .env
# Or per-app:
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

## Project Structure

```
I_Am_An_Actuary/
├── apps/
│   ├── frontend/          # Next.js 15 application
│   │   └── src/
│   │       ├── app/        # App Router pages & API routes
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx                # Landing page
│   │       │   ├── dashboard/             # Dashboard pages
│   │       │   └── api/health/route.ts    # BFF health endpoint
│   │       ├── components/ # React components
│   │       │   └── ui/     # shadcn/ui primitives
│   │       ├── lib/        # Utilities & client libraries
│   │       └── types/      # TypeScript type definitions
│   └── backend/            # FastAPI application
│       └── app/
│           ├── main.py     # App entry point
│           ├── api/        # Route handlers
│           │   └── health.py
│           ├── core/
│           ├── models/
│           ├── schemas/
│           ├── services/
│           └── agents/
├── packages/
│   └── shared-types/       # Shared TypeScript types
├── docker/
│   └── docker-compose.yml  # Local dev: PostgreSQL
├── docs/                   # Architecture documentation
├── .env.example            # Root environment variables template
├── package.json            # Root workspace config (Turborepo)
├── turbo.json              # Turborepo pipeline config
└── README.md
```

## Available Scripts

### Root (Turborepo)

```bash
npm run dev    # Start all apps in dev mode (requires backend running separately)
npm run build  # Build all apps
npm run lint   # Lint all apps
npm run test   # Test all apps
```

### Frontend only

```bash
cd apps/frontend
npm run dev   # Start Next.js dev server (port 3000)
npm run build # Production build
npm run start # Start production server
```

### Backend only

```bash
cd apps/backend
uvicorn app.main:app --reload  # Dev server (port 8000)
```

## API Endpoints

| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | `/`               | Root (API info)    |
| GET    | `/health`         | Backend health     |
| GET    | `/api/health`     | Frontend BFF health|

## Deployment

- **Frontend**: Vercel
- **Backend**: Docker (Google Cloud Run)
- **Database**: Supabase PostgreSQL + pgvector

See `docs/DeploymentArchitecture.md` for details.