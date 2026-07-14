# 18_DEPLOYMENT_GUIDE.md

## AJIS — Anak Juara Information System
### Production Deployment Guide

**Prepared for:** Rumah Zakat — Anak Juara Program  
**Technology Stack:** Next.js 15+ · PostgreSQL 14+ (Neon) · Vercel · Node.js 20 LTS  
**Status:** Deployment specification and procedures  
**Document Date:** July 14, 2026

---

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [Environment Variables](#2-environment-variables)
3. [Build Process](#3-build-process)
4. [Database Migration](#4-database-migration)
5. [Pre-Production Verification](#5-pre-production-verification)
6. [Production Deployment](#6-production-deployment)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Production Checklist](#8-production-checklist)
9. [Security Checklist](#9-security-checklist)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Rollback Strategy](#11-rollback-strategy)
12. [Incident Response](#12-incident-response)

---

## 1. Deployment Overview

### 1.1 Architecture

```
Development (Local)
  ↓
Staging (Vercel Preview + Neon staging branch)
  ↓
Production (Vercel Production + Neon primary)
```

- **Vercel** handles application hosting, serverless function execution, Edge caching, and auto-scaling
- **Neon PostgreSQL** provides managed database with branching for dev/staging/production isolation
- **GitHub** is the source of truth; Vercel auto-deploys on push to `main` (production) and creates preview deployments on every PR

### 1.2 Deployment Stages

| Stage | Trigger | Database | Duration | Sign-off |
|-------|---------|----------|----------|----------|
| **Development** | `git push` to feature branch | Neon dev branch (personal) | Ongoing | Developer |
| **Preview/Staging** | Pull Request created | Neon staging branch | Hours–days | QA/Test lead |
| **Production** | Merge to `main` + manual approval | Neon primary (production) | Permanent | Engineering lead + Product owner |

### 1.3 Key Principles

- **Immutable infrastructure:** Every deployment is a distinct version; no in-place edits to production
- **Infrastructure as code:** All configuration (migrations, env vars, build scripts) version-controlled in Git
- **Database-first:** Schema migrations are applied before application code rolls out
- **Audit trail:** Every deployment logged with timestamp, deployer, and git commit hash
- **Graceful rollback:** Previous version immediately available; automatic healthchecks validate new deployment before traffic shift

---

## 2. Environment Variables

### 2.1 Variable Inventory

**Required in all environments (dev/staging/production):**

| Variable | Purpose | Example | Notes |
|----------|---------|---------|-------|
| `NODE_ENV` | Node environment | `development` \| `production` | Controls Next.js build optimization |
| `NEXT_PUBLIC_APP_URL` | Frontend-visible app URL | `https://rzajis.vercel.app` | Used for OAuth redirects, link generation |
| `NEXT_PUBLIC_APP_ENV` | UI environment indicator | `development` \| `staging` \| `production` | Shown in header/footer for context |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@...` | Must use Neon pooled driver (`?sslmode=require`) |
| `SESSION_SECRET` | Cookie encryption key | (random 32+ char base64) | **Different per environment** — never share |
| `SESSION_COOKIE_NAME` | Session cookie name | `ajis_session` | Consistent across all environments |
| `SESSION_TIMEOUT_MS` | Session expiry (ms) | `86400000` (24 hours) | Can be per-environment |

**Optional (recommended for production):**

| Variable | Purpose | Example |
|----------|---------|---------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for file uploads | (auto-provisioned in Vercel) |
| `SENTRY_DSN` | Error tracking (Sentry) | `https://key@sentry.io/123456` |
| `VERCEL_ANALYTICS_ID` | Vercel analytics | (auto-provisioned) |
| `LOG_LEVEL` | Application log level | `debug` \| `info` \| `warn` \| `error` |
| `EMAIL_PROVIDER_API_KEY` | Transactional email (SendGrid/AWS SES) | (provider-specific) |
| `EMAIL_FROM_ADDRESS` | Sender address for transactional email | `no-reply@rzajis.vercel.app` |

### 2.2 Environment-Specific Values

```bash
# .env.development (local — git-ignored)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
DATABASE_URL=postgres://user:pass@ep-xxxx.neon.tech/rz_ajis_dev?sslmode=require
SESSION_SECRET=<random-32-char-string-for-local-dev>
SESSION_TIMEOUT_MS=86400000

# .env.staging (Vercel dashboard — Preview scope)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.rzajis.vercel.app
NEXT_PUBLIC_APP_ENV=staging
DATABASE_URL=postgres://user:pass@ep-yyyy.neon.tech/rz_ajis_staging?sslmode=require
SESSION_SECRET=<distinct-random-key-for-staging>
SESSION_TIMEOUT_MS=86400000
SENTRY_DSN=https://key@sentry.io/staging-project

# .env.production (Vercel dashboard — Production scope)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://rzajis.vercel.app
NEXT_PUBLIC_APP_ENV=production
DATABASE_URL=postgres://user:pass@ep-zzzz.neon.tech/rz_ajis?sslmode=require
SESSION_SECRET=<distinct-random-key-for-production>
SESSION_TIMEOUT_MS=86400000
SENTRY_DSN=https://key@sentry.io/production-project
VERCEL_ANALYTICS_ID=<auto-provisioned>
BLOB_READ_WRITE_TOKEN=<auto-provisioned>
```

### 2.3 Secret Management

**❌ DO NOT:**
- Commit `.env.local` or any `.env.*` file to Git
- Share production secrets in Slack, email, or verbal communication
- Use the same secret across multiple environments

**✅ DO:**
- Store secrets in Vercel Environment Variables dashboard (isolated per scope: Development, Preview, Production)
- Rotate `SESSION_SECRET` periodically (every 6 months, or immediately if suspected compromise)
- Use a password manager (1Password, LastPass) to track secret rotation dates
- Audit who has access to production environment variables in Vercel dashboard (Settings → Team → Members)

### 2.4 Vercel Environment Variables Setup

1. Log in to **Vercel Dashboard** → select **rz_ajis** project
2. Navigate to **Settings** → **Environment Variables**
3. For each environment (Development, Preview, Production):
   - Click **Add New**
   - Enter variable name (e.g., `DATABASE_URL`)
   - Enter value
   - Select scope(s): Development / Preview / Production
   - Click **Save**
4. **Environment Variables Checklist:**
   - [ ] All required vars present in each scope
   - [ ] Secrets (SESSION_SECRET, DATABASE_URL) use distinct values per scope
   - [ ] NEXT_PUBLIC_* vars visible to frontend (URL, APP_ENV)
   - [ ] Sensitive vars (Sentry DSN, BLOB token) hidden from logs

### 2.5 Validation Script

Create `scripts/validate-env.ts` to catch missing/invalid vars at build time:

```typescript
// scripts/validate-env.ts
import { config } from "@/lib/config";

const requiredVars = [
  "NODE_ENV",
  "DATABASE_URL",
  "SESSION_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const missingVars = requiredVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

console.log("✅ Environment variables validated");

// Verify DATABASE_URL is a valid Neon connection string
if (!process.env.DATABASE_URL?.includes("neon.tech")) {
  console.warn(
    "⚠️  DATABASE_URL does not appear to be a Neon connection string"
  );
}

// Verify SESSION_SECRET meets entropy requirements
if (
  !process.env.SESSION_SECRET ||
  Buffer.from(process.env.SESSION_SECRET, "base64").length < 32
) {
  console.error("❌ SESSION_SECRET must be >= 32 bytes (base64-encoded)");
  process.exit(1);
}

console.log("✅ All environment variables valid");
```

Add to `package.json` scripts and CI:

```json
{
  "scripts": {
    "validate:env": "tsx scripts/validate-env.ts",
    "build": "npm run validate:env && next build"
  }
}
```

---

## 3. Build Process

### 3.1 Local Build

```bash
# 1. Verify environment
npm run validate:env

# 2. Lint & type check (catch issues before build)
npm run lint
npm run type-check

# 3. Run tests
npm run test -- --coverage

# 4. Build Next.js
npm run build

# 5. Verify build output
ls -la .next/
# Should contain: standalone/, static/, cache/, etc.
```

### 3.2 Build Command (Vercel)

Configure in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@DATABASE_URL",
    "SESSION_SECRET": "@SESSION_SECRET"
  },
  "regions": ["sfo1"],
  "functions": {
    "api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 3.3 Build Optimization

**Next.js build settings** in `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  // Server Components by default (smaller JS bundles)
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
  // Static generation (ISR) for public pages
  staticPageGenerationTimeout: 120,
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blob.vercelusercontent.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Compression
  compress: true,
  // Production-only optimizations
  swcMinify: true,
};

export default config;
```

### 3.4 Build Success Criteria

After `npm run build` completes locally, verify:

```bash
# ✅ Check build artifacts exist
test -d .next/standalone && echo "✓ Standalone output"
test -d .next/static && echo "✓ Static files"
test -f .next/build-id && echo "✓ Build ID"

# ✅ Check no build errors
grep -i "error" .next/build-manifest.json && echo "❌ Build errors found" || echo "✓ No errors"

# ✅ Estimate bundle size
du -sh .next/
# Should be < 100MB for a healthy Next.js app
```

### 3.5 CI/CD Pipeline (GitHub Actions)

`.github/workflows/build-and-test.yml`:

```yaml
name: Build & Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: rz_ajis_test
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run validate:env
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm audit
      - run: npx snyk test --severity-threshold=high
```

### 3.6 Build Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Build time** | < 5 minutes | Includes linting, testing, Next.js build |
| **Bundle size** | < 100MB | Check via `du -sh .next/` |
| **JS chunk size** | < 250KB per chunk | Monitor via `npm run analyze` (if webpack-bundle-analyzer added) |
| **LCP (Largest Contentful Paint)** | < 2.5s on 4G | Check via Lighthouse |

---

## 4. Database Migration

### 4.1 Migration Workflow

**Database migration applies schema changes to PostgreSQL before the application code rolls out.**

```
Git push → CI passes → Migrate staging DB → Deploy app → Test → Merge to main
                                                            ↓
                                                      (if all green)
                                                            ↓
                                              Migrate production DB → Deploy app
```

### 4.2 Pre-Migration Checklist

Before any database migration (staging or production):

- [ ] Migration file reviewed and approved (PR with @DBA or @senior-engineer tag)
- [ ] Backup taken:
  - Staging: `pg_dump` to S3 or local storage (manual before migration)
  - Production: Neon auto-backup (6-hour retention) + manual backup before critical migrations
- [ ] Migration tested on staging branch first (never test directly on production)
- [ ] Estimated runtime known (check `EXPLAIN ANALYZE` on large tables)
- [ ] Downtime window scheduled (if needed) — announce in Slack #deployments channel
- [ ] Rollback plan documented (see §11)

### 4.3 Migration Execution on Staging

1. **Create Neon staging branch** (if not already created):
   ```bash
   # Via Neon console:
   # Branch from: main
   # Branch name: staging
   # Keep branch for: 7 days
   ```

2. **Get staging connection string:**
   ```bash
   # Copy from Neon console:
   # Branches → staging → Connection string (Pooled)
   export DATABASE_URL="postgres://user:pass@ep-xxxx.neon.tech/rz_ajis?sslmode=require"
   ```

3. **Run migrations:**
   ```bash
   # scripts/migrate.ts (if using a migration runner)
   # Or direct psql:
   psql "$DATABASE_URL" -f migrations/0001_create_schemas.sql
   psql "$DATABASE_URL" -f migrations/0002_geography_schema.sql
   # ... (all 13 migrations in order)
   ```

4. **Verify migration success:**
   ```bash
   # Check all tables created
   psql "$DATABASE_URL" -c "
     SELECT table_schema, COUNT(*) AS table_count
     FROM information_schema.tables
     WHERE table_schema NOT IN ('pg_*', 'information_schema')
     GROUP BY table_schema;"
   
   # Should show: 34 tables across 10 schemas (geography, organization, person, etc.)
   ```

5. **Run verification queries** (from `14_DATABASE_MIGRATION.md` §16):
   ```bash
   # Confirm FK indexes exist, triggers work, updated_at refreshes
   psql "$DATABASE_URL" -f migrations/verify.sql
   ```

### 4.4 Migration Execution on Production

**Only after staging migration is fully validated:**

1. **Announce in #deployments Slack channel:**
   ```
   🚀 Starting production database migration
   Migration: 0005_person_schema.sql
   Expected runtime: ~30 seconds (tested on staging)
   Rollback plan: Apply 0005_person_schema.down.sql if failure
   ```

2. **Take Neon backup:**
   ```bash
   # Neon console: Backups → Manual backup
   # Label: "pre-0005-person-schema-2026-07-14"
   # Keep for: 30 days
   ```

3. **Get production connection string:**
   ```bash
   export DATABASE_URL="postgres://user:pass@ep-zzzz.neon.tech/rz_ajis?sslmode=require"
   ```

4. **Run migration:**
   ```bash
   psql "$DATABASE_URL" -f migrations/0005_person_schema.sql
   # Watch output for any errors; if any error, immediately ROLLBACK (see §11)
   ```

5. **Verify success:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM person.child;"
   # Should return 0 (table exists, no data yet)
   ```

6. **Post in Slack:**
   ```
   ✅ Production migration 0005_person_schema.sql completed successfully
   Tables affected: person.child, person.coordinator, person.donor, person.family_member, ...
   Downtime: 0 seconds (schema change only, no rewrite)
   ```

### 4.5 Migration Runner Script

Create `scripts/migrate.ts` for automated migration tracking:

```typescript
// scripts/migrate.ts
import fs from "fs/promises";
import path from "path";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: "require",
});

async function getMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations() {
  const result = await sql`SELECT name FROM public._migrations ORDER BY name`;
  return new Set(result.map((r: any) => r.name));
}

async function applyMigration(filename: string) {
  const filepath = path.join(process.cwd(), "migrations", filename);
  const content = await fs.readFile(filepath, "utf-8");

  // Split .up and .down sections (if in same file)
  const [upSQL] = content.split("-- DOWN");

  console.log(`Applying ${filename}...`);
  await sql.unsafe(upSQL);

  await sql`
    INSERT INTO public._migrations (name) VALUES (${filename})
  `;

  console.log(`✅ ${filename} applied`);
}

async function runMigrations() {
  await getMigrationsTable();
  const applied = await getAppliedMigrations();

  const migrationDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationDir))
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();

  for (const file of files) {
    if (!applied.has(file)) {
      await applyMigration(file);
    }
  }

  console.log("\n✅ All migrations applied");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
```

Run via: `DATABASE_URL=... npm run migrate`

---

## 5. Pre-Production Verification

### 5.1 Staging Environment Testing

Before promoting to production, verify staging environment:

```bash
# 1. Database connectivity
curl -X GET https://staging.rzajis.vercel.app/api/v1/auth/me \
  -H "Cookie: ajis_session=invalid" \
  # Should return 401 (session invalid, database working)

# 2. Authentication flow
curl -X POST https://staging.rzajis.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin.test","password":"TestPass123!"}'
  # Should return 200 with session cookie

# 3. Data retrieval
curl -X GET https://staging.rzajis.vercel.app/api/v1/children \
  -H "Cookie: ajis_session=<valid-token>" \
  # Should return 200 OK with paginated children list

# 4. Response time check (should be < 300ms p95)
ab -n 100 -c 10 https://staging.rzajis.vercel.app/api/v1/children

# 5. Load test (see Testing Plan §8.4)
k6 run load-test.js
```

### 5.2 Data Validation

Verify data integrity in staging:

```sql
-- Check referential integrity (no orphaned FKs)
SELECT COUNT(*) FROM person.child c
WHERE c.office_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM organization.office o WHERE o.office_id = c.office_id);
-- Should return 0 (no orphans)

-- Check soft-delete logic
SELECT COUNT(*) FROM person.child WHERE active = false;
-- Should match expected number of deactivated children

-- Check audit trail
SELECT COUNT(*) FROM public._audit_log;
-- Should have entries for all schema changes
```

### 5.3 Security Scan

Run security checks before promoting:

```bash
# 1. Dependency audit
npm audit
# Should have no critical vulnerabilities (high is acceptable if mitigated)

# 2. OWASP scan (via Snyk or similar)
npx snyk test --severity-threshold=high

# 3. Database compliance
# Verify SESSION_SECRET is present and entropy >= 32 bytes
psql "$DATABASE_URL" -c "SELECT current_database(), version();"

# 4. TLS/HTTPS verification
curl -I https://staging.rzajis.vercel.app/
# Should show: Strict-Transport-Security header, X-Frame-Options: DENY, etc.
```

### 5.4 Performance Baseline

Measure and document staging performance:

```bash
# Lighthouse audit
npm run lighthouse https://staging.rzajis.vercel.app

# WebPageTest
curl https://api.webpagetest.org/runtest.php \
  -d "url=https://staging.rzajis.vercel.app&location=Virginia&f=json"

# Expected results:
# - FCP < 1.5s (First Contentful Paint on 4G)
# - LCP < 2.5s (Largest Contentful Paint)
# - CLS < 0.1 (Cumulative Layout Shift)
```

---

## 6. Production Deployment

### 6.1 Pre-Deployment Sign-Off

**Required approvals before production deployment:**

- [ ] **Code Review:** ≥2 approvals on main PR (including @senior-engineer or @tech-lead)
- [ ] **Product Sign-Off:** Feature acceptance from product owner (@product-manager)
- [ ] **Security Review:** If any auth/data changes, @security-engineer approval
- [ ] **QA Sign-Off:** Staging environment testing complete (@qa-lead)
- [ ] **Database Review:** If migrations included, DBA approval (@dba)

### 6.2 Deployment Window

**Ideal deployment windows for Rumah Zakat (Indonesia timezone, UTC+7):**

- **Best:** Tuesday–Thursday 09:00–12:00 WIB (off-peak, staff available)
- **Acceptable:** Early morning 07:00–08:00 WIB (before launch, if urgent)
- **Avoid:** Friday afternoon (weekend approaching), late night (no on-call support)
- **Never:** Friday 17:00 WIB onward (weekend, no support staff)

### 6.3 Deployment Procedure

**Step 1: Announce deployment**

```
🚀 Deploying to production in 5 minutes

Release: v1.0.0-rc.1
Changes:
- User management module complete
- Authentication hardened against XSS
- Database migrations: 0001–0005 applied

Deployment: ~2 minutes
Monitoring: Sentry, Vercel Analytics enabled

Slack channel: #deployments
Questions? Tag @tech-lead
```

**Step 2: Merge to main (if not already)**

```bash
git checkout main
git pull origin main
# Should be ready to deploy (all CI checks passed on PR)
```

**Step 3: Production database migration** (if needed)

```bash
# Apply any pending migrations
export DATABASE_URL="<production-neon-url>"
npm run migrate

# Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM person.child;"
```

**Step 4: Trigger production deployment on Vercel**

- Via **Vercel Dashboard:**
  - Navigate to rz_ajis project → Deployments
  - Find latest `main` branch commit
  - Click **Promote to Production**
  - Confirm "Yes, I want to deploy"
  
- Or via **Vercel CLI:**
  ```bash
  vercel --prod
  # Will prompt for production deployment; confirm
  ```

**Step 5: Monitor deployment**

```bash
# Watch Vercel build log
# Expected output:
# ✓ Packages installed (npm ci)
# ✓ Environment variables loaded
# ✓ Build complete
# ✓ Functions optimized
# ✓ Ready to go live

# Deployment typically takes 2–3 minutes
```

**Step 6: Health check**

```bash
# Test production endpoints
curl https://rzajis.vercel.app/api/v1/auth/me \
  -H "Cookie: ajis_session=invalid"
# Should return 401 (service up)

# Monitor Sentry for errors
# Check Vercel Analytics for traffic

# Wait 5 minutes before proceeding
```

**Step 7: Post in Slack**

```
✅ Production deployment complete

Commit: abc1234 (User management module)
Deployed: 09:15 WIB
Downtime: 0 minutes (serverless, no restart)

Monitoring active:
- Sentry: https://sentry.io/...
- Vercel Analytics: https://vercel.com/...
- Status page: https://rzajis.vercel.app/health

Next: Monitor for 1 hour. Contact @tech-lead for issues.
```

---

## 7. Post-Deployment Verification

### 7.1 Immediate Checks (First 5 minutes)

```bash
# 1. Homepage loads
curl -I https://rzajis.vercel.app/
# Status: 200 OK

# 2. API responds
curl https://rzajis.vercel.app/api/v1/auth/me \
  -H "Cookie: ajis_session=invalid" -s | jq .
# Should show: {"error": {"code": "UNAUTHENTICATED", ...}}

# 3. Database accessible
# (Implicit if API responds with database queries)

# 4. No Sentry errors
# Open Sentry dashboard; should be clear or only known issues

# 5. Vercel deployment status
# Vercel Dashboard → Deployments → Latest should be "Ready"
```

### 7.2 Extended Checks (First 30 minutes)

```bash
# 1. Load test (light, to confirm no degradation)
ab -n 50 -c 5 https://rzajis.vercel.app/api/v1/children

# 2. Regional coordinator can log in
curl -X POST https://rzajis.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"korwil.wilayah1","password":"TestPass123!"}'
# Should return 200 with session cookie

# 3. Child list accessible
curl https://rzajis.vercel.app/api/v1/children?limit=10 \
  -H "Cookie: ajis_session=<valid-token>" -s | jq '.data | length'
# Should return integer (number of children)

# 4. Check response times
# Vercel Analytics: all endpoints < 300ms p95

# 5. Monitor Sentry error rate
# Should remain < 1% (99%+ success rate)
```

### 7.3 Business Logic Validation (1 hour)

Ask a real user (Korwil or Branch Admin) to test:

- [ ] Log in successfully
- [ ] View children list for their region
- [ ] Create a new child record
- [ ] Record a coaching session with attendance
- [ ] Generate a semester report
- [ ] Log out

Document any issues in #deployments Slack channel.

### 7.4 Performance Validation

Compare to pre-deployment baseline:

| Metric | Baseline | Post-Deployment | Target |
|--------|----------|-----------------|--------|
| **API p95 response time** | 120ms | <150ms | <300ms |
| **FCP (First Contentful Paint)** | 0.8s | <1.0s | <1.5s |
| **Error rate** | 0.05% | <0.5% | <1% |
| **Sentry unique errors** | 2–3 known | <5 | <5 |

If any metric degrades significantly, consider **rollback** (see §11).

---

## 8. Production Checklist

### 8.1 Pre-Deployment Checklist

- [ ] **Code & Quality**
  - [ ] All PR checks passed (lint, type, test, build)
  - [ ] ≥2 code approvals received
  - [ ] No "WIP", "TODO", or "FIXME" commits in changeset
  - [ ] Changelog/release notes prepared

- [ ] **Database**
  - [ ] Migrations tested on staging successfully
  - [ ] Backup of staging database taken
  - [ ] Manual backup of production database scheduled/taken
  - [ ] Rollback migration scripts reviewed

- [ ] **Environment Variables**
  - [ ] All required vars present in Vercel Production scope
  - [ ] Secrets differ from staging (SESSION_SECRET, DSN keys, etc.)
  - [ ] No hardcoded secrets in code (audit via `npm audit` + `git grep`)

- [ ] **Security**
  - [ ] No new dependencies added without security review
  - [ ] `npm audit` shows no critical vulnerabilities
  - [ ] HTTPS enforced (Vercel default, but verify headers)
  - [ ] CORS headers appropriate (not `*`)
  - [ ] CSRF token mechanism confirmed (SameSite=Strict)

- [ ] **Documentation**
  - [ ] Release notes written (GitHub Releases)
  - [ ] Deployment procedure double-checked
  - [ ] Rollback plan documented
  - [ ] On-call engineer assigned and notified

- [ ] **Monitoring**
  - [ ] Sentry project linked and alerts configured
  - [ ] Vercel Analytics enabled for production
  - [ ] Health check endpoint confirmed working
  - [ ] Slack bot/alerts configured for deployment events

### 8.2 Post-Deployment Checklist (First 24 hours)

- [ ] **Immediate (0–5 min)**
  - [ ] Homepage loads without errors
  - [ ] API endpoints respond (test auth/me, children list)
  - [ ] Database queries succeed
  - [ ] No spike in Sentry errors

- [ ] **Short-term (5–30 min)**
  - [ ] Load test shows no degradation
  - [ ] User login flows work
  - [ ] CRUD operations complete without error
  - [ ] No database connection issues

- [ ] **Extended (30 min–2 hours)**
  - [ ] Real user testing completed (Korwil/Branch Admin)
  - [ ] Performance metrics stable
  - [ ] Error rate remains < 1%
  - [ ] No memory/CPU issues in Vercel Analytics

- [ ] **Follow-up (24 hours)**
  - [ ] No unusual patterns in Sentry
  - [ ] Database performance metrics stable (check Neon dashboard)
  - [ ] User feedback collected and logged
  - [ ] Deployment logged in CHANGELOG

---

## 9. Security Checklist

### 9.1 Pre-Deployment Security Review

- [ ] **Authentication**
  - [ ] SESSION_SECRET meets entropy requirement (≥32 bytes)
  - [ ] Session cookie flags correct: HttpOnly, Secure, SameSite=Strict
  - [ ] Session timeout appropriate (24 hours default)
  - [ ] Rate limiting on /auth/login (5 attempts / 10 min window)

- [ ] **Authorization**
  - [ ] Row-level scoping enforced for all /api/v1/* endpoints
  - [ ] Branch Admin can only access their office's data (404 if out-of-scope)
  - [ ] Korwil can only access their region's data
  - [ ] Super Admin can access all data

- [ ] **Input Validation**
  - [ ] All user inputs validated against Zod schema
  - [ ] Required fields enforced
  - [ ] Field length limits enforced (e.g., full_name ≤ 200 chars)
  - [ ] Enum values validated (attendance status, role, etc.)
  - [ ] No SQL injection, command injection, or XSS possible

- [ ] **Data Protection**
  - [ ] No child PII on public website
  - [ ] Passwords hashed with bcrypt (cost ≥ 10)
  - [ ] No plaintext passwords in logs or audit trail
  - [ ] Sensitive fields redacted from error responses
  - [ ] TLS enforced in transit (HTTPS, `sslmode=require` on DB)

- [ ] **Infrastructure**
  - [ ] Vercel project settings: only private repos, no public builds
  - [ ] GitHub branch protection: main requires ≥2 reviews, CI passing
  - [ ] Vercel environment variables scoped correctly (never expose secrets to public)
  - [ ] Neon database: password-protected, IP whitelist (if applicable)
  - [ ] Backups configured and tested (restore test required)

- [ ] **Dependencies**
  - [ ] `npm audit` run; no critical vulnerabilities
  - [ ] `npm outdated` checked; security updates applied
  - [ ] Dependency lock file (`package-lock.json`) committed
  - [ ] No dev dependencies in production build

### 9.2 Production Security Hardening

After deployment, verify:

```bash
# 1. Security headers present
curl -I https://rzajis.vercel.app | grep -i "x-frame\|x-content\|referrer\|hsts"
# Expected:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Strict-Transport-Security: max-age=...

# 2. No sensitive info in responses
curl https://rzajis.vercel.app/api/v1/auth/me | jq .
# Should NOT include: passwords, tokens, secrets

# 3. CORS headers restrictive
curl -H "Origin: https://evil.com" \
     -I https://rzajis.vercel.app/api/v1/children
# Should NOT have: Access-Control-Allow-Origin: *

# 4. Rate limiting active
for i in {1..10}; do
  curl -X POST https://rzajis.vercel.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' -s | jq '.error.code'
done
# 6th attempt should return 429 TOO_MANY_REQUESTS

# 5. CSRF protection (SameSite cookie)
curl -i -X POST https://rzajis.vercel.app/api/v1/sessions \
  -H "Origin: https://evil.com" | grep -i "set-cookie"
# Cookie should have: SameSite=Strict
```

### 9.3 Incident Response

If a security issue is discovered:

1. **Do NOT deploy further changes** until issue is understood
2. **Isolate:** Determine if issue is in code, database, or infrastructure
3. **Notify:** Slack #security-incidents channel (if such exists) + @tech-lead + @security-engineer
4. **Mitigate:** Apply immediate fix or rollback if severe
5. **Audit:** Check Sentry/logs for evidence of exploitation
6. **Post-mortem:** Schedule post-incident review within 24 hours

---

## 10. Monitoring & Observability

### 10.1 Sentry Error Tracking

**Setup:** Link Sentry DSN to Vercel environment variables (Production scope only)

```javascript
// lib/sentry.ts (initialize in Next.js)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Redact sensitive fields
    if (event.request?.headers?.cookie) {
      event.request.headers.cookie = "[REDACTED]";
    }
    return event;
  },
});
```

**Monitoring:**

- [ ] Error rate < 1% (check dashboard hourly for first 24h)
- [ ] Critical errors (5xx) = 0 (except planned maintenance)
- [ ] Performance degradation alerts configured

### 10.2 Vercel Analytics

**Metrics to monitor:**

| Metric | Healthy Range | Alert Threshold |
|--------|---------------|-----------------|
| **Response Time (p50)** | < 100ms | > 300ms |
| **Response Time (p95)** | < 300ms | > 500ms |
| **Error Rate** | < 0.5% | > 1% |
| **Throughput** | Stable | ±20% spike |
| **Serverless Function Duration** | < 3s avg | > 10s |

### 10.3 Database Monitoring (Neon)

**Monitor via Neon console:**

- [ ] Query latency: p95 < 100ms
- [ ] Connection count: < 10 (Vercel serverless = low concurrency)
- [ ] Cache hit ratio: > 95% (indexes working)
- [ ] Storage growth: < 5GB (acceptable for initial data)

**Queries to check:**

```sql
-- Slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
-- Unused large indexes = candidates for removal

