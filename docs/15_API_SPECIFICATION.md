# 15_API_SPECIFICATION.md

## AJIS — Anak Juara Information System
### REST API Specification

**Prepared for:** Rumah Zakat — Anak Juara Program
**Source documents:** `08_PRD.md`, `09_ERD.md`, `10_DATABASE_SPECIFICATION.md`
**Status:** Specification only — no implementation code included
**Document Date:** July 14, 2026

---

## Table of Contents

1. Introduction & Scope
2. Global API Conventions
3. Module: Authentication
4. Module: Users
5. Module: Children
6. Module: Donors
7. Module: Regions
8. Module: Reports
9. Global Error Code Reference
10. Open Items to Confirm Before Implementation

---

## 1. Introduction & Scope

This document specifies every REST API endpoint required to implement the AJIS rebuild described in `08_PRD.md`, against the normalized PostgreSQL schema described in `09_ERD.md` and `10_DATABASE_SPECIFICATION.md`. It covers the Super Admin Dashboard and Regional Dashboard (Branch Admin / Korwil) applications, plus the minimal public, unauthenticated surface consumed by the Public Website.

Endpoints are grouped into six modules per the request: **Authentication, Users, Children, Donors, Regions, Reports**. Domain areas that the PRD scopes as *tabs or sub-resources of a child profile* (coaching sessions/Pembinaan, hafalan, semester evaluations/Penilaian) are specified under **Children**, consistent with §5.3 of the PRD, which presents them as tabs on the child profile rather than standalone applications. Coordinator (SDM Wilayah) management is specified under **Regions**, since coordinators are organizational staff scoped to an office, per PRD §5.2.

Out of scope, matching PRD §3.2: parent/guardian portal, push notifications, PDF export, CAJ/PM workflows, Materi/Prestasi/Dokumentasi modules, online payment processing, and feature-level permissions.

---

## 2. Global API Conventions

### 2.1 Base URL & Versioning

All authenticated endpoints are served under:

```
/api/v1
```

The Public Website's unauthenticated aggregate endpoints are served under:

```
/api/v1/public
```

### 2.2 Authentication Model

- Session-based authentication using an encrypted, `httpOnly`, `Secure`, `SameSite=Strict` cookie (`ajis_session`), per PRD §9.1. There is no bearer token / `Authorization` header scheme for the dashboards.
- The cookie is validated (decrypted and checked for an active, non-expired session record) on **every** request to a non-public endpoint — never merely checked for presence.
- A request with a missing, invalid, or expired session cookie against a non-public endpoint returns `401 UNAUTHENTICATED`.
- The login endpoint (`POST /api/v1/auth/login`) is rate-limited (PRD §9.1) — see §3.1.

### 2.3 Authorization Model (Row-Level Scoping)

Per PRD §4.1/§6 and `10_DATABASE_SPECIFICATION.md` §6.7, authorization is enforced in two layers on every request:

1. **Role check (`access_control.role` / `permission`)** — does this role have the capability at all (e.g., only Super Admin can create an office).
2. **Row-level data scope** — which rows the caller may see or write:
   - **Super Admin** — unrestricted; all offices, all regions.
   - **Branch Admin (SPMD)** — scoped to the single `office_id` linked via `system_user.coordinator_id → coordinator.office_id`.
   - **Korwil** — scoped to the single assigned `region_id` (`organization.coaching_region`). *(See §10, item 1 — the current schema does not yet carry an explicit coordinator→region assignment column; this specification assumes one will exist, e.g. `coordinator.assigned_region_id`.)*
   - **Public Visitor** — no authentication; access limited to `/api/v1/public/*`, which returns only aggregate, de-identified data (PRD §9.3).

Every list, detail, and write endpoint documented below states the roles permitted and how the scope filter is applied. On writes, the server **re-validates that the submitted resource ID actually falls within the caller's scope before applying the change** (PRD §9.2) — a Branch Admin cannot write a child ID that resolves to another office merely by knowing its ID.

### 2.4 Request / Response Envelope

Successful responses:

```json
{
  "data": { },
  "meta": { }
}
```

`meta` is omitted for single-resource responses and populated with pagination info for list responses (§2.6).

Error responses (uniform shape for every non-2xx response):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary.",
    "details": [
      { "field": "full_name", "issue": "required" }
    ]
  }
}
```

`details` is present only for `VALIDATION_ERROR` (422) and omitted otherwise.

### 2.5 Pagination

List endpoints use **keyset (seek-based) pagination**, per PRD §10.2, not offset pagination.

Query parameters:

| Param | Type | Description |
|---|---|---|
| `limit` | integer | Page size. Default `25`, max `100`. |
| `cursor` | string | Opaque cursor from the previous response's `meta.next_cursor`. Omit for the first page. |

Response `meta`:

```json
{
  "meta": {
    "next_cursor": "eyJpZCI6MTIzfQ==",
    "has_more": true
  }
}
```

### 2.6 Common Query Parameters on List Endpoints

| Param | Applies to | Description |
|---|---|---|
| `q` | name-searchable resources | Free-text search (backed by a GIN index per §15.4 of the DB spec). |
| `active` | soft-deletable resources | `true` (default) / `false` / `all`. |
| `office_id` | Super Admin only | Filter to one office; ignored (forced to caller's own scope) for Branch Admin/Korwil. |
| `region_id` | Super Admin / Branch Admin | Filter to one coaching region. |
| `sort` | most list endpoints | e.g. `-created_at`, `full_name`. Default varies per endpoint, stated inline. |

### 2.7 Standard HTTP Status Codes

| Status | Meaning |
|---|---|
| `200 OK` | Successful read or update. |
| `201 Created` | Successful resource creation. |
| `204 No Content` | Successful action with no response body (e.g., logout). |
| `400 BAD_REQUEST` | Malformed request (unparseable JSON, wrong content type). |
| `401 UNAUTHENTICATED` | Missing/invalid/expired session. |
| `403 FORBIDDEN` | Authenticated, but role/scope does not permit this action. |
| `404 NOT_FOUND` | Resource does not exist, or exists but is outside the caller's scope (scope violations are reported as 404, not 403, to avoid confirming a resource's existence to an out-of-scope caller). |
| `409 CONFLICT` | Uniqueness violation (e.g., duplicate `username`, duplicate `(child_id, semester_id)` evaluation). |
| `422 UNPROCESSABLE_ENTITY` | Field-level validation failure. |
| `429 TOO_MANY_REQUESTS` | Rate limit exceeded (login endpoint). |
| `500 INTERNAL_ERROR` | Unhandled server error. |

### 2.8 Soft Delete

"Delete" endpoints on core entities (`child`, `donor`, `office`, `coaching_region`, `coordinator`, `system_user`, `facility`) never issue a physical `DELETE` — they set `active = false`, per the `active` flag convention in `10_DATABASE_SPECIFICATION.md` §2.5. They are documented below as `DELETE` for REST-verb clarity but behave as a soft deactivation. Reactivation is a `PATCH` with `{"active": true}`.

### 2.9 Idempotency on Writes

`POST` endpoints that create financial or attendance records (session creation, transactions, sponsorship pairings) accept an optional `Idempotency-Key` header. A repeated request with the same key returns the original `201` response rather than creating a duplicate row, guarding against double-submission from field devices with unreliable connectivity.

### 2.10 Auditability

Every successful write to a core operational table (per PRD §8.2) is recorded as a history entry (actor `system_user_id`, timestamp, prior value) retrievable via `GET /api/v1/reports/audit-log` (§8.5). This is implicit in every write endpoint below and not repeated per-endpoint.

---

## 3. Module: Authentication

Backed by `person.system_user` and `reference.role`.

### 3.1 `POST /api/v1/auth/login`

Authenticates a user and issues the session cookie.

**Request Body**

```json
{
  "username": "korwil.jabar01",
  "password": "plaintext-password"
}
```

**Response `200 OK`**

```json
{
  "data": {
    "system_user_id": 481,
    "username": "korwil.jabar01",
    "role": { "role_id": 3, "code": "korwil", "name": "Regional Coordinator" },
    "coordinator": { "coordinator_id": 112, "full_name": "Ahmad Faisal", "office_id": 4 },
    "donor": null
  }
}
```

The `ajis_session` cookie is set via `Set-Cookie`; it is not present in the JSON body.

**Validation**
- `username`: required, string.
- `password`: required, string, min 1 char (length rules are enforced at password-set time, not at login).

**Authorization**
- No prior authentication required (this *is* the auth entry point).

**Business rule:** if the stored `password_hash` is still legacy MD5 (identifiable by hash length/format), the server verifies against MD5 once, then transparently re-hashes with bcrypt/argon2 and updates `password_hash` before responding (PRD §9.1) — invisible to the client.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `401` | `INVALID_CREDENTIALS` | Username not found or password mismatch. Same error/message for both cases, to avoid username enumeration. |
| `403` | `ACCOUNT_INACTIVE` | `system_user.active = false`. |
| `422` | `VALIDATION_ERROR` | Missing `username` or `password`. |
| `429` | `RATE_LIMITED` | Too many login attempts from this IP/username within the rate-limit window. |

---

### 3.2 `POST /api/v1/auth/logout`

Invalidates the current session.

**Request Body:** none.

**Response `204 No Content`**

**Authorization:** any authenticated session.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHENTICATED` | No valid session to log out of. |

