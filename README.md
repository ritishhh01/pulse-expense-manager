# Pulse — Expense Manager

> **Split expenses, not friendships.**

Pulse is a high-end fintech expense-splitting app built with a Gen Z / Chaotechh brand identity. It offers full Splitwise-style parity: group expenses, smart splits, friend-level balance summaries, UPI-ready settlements, and a clean dark-neon UI.

**Live app:** https://chaotechh-expense-manager--chaotechhh.replit.app

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Workflows](#workflows)
- [Setup Guide](#setup-guide)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Deployment](#deployment)

---

## Features

| Category | Features |
|---|---|
| **Auth** | Clerk-powered sign-up/sign-in, OAuth, session management |
| **Groups** | Create groups with type (Trip, Home, Food, Event, Sports, Other) and emoji; invite members |
| **Expenses** | Add expenses with paid-by selector, Equal / Percentage / Custom split modes, optional notes |
| **Settlements** | Record payments between group members; track who owes what |
| **Friends view** | Cross-group aggregated balance per person with per-group breakdown |
| **Profile** | Edit display name, UPI ID, avatar color; sign out |
| **Dashboard** | Summary cards, recent activity, total balances |
| **Search** | Live expense search within any group |
| **Group management** | Leave group (members), remove members (creator), delete group (creator) |
| **Mobile-first** | Bottom tab bar navigation on mobile; responsive sidebar on desktop |
| **Theme** | Dark / light toggle with neon-green (`#39FF14`) accent |

---

## Tech Stack

### Frontend — `artifacts/pulse`

| Technology | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Dev server & build tool |
| TypeScript | 5.9 | Static typing |
| Tailwind CSS | 4 | Utility-first styling |
| Radix UI / shadcn/ui | latest | Headless accessible components |
| TanStack React Query | 5 | Server state & caching |
| Wouter | 3 | Client-side routing |
| Framer Motion | 12 | Animations |
| `@clerk/react` | 6 | Authentication UI |
| React Hook Form + Zod | 7 / 3 | Form validation |
| Lucide React | latest | Icon set |
| Sonner | 2 | Toast notifications |
| next-themes | 0.4 | Dark/light mode |
| date-fns | 3 | Date formatting |

### Backend — `artifacts/api-server`

| Technology | Version | Role |
|---|---|---|
| Node.js | 24 | Runtime |
| Express | 5 | HTTP framework |
| TypeScript | 5.9 | Static typing |
| Drizzle ORM | 0.45 | Type-safe ORM |
| PostgreSQL | 16 | Primary database |
| `@clerk/express` | 2 | Auth middleware & token verification |
| Zod | 3 | Request validation |
| Pino + pino-http | 9 / 10 | Structured JSON logging |
| http-proxy-middleware | 3 | Clerk FAPI & npm CDN proxy |
| ESBuild | 0.27 | Production bundler (single `dist/index.mjs`) |

### Shared Libraries — `lib/`

| Package | Role |
|---|---|
| `@workspace/db` | Drizzle schema definitions + DB client |
| `@workspace/api-spec` | OpenAPI spec (source of truth for all endpoints) |
| `@workspace/api-zod` | Zod schemas auto-generated from the OpenAPI spec |
| `@workspace/api-client-react` | TanStack React Query hooks generated from the spec |

### Infrastructure

| Service | Usage |
|---|---|
| Replit Autoscale (Cloud Run) | Production hosting |
| Replit PostgreSQL | Managed database (dev + prod) |
| Clerk | User authentication & identity |
| pnpm workspaces | Monorepo dependency management |

---

## Project Structure

```
pulse-monorepo/
├── artifacts/
│   ├── api-server/               # Express REST API
│   │   ├── src/
│   │   │   ├── app.ts            # Express app setup, middleware chain
│   │   │   ├── index.ts          # Server entry point (port binding, boot tasks)
│   │   │   ├── lib/
│   │   │   │   ├── migrate.ts    # Idempotent schema migration (runs on every boot)
│   │   │   │   ├── seed.ts       # Dev seed data (skipped if data exists)
│   │   │   │   ├── get-db-user.ts# Clerk → DB user resolver
│   │   │   │   └── logger.ts     # Pino logger config
│   │   │   ├── middlewares/
│   │   │   │   └── clerkProxyMiddleware.ts  # FAPI + npm CDN proxy
│   │   │   └── routes/
│   │   │       ├── auth.ts       # POST /auth/me (upsert user on first sign-in)
│   │   │       ├── users.ts      # GET/PATCH /users
│   │   │       ├── groups.ts     # CRUD /groups + member management
│   │   │       ├── expenses.ts   # CRUD /expenses
│   │   │       ├── settlements.ts# POST/GET /settlements
│   │   │       ├── dashboard.ts  # GET /dashboard/summary|balances|activity
│   │   │       └── health.ts     # GET /healthz
│   │   ├── build.mjs             # ESBuild config (bundles to single file)
│   │   └── .replit-artifact/
│   │       └── artifact.toml     # Service config (ports, dev/prod commands)
│   │
│   └── pulse/                    # React + Vite frontend
│       ├── src/
│       │   ├── App.tsx           # Router, Clerk provider, theme provider
│       │   ├── pages/
│       │   │   ├── home.tsx      # Dashboard / landing
│       │   │   ├── groups.tsx    # Groups list
│       │   │   ├── group-detail.tsx  # Group view + expense search
│       │   │   ├── new-expense.tsx   # Add expense (split modes, paid-by)
│       │   │   ├── new-group.tsx     # Create group
│       │   │   ├── friends.tsx       # Cross-group balance aggregation
│       │   │   └── profile.tsx       # Edit profile, sign out
│       │   ├── components/
│       │   │   ├── layout.tsx        # Sidebar + mobile tab bar
│       │   │   └── ui/               # shadcn/ui component library
│       │   └── hooks/
│       │       └── use-theme.ts
│       └── .replit-artifact/
│           └── artifact.toml     # Static serve config for production
│
├── lib/
│   ├── db/                       # Drizzle ORM schema & client
│   │   └── src/schema/
│   │       ├── users.ts
│   │       ├── groups.ts
│   │       ├── expenses.ts
│   │       └── settlements.ts
│   ├── api-spec/
│   │   └── openapi.yaml          # OpenAPI 3 spec (source of truth)
│   ├── api-zod/                  # Auto-generated Zod types
│   └── api-client-react/         # Auto-generated React Query hooks
│
├── scripts/
│   └── post-merge.sh             # Runs after task-agent merges (pnpm install + db push)
├── pnpm-workspace.yaml           # Workspace packages + version catalog
├── .replit                       # Replit runtime config
└── README.md
```

---

## Database Schema

All tables live in a single PostgreSQL database. The schema is managed by Drizzle ORM and synchronised on every boot via `ensureSchema()`.

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Internal ID |
| `clerk_id` | text unique | Clerk user ID (nullable for seed users) |
| `name` | text | Display name |
| `email` | text unique | |
| `phone_number` | text | Optional |
| `upi_id` | text | UPI payment ID (optional) |
| `avatar_color` | text | Hex colour, default `#39FF14` |
| `created_at` | timestamptz | |

### `groups`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text | |
| `description` | text | Optional |
| `emoji` | text | Default `💰` |
| `type` | text | `trip`, `home`, `food`, `event`, `sports`, `other` |
| `created_by_user_id` | integer FK → users | Group creator |
| `created_at` | timestamptz | |

### `group_members`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `group_id` | integer FK → groups (cascade) | |
| `user_id` | integer FK → users | |
| `joined_at` | timestamptz | |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `group_id` | integer FK → groups (cascade) | |
| `description` | text | |
| `amount` | numeric(12,2) | |
| `category` | text | Default `others` |
| `notes` | text | Optional free-text notes |
| `paid_by_user_id` | integer FK → users | Who fronted the cash |
| `created_at` | timestamptz | |

### `expense_splits`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `expense_id` | integer FK → expenses (cascade) | |
| `user_id` | integer FK → users | |
| `amount` | numeric(12,2) | Each person's share |
| `is_paid` | text | `"true"` / `"false"` |

### `settlements`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `group_id` | integer FK → groups (cascade) | |
| `from_user_id` | integer FK → users | Payer |
| `to_user_id` | integer FK → users | Receiver |
| `amount` | numeric(12,2) | |
| `settled_at` | timestamptz | |

---

## API Reference

All endpoints are prefixed with `/api`. Authentication is required for every endpoint except `GET /api/healthz` and `POST /api/auth/me`.

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check (no auth) |

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/me` | Upsert current Clerk user into DB on first sign-in |

### Users
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/:id` | Get user by ID |
| `POST` | `/api/users` | Create user |
| `PATCH` | `/api/users/:id` | Update own profile (name, UPI ID, avatar colour) |

### Groups
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/groups` | List groups the current user belongs to |
| `POST` | `/api/groups` | Create group |
| `GET` | `/api/groups/:id` | Get group with members |
| `PATCH` | `/api/groups/:id` | Update group details |
| `DELETE` | `/api/groups/:id` | Delete group (creator only) |
| `POST` | `/api/groups/:id/members` | Add member to group |
| `DELETE` | `/api/groups/:id/members/:userId` | Leave group (self) or remove member (creator) |

### Expenses
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/expenses` | List expenses (filterable by group) |
| `POST` | `/api/expenses` | Create expense with splits |
| `GET` | `/api/expenses/:id` | Get single expense |
| `PATCH` | `/api/expenses/:id` | Update expense |
| `DELETE` | `/api/expenses/:id` | Delete expense |

### Settlements
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settlements` | List settlements |
| `POST` | `/api/settlements` | Record a settlement |

### Dashboard
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Total owed/owe figures for current user |
| `GET` | `/api/dashboard/balances` | Per-group balance breakdown |
| `GET` | `/api/dashboard/activity` | Recent expenses across all groups |

### Clerk Proxy
| Path | Description |
|---|---|
| `/api/__clerk/npm/*` | Proxied to `https://npm.clerk.dev` — serves Clerk JS bundle |
| `/api/__clerk/*` | Proxied to `https://frontend-api.clerk.dev` — Clerk FAPI calls |

---

## Workflows

The project runs as a **pnpm monorepo** with three concurrent workflows in development.

### 1. API Server (`artifacts/api-server: API Server`)

**Dev command:** `pnpm --filter @workspace/api-server run dev`

What it does:
1. Sets `NODE_ENV=development`
2. Runs **ESBuild** (`build.mjs`) — bundles all TypeScript into a single `dist/index.mjs` plus pino worker files
3. Starts the server with `node --enable-source-maps ./dist/index.mjs`
4. On boot: runs `ensureSchema()` (idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations) then `ensureSeedData()` (skips if data already exists)
5. Listens on the port from the `PORT` environment variable (default `8080` in production, dynamically assigned in dev)

**Production command:**
```
pnpm --filter @workspace/api-server run build:prod
node --enable-source-maps artifacts/api-server/dist/index.mjs
```
`build:prod` also runs `drizzle-kit push --force` to sync the Drizzle schema to the production DB before building.

### 2. Pulse Frontend (`artifacts/pulse: web`)

**Dev command:** `pnpm --filter @workspace/pulse run dev`

Starts a **Vite** dev server with HMR. The app is a pure SPA — all routing is client-side via Wouter. In production it is built to static files (`vite build`) and served by Replit's CDN without any Node.js process.

**Production build:**
```
pnpm --filter @workspace/pulse run build
```
Output goes to `artifacts/pulse/dist/public` and is served as a static site with a catch-all rewrite to `index.html` for SPA routing.

### 3. Component Preview Server (`artifacts/mockup-sandbox: Component Preview Server`)

Internal Vite server used during development for isolated component prototyping on the canvas. Not deployed to production.

### Middleware chain (API server)

```
Request
  │
  ├─ pino-http logger          (all requests logged with method, URL, status, response time)
  ├─ Clerk proxy (/api/__clerk) (npm CDN → npm.clerk.dev | FAPI → frontend-api.clerk.dev)
  ├─ CORS                      (credentials: true, origin: true)
  ├─ express.json / urlencoded
  ├─ clerkMiddleware()         (attaches Clerk auth context to req)
  └─ /api router
       ├─ requireAuth()        (returns 401 if no Clerk userId; skips PUBLIC_PATHS)
       └─ route handlers
```

`PUBLIC_PATHS` (no auth required): `/health`, `/auth/me`, `/__clerk`

---

## Setup Guide

### Prerequisites

- [Node.js 24+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) — `npm install -g pnpm`
- PostgreSQL database (or use [Replit](https://replit.com) which provisions one automatically)
- A [Clerk](https://clerk.com) account

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/pulse-expense-manager.git
cd pulse-expense-manager
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file at the repo root (or set these as secrets in Replit):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pulse

# Clerk — get these from https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Optional: Only set this in production when using the Clerk proxy
# VITE_CLERK_PROXY_URL=https://your-domain.com/api/__clerk

# Server
SESSION_SECRET=your-random-secret-string
```

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This runs `drizzle-kit push` which introspects the Drizzle schema and creates all tables in your PostgreSQL database.

### 5. Start the development servers

Open two terminal tabs (or use a process manager like `concurrently`):

**Tab 1 — API server:**
```bash
pnpm --filter @workspace/api-server run dev
```
The API server starts on port `8080` and automatically:
- Applies any missing schema columns (`ensureSchema`)
- Seeds demo data on first boot (`ensureSeedData`)

**Tab 2 — Frontend:**
```bash
pnpm --filter @workspace/pulse run dev
```
Vite starts on port `5173` (or the `PORT` env var). Open [http://localhost:5173](http://localhost:5173).

### 6. Configure Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → your app
2. Under **API Keys**, copy your publishable and secret keys into the `.env` file above
3. Under **Domains**, add `localhost:5173` (dev) and your production domain
4. Optionally enable social OAuth providers (Google, GitHub, etc.)

### 7. (Production) Set up the Clerk proxy

If deploying to a domain without a Clerk CNAME record (e.g. `*.replit.app`), set the proxy URL so Clerk's FAPI routes through your own domain:

```env
VITE_CLERK_PROXY_URL=https://your-app-domain.com/api/__clerk
```

The API server's `clerkProxyMiddleware` will automatically proxy:
- `/api/__clerk/npm/*` → `https://npm.clerk.dev` (Clerk JS bundle)
- `/api/__clerk/*` → `https://frontend-api.clerk.dev` (Clerk FAPI)

---

## Environment Variables & Secrets

| Variable | Required | Where | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | API server | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Yes | API server | Clerk backend secret key |
| `CLERK_PUBLISHABLE_KEY` | Yes | API server | Clerk publishable key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Frontend (build time) | Clerk publishable key (Vite exposes `VITE_` prefixed vars) |
| `VITE_CLERK_PROXY_URL` | Production only | Frontend (build time) | Proxy URL for Clerk FAPI — set to `https://yourdomain.com/api/__clerk` |
| `SESSION_SECRET` | Yes | API server | Secret for session signing |
| `PORT` | Yes | API server | Port to listen on (set automatically by Replit) |
| `NODE_ENV` | Optional | API server | `development` or `production` |

---

## Deployment

The app is configured for **Replit Autoscale** (Cloud Run):

- **Frontend** is built to static files and served via Replit's CDN (zero cold-start)
- **API server** is bundled to a single `dist/index.mjs` with ESBuild and run directly with Node — no pnpm in the production container, faster cold-start

**Production build flow:**
1. `pnpm --filter @workspace/api-server run build:prod` — pushes DB schema, bundles API
2. `pnpm --filter @workspace/pulse run build` — builds frontend to `dist/public`
3. API server starts: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
4. Frontend is served statically from `artifacts/pulse/dist/public`

To deploy on Replit, click **Publish** in the workspace.

For other platforms (Railway, Fly.io, Render, etc.) expose `PORT` and `DATABASE_URL` as environment variables and use the production build commands above.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Install deps: `pnpm install`
4. Make changes and run type-check: `pnpm typecheck`
5. Open a pull request

---

## License

MIT