-- Connection pool status
SELECT count(*) FROM pg_stat_activity;
```

### 10.4 Health Check Endpoint

Create `/api/v1/health` (unauthenticated):

```typescript
// app/api/v1/health/route.ts
export async function GET() {
  try {
    // Test database connectivity
    const result = await sql`SELECT 1`;

    return Response.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 }
    );
  }
}
```

**Monitor with:** `curl https://rzajis.vercel.app/api/v1/health` (every 60s)

---

## 11. Rollback Strategy

### 11.1 When to Rollback

**Immediately rollback if:**

- [ ] Error rate > 10% (e.g., 5xx errors in > 1 in 10 requests)
- [ ] Critical business logic broken (e.g., cannot create child, cannot log in)
- [ ] Database corruption or data loss
- [ ] Security breach detected
- [ ] Performance degradation > 50% (p95 response time > 500ms)

**Monitor closely, but don't rollback for:**

- [ ] Minor issues (typo in UI, non-critical field missing)
- [ ] Single user reports (confirm if widespread first)
- [ ] Expected warning logs (not errors)

### 11.2 Application Rollback (Vercel)

**Fastest option: Revert to previous production deployment**

```bash
# Via Vercel Dashboard:
# 1. Deployments → Find previous successful deployment
# 2. Click the deployment
# 3. Click "Promote to Production"
# 4. Confirm
# Takes ~1–2 minutes

# Or via CLI:
vercel rollback --prod
# Prompts for which previous deployment to promote
```

