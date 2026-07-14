# 13_SETUP_GUIDE.md

## AJIS — Anak Juara Information System
### Local Development & Project Setup Guide

**Prepared for:** Rumah Zakat — Anak Juara Program
**Project:** `github.com/devcntrz/rz_ajis`
**Companion documents:** `00_PROJECT_CONTEXT.md` (source of truth for standards/decisions), `10_DATABASE_SPECIFICATION.md` (schema), `12_TASK_BREAKDOWN.md` (Tasks 1–6 correspond to this guide)
**Document date:** July 14, 2026

> Read `00_PROJECT_CONTEXT.md` first. This guide operationalizes §7 (Technology Stack), §10 (Folder Structure Standards), and §12 (Deployment Standards) into concrete setup steps. If anything here conflicts with `PROJECT_CONTEXT.md`, that document wins — update this guide to match, not the other way around.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Dependencies](#5-dependencies)
6. [Initial Configuration](#6-initial-configuration)
7. [Verification Checklist](#7-verification-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Install these before cloning the repository:

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Lock via `.nvmrc`; use `nvm use` on every session |
| npm | 10.x (bundled with Node 20) | Project uses npm, not yarn/pnpm, unless the repo is later changed — keep `package-lock.json` committed |
| Git | 2.4+ | |
| GitHub account | — | With access to `devcntrz/rz_ajis` |
| Vercel account | — | Linked to the same GitHub org, with access to the `rzajis` project |
| Neon account | — | With access to the project's Neon organization/database |
| A code editor | — | VS Code recommended (Tailwind CSS IntelliSense + ESLint + Prettier extensions) |

You do **not** need PostgreSQL installed locally — Neon is a managed, remote Postgres service; local development connects to a Neon **development branch** over the network (see §4 and §6.3).

---

## 2. Installation

### 2.1 Clone the repository

```bash
git clone https://github.com/devcntrz/rz_ajis.git
cd rz_ajis
```

If you are bootstrapping the project for the very first time (i.e. this repo does not exist yet), initialize it instead:

```bash
npx create-next-app@latest rz_ajis \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"
cd rz_ajis
git init
git remote add origin https://github.com/devcntrz/rz_ajis.git
```

> As of this document, the repository already exists and is bootstrapped (see `00_PROJECT_CONTEXT.md` §14) — most contributors will use the `git clone` path above, not `create-next-app`.

### 2.2 Set the Node version

```bash
node -v            # confirm 20.x or later
echo "20" > .nvmrc # if not already present
nvm use
```

### 2.3 Install dependencies

```bash
npm install
```

### 2.4 Initialize shadcn/ui

If `components.json` does not yet exist at the repo root:

```bash
npx shadcn@latest init
```

When prompted, use:
- **Style:** New York
- **Base color:** Neutral (brand orange/teal tokens are layered on top — see §6.1)
- **CSS variables:** Yes
- **Tailwind config:** `tailwind.config.ts`
- **Components alias:** `@/components`
- **Utils alias:** `@/lib/utils`

Then add the primitives the project needs as they come up, e.g.:

```bash
npx shadcn@latest add button card dialog table tabs form input select badge dropdown-menu avatar
```

Only add primitives you're about to use — do not bulk-add the entire component catalog speculatively.

### 2.5 Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local` with real values per §4. **Never commit `.env.local`.**

### 2.6 Confirm the dev server runs

```bash
npm run dev
```

Visit `http://localhost:3000` — you should see the default (or scaffolded) home route. A full green run confirms Next.js, TypeScript, and Tailwind are wired together correctly; it does **not** yet confirm the database connection (see §6.3).

---

## 3. Folder Structure

This mirrors `00_PROJECT_CONTEXT.md` §10 exactly, with setup-specific additions (`scripts/`, `migrations/`, `docs/`, `.github/`) called out. **Before adding any new top-level folder, check whether an existing one already fits** — this structure is intentionally shallow.

```
rz_ajis/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # lint, type-check, test, build on every push/PR
│       └── deploy.yml             # Vercel preview deployments on PR
├── app/                           # Next.js App Router — route groups per application
│   ├── (public)/                  # Public Website — no auth
│   ├── (super-admin)/             # Super Admin Dashboard — authenticated
│   ├── (regional)/                # Regional Dashboard — Branch Admin & Korwil, authenticated
│   └── api/                       # API routes / Server Actions shared across apps
├── components/                    # Shared UI components (shadcn/ui-based)
│   └── ui/                        # shadcn/ui primitives (generated via `shadcn add`)
├── hooks/                         # Shared React hooks
├── lib/                           # Data-access helpers, query utilities, auth/session logic
│   ├── db.ts                      # Typed Neon query client (see §6.3)
│   ├── config.ts                  # Validated environment config (see §4.3)
│   └── constants.ts               # Brand tokens, shared constants
├── migrations/                    # Version-controlled, incremental SQL migrations (§12 of PROJECT_CONTEXT.md)
├── public/                        # Static assets
├── refs/                          # Reference material (design docs, legacy-system notes)
├── scripts/                       # migrate.ts, seed.ts, and other one-off operational scripts
├── types/                         # Shared TypeScript types, matched to the database schema
│   └── index.ts                   # Single export entry point
├── docs/                          # TESTING.md, OPERATIONS.md, and other supplementary docs
├── middleware.ts                  # Auth/session middleware, route-group protection
├── components.json                # shadcn/ui configuration
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── .prettierrc
├── .nvmrc
├── .env.example
├── vercel.json
├── AGENTS.md                      # Repo-local agent instructions
├── CLAUDE.md                      # Repo-local Claude-specific instructions
├── 00_PROJECT_CONTEXT.md
├── 10_DATABASE_SPECIFICATION.md
├── 12_TASK_BREAKDOWN.md
├── 13_SETUP_GUIDE.md              # This document
└── README.md
```

**Route group rule:** `(public)`, `(super-admin)`, and `(regional)` share `components/`, `lib/`, and `types/` without duplicating layout or data-access code, while keeping each application's auth boundary and route tree distinct.

---

## 4. Environment Variables

### 4.1 `.env.example` (commit this — no real secrets)

```bash
# ── App ──────────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# ── Database (Neon Postgres) ────────────────────────
# Use a Neon development branch for local work — never point
# local development at the production database.
DATABASE_URL=postgres://user:password@ep-xxxx.neon.tech/rz_ajis?sslmode=require

# ── Auth / Sessions ──────────────────────────────────
# Random, high-entropy secret used to sign/encrypt session cookies.
# Generate with: openssl rand -base64 32
SESSION_SECRET=replace-with-a-generated-secret
SESSION_COOKIE_NAME=ajis_session

# ── File / Photo Uploads (managed object storage) ───
# Vercel Blob per PROJECT_CONTEXT.md §9 (no ad hoc unhandled uploads)
BLOB_READ_WRITE_TOKEN=

# ── Email (transactional / contact inquiry) ─────────
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=no-reply@example.org

# ── Monitoring / Error Tracking (optional, prod-recommended) ─
SENTRY_DSN=
VERCEL_ANALYTICS_ID=
```

### 4.2 Where each variable is used

| Variable | Required in | Notes |
|---|---|---|
| `DATABASE_URL` | All environments | Neon connection string; **must** use a pooled/serverless-compatible driver, not a fixed-size pool (PROJECT_CONTEXT.md §12) |
| `SESSION_SECRET` | All environments | Distinct value per environment (dev/staging/prod) — never share a secret across environments |
| `BLOB_READ_WRITE_TOKEN` | Any environment handling child photo uploads | Provisioned automatically when a Vercel Blob store is linked to the Vercel project |
| `EMAIL_PROVIDER_API_KEY` | Public Website (donor/contact inquiry) | Provider TBC — confirm against actual vendor before implementing Task covering this |
| `SENTRY_DSN`, `VERCEL_ANALYTICS_ID` | Staging/production | Optional locally; recommended once monitoring is set up (see Task 99 in `12_TASK_BREAKDOWN.md`) |

### 4.3 Validation

Environment variables are **not** read directly via `process.env` scattered through the codebase. They are parsed and validated once, at startup, through a single typed module:

```ts
// lib/config.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default("ajis_session"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast — never boot the app with malformed/missing config.
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const config = parsed.data;
```

Rules:
- **Never log or expose secret values** — if you need to debug config, log which keys are present, not their values.
- All application code reads config via `import { config } from "@/lib/config"`, never `process.env` directly outside this file.
- Vercel environment variables (Development / Preview / Production scopes in the Vercel dashboard) are the source of truth for deployed environments; `.env.local` is for local development only and is git-ignored.

### 4.4 Environments

| Environment | Config source | Database |
|---|---|---|
| Local development | `.env.local` | Neon **development** branch |
| Preview (per PR) | Vercel Preview env vars | Neon **development** branch (or a per-branch ephemeral Neon branch, if adopted later) |
| Staging | Vercel Staging environment | Neon staging branch/instance |
| Production | Vercel Production environment | Neon **production** branch/instance |

---

## 5. Dependencies

### 5.1 Core framework

```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node @types/react-dom
```

### 5.2 Styling & UI

```bash
npm install tailwindcss @tailwindcss/postcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install tailwindcss-animate
# shadcn/ui primitives are added incrementally via `npx shadcn@latest add <component>`
# (they are copied into components/ui/, not installed as an npm package)
```

### 5.3 Database & data access

```bash
npm install postgres          # lightweight, serverless-friendly Postgres driver
npm install zod                # runtime schema validation (env vars + API payloads)
```

> Per `00_PROJECT_CONTEXT.md` §7, the data-access approach (raw parameterized SQL via a typed query helper vs. an ORM) is **to be confirmed against the current repo state** before assuming either. Task 4 in `12_TASK_BREAKDOWN.md` uses the `postgres` package as its baseline; if an ORM (e.g., Drizzle) is adopted later, update this section and §7 of `PROJECT_CONTEXT.md` in the same change.

### 5.4 Forms & validation

```bash
npm install react-hook-form @hookform/resolvers
```

### 5.5 Data fetching / caching (client-side)

```bash
npm install swr
```

### 5.6 File uploads

```bash
npm install @vercel/blob
```

### 5.7 Dev tooling

```bash
npm install -D eslint eslint-config-next eslint-config-airbnb eslint-config-airbnb-typescript
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 5.8 `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed.ts"
  }
}
```

---

## 6. Initial Configuration

### 6.1 Tailwind theme & brand tokens

Extend `tailwind.config.ts` with the Anak Juara brand palette and typography (per `12_TASK_BREAKDOWN.md` Task 2):

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F59E0B", // Anak Juara brand orange
          50: "#FFFBEB",
          500: "#F59E0B",
          600: "#D97706",
          900: "#78350F",
        },
        secondary: {
          DEFAULT: "#14B8A6", // teal
          50: "#F0FDFA",
          500: "#14B8A6",
          600: "#0D9488",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

Document color usage in `lib/constants.ts`, and verify all foreground/background pairings against WCAG AA contrast before shipping any UI that uses them.

### 6.2 TypeScript path aliases

`tsconfig.json` should include:

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

### 6.3 Database connection (Neon)

1. In the Neon console, create a **development branch** off the main database (Neon branching — do not develop against production or staging directly).
2. Copy the pooled connection string into `.env.local` as `DATABASE_URL`.
3. `lib/db.ts` exports a typed query client using the `postgres` driver in serverless-safe mode:

```ts
// lib/db.ts
import postgres from "postgres";
import { config } from "@/lib/config";

export const sql = postgres(config.DATABASE_URL, {
  ssl: "require",
  max: 1, // serverless functions: one connection per invocation, not a fixed pool
});
```

4. Add a startup health check (e.g., `SELECT 1`) so a broken connection string fails immediately and visibly rather than surfacing as a confusing downstream error.

### 6.4 Git & GitHub

```bash
git checkout -b setup/initial-scaffold
git add .
git commit -m "chore: initial project scaffold, tooling, and configuration"
git push -u origin setup/initial-scaffold
```

- Protect `main`: require CI to pass and require at least one review before merge.
- Use conventional commits (`feat:`, `chore:`, `fix:`, `docs:`, `ci:`, `design:`, `types:`) — see the Git Commit examples throughout `12_TASK_BREAKDOWN.md`.
- Add `AGENTS.md` / `CLAUDE.md` references at the top of the README so future contributors (human or AI) know to read `00_PROJECT_CONTEXT.md` first.

### 6.5 GitHub Actions CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - run: npm run build
```

Wire the Vercel integration token into GitHub Secrets so preview deployments run on every PR (`.github/workflows/deploy.yml`, or via Vercel's native Git integration, which handles this without a separate workflow file in most setups).

### 6.6 Vercel project

1. Import `devcntrz/rz_ajis` into Vercel, connected to GitHub for auto-deploy on push to `main` and preview deployments on every PR.
2. Set environment variables in the Vercel dashboard for **Development**, **Preview**, and **Production** scopes separately (per §4.4) — do not reuse production secrets in preview.
3. Confirm `vercel.json` sets the build command (`next build`), output directory, and any required headers (CORS, security headers).
4. Deploy target: `rzajis.vercel.app`.

---

## 7. Verification Checklist

Before considering setup complete:

- [ ] `npm run dev` starts without errors at `http://localhost:3000`
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` completes successfully
- [ ] `.env.local` is populated and git-ignored (`git status` shows it untracked)
- [ ] `lib/config.ts` throws a clear error when a required env var is missing (test by temporarily removing one)
- [ ] Database health check succeeds against the Neon development branch
- [ ] shadcn/ui component (e.g., `Button`) renders correctly with brand colors applied
- [ ] GitHub Actions CI workflow runs and passes on a test PR
- [ ] Vercel preview deployment succeeds on the same test PR

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Invalid environment configuration` on startup | Missing/malformed var in `.env.local` | Compare against `.env.example`; check `SESSION_SECRET` is ≥32 chars |
| Database connection times out locally | Neon branch suspended (auto-suspend on inactivity) or wrong `sslmode` | Neon free-tier branches auto-suspend; the first query after idle wakes it — retry. Confirm `sslmode=require` is present |
| `Module not found: @/components/...` | Path alias not configured | Recheck `tsconfig.json` `paths` and restart the dev server/TS server |
| Tailwind classes not applying | `content` globs in `tailwind.config.ts` don't cover the file | Ensure the file's path matches an entry in `content` |
| CI fails on `type-check` but not locally | Local `tsconfig.json` changes not committed, or Node version mismatch | Confirm `.nvmrc` matches CI's `node-version`; run `npm ci` locally to mirror CI's clean install |
| Vercel build fails but local build succeeds | Missing environment variable in the relevant Vercel scope | Compare `.env.example` against the Vercel dashboard for that environment |

---

**End of 13_SETUP_GUIDE.md**
