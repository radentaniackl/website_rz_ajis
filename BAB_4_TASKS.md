# BAB 4 — Authentication & Authorization Tasks

## Task Breakdown

### Phase 1: Database Setup

- [ ] AUTH4-1: Add auth tables to schema (ajis_session, ajis_account, ajis_verification_token)

### Phase 2: Auth.js Configuration

- [ ] AUTH4-2: Configure Auth.js v5 with Drizzle adapter
- [ ] AUTH4-3: Implement SSO provider (Google/Microsoft/Custom)
- [ ] AUTH4-4: Implement credentials provider (username/password)

### Phase 3: Login Implementation

- [ ] AUTH4-5: Create login page with validation
- [ ] AUTH4-6: Implement login flow (Server Action)

### Phase 4: Logout Implementation

- [ ] AUTH4-7: Implement logout flow (Server Action)

### Phase 5: Middleware & Protection

- [ ] AUTH4-8: Configure middleware for route protection
- [ ] AUTH4-9: Implement RBAC filters (WHERE clause builders)
- [ ] AUTH4-10: Implement permission checker utility
- [ ] AUTH4-11: Create unauthorized page

### Phase 6: Password Security

- [ ] AUTH4-12: Migrate passwords (MD5 → bcrypt/argon2)
- [ ] AUTH4-13: Implement password reset flow

### Phase 7: Validation & Error Handling

- [ ] AUTH4-14: Add validation schemas (Zod)
- [ ] AUTH4-15: Implement error handling utilities

### Phase 8: Security & Testing

- [ ] AUTH4-16: Add audit logging for authentication events
- [ ] AUTH4-17: Implement rate limiting for login attempts
- [ ] AUTH4-18: Run authentication tests (login, logout, session, RBAC)

## Task Details

| Task | Tujuan | Deskripsi | Priority | Dependency | Estimasi | Output | Deliverable |
|------|--------|-----------|----------|------------|---------|--------|-------------|
| AUTH4-1 | Add auth tables to schema | Add ajis_session, ajis_account, ajis_verification_token to schema | High | DB3-10 | 0.5 day | Updated schema | Auth tables defined |
| AUTH4-2 | Configure Auth.js | Setup Auth.js v5 with Drizzle adapter, JWT callbacks | High | AUTH4-1 | 1 day | Auth.js config | Auth.js configured |
| AUTH4-3 | Implement SSO provider | Configure Google/Microsoft OAuth provider | High | AUTH4-2 | 1 day | SSO provider | SSO login working |
| AUTH4-4 | Implement credentials provider | Configure username/password login with bcrypt | High | AUTH4-2 | 0.5 day | Credentials provider | Local login working |
| AUTH4-5 | Create login page | Build login form with React Hook Form + Zod validation | High | AUTH4-4 | 1 day | Login page | Login UI ready |
| AUTH4-6 | Implement login flow | Server Action for login with error handling | High | AUTH4-5 | 0.5 day | Login action | Login working |
| AUTH4-7 | Implement logout flow | Server Action for logout with session cleanup | High | AUTH4-6 | 0.5 day | Logout action | Logout working |
| AUTH4-8 | Configure middleware | Protect routes with middleware, redirect logic | High | AUTH4-2 | 0.5 day | Middleware | Route protection |
| AUTH4-9 | Implement RBAC filters | Build RBAC WHERE clause builders for data scoping | High | AUTH4-2 | 1 day | RBAC filters | Data scoping ready |
| AUTH4-10 | Implement permission checker | Build permission validation utility for authorization | High | AUTH4-9 | 0.5 day | Permission checker | Authorization ready |
| AUTH4-11 | Create unauthorized page | Build unauthorized access page with user-friendly message | Medium | AUTH4-10 | 0.5 day | Unauthorized page | Error page ready |
| AUTH4-12 | Migrate passwords | Rehash MD5 passwords to bcrypt/argon2, force reset | High | AUTH4-4 | 1 day | Migrated passwords | Passwords secure |
| AUTH4-13 | Implement password reset | Build password reset flow with email verification | Medium | AUTH4-12 | 1 day | Password reset | Reset flow working |
| AUTH4-14 | Add validation schemas | Create Zod schemas for login, password reset | High | AUTH4-5 | 0.5 day | Validation schemas | Validation ready |
| AUTH4-15 | Implement error handling | Build error handling utilities for auth errors | High | AUTH4-6 | 0.5 day | Error handlers | Errors handled |
| AUTH4-16 | Add audit logging | Log authentication events (login, logout, failed attempts) | Medium | AUTH4-6 | 0.5 day | Audit logging | Events logged |
| AUTH4-17 | Implement rate limiting | Add rate limiting for login attempts, account lockout | Medium | AUTH4-6 | 0.5 day | Rate limiting | Login protected |
| AUTH4-18 | Run authentication tests | Test login, logout, session, RBAC, permissions | High | All | 1 day | Test results | Auth validated |

**Total Estimasi:** 12 days

## Critical Blockers (Perlu Klarifikasi)

1. **SSO Provider Selection** - Choose Google/Microsoft/Custom OAuth provider
2. **Password Migration** - Rehash MD5 passwords to bcrypt/argon2 + force reset
3. **Auth Tables** - Add ajis_session, ajis_account, ajis_verification_token to schema
4. **NEXTAUTH_SECRET** - Generate secure secret for production
5. **Email Provider** - Choose Resend/SendGrid for password reset (or disable)

## RBAC Matrix

| Role ID | Role Name | Data Scope | Permissions |
|---------|-----------|------------|-------------|
| 1 | Super Admin | All offices, all regions | Full access to all modules |
| 2 | Branch Admin (SPMD) | Single office + regions | Office data access, CRUD office users |
| 9 | Regional Coordinator (Korwil) | Assigned regions only | Read anak, CRUD operational data (sesi, hafalan, evaluasi) |

## Route Protection

**Public Routes:**
- `/login` - Login page
- `/auth/error` - Auth error page
- `/auth/verify-request` - Email verification

**Auth Required Routes:**
- `/dashboard/*` - All dashboard pages
- `/anak/*` - Child data pages
- `/sesi/*` - Session pages
- `/hafalan/*` - Hafalan pages
- `/evaluasi/*` - Evaluation pages
- `/laporan/*` - Report pages

**Super Admin Only:**
- `/kantor/*` - Office management
- `/settings` - System settings

**Branch Admin & Super Admin:**
- `/wilayah/*` - Region management
- `/users/*` - User management