**Alternative: Revert Git commit and re-deploy**

```bash
git log --oneline (find the bad commit)
git revert abc1234 (commit hash of bad deploy)
git push origin main
# Vercel auto-deploys the revert (2–3 minutes)
```

### 11.3 Database Rollback

**If migration caused issues:**

1. **Identify the problematic migration:**
   ```sql
   SELECT name FROM public._migrations ORDER BY applied_at DESC LIMIT 5;
   -- Find which one caused issues
   ```

2. **Create rollback migration:**
   ```bash
   # If 0005_person_schema.sql caused issues:
   # Run the .down.sql file
   psql "$DATABASE_URL" -f migrations/0005_person_schema.down.sql
   ```

3. **Remove from tracking table:**
   ```sql
   DELETE FROM public._migrations WHERE name = '0005_person_schema.sql';
   ```

4. **Verify data integrity:**
   ```sql
   -- Ensure no orphaned foreign keys after rollback
   SELECT COUNT(*) FROM person.child;
   -- Check recent data is still there
   ```

5. **Re-deploy application** (after fixing the migration)

### 11.4 Data Restoration from Backup

**If data corruption is suspected:**

1. **Stop application** (to prevent further writes):
   ```bash
   # Via Vercel: Deployments → click current prod deployment → click "Pause"
   # (Not a real pause in Vercel, but can stop accepting traffic at DB level)
   ```