---

### 3.3 `GET /api/v1/auth/me`

Returns the current authenticated identity and scope — used by the dashboard shell on load to determine which application/role UI to render.

**Response `200 OK`**

```json
{
  "data": {
    "system_user_id": 481,
    "username": "korwil.jabar01",
    "role": { "role_id": 3, "code": "korwil", "name": "Regional Coordinator" },
    "scope": { "type": "region", "region_id": 9, "office_id": 4 }
  }
}
```

**Authorization:** any authenticated session.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHENTICATED` | No valid session. |

---

### 3.4 `POST /api/v1/auth/change-password`

Self-service password change for the currently authenticated user.

**Request Body**

```json
{
  "current_password": "old-plaintext",
  "new_password": "new-plaintext"
}
```

**Response `200 OK`**

```json
{ "data": { "message": "Password updated." } }
```

**Validation**
- `current_password`: required; must match the caller's stored hash.
- `new_password`: required, minimum 8 characters, must differ from `current_password`.

**Authorization:** any authenticated session; a user may only change their own password via this endpoint (admin-triggered resets use §4.6).

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHENTICATED` | No valid session. |
| `422` | `VALIDATION_ERROR` | `new_password` too short or missing. |
| `409` | `INVALID_CURRENT_PASSWORD` | `current_password` does not match. |

---

## 4. Module: Users

Backed by `person.system_user` and `reference.role`. All endpoints in this module are **Super Admin only** except `GET /api/v1/roles`, per PRD §5.2 ("the only role that manages ... users").

### 4.1 `GET /api/v1/users`

List system user accounts.

