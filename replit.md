# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (`@clerk/express` on API, `@clerk/react` v6.1.4 on frontend)
  - Clerk app ID: `app_3C0Cja7fjPXP5lyazoJWs5zdGx4`
  - Sign-in/sign-up: Google OAuth + email/password
  - DB users table has `clerkId` (text, unique) and `phoneNumber` (text) columns
  - `POST /api/auth/me` — public endpoint that creates or links a DB user from Clerk session
  - All other `/api/*` routes require a valid Clerk session cookie
  - Clerk proxy middleware active in production at `/api/__clerk`
- **Frontend app**: `artifacts/pulse` — React + Vite at `/`
  - Landing page for signed-out users
  - `/sign-in` and `/sign-up` with Clerk's dark-themed component
  - Layout sidebar has sign-out button (both desktop and mobile)
  - Mobile bottom tab bar: Home, Groups, +Add (center), Friends, Profile
  - `/friends` — cross-group aggregated balances per person
  - `/profile` — edit name, UPI ID, avatar color; sign out

## Splitwise Feature Parity
- **Paid-by selector** on new expense — choose which group member paid
- **Percentage splits** — Equal / % / Custom split modes on new expense
- **Expense notes** — optional notes field stored on expenses table
- **Group types** — Trip, Home, Food, Event, Sports, Other (stored on groups table)
- **Expense search** — filter expenses by description/category/payer in group detail
- **Leave group** — non-creator members can leave a group (DELETE /groups/:id/members/:userId)
- **Remove member** — group creator can remove other members
- **Friends view** — aggregate balances across all groups per friend
- **Profile page** — edit display name, UPI ID, avatar color

## DB Schema Additions
- `expenses.notes` — nullable text column (added via migrate.ts)
- `groups.type` — text column, default 'other' (added via migrate.ts)
- `users.upiId`, `users.avatarColor` — existing columns
- PATCH /users/:id — update own profile (requires Clerk auth, self only)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