2. **Restore from Neon backup:**
   ```bash
   # Via Neon console: Backups → select backup → Restore
   # Neon restores to a new branch; you then promote it
   ```

3. **Verify restored data:**
   ```sql
   SELECT COUNT(*) FROM person.child;
   -- Compare to expected count before corruption
   ```

4. **Re-deploy application** to point to restored database

### 11.5 Rollback Comms

**Post in #deployments:**

```
⚠️ ROLLBACK: Production deployment reverted

Commit reverted: abc1234 (User management module)
Reason: Error rate spiked to 15% (child creation failing)
Action: Promoted previous deployment xyz5678
Time: 09:22 WIB (7 minutes after initial deployment)

Current status: Back to stable
Next steps: Debug issue, apply fix, re-deploy tomorrow

Contact @tech-lead for details.
```

---

## 12. Incident Response

### 12.1 Incident Communication

**Upon detecting a critical issue:**

1. **Declare incident** in #deployments Slack:
   ```
   🚨 INCIDENT: Production database unavailable
   Severity: Critical
   Impact: Users cannot log in
   ETA: 15 minutes
   ```

2. **Establish incident channel** (if not automated):
   ```
   Slack: #incident-2026-07-14-database
   Zoom: [bridge link] (if needed for synchronous discussion)
   ```

