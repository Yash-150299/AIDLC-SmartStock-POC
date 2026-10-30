# SmartStock

Inventory management for a small supermarket team. Monorepo with two packages generated in this
stage:

- **`shared/`** — `@smartstock/shared`: the single source of truth for cross-unit DTOs, enums,
  error codes, the canonical `deriveStockStatus` rule, and shared validation helpers.
- **`backend/`** — an Express + Prisma (PostgreSQL) modular monolith exposing the REST API under
  `/api`.

> `web` and `mobile` units and automated tests are produced in later stages and are not part of
> this package set.

## Prerequisites

- Node.js 18+ and npm 9+ (npm workspaces).
- A reachable PostgreSQL database.

## Setup

```bash
# 1. Install all workspace dependencies from the repo root
npm install

# 2. Configure the backend environment
cp backend/.env.example backend/.env
# then edit backend/.env — set DATABASE_URL and a strong JWT_SECRET

# 3. Build the shared package (backend imports it as a workspace dependency)
npm run build:shared

# 4. Generate the Prisma client, run migrations, and seed demo data
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Running

```bash
# Development (auto-reload via ts-node-dev)
npm run dev

# Production-style build + run
npm run build
npm run start --workspace @smartstock/backend
```

The API listens on `http://localhost:<PORT>` (default `3000`) with all routes under `/api`.

## Demo credentials

The seed (`backend/prisma/seed.ts`) creates demo accounts (all flagged `isDemo = true`). Passwords
are hashed with bcrypt; the plaintext values below are for local demo use only:

| Username | Email                  | Password      |
| -------- | ---------------------- | ------------- |
| `manager`| `manager@smartstock.dev` | `Password123!` |
| `clerk`  | `clerk@smartstock.dev`   | `Password123!` |

Log in via `POST /api/auth/login` with either the username or the email as `identifier`.

## Project layout

```
/
├─ package.json          # npm workspaces
├─ tsconfig.base.json
├─ shared/               # @smartstock/shared
└─ backend/              # Express modular monolith (Prisma/PostgreSQL)
```