**Query Params:** `limit`, `cursor`, `q` (matches `username` or linked `coordinator.full_name`/`donor.full_name`), `active`, `role_id`, `office_id` (filters by linked coordinator's office), `sort` (default `username`).

**Response `200 OK`**

```json
{
  "data": [
    {
      "system_user_id": 481,
      "username": "korwil.jabar01",
      "role": { "role_id": 3, "code": "korwil", "name": "Regional Coordinator" },
      "coordinator": { "coordinator_id": 112, "full_name": "Ahmad Faisal" },
      "donor": null,
      "is_system_account": false,
      "active": true,
      "created_at": "2026-02-10T08:12:00Z"
    }
  ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** Super Admin only.

**Error Responses:** `401 UNAUTHENTICATED`, `403 FORBIDDEN`.

---

### 4.2 `POST /api/v1/users`

Create a user account, linking it to an existing coordinator, an existing donor, or as a standalone system account.

**Request Body**

```json
{
  "username": "korwil.jabar02",
  "password": "temporary-password",
  "role_id": 3,
  "coordinator_id": 118,
  "donor_id": null,
  "is_system_account": false
}
```

**Response `201 Created`** — same shape as one list item in §4.1.

**Validation**
- `username`: required, unique (`uq_system_user_username`), 3–100 chars.
- `password`: required, min 8 chars; hashed server-side before storage — never returned in any response.
- `role_id`: required, must reference an active `reference.role` row.
- `coordinator_id` / `donor_id`: each optional, but **exactly one** of `coordinator_id`, `donor_id`, or `is_system_account = true` must be set (mirrors `chk_system_user_owner`).
- `coordinator_id`, if provided: must reference an existing coordinator not already linked to another `system_user` (`uq_system_user_coordinator_id`).
- `donor_id`, if provided: same uniqueness rule via `uq_system_user_donor_id`.

**Authorization:** Super Admin only.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `FORBIDDEN` | Caller is not Super Admin. |
| `409` | `USERNAME_TAKEN` | `username` already exists. |
| `409` | `COORDINATOR_ALREADY_LINKED` | `coordinator_id` already has an account. |
| `409` | `DONOR_ALREADY_LINKED` | `donor_id` already has an account. |
| `422` | `VALIDATION_ERROR` | Missing/invalid fields, or none/more-than-one of the three owner fields set. |
| `404` | `ROLE_NOT_FOUND` | `role_id` does not exist or is inactive. |

---

### 4.3 `GET /api/v1/users/:id`

**Response `200 OK`** — same shape as one list item in §4.1.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 NOT_FOUND` (unknown `system_user_id`).

---

### 4.4 `PATCH /api/v1/users/:id`

Edit a user account. `username`, `role_id`, `active` are editable; `coordinator_id`/`donor_id`/`is_system_account` are immutable after creation (re-create the account to change ownership, preserving audit history integrity).

**Request Body** (all fields optional; only provided fields are updated)

```json
{
  "role_id": 2,
  "active": true
}
```

**Response `200 OK`** — updated resource, shape as §4.1.

**Validation**
- `username`, if provided: unique, 3–100 chars.
- `role_id`, if provided: must reference an active role.
- Attempting to set `coordinator_id`, `donor_id`, or `is_system_account` in the body returns `422` (immutable fields).

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `409 USERNAME_TAKEN`, `422 VALIDATION_ERROR` (includes immutable-field attempts).

---

### 4.5 `DELETE /api/v1/users/:id`

Deactivates the account (§2.8) — disables login without deleting history.

**Response `200 OK`**

```json
{ "data": { "system_user_id": 481, "active": false } }
```

**Authorization:** Super Admin only. A Super Admin cannot deactivate their own account (prevents accidental lockout).

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `FORBIDDEN` | Not Super Admin, or attempting self-deactivation. |
| `404` | `NOT_FOUND` | Unknown `system_user_id`. |

---

### 4.6 `POST /api/v1/users/:id/reset-password`

Admin-triggered password reset — generates a temporary password (or accepts an explicit one) and forces re-hash.

**Request Body**

```json
{ "new_password": "optional-explicit-temp-password" }
```

If omitted, the server generates a random temporary password and returns it once in the response (it is never retrievable again).

**Response `200 OK`**

```json
{ "data": { "system_user_id": 481, "temporary_password": "kX9#mQ2p" } }
```

**Validation:** `new_password`, if provided, minimum 8 characters.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### 4.7 `GET /api/v1/roles`

Read-only lookup of roles and their granted permissions (`access_control.role`, `role_permission`, `permission`).

**Response `200 OK`**

```json
{
  "data": [
    { "role_id": 1, "code": "super_admin", "name": "Super Admin", "permissions": ["read_child", "edit_child", "manage_users", "…"] },
    { "role_id": 2, "code": "branch_admin", "name": "Branch Admin" },
    { "role_id": 3, "code": "korwil", "name": "Regional Coordinator" }
  ]
}
```

**Authorization:** any authenticated user (used to render role-appropriate UI; read-only, no sensitive data).

**Error Responses:** `401 UNAUTHENTICATED`.

---

## 5. Module: Children

Backed by `person.child`, `person.family_member`, `person.household_member`, `person.child_education`, `program.child_enrollment`, `activity.coaching_session`, `activity.session_attendance`, `activity.session_habit_tracking`, `activity.hafalan_item_lookup`, `activity.hafalan_assessment`, `evaluation.semester_evaluation`, `evaluation.evaluation_item_score`.

All list/detail endpoints in this module apply row-level scoping (§2.3): Super Admin sees all children; Branch Admin sees children whose current enrollment/session history ties to their `office_id`; Korwil sees children within their assigned `region_id`.

### 5.1 `GET /api/v1/children`

List/search children (PRD §5.3 "Children (Anak)" list).

**Query Params:** `limit`, `cursor`, `q` (name search, GIN-indexed), `active`, `office_id` (Super Admin), `region_id` (Super Admin/Branch Admin), `welfare_category_id`, `sort` (default `full_name`).

**Response `200 OK`**

```json
{
  "data": [
    { "child_id": 5021, "full_name": "Siti Aisyah", "active": true, "office_id": 4, "region_id": 9 }
  ],
  "meta": { "next_cursor": "…", "has_more": true }
}
```

**Authorization:** Super Admin (unrestricted), Branch Admin (own office), Korwil (own region).

**Error Responses:** `401`, `403` (role has no read permission — should not normally occur for these three roles).

---

### 5.2 `POST /api/v1/children`

Register a new child.

**Request Body**

```json
{
  "full_name": "Siti Aisyah",
  "region_id": 9,
  "welfare_category_id": 2,
  "family_members": [
    { "relationship": "mother", "full_name": "Dewi Lestari" }
  ]
}
```

**Response `201 Created`**

```json
{
  "data": {
    "child_id": 5021,
    "full_name": "Siti Aisyah",
    "active": true,
    "created_at": "2026-07-14T09:00:00Z"
  }
}
```

**Validation**
- `full_name`: required, 1–200 chars.
- `region_id`: required for Korwil/Branch Admin creation (defaults to caller's own scope if omitted for those roles; required explicitly for Super Admin); must reference an active `coaching_region`.
- `welfare_category_id`, if provided: must reference an active `reference.welfare_category` row.
- `family_members`, if provided: each entry validated per §5.6 rules; created transactionally with the child.

**Authorization:** Super Admin, Branch Admin (own office only), Korwil (own region only). Server rejects (`403`) an attempt by Branch Admin/Korwil to register a child under a `region_id` outside their scope.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `FORBIDDEN` | `region_id` outside caller's scope. |
| `404` | `REGION_NOT_FOUND` | `region_id` does not exist/inactive. |
| `404` | `WELFARE_CATEGORY_NOT_FOUND` | `welfare_category_id` does not exist/inactive. |
| `422` | `VALIDATION_ERROR` | Missing/invalid `full_name`, malformed `family_members` entries. |

---

### 5.3 `GET /api/v1/children/:id`

Child profile — the "Data" tab. Family members, education, and enrollment are summarized inline; full lists are on their own sub-resources (§5.6–§5.8) for pagination.

**Response `200 OK`**

```json
{
  "data": {
    "child_id": 5021,
    "full_name": "Siti Aisyah",
    "active": true,
    "region": { "region_id": 9, "name": "Wilayah Bandung Timur", "office_id": 4 },
    "current_education": { "education_level": "smp", "grade": "8", "school": "SMPN 12 Bandung" },
    "family_member_count": 2,
    "created_at": "2026-01-05T03:00:00Z",
    "updated_at": "2026-06-01T10:00:00Z"
  }
}
```

**Authorization:** Super Admin, Branch Admin (own office), Korwil (own region). Out-of-scope IDs return `404` (§2.7).

**Error Responses:** `401`, `404 NOT_FOUND`.

---

### 5.4 `PATCH /api/v1/children/:id`

Edit core child fields.

**Request Body**

```json
{ "full_name": "Siti Aisyah Nurhaliza" }
```

**Response `200 OK`** — updated resource, shape as §5.3.

**Validation:** `full_name`, if provided: 1–200 chars.

**Authorization:** Super Admin, Branch Admin (own office), Korwil (own region). Server re-validates the child's current scope matches the caller before applying the write (PRD §9.2).

**Error Responses:** `401`, `404`, `422 VALIDATION_ERROR`.

---

### 5.5 `DELETE /api/v1/children/:id`

Deactivates the child record (§2.8) — e.g., graduated or withdrawn from the program. Historical sessions/evaluations/sponsorships are preserved.

**Response `200 OK`**

```json
{ "data": { "child_id": 5021, "active": false } }
```

**Authorization:** Super Admin, Branch Admin (own office), Korwil (own region).

**Error Responses:** `401`, `404`.

---

### 5.6 Family Members

#### `GET /api/v1/children/:id/family-members`

**Response `200 OK`**

```json
{
  "data": [
    { "family_member_id": 991, "relationship": "mother", "full_name": "Dewi Lestari" }
  ]
}
```

#### `POST /api/v1/children/:id/family-members`

**Request Body**

```json
{ "relationship": "father", "full_name": "Budi Santoso" }
```

**Response `201 Created`** — created row, shape as above.

**Validation**
- `relationship`: required; one of `father`, `mother`, `guardian`, `sibling`, `other` (`chk_family_member_relationship`, VARCHAR+CHECK per DB spec §6.2).
- `full_name`: required, 1–200 chars.

#### `PATCH /api/v1/family-members/:id`

**Request Body:** any subset of `relationship`, `full_name`.

**Response `200 OK`** — updated row.

#### `DELETE /api/v1/family-members/:id`

Physical delete is permitted here (no financial/audit dependency on `family_member` rows) — a true `204 No Content` removal, not a soft deactivation, since these rows `CASCADE` from the child and carry no downstream references.

**Response `204 No Content`**

**Authorization (all four):** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses (all four):** `401`, `403` (scope mismatch on the parent child), `404 NOT_FOUND` (unknown child or family member ID), `422 VALIDATION_ERROR` (invalid `relationship` value or missing `full_name`).

---

### 5.7 Education History

#### `GET /api/v1/children/:id/education`

Returns the full temporal history, ordered by `effective_from DESC`.

**Response `200 OK`**

```json
{
  "data": [
    { "education_id": 771, "education_level": "smp", "grade": "8", "school": { "facility_id": 30, "name": "SMPN 12 Bandung" }, "effective_from": "2025-07-01", "effective_to": null }
  ]
}
```

#### `POST /api/v1/children/:id/education`

Adds a new education period. The server automatically closes the previous open period (`effective_to = new.effective_from - 1 day`) if one exists — the client does not manage `effective_to` on the prior row directly.

**Request Body**

```json
{ "education_level": "smp", "grade": "8", "school_id": 30, "effective_from": "2026-07-01" }
```

**Response `201 Created`** — created row, shape as above, with `effective_to: null`.

**Validation**
- `education_level`: required; one of `sd`, `smp`, `sma`, `other` (`chk_child_education_level`, DB spec §6.6 — confirm whether `smk` should be added, per §18 item 3 of the DB spec).
- `school_id`: required, must reference an active `organization.facility`.
- `effective_from`: required, valid date.

#### `PATCH /api/v1/education/:id`

Corrects a historical entry (e.g., wrong grade recorded). Does **not** re-trigger the auto-close logic of `POST`.

**Request Body:** any subset of `education_level`, `grade`, `school_id`, `effective_from`, `effective_to`.

**Response `200 OK`** — updated row.

**Validation:** `effective_to`, if provided, must be `>= effective_from` (`chk_child_education_dates`).

**Authorization (all three):** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses (all three):** `401`, `403`, `404` (unknown child/education ID, or unknown/inactive `school_id`), `422 VALIDATION_ERROR`.

---

### 5.8 Program Enrollment

#### `GET /api/v1/children/:id/enrollments`

**Response `200 OK`**

```json
{
  "data": [
    { "enrollment_id": 4410, "program": { "program_id": 1, "name": "Anak Juara" }, "welfare_category": { "welfare_category_id": 2, "name": "Dhuafa" }, "enrollment_date": "2025-07-01", "active": true }
  ]
}
```

#### `POST /api/v1/children/:id/enrollments`

**Request Body**

```json
{ "program_id": 1, "welfare_category_id": 2, "enrollment_date": "2026-07-14" }
```

**Response `201 Created`** — created row, shape as above.

**Validation**
- `program_id`: required, must reference an active `program.program`.
- `welfare_category_id`: required, must reference an active `reference.welfare_category`.
- `enrollment_date`: required, valid date, not in the future.

#### `PATCH /api/v1/enrollments/:id`

**Request Body:** any subset of `welfare_category_id`, `active`.

**Response `200 OK`** — updated row.

**Authorization (all three):** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses (all three):** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

### 5.9 Coaching Sessions (Pembinaan)

`activity.coaching_session` (header) + `activity.session_attendance` (per-child detail) + `activity.session_habit_tracking` (per-attendance Mandiri habits).

#### `GET /api/v1/sessions`

List session headers.

**Query Params:** `limit`, `cursor`, `region_id`, `office_id` (Super Admin, resolves to all regions under that office), `presenter_id`, `session_type_id`, `date_from`, `date_to`, `sort` (default `-session_date`).

**Response `200 OK`**

```json
{
  "data": [
    { "session_id": 8801, "region": { "region_id": 9, "name": "Wilayah Bandung Timur" }, "presenter": { "coordinator_id": 112, "full_name": "Ahmad Faisal" }, "session_type": { "session_type_id": 1, "code": "reguler", "name": "Reguler" }, "session_date": "2026-07-12", "attendance_count": 18 }
  ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

#### `POST /api/v1/sessions`

Creates a session header and its full per-child attendance/Mandiri matrix in a single transactional write (PRD §10.2 — wrapped multi-row writes), matching the mobile-friendly single-form workflow in PRD §5.3. Supports the `Idempotency-Key` header (§2.9).

**Request Body**

```json
{
  "region_id": 9,
  "presenter_id": 112,
  "session_type_id": 1,
  "session_date": "2026-07-12",
  "attendance": [
    {
      "child_id": 5021,
      "attendance_status_id": 1,
      "habits": [
        { "habit_type": "prayer", "status": "completed" },
        { "habit_type": "recitation", "status": "partial" }
      ]
    }
  ],
  "guardian_attendance": [
    { "family_member_id": 991, "attendance_status_id": 1 }
  ]
}
```

`guardian_attendance` is only accepted (and only meaningful) when `session_type_id` resolves to the Parenting session type (PRD §5.3).

**Response `201 Created`**

```json
{
  "data": {
    "session_id": 8801,
    "region_id": 9,
    "presenter_id": 112,
    "session_type_id": 1,
    "session_date": "2026-07-12",
    "attendance_recorded": 18
  }
}
```

**Validation**
- `region_id`, `presenter_id`, `session_type_id`: required, must each reference an active row (`RESTRICT` FKs per DB spec §11.1); `presenter_id`'s coordinator must be active.
- `session_date`: required, valid date, not in the future.
- `attendance`: required array, min length 1; each `child_id` must reference an active child within `region_id`'s scope; `attendance_status_id` required; `(session_id, child_id)` uniqueness (`UNIQUE (session_id, child_id)`) is enforced server-side by construction (one array entry per child).
- `habits[].status`: one of `completed`, `partial`, `not_completed` (`chk_session_habit_tracking_status`).
- `guardian_attendance`, if provided: each `family_member_id` must belong to one of the children in `attendance`.

**Authorization:** Super Admin, Branch Admin (own office's regions), Korwil (own region only — and only as `presenter_id` referencing their own coordinator record, or another coordinator if the role's permission set allows it).

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `FORBIDDEN` | `region_id` outside caller's scope. |
| `404` | `REGION_NOT_FOUND` / `PRESENTER_NOT_FOUND` / `SESSION_TYPE_NOT_FOUND` | Referenced lookup row missing/inactive. |
| `404` | `CHILD_NOT_FOUND` | A `child_id` in `attendance` does not exist or is outside `region_id`. |
| `422` | `VALIDATION_ERROR` | Empty `attendance`, invalid `habits[].status`, future `session_date`. |

---

#### `GET /api/v1/sessions/:id`

Full session detail, including the attendance/Mandiri matrix.

**Response `200 OK`**

```json
{
  "data": {
    "session_id": 8801,
    "region": { "region_id": 9, "name": "Wilayah Bandung Timur" },
    "presenter": { "coordinator_id": 112, "full_name": "Ahmad Faisal" },
    "session_type": { "session_type_id": 1, "name": "Reguler" },
    "session_date": "2026-07-12",
    "attendance": [
      {
        "attendance_id": 55012,
        "child": { "child_id": 5021, "full_name": "Siti Aisyah" },
        "attendance_status": { "attendance_status_id": 1, "name": "Hadir" },
        "habits": [ { "habit_type": "prayer", "status": "completed" } ]
      }
    ]
  }
}
```

**Authorization:** Super Admin, Branch Admin (session's office), Korwil (session's region).

**Error Responses:** `401`, `404`.

---

#### `PATCH /api/v1/sessions/:id`

Edits session header fields and/or individual attendance rows. Attendance rows are updated by `attendance_id`, not replaced wholesale.

**Request Body**

```json
{
  "session_date": "2026-07-13",
  "attendance": [
    { "attendance_id": 55012, "attendance_status_id": 2 }
  ]
}
```

**Response `200 OK`** — updated resource, shape as §5.9 `GET /sessions/:id`.

**Validation:** same field-level rules as `POST`; `attendance[].attendance_id` must belong to this `session_id`.

**Authorization:** Super Admin, Branch Admin (session's office), Korwil (session's region).

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

#### `DELETE /api/v1/sessions/:id`

Deletes a session and its full attendance/habit detail (`CASCADE` from `coaching_session` → `session_attendance` → `session_habit_tracking`, per DB spec §11.1–§11.3). This is a genuine hard delete, not a soft deactivation — a mis-entered session has no reporting value once removed, unlike a child or donor record.

**Response `204 No Content`**

**Authorization:** Super Admin, Branch Admin (session's office). Korwil may delete only sessions they personally presented, within a configurable grace period (business rule; exact window to be confirmed — see §10).

**Error Responses:** `401`, `403`, `404`.

---

#### `GET /api/v1/children/:id/attendance`

The child profile's "Kehadiran" (attendance history) tab.

**Query Params:** `limit`, `cursor`, `date_from`, `date_to`, `sort` (default `-session_date`).

**Response `200 OK`**

```json
{
  "data": [
    { "session_id": 8801, "session_date": "2026-07-12", "session_type": "Reguler", "attendance_status": "Hadir" }
  ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `404` (unknown/out-of-scope `child_id`).

---

### 5.10 Hafalan (Memorization Tracking)

#### `GET /api/v1/hafalan-items`

Read-only lookup of `activity.hafalan_item_lookup`.

**Query Params:** `category` (e.g., `surah`, `prayer`, `dua`), `active`.

**Response `200 OK`**

```json
{ "data": [ { "item_id": 14, "name": "Al-Fatihah", "category": "surah", "active": true } ] }
```

**Authorization:** any authenticated user.

**Error Responses:** `401`.

---

#### `GET /api/v1/children/:id/hafalan`

The child profile's "Hafalan" tab — one row per lookup item, joined with the child's latest assessment if one exists, grouped by `category` for progress display.

**Response `200 OK`**

```json
{
  "data": {
    "by_category": {
      "surah": [
        { "item": { "item_id": 14, "name": "Al-Fatihah" }, "assessment": { "assessment_id": 9012, "status": "completed", "assessed_date": "2026-05-01", "assessor": { "coordinator_id": 112, "full_name": "Ahmad Faisal" } } },
        { "item": { "item_id": 15, "name": "Al-Baqarah 1-5" }, "assessment": null }
      ]
    },
    "progress_summary": { "surah": { "completed": 1, "partial": 0, "not_started": 1 } }
  }
}
```

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `404`.

---

#### `PATCH /api/v1/children/:id/hafalan/:item_id`

Upserts the assessment for one child/item pair (`UNIQUE (child_id, item_id)` — DB spec §11.5, per §18 item 4 the current design overwrites rather than versions history).

**Request Body**

```json
{ "status": "completed", "assessed_date": "2026-07-14" }
```

**Response `200 OK`**

```json
{ "data": { "assessment_id": 9012, "item_id": 14, "status": "completed", "assessed_date": "2026-07-14", "assessor_id": 112 } }
```

`assessor_id` is set server-side to the calling Korwil's `coordinator_id` (or, if a Branch Admin/Super Admin performs the update, requires an explicit `assessor_id` in the body referencing an active coordinator).

**Validation**
- `status`: required; one of `completed`, `partial`, `not_started` (`chk_hafalan_assessment_status`).
- `assessed_date`: required, valid date, not in the future.
- `item_id`: must reference an active `hafalan_item_lookup` row.

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `403`, `404` (unknown child or `item_id`), `422 VALIDATION_ERROR`.

---

### 5.11 Evaluations (Penilaian / Laporan Semester)

Backed by `evaluation.semester_evaluation` and `evaluation.evaluation_item_score`.

#### `GET /api/v1/children/:id/evaluations`

The child profile's "Penilaian" tab — evaluation history across semesters.

**Response `200 OK`**

```json
{
  "data": [
    { "evaluation_id": 2201, "semester": { "semester_id": 4, "name": "Ganjil 2026/2027" }, "evaluator": { "coordinator_id": 112, "full_name": "Ahmad Faisal" }, "approver": null, "average_score": 82.5 }
  ]
}
```

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `404`.

---

#### `GET /api/v1/evaluations/:id`

Full evaluation detail, including per-item scores and the free-text Laporan Semester fields.

**Response `200 OK`**

```json
{
  "data": {
    "evaluation_id": 2201,
    "child": { "child_id": 5021, "full_name": "Siti Aisyah" },
    "semester": { "semester_id": 4, "name": "Ganjil 2026/2027" },
    "evaluator": { "coordinator_id": 112, "full_name": "Ahmad Faisal" },
    "approver": null,
    "item_scores": [
      { "score_id": 9901, "item": { "item_id": 3, "name": "Akhlak", "category": "aspek_mandiri" }, "score": 85 }
    ],
    "coach_notes": "Menunjukkan peningkatan kedisiplinan...",
    "child_voice": "Saya senang bisa hafal Al-Fatihah."
  }
}
```

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `404`.

---

#### `POST /api/v1/evaluations/generate`

Auto-generates a semester evaluation for one child from that semester's session-attendance and hafalan data (PRD §5.3/§8.1 "auto-generate ... then manually refine"). Idempotent per `(child_id, semester_id)` — re-calling regenerates scores from source data but does not create a duplicate row, per `UNIQUE (child_id, semester_id)`.

**Request Body**

```json
{ "child_id": 5021, "semester_id": 4 }
```

**Response `201 Created`** (or `200 OK` if an evaluation already existed and was regenerated) — shape as §5.11 `GET /evaluations/:id`, with `evaluator_id` set to the caller's `coordinator_id`.

**Validation**
- `child_id`: required, must be within caller's scope.
- `semester_id`: required, must reference an existing `reference.semester`.

**Authorization:** Branch Admin (own office), Korwil (own region). Super Admin uses mass-generate (§5.11 below) rather than single-child generation, though single-child generation is not restricted for Super Admin either.

**Error Responses:** `401`, `403`, `404` (unknown `child_id`/`semester_id`), `422 VALIDATION_ERROR`.

---

#### `PATCH /api/v1/evaluations/:id`

Manually refines a generated evaluation — per-item scores, coach notes, child's voice, letter grade.

**Request Body**

```json
{
  "item_scores": [ { "item_id": 3, "score": 88 } ],
  "coach_notes": "Updated notes.",
  "child_voice": "Updated child voice text."
}
```

**Response `200 OK`** — updated resource, shape as §5.11 `GET /evaluations/:id`.

**Validation**
- `item_scores[].score`: `0`–`100` inclusive (`CHECK (score BETWEEN 0 AND 100)` — confirm this matches the actual grading scale per DB spec §18 item 5).
- `item_scores[].item_id`: must reference an active `evaluation.evaluation_item`; upserts the score row for `(evaluation_id, item_id)`.
- An evaluation with a non-null `approver_id` (already approved) rejects further edits with `409` unless the caller is Super Admin (reopen requires elevated privilege).

**Authorization:** Branch Admin (own office), Korwil (own region, own submitted evaluations), Super Admin (any).

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `FORBIDDEN` | Scope mismatch. |
| `404` | `NOT_FOUND` | Unknown evaluation or `item_id`. |
| `409` | `EVALUATION_APPROVED` | Attempting to edit an already-approved evaluation without Super Admin privilege. |
| `422` | `VALIDATION_ERROR` | `score` outside 0–100. |

---

#### `POST /api/v1/evaluations/:id/approve`

Sets `approver_id` to the caller's `coordinator_id`, finalizing the evaluation (`RESTRICT`, never `SET NULL`, per DB spec §12.2 — approval is a permanent audit fact).

**Request Body:** none.

**Response `200 OK`**

```json
{ "data": { "evaluation_id": 2201, "approver": { "coordinator_id": 90, "full_name": "Rina Marlina" }, "approved_at": "2026-07-14T09:30:00Z" } }
```

**Authorization:** Branch Admin (own office), Super Admin. Korwil cannot self-approve their own generated evaluation (separation of duties).

**Error Responses:** `401`, `403`, `404`, `409 ALREADY_APPROVED`.

---

#### `POST /api/v1/evaluations/mass-generate`

Bulk-generates evaluations for every enrolled, active child in scope for a given semester (PRD §5.2 "mass-sync/generate"). Runs as a background job for large offices; the response returns a job handle rather than the full result set.

**Request Body**

```json
{ "semester_id": 4, "office_id": 4 }
```

`office_id` is required for Super Admin (or `region_id` for a narrower run); implicit (caller's own scope) for Branch Admin.

**Response `202 Accepted`**

```json
{ "data": { "job_id": "mgen_7788", "status": "queued", "estimated_children": 340 } }
```

Progress/result is polled via `GET /api/v1/evaluations/mass-generate/:job_id`.

**Validation:** `semester_id` required; `office_id`/`region_id` required and must be in caller's scope for non-Super-Admin callers.

**Authorization:** Branch Admin (own office), Super Admin.

**Error Responses:** `401`, `403`, `404 SEMESTER_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

#### `GET /api/v1/evaluations/pivot`

Cross-child pivot view — evaluation items as columns, children as rows, for a given office/region and semester (PRD §5.2 "pivot views").

**Query Params:** `semester_id` (required), `office_id` or `region_id` (required, scoped).

**Response `200 OK`**

```json
{
  "data": {
    "semester": { "semester_id": 4, "name": "Ganjil 2026/2027" },
    "items": [ { "item_id": 3, "name": "Akhlak" }, { "item_id": 4, "name": "Prestasi Akademik" } ],
    "rows": [
      { "child": { "child_id": 5021, "full_name": "Siti Aisyah" }, "scores": { "3": 88, "4": 75 } }
    ]
  }
}
```

**Authorization:** Super Admin, Branch Admin (own office), Korwil (own region).

**Error Responses:** `401`, `403`, `404 SEMESTER_NOT_FOUND`, `422 VALIDATION_ERROR` (missing `semester_id`/scope filter).

---

## 6. Module: Donors

Backed by `person.donor`, `sponsorship.child_donor_pairing`, `sponsorship.pairing_balance_snapshot`. All financial-linkage FKs in this schema are `RESTRICT`, never `CASCADE` (DB spec §10.1) — this module never permits an operation that would silently erase financial history.

### 6.1 `GET /api/v1/donors`

**Query Params:** `limit`, `cursor`, `q` (name search), `active`, `sort` (default `full_name`).

**Response `200 OK`**

```json
{
  "data": [ { "donor_id": 301, "full_name": "Hendra Wijaya", "active": true, "sponsorship_count": 3 } ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** Super Admin only (PRD §5.2 "Sponsorship & Donor Management" is a Super Admin Dashboard capability; not exposed on the Regional Dashboard).

**Error Responses:** `401`, `403`.

---

### 6.2 `POST /api/v1/donors`

**Request Body**

```json
{ "full_name": "Hendra Wijaya" }
```

**Response `201 Created`**

```json
{ "data": { "donor_id": 301, "full_name": "Hendra Wijaya", "active": true } }
```

**Validation:** `full_name`: required, 1–200 chars.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `422 VALIDATION_ERROR`.

---

### 6.3 `GET /api/v1/donors/:id`

**Response `200 OK`**

```json
{
  "data": {
    "donor_id": 301,
    "full_name": "Hendra Wijaya",
    "active": true,
    "has_portal_account": false,
    "created_at": "2025-03-01T00:00:00Z"
  }
}
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`.

---

### 6.4 `PATCH /api/v1/donors/:id`

**Request Body**

```json
{ "full_name": "Hendra Wijaya, S.E." }
```

**Response `200 OK`** — updated resource.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

### 6.5 `DELETE /api/v1/donors/:id`

Deactivates (§2.8). A donor with any active `child_donor_pairing` cannot be deactivated until the pairing is ended first (protects financial reporting integrity).

**Response `200 OK`**

```json
{ "data": { "donor_id": 301, "active": false } }
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `409 DONOR_HAS_ACTIVE_SPONSORSHIPS`.

---

### 6.6 `GET /api/v1/donors/:id/sponsorships`

Lists `child_donor_pairing` rows for this donor.

**Response `200 OK`**

```json
{
  "data": [
    { "pairing_id": 6601, "child": { "child_id": 5021, "full_name": "Siti Aisyah" }, "program": { "program_id": 1, "name": "Anak Juara" }, "pairing_date": "2025-08-01", "end_date": null, "active": true }
  ]
}
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`.

---

### 6.7 `POST /api/v1/donors/:id/sponsorships`

Creates a donor-to-child sponsorship pairing. Supports the `Idempotency-Key` header (§2.9).

**Request Body**

```json
{ "child_id": 5021, "program_id": 1, "pairing_date": "2026-07-14" }
```

**Response `201 Created`** — created row, shape as §6.6.

**Validation**
- `child_id`: required, must reference an existing (any-scope; Super Admin only) child.
- `program_id`: required, must reference an active `program.program`.
- `pairing_date`: required, valid date, not in the future.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404` (`CHILD_NOT_FOUND` / `PROGRAM_NOT_FOUND`), `422 VALIDATION_ERROR`.

---

### 6.8 `PATCH /api/v1/sponsorships/:id`

Ends or edits a pairing. Setting `end_date` ends the sponsorship; the row is never deleted (`RESTRICT` on all three FKs, DB spec §10.1).

**Request Body**

```json
{ "end_date": "2026-12-31" }
```

**Response `200 OK`** — updated row.

**Validation:** `end_date`, if provided, must be `>= pairing_date` (`CHECK end_date >= pairing_date`).

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

### 6.9 `GET /api/v1/sponsorships/:id/balance-snapshots`

Lists `pairing_balance_snapshot` rows (one per semester per pairing).

**Response `200 OK`**

```json
{
  "data": [
    { "snapshot_id": 771, "semester": { "semester_id": 4, "name": "Ganjil 2026/2027" }, "closing_balance": "1250000.00", "snapshot_date": "2026-06-30" }
  ]
}
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`.

---

### 6.10 `POST /api/v1/sponsorships/:id/balance-snapshots`

Records a closing-balance snapshot for a pairing/semester. `UNIQUE (pairing_id, semester_id)` — a second call for the same semester updates the existing snapshot rather than duplicating (upsert semantics).

**Request Body**

```json
{ "semester_id": 4, "closing_balance": "1250000.00", "snapshot_date": "2026-06-30" }
```

**Response `201 Created`** (or `200 OK` on upsert) — created/updated row, shape as §6.9.

**Validation**
- `semester_id`: required, must reference an existing `reference.semester`.
- `closing_balance`: required, `NUMERIC(14,2)`, must be `>= 0`.
- `snapshot_date`: required, valid date.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 SEMESTER_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

## 7. Module: Regions

Backed by `organization.office`, `organization.coaching_region`, `organization.facility`, `person.coordinator`, and read-only `geography.*` lookups.

### 7.1 Offices (Kantor)

#### `GET /api/v1/offices`

**Query Params:** `limit`, `cursor`, `q`, `active`, `parent_office_id`, `sort` (default `name`).

**Response `200 OK`**

```json
{
  "data": [ { "office_id": 4, "name": "Kantor Cabang Bandung", "parent_office_id": 1, "active": true } ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** any authenticated user may read (needed to populate scoping/filter UI); Branch Admin/Korwil results are not filtered (offices are organizational reference data, not row-scoped), but the list is read-only for them.

**Error Responses:** `401`.

---

#### `POST /api/v1/offices`

**Request Body**

```json
{ "name": "Kantor Cabang Sumedang", "parent_office_id": 1 }
```

**Response `201 Created`**

```json
{ "data": { "office_id": 12, "name": "Kantor Cabang Sumedang", "parent_office_id": 1, "active": true } }
```

**Validation**
- `name`: required, 1–150 chars.
- `parent_office_id`, if provided: must reference an existing office and must not equal the office's own eventual ID (`chk_office_not_own_parent` — enforced trivially on create since the ID doesn't exist yet, but re-checked on `PATCH`).

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 PARENT_OFFICE_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

#### `GET /api/v1/offices/:id`

**Response `200 OK`** — same shape as one list item, plus `children` (immediate sub-offices) and `region_count`.

**Authorization:** any authenticated user.

**Error Responses:** `401`, `404`.

---

#### `PATCH /api/v1/offices/:id`

**Request Body:** any subset of `name`, `parent_office_id`, `active`.

**Response `200 OK`** — updated resource.

**Validation:** `chk_office_not_own_parent` re-checked; `parent_office_id` must not create a cycle in the office hierarchy (validated via recursive traversal).

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `409 CIRCULAR_HIERARCHY`, `422 VALIDATION_ERROR`.

---

#### `DELETE /api/v1/offices/:id`

Deactivates (§2.8). An office with active `coaching_region`, `facility`, or `coordinator` rows, or a non-deactivated child office, cannot be deactivated until those are handled first (`RESTRICT` semantics surfaced as a guided error, not a raw FK violation).

**Response `200 OK`**

```json
{ "data": { "office_id": 12, "active": false } }
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `409 OFFICE_HAS_ACTIVE_DEPENDENTS`.

---

### 7.2 Coaching Regions (Wilayah Pembinaan)

#### `GET /api/v1/regions`

**Query Params:** `limit`, `cursor`, `q`, `active`, `office_id`, `sort` (default `name`).

**Response `200 OK`**

```json
{
  "data": [ { "region_id": 9, "name": "Wilayah Bandung Timur", "office_id": 4, "active": true } ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** Super Admin (all), Branch Admin (own office only — `office_id` filter forced), Korwil (read-only, own region only).

**Error Responses:** `401`.

---

#### `POST /api/v1/regions`

**Request Body**

```json
{ "name": "Wilayah Bandung Barat", "office_id": 4 }
```

**Response `201 Created`**

```json
{ "data": { "region_id": 10, "name": "Wilayah Bandung Barat", "office_id": 4, "active": true } }
```

**Validation:** `name`: required, 1–150 chars. `office_id`: required, must reference an active office.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 OFFICE_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

#### `GET /api/v1/regions/:id`

**Response `200 OK`** — resource shape as list item, plus `coordinator_count`, `child_count`.

**Authorization:** Super Admin, Branch Admin (own office), Korwil (own region).

**Error Responses:** `401`, `404`.

---

#### `PATCH /api/v1/regions/:id`

**Request Body:** any subset of `name`, `office_id`, `active`.

**Response `200 OK`** — updated resource.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

#### `DELETE /api/v1/regions/:id`

Deactivates (§2.8). Blocked if the region has active children, coordinators assigned, or open coaching sessions referencing it, via the same guided-error pattern as §7.1's office delete.

**Response `200 OK`**

```json
{ "data": { "region_id": 10, "active": false } }
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `409 REGION_HAS_ACTIVE_DEPENDENTS`.

---

### 7.3 Facilities

#### `GET /api/v1/facilities`

**Query Params:** `limit`, `cursor`, `q`, `active`, `office_id`.

**Response `200 OK`**

```json
{ "data": [ { "facility_id": 30, "name": "SMPN 12 Bandung", "office_id": 4, "active": true } ], "meta": { "next_cursor": "…", "has_more": false } }
```

**Authorization:** any authenticated user (needed to populate the `school_id` selector on child education forms, §5.7).

**Error Responses:** `401`.

---

#### `POST /api/v1/facilities`

**Request Body**

```json
{ "name": "SMPN 15 Bandung", "office_id": 4 }
```

**Response `201 Created`**

```json
{ "data": { "facility_id": 31, "name": "SMPN 15 Bandung", "office_id": 4, "active": true } }
```

**Validation:** `name`: required, 1–200 chars. `office_id`: required, must reference an active office.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404 OFFICE_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

#### `PATCH /api/v1/facilities/:id`

**Request Body:** any subset of `name`, `office_id`, `active`. Deactivating a facility referenced by an open (`effective_to IS NULL`) `child_education` row is permitted (facility deactivation ≠ deletion; `RESTRICT` only blocks a hard delete, which this API never performs).

**Response `200 OK`** — updated resource.

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

### 7.4 Coordinators (SDM Wilayah)

#### `GET /api/v1/coordinators`

**Query Params:** `limit`, `cursor`, `q`, `active`, `office_id`, `sort` (default `full_name`).

**Response `200 OK`**

```json
{
  "data": [ { "coordinator_id": 112, "full_name": "Ahmad Faisal", "phone": "+62812xxxxxxx", "office_id": 4, "active": true, "has_account": true } ],
  "meta": { "next_cursor": "…", "has_more": false }
}
```

**Authorization:** Super Admin (all), Branch Admin (own office only).

**Error Responses:** `401`, `403` (Korwil has no access to this endpoint — coordinator management is a Super Admin/Branch Admin capability per PRD §5.2/§5.3).

---

#### `POST /api/v1/coordinators`

**Request Body**

```json
{ "full_name": "Rina Marlina", "phone": "+62813xxxxxxx", "office_id": 4 }
```

**Response `201 Created`**

```json
{ "data": { "coordinator_id": 119, "full_name": "Rina Marlina", "phone": "+62813xxxxxxx", "office_id": 4, "active": true } }
```

**Validation**
- `full_name`: required, 1–200 chars.
- `phone`, if provided: max 30 chars.
- `office_id`, if provided: must reference an active office (nullable per DB spec §6.4 — a coordinator's office assignment need not be fixed at creation).

**Authorization:** Super Admin, Branch Admin (forced `office_id` = own office).

**Error Responses:** `401`, `403`, `404 OFFICE_NOT_FOUND`, `422 VALIDATION_ERROR`.

---

#### `GET /api/v1/coordinators/:id`

**Response `200 OK`** — resource shape as list item.

**Authorization:** Super Admin, Branch Admin (own office).

**Error Responses:** `401`, `404`.

---

#### `PATCH /api/v1/coordinators/:id`

**Request Body:** any subset of `full_name`, `phone`, `office_id`, `active`.

**Response `200 OK`** — updated resource.

**Authorization:** Super Admin, Branch Admin (own office).

**Error Responses:** `401`, `403`, `404`, `422 VALIDATION_ERROR`.

---

#### `DELETE /api/v1/coordinators/:id`

Deactivates (§2.8). A coordinator who has acted as `presenter_id`, `assessor_id`, or `evaluator_id`/`approver_id` anywhere in the system can never be hard-deleted (DB spec §6.4) — this endpoint only ever deactivates.

**Response `200 OK`**

```json
{ "data": { "coordinator_id": 119, "active": false } }
```

**Authorization:** Super Admin, Branch Admin (own office).

**Error Responses:** `401`, `403`, `404`.

---

### 7.5 Geography (Read-Only Lookups)

Used to populate cascading address selectors on forms (e.g., `location.address_text` capture, if/when full child demographic fields are added per DB spec §18 item 1).

#### `GET /api/v1/geography/provinces`

**Response `200 OK`**

```json
{ "data": [ { "province_id": 9, "name": "Jawa Barat" } ] }
```

#### `GET /api/v1/geography/districts?province_id=9`

**Response `200 OK`**

```json
{ "data": [ { "district_id": 44, "name": "Kabupaten Sumedang" } ] }
```

#### `GET /api/v1/geography/subdistricts?district_id=44`

**Response `200 OK`**

```json
{ "data": [ { "subdistrict_id": 501, "name": "Jatinangor" } ] }
```

#### `GET /api/v1/geography/villages?subdistrict_id=501`

**Response `200 OK`**

```json
{ "data": [ { "village_id": 8801, "name": "Cibeusi" } ] }
```

**Authorization (all four):** any authenticated user.

**Validation (all four except `/provinces`):** the parent-ID query param is required; an unrecognized parent ID returns an empty `data` array, not an error (geography is immutable reference data — an empty result is a normal, valid response).

**Error Responses (all four):** `401`.

---

## 8. Module: Reports

Backed by cross-schema read queries. This module contains no `POST`/`PATCH`/`DELETE` writes to core tables — `POST` endpoints here trigger read/export jobs only.

### 8.1 `GET /api/v1/reports/dashboard`

The Global Dashboard (Super Admin) or scoped Beranda (Branch Admin/Korwil), per PRD §5.2/§5.3.

**Query Params:** `office_id`, `region_id` (Super Admin only, to drill down; ignored/forced to caller's own scope otherwise), `semester_id` (defaults to current semester).

**Response `200 OK`**

```json
{
  "data": {
    "scope": { "type": "office", "office_id": 4 },
    "totals": { "active_children": 340, "sessions_this_month": 28, "average_attendance_rate": 0.91, "hafalan_completion_rate": 0.64, "evaluations_completed": 310, "evaluations_pending": 30 },
    "attendance_trend": [ { "week_start": "2026-06-29", "rate": 0.89 } ],
    "welfare_distribution": [ { "welfare_category": "Dhuafa", "count": 210 } ]
  }
}
```

**Authorization:** Super Admin (unrestricted, optional drill-down filters), Branch Admin (own office), Korwil (own region).

**Error Responses:** `401`, `403` (attempted `office_id`/`region_id` outside scope for non-Super-Admin), `404 SEMESTER_NOT_FOUND`.

---

### 8.2 `GET /api/v1/reports/rekap-pembinaan`

The rebuilt "Rekap Pembinaan" recap report (PRD §3.1/§5.2) — coaching-session summary filterable by date range and office.

**Query Params:** `date_from` (required), `date_to` (required), `office_id` (Super Admin; forced to own office for Branch Admin), `region_id`, `limit`, `cursor`.

**Response `200 OK`**

```json
{
  "data": [
    { "region": { "region_id": 9, "name": "Wilayah Bandung Timur" }, "session_count": 12, "total_attendance_hadir": 205, "total_attendance_izin": 8, "total_attendance_alfa": 3 }
  ],
  "meta": { "next_cursor": "…", "has_more": false, "date_from": "2026-06-01", "date_to": "2026-06-30" }
}
```

**Authorization:** Super Admin, Branch Admin (own office).

**Error Responses:** `401`, `403`, `422 VALIDATION_ERROR` (missing/invalid `date_from`/`date_to`, or `date_to < date_from`).

---

### 8.3 `GET /api/v1/reports/rekap-pembinaan/export`

Same filter set as §8.2, returning a downloadable file rather than a JSON page — the "export/export-detail" capability named in PRD §3.1.

**Query Params:** same as §8.2, plus `format` (`csv` | `xlsx`, default `xlsx`), `detail` (`true` for per-child-per-session rows instead of the region-level summary).

**Response `200 OK`**

Binary file stream. `Content-Type: text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; `Content-Disposition: attachment; filename="rekap-pembinaan-2026-06.xlsx"`.

**Authorization:** Super Admin, Branch Admin (own office).

**Error Responses:** `401`, `403`, `422 VALIDATION_ERROR` (same as §8.2, plus invalid `format`).

---

### 8.4 `GET /api/v1/reports/semester/:child_id/:semester_id`

The per-child Laporan Semester report view — data assembly for the semester report card (formatted PDF rendering is out of scope per PRD §3.2/§10; this endpoint returns the structured data a rendering layer would consume).

**Response `200 OK`**

```json
{
  "data": {
    "child": { "child_id": 5021, "full_name": "Siti Aisyah" },
    "semester": { "semester_id": 4, "name": "Ganjil 2026/2027" },
    "evaluation": { "evaluation_id": 2201, "item_scores": [ { "item": "Akhlak", "score": 88 } ], "coach_notes": "…", "child_voice": "…" },
    "attendance_summary": { "hadir": 14, "izin": 1, "alfa": 0 },
    "hafalan_summary": { "surah": { "completed": 5, "partial": 2, "not_started": 3 } }
  }
}
```

**Authorization:** Super Admin, Branch Admin (child's office), Korwil (child's region).

**Error Responses:** `401`, `403`, `404` (unknown child/semester, or no evaluation exists yet for that pair — the client should call §5.11 `POST /evaluations/generate` first).

---

### 8.5 `GET /api/v1/reports/audit-log`

Backed by the schema's history/audit pattern (DB spec §2.4; PRD §5.2 "Audit Log").

**Query Params:** `limit`, `cursor`, `table_name`, `record_id`, `actor_id`, `date_from`, `date_to`, `sort` (default `-timestamp`).

**Response `200 OK`**

```json
{
  "data": [
    { "audit_id": 88123, "table_name": "person.child", "record_id": 5021, "action": "UPDATE", "actor": { "system_user_id": 481, "username": "korwil.jabar01" }, "changed_fields": { "full_name": { "old": "Siti Aisyah", "new": "Siti Aisyah Nurhaliza" } }, "timestamp": "2026-07-14T09:05:00Z" }
  ],
  "meta": { "next_cursor": "…", "has_more": true }
}
```

**Authorization:** Super Admin only.

**Error Responses:** `401`, `403`, `422 VALIDATION_ERROR` (invalid date range).

---

### 8.6 `GET /api/v1/public/impact-stats`

The Public Website's transparency-reporting data source (PRD §5.1/§9.3) — aggregate, de-identified only. No authentication.

**Response `200 OK`**

```json
{
  "data": {
    "total_children_supported": 12480,
    "regions_active": 86,
    "offices_active": 22,
    "sessions_completed_this_year": 9120,
    "hafalan_items_completed_this_year": 34210
  }
}
```

**Authorization:** none — public endpoint. The response is served from an ISR-cached aggregate query (PRD §10.3), never a per-child query, so it structurally cannot leak PII regardless of caller.

**Error Responses:** `500 INTERNAL_ERROR` only (no auth/scope errors are possible on a public endpoint).

---

## 9. Global Error Code Reference

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | One or more fields failed validation; see `details`. |
| `UNAUTHENTICATED` | 401 | No valid session. |
| `FORBIDDEN` | 403 | Authenticated but not permitted (role or scope). |
| `NOT_FOUND` | 404 | Resource missing or outside caller's scope. |
| `INVALID_CREDENTIALS` | 401 | Login failure. |
| `ACCOUNT_INACTIVE` | 403 | Deactivated `system_user` attempting login. |
| `RATE_LIMITED` | 429 | Login rate limit exceeded. |
| `INVALID_CURRENT_PASSWORD` | 409 | Self-service password change with wrong current password. |
| `USERNAME_TAKEN` | 409 | Duplicate `username`. |
| `COORDINATOR_ALREADY_LINKED` / `DONOR_ALREADY_LINKED` | 409 | `coordinator_id`/`donor_id` already owns a `system_user` row. |
| `ROLE_NOT_FOUND` / `REGION_NOT_FOUND` / `OFFICE_NOT_FOUND` / `PRESENTER_NOT_FOUND` / `SESSION_TYPE_NOT_FOUND` / `SEMESTER_NOT_FOUND` / `CHILD_NOT_FOUND` / `PROGRAM_NOT_FOUND` / `WELFARE_CATEGORY_NOT_FOUND` / `PARENT_OFFICE_NOT_FOUND` | 404 | Referenced FK target does not exist or is inactive. |
| `CIRCULAR_HIERARCHY` | 409 | `office.parent_office_id` change would create a cycle. |
| `OFFICE_HAS_ACTIVE_DEPENDENTS` / `REGION_HAS_ACTIVE_DEPENDENTS` | 409 | Deactivation blocked by active child records. |
| `DONOR_HAS_ACTIVE_SPONSORSHIPS` | 409 | Donor deactivation blocked by an open pairing. |
| `EVALUATION_APPROVED` / `ALREADY_APPROVED` | 409 | Write blocked by an already-finalized evaluation. |

---

## 10. Open Items to Confirm Before Implementation

Mirroring the rigor of `10_DATABASE_SPECIFICATION.md` §18, these are gaps in the source PRD/ERD/DB spec that this API specification had to assume an answer for, and that should be confirmed before implementation:

1. **Korwil-to-region assignment.** The current schema (`person.coordinator`) carries `office_id` but no explicit `region_id`/`assigned_region_id` column, yet the PRD requires Korwil to be scoped to "the assigned coaching region" (§6). This specification assumes such a column will be added to `person.coordinator` (or a small assignment table) before the scoping logic in §2.3 can be implemented as written.
2. **Full column list for `person.child`** (and `coordinator`, `donor`) — per DB spec §18 item 1, demographic fields (date of birth, gender, NIK, address) are not yet enumerated. Several request/response bodies above (e.g., §5.2 `POST /children`) will need additional fields once that list is confirmed.
3. **Delete window for Korwil-initiated session deletion** (§5.9 `DELETE /sessions/:id`) — this spec assumes a "grace period" business rule exists but does not fix a duration; needs product confirmation.
4. **Evaluation score scale** — this spec assumes 0–100 per `evaluation_item_score.score`'s `CHECK` constraint (DB spec §18 item 5); confirm against actual Laporan Semester grading conventions (numeric vs. letter grade as the primary input).
5. **Mass-generate job polling contract** (§5.11) — this spec assumes an asynchronous job pattern (`202` + poll endpoint) given potentially thousands of children per office; confirm whether a synchronous response is acceptable at expected office sizes instead.
6. **Rekap Pembinaan export detail-row shape** (§8.3, `detail=true`) — the exact per-child-per-session column set for the detail export was not specified in the PRD beyond "export/export-detail exists"; needs a concrete column list from the legacy report before implementation.
7. **Value vocabularies inherited from the DB spec** (§18 item 3 there) — `education_level`, `family_member.relationship`, habit/assessment `status` values used throughout this document's validation rules should be reconfirmed as exhaustive.

---

**End of API Specification.**