3. **Assign roles:**
   - **Incident Commander:** @tech-lead (directs response)
   - **Communications:** @product-manager (updates stakeholders)
   - **Technical Lead:** @dba or @senior-engineer (implements fix)

### 12.2 Incident Investigation

```bash
# 1. Gather logs
curl https://sentry.io/api/0/organizations/rumah-zakat/issues/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[0:10]'

# 2. Check recent deployments
vercel list --limit=10

# 3. Query database status
psql "$DATABASE_URL" -c "SELECT datname, state, query FROM pg_stat_activity LIMIT 20;"

# 4. Check Vercel function logs
# Via Vercel dashboard: Deployments → current prod → Logs

# 5. Correlation: What changed?
git log --oneline -10
git diff HEAD~1 HEAD -- lib/db.ts # (any database connection changes?)
```

### 12.3 Recovery Procedure

**Example: Database connection timeouts post-deployment**

1. **Hypothesis:** New migration locks table during query
2. **Validate:** Check `pg_locks` for long-running transactions
3. **Mitigate:** Rollback migration (§11.3) + rollback deployment (§11.2)
4. **Communicate:** Post resolution in incident channel
5. **Root Cause Analysis:** Schedule 1-hour post-mortem within 24 hours

### 12.4 Post-Incident Checklist

Within 24 hours of incident resolution:

- [ ] Root cause identified
- [ ] Permanent fix implemented and tested on staging
- [ ] Re-deployment to production completed
- [ ] Status page updated (if applicable)
- [ ] User communication sent (apology, timeline, prevention)
- [ ] Post-mortem scheduled (within 48 hours)
- [ ] Incident logged in shared doc (for future reference)

---

## 13. Appendix: Command Reference

### Quick Deploy Checklist

```bash
# 1. Verify code quality
npm run lint && npm run type-check && npm run test

# 2. Build
npm run build

# 3. Check staging
curl https://staging.rzajis.vercel.app/api/v1/health

# 4. Tag release (optional)
git tag -a v1.0.0 -m "User management module"
git push origin v1.0.0

# 5. Trigger production deployment
vercel --prod
# Or merge main → Vercel auto-deploys

# 6. Monitor
curl https://rzajis.vercel.app/api/v1/health
# Watch Sentry dashboard
# Watch Vercel Analytics
```

### Environment Variable Generator

```bash
# Generate random SESSION_SECRET
openssl rand -base64 32

# Test Neon connection
psql "$DATABASE_URL" -c "SELECT version();"

# Check build output
ls -lh .next/standalone/
```

---

**End of 18_DEPLOYMENT_GUIDE.md**
