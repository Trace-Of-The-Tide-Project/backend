# Trace of the Tides — API Reference

**Heritage Storytelling Platform — Backend API**

---

## Document Status

| Item | Value |
|------|-------|
| Version | 1.0 (snapshot of `develop` branch) |
| Last updated | 2026-04-26 |
| Companion to | Live Swagger UI at `GET /api/docs` |
| Source of truth for live "try-it" | Swagger (`/api/docs`) |
| Source of truth for prose / workflows | This document |

> **Tip for readers.** This document is a curated, human-friendly companion to the auto-generated Swagger UI exposed by the running backend. For a live request playground, exhaustive per-field schemas, and downloadable OpenAPI JSON, open `GET /api/docs` against your environment. This document covers the parts Swagger does not: authentication workflows, error semantics, rate limits, conventions, and worked examples for the most important endpoints.

---

## Table of Contents

### Part 1 — Conventions (read this first)
1. [Introduction](#1-introduction)
2. [Authentication](#2-authentication)
3. [Authorization](#3-authorization)
4. [Standard Response Envelope](#4-standard-response-envelope)
5. [Standard Error Response](#5-standard-error-response)
6. [Validation Behavior](#6-validation-behavior)
7. [Rate Limiting](#7-rate-limiting)
8. [CORS & Security Headers](#8-cors--security-headers)
9. [General Conventions](#9-general-conventions)

### Part 2 — Resources

#### Identity & Access
- [Auth](#auth)
- [Users](#users)
- [Roles & Permissions](#roles--permissions)
- [Follows](#follows)

#### Content Authoring
- [Articles](#articles)
- [Collections](#collections)
- [Tags](#tags)
- [Writers](#writers)

#### Magazines
- [Magazines](#magazines)
- [Magazine Issues](#magazine-issues)
- [Book Club](#book-club)
- [Newsletter Subscribers](#newsletter-subscribers)

#### Submissions
- [Open Calls](#open-calls)
- [Contributions](#contributions)
- [Issue Pledges](#issue-pledges)

#### Trips
- [Trips](#trips)

#### Collectives & Phases
- [Collectives](#collectives)
- [Phases](#phases)
- [Groups](#groups)
- [People](#people)
- [References](#references)

#### Engagement
- [Comments](#comments)
- [Reactions](#reactions)
- [Discussions](#discussions)
- [Notifications](#notifications)

#### Boards (Whiteboarding)
- [Boards](#boards)

#### Knowledge Base
- [Knowledge](#knowledge)

#### CMS
- [CMS Pages & Settings](#cms-pages--settings)

#### Author Workspace
- [Author Dashboard & Settings](#author-dashboard--settings)

#### Tasks
- [Tasks](#tasks)

#### Messaging
- [Messaging](#messaging)

#### Finance
- [Finance](#finance)
- [Donations](#donations)

#### Files & Uploads
- [Files](#files)
- [Upload](#upload)

#### Partners
- [Partners](#partners)

#### Admin
- [Admin Dashboard](#admin-dashboard)
- [Analytics](#analytics)
- [Moderation](#moderation)
- [Audit Trails](#audit-trails)
- [Logs](#logs)
- [Admin Engagements](#admin-engagements)
- [System Settings](#system-settings)

### Part 3 — Appendices
- [Appendix A — Roles](#appendix-a--roles)
- [Appendix B — Permissions](#appendix-b--permissions)
- [Appendix C — Common Status Enums](#appendix-c--common-status-enums)
- [Appendix D — Pagination Contract](#appendix-d--pagination-contract)
- [Appendix E — DTO Index](#appendix-e--dto-index)

---

# Part 1 — Conventions

## 1. Introduction

The Trace of the Tides API is a NestJS HTTP backend powering a heritage-storytelling platform. It exposes ~450 endpoints across 44 feature modules covering identity, content authoring (articles, magazines, books), submissions (open calls, contributions, trip applications), community (collectives, groups, comments, reactions), commerce (donations, payouts, pledges), and admin tooling (moderation, analytics, system settings).

### Base URL

| Environment | Base URL |
|-------------|----------|
| Local development | `http://localhost:3001` |
| Production | `${GCP_URL}` (set via env var; see [src/main.ts](src/main.ts)) |

### Versioning

There is **no global URL prefix** — endpoints start at the controller path (e.g., `/auth/login`, not `/api/v1/auth/login`). Swagger advertises the API as version `1.0`. Breaking changes are tracked through repo commits, not URL versioning.

### Live Swagger UI

```
GET /api/docs
```

Swagger UI is served from the running backend and includes Bearer auth (`addBearerAuth()` in `bootstrap`). Use it for live request playground, exhaustive schema browsing, and OpenAPI JSON export.

### Discoverable Health Check

```
GET /         → "Hello World!" liveness check
GET /health   → application health
```

Both are public and unrate-limited at the application layer (only the global throttler applies).

---

## 2. Authentication

### Scheme

The API uses **stateless JWT Bearer authentication**.

```
Authorization: Bearer <access_token>
```

Tokens are issued at login (or signup, since signup auto-logs-in) and carried in the `Authorization` header on every protected request.

### Token Lifetimes

| Token | Lifetime | Notes |
|-------|---------|-------|
| Access token (JWT) | 1 hour | Stateless; identity & roles encoded in payload |
| Refresh token | 30 days | Stored hashed (bcrypt) in DB; rotated on use |
| 2FA temp token | 5 minutes | Issued only when admin login requires 2FA |
| Email verification token | 24 hours | JWT with `purpose: 'email-verification'` |
| Password reset token | 1 hour | JWT with `purpose: 'password-reset'`, single-use |

### Refresh Token Rules

- Hashed in DB (bcrypt).
- Single-use: consumed (deleted) on every refresh.
- Rotated: a new refresh token is issued alongside the new access token.
- Capped at **5 active per user** — the oldest is culled when a 6th is issued.
- Each token records issuing IP and user agent.

### Login Flow

```
POST /auth/login                      → 200 { accessToken, refreshToken, user }
                                      → 200 { requires_2fa: true, temp_token } (if admin has 2FA)

POST /auth/2fa/validate               → 200 { accessToken, refreshToken, user }
  body: { temp_token, code }

POST /auth/refresh-token              → 200 { accessToken, refreshToken }
  body: { refreshToken, accessToken? }

POST /auth/logout                     → 200 { message }
  Authorization: Bearer <access_token>
  body: { refreshToken? }   // omit to revoke all sessions
```

### Email Verification

A user can sign up and immediately receive an access + refresh token pair. Email is `unverified` until the user clicks the verification link.

```
POST /auth/signup                     → 200 { accessToken, refreshToken, user (unverified) }
POST /auth/verify-email               → 200 { message }   body: { token }
POST /auth/resend-verification        → 200 { message }   (Bearer; cooldown 60 s)
```

### Password Management

| Action | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| Forgot password | `POST /auth/forgot-password` | Public | Cooldown 60 s/email; always returns 200 (never reveals existence) |
| Resend reset email | `POST /auth/resend-reset-email` | Public | Same cooldown |
| Reset password (token in body) | `POST /auth/reset-password` | Public | Single-use token; revokes all sessions on success |
| Reset password (token in header) | `POST /auth/set-new-password` | Bearer (reset token) | Token in `Authorization`; body has only `newPassword`/`confirmPassword` |
| Change password | `POST /auth/change-password` | Bearer | Requires current password; revokes all other sessions |

All password fields enforce: **min 8 chars, at least one uppercase, one lowercase, one digit** (regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`).

### Two-Factor Authentication (TOTP)

2FA is currently scoped to **admin users**. Setup is opt-in.

```
POST /auth/2fa/setup     → 200 { secret, qrCodeDataUrl }   (Bearer)
POST /auth/2fa/verify    → 200 { backup_codes: string[] }  (Bearer; body: { code })
POST /auth/2fa/disable   → 200 { message }                 (Bearer; body: { password })
```

When an admin with 2FA enabled logs in, `POST /auth/login` returns `{ requires_2fa: true, temp_token }`. The client then submits the temp token + 6-digit code (or a single-use backup code) to `POST /auth/2fa/validate`, which returns the full token pair.

### Public Endpoints

Endpoints without `@UseGuards(JwtAuthGuard)` are public. The codebase does **not** use a `@Public()` decorator — auth is opt-in via guard application. Each section below labels every endpoint as **Public**, **Bearer**, or **Bearer + Role(s)**.

---

## 3. Authorization

### Role Model

Twelve roles exist (see [src/enums/role.enum.ts](src/enums/role.enum.ts)):

`admin`, `user`, `author`, `manager`, `guest`, `editor`, `contributor`, `moderator`, `analyst`, `developer`, `support`, `artist`

A user is assigned `user` by default at signup. Additional roles are added via the `UserRole` junction table. Roles travel inside the JWT payload as `roles: string[]`.

### Role Guards

Endpoints are restricted with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin', 'editor')`. The user must have **at least one** of the listed roles. If `@Roles()` is omitted but `RolesGuard` is applied, any authenticated user passes.

### Permission Overrides

Beyond roles, the platform supports per-user permission grants and denials via `PermissionsGuard` and the `@RequirePermission(...)` decorator. Defined permissions (see [src/common/constants/permissions.ts](src/common/constants/permissions.ts)):

```
content.publish, content.delete, content.feature
moderation.approve, moderation.reject, moderation.flag
finance.view, finance.approve_payout
users.manage, users.suspend
open_calls.manage
analytics.view
messaging.broadcast
```

Per-user grants/denials are managed through `/roles/permissions/:userId` (admin-only).

### Default Authorization Outcomes

| Condition | HTTP status |
|-----------|-------------|
| Missing/invalid token on protected endpoint | `401 Unauthorized` |
| Valid token but role/permission insufficient | `403 Forbidden` |
| Resource ownership / scope check fails | `403 Forbidden` (or `404 Not Found` to avoid information disclosure on private resources) |

---

## 4. Standard Response Envelope

Every successful response is wrapped by the global `ResponseInterceptor` ([src/common/interceptors/response.interceptor.ts](src/common/interceptors/response.interceptor.ts)). Four shapes are emitted depending on the handler's return:

### 4.1 Single object

```json
{
  "status": 200,
  "results": 1,
  "data": {
    "id": "9f83…",
    "title": "Echoes of Jaffa"
  }
}
```

### 4.2 Array

```json
{
  "status": 200,
  "results": 3,
  "data": [
    { "id": "…" },
    { "id": "…" },
    { "id": "…" }
  ]
}
```

### 4.3 Paginated (any handler that returns `{ rows, meta }`)

```json
{
  "status": 200,
  "results": 10,
  "data": [ /* up to `limit` items */ ],
  "meta": {
    "total": 247,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
```

### 4.4 Message-only

When the service returns a small `{ message: string }` (or `{ message, ...one_more_field }`), the envelope flattens it:

```json
{
  "status": 200,
  "message": "Email verified successfully"
}
```

### 4.5 Empty

`null` or `undefined` returns become:

```json
{
  "status": 200,
  "results": 0,
  "data": null
}
```

> **Implication for client code.** Treat `data` as the canonical payload location. Always check `meta` to detect paginated responses. Treat `message` as a flat-top-level field, not nested in `data`.

---

## 5. Standard Error Response

Every error is normalized by the global `AllExceptionsFilter` ([src/common/filters/all-exceptions.filter.ts](src/common/filters/all-exceptions.filter.ts)).

### 5.1 Standard error shape

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "email must be a valid email",
  "timestamp": "2026-04-26T14:23:45.123Z",
  "path": "/auth/signup"
}
```

`message` may be a **string or an array of strings** (e.g., when class-validator returns multiple field errors).

### 5.2 Common HTTP status codes

| Status | Error | Triggers |
|--------|-------|----------|
| **400** | Bad Request | DTO validation failure, unknown fields (whitelist violation), foreign-key constraint failure, malformed token, "passwords do not match", "already verified" |
| **401** | Unauthorized | Missing token, expired token, invalid credentials, account `pending` / `suspended` / `inactive`, expired/invalid refresh token, wrong 2FA code |
| **403** | Forbidden | Authenticated but lacking required role/permission |
| **404** | Not Found | Resource id does not exist or is not accessible to the caller |
| **409** | Conflict | Unique-constraint violation (e.g., signup with already-registered email) |
| **413** | Payload Too Large | File upload exceeds size limit (e.g., avatar > 5 MB) |
| **429** | Too Many Requests | Throttler limit hit, or per-action cooldown active (forgot/resend) |
| **500** | Internal Server Error | Uncaught exception; server logs detail |
| **503** | Service Unavailable | External service down (e.g., email transport) |

### 5.3 Throttler-specific 429 shape

The custom throttler ([src/common/guards/throttler-exception.guard.ts](src/common/guards/throttler-exception.guard.ts)) emits:

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please wait 47 seconds before retrying.",
  "retryAfter": 47,
  "limit": 20,
  "ttl": 60,
  "key": "global-…"
}
```

Read `retryAfter` (seconds) for the back-off interval.

### 5.4 Sequelize-mapped errors

| Sequelize error | HTTP | Notes |
|-----------------|------|-------|
| `UniqueConstraintError` | 409 | `message` is `"<field> already exists"` (or array if multiple fields) |
| `ForeignKeyConstraintError` | 400 | `message` is `"Referenced record does not exist"` |
| `ValidationError` | 400 | `message` is an array of model-validation messages |
| `DatabaseError` | 400 | `message` is `"Invalid query or data format"` |

---

## 6. Validation Behavior

The global `ValidationPipe` ([src/main.ts:17-23](src/main.ts#L17-L23)) is configured strictly:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

| Option | Effect |
|--------|--------|
| `whitelist` | Properties not present in the DTO are stripped from the request body. |
| `forbidNonWhitelisted` | If the request includes any unknown property, the pipe throws **400 Bad Request** instead of silently stripping. |
| `transform` | Plain payloads are auto-transformed into DTO class instances; primitive types are coerced (e.g., `"1"` → `1` for `@IsInt`-marked numeric query params). |

**Practical client implications:**
- Do not send extra fields. Use exactly the fields documented in each request body — the request will be rejected otherwise.
- Date fields decorated with `@IsDateString()` accept ISO-8601 strings (e.g., `"2026-05-12T09:00:00Z"`).
- Booleans submitted as strings (`"true"`/`"false"`) are coerced where the DTO marks the field as `boolean`.

---

## 7. Rate Limiting

### Global throttler

Configured in [src/app.module.ts:80-85](src/app.module.ts#L80-L85):

| Setting | Value |
|---------|-------|
| Limit | **20 requests / 60 seconds per IP** |
| Guard | `CustomThrottlerGuard` (registered as `APP_GUARD`) |
| Response | `429` with the throttler-specific shape (see §5.3) |

### Per-action cooldowns

Some sensitive endpoints use Redis-backed cooldowns (`CooldownService`) on top of the global throttler:

| Action | Cooldown | Keyed by |
|--------|----------|----------|
| `POST /auth/forgot-password` | 60 s | email |
| `POST /auth/resend-reset-email` | 60 s | email |
| `POST /auth/resend-verification` | 60 s | user id |

When the cooldown is active, the endpoint returns **429** with a message describing the wait time.

---

## 8. CORS & Security Headers

| Concern | Setting |
|---------|---------|
| `helmet()` middleware | Enabled — sets HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, baseline CSP |
| CORS `origin` | `'*'` (permissive) |
| CORS credentials | Not enabled — clients must send the JWT in `Authorization`, not as a cookie |

> **Production hardening note.** The current `origin: '*'` is appropriate for development but should be tightened in production to the explicit frontend origin(s).

---

## 9. General Conventions

### Identifiers

All primary keys and foreign keys are **UUID v4** strings (e.g., `"9f83a17e-d4c8-4f1e-9d0a-4d3a31a85b27"`).

### Dates

All date/datetime fields are **ISO-8601 strings**. Examples: `"2026-04-26"` (date-only), `"2026-04-26T09:30:00Z"` (UTC datetime).

### Pagination Query Params

Almost every list endpoint accepts the same shape:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer ≥ 1 | `1` | 1-indexed page number |
| `limit` | integer 1–100 | `10` | Items per page |
| `search` | string | – | Free-text search across the resource's primary text fields |
| `sortBy` | string | `createdAt` | Field to sort by |
| `order` | `ASC` \| `DESC` | `DESC` | Sort direction |

The response includes a `meta` object (see §4.3).

### Language

The platform is bilingual (English / Arabic). A request `Accept-Language: ar` header (or `?lang=ar`) is honored by `LanguageMiddleware` for resources that support i18n. Most resource fields are stored in English with optional `_ar` translations or via a separate `translation_of` resource (see Articles).

### Linkable file references

Throughout this document, paths like `[src/auth/auth.controller.ts](src/auth/auth.controller.ts)` are clickable in IDEs and rendered Markdown viewers — handy for jumping to source.

---

# Part 2 — Resources

Each section below opens with a one-line description, an endpoint inventory table, and then per-endpoint detail for non-trivial writes (`POST`/`PATCH`) and any endpoint with non-obvious semantics. Pure CRUD reads/deletes are represented in the inventory table only.

> **Auth-label legend.** **Public** = no auth required. **Bearer** = requires a valid JWT in the `Authorization` header. **Bearer + Role(s)** = JWT plus at least one of the listed roles.

---

## Identity & Access

### Auth

Account lifecycle, login, refresh, password reset, and 2FA.

**Source:** [src/auth/auth.controller.ts](src/auth/auth.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/check-email` | Public | Validate email and check if already registered |
| POST | `/auth/signup` | Public | Register new account (auto-logs-in) |
| POST | `/auth/login` | Public | Login with email/username + password |
| POST | `/auth/verify-email` | Public | Confirm email with token from verification message |
| POST | `/auth/resend-verification` | Bearer | Resend verification email (60 s cooldown) |
| POST | `/auth/forgot-password` | Public | Request password reset email (60 s cooldown) |
| POST | `/auth/resend-reset-email` | Public | Resend reset email (60 s cooldown) |
| POST | `/auth/reset-password` | Public | Reset password using token from email body |
| POST | `/auth/set-new-password` | Reset-token in header | Same as above with token in `Authorization` |
| POST | `/auth/logout` | Bearer | Revoke a refresh token (or all sessions) |
| POST | `/auth/refresh-token` | Public (refresh token in body) | Mint a new access token |
| GET | `/auth/me` | Bearer | Current user with roles |
| POST | `/auth/change-password` | Bearer | Change password (requires current) |
| POST | `/auth/2fa/setup` | Bearer | Generate TOTP secret + QR code |
| POST | `/auth/2fa/verify` | Bearer | Activate 2FA with first TOTP code |
| POST | `/auth/2fa/validate` | Public (temp token in body) | Submit 2FA code during login challenge |
| POST | `/auth/2fa/disable` | Bearer | Disable 2FA (requires password) |

---

#### POST `/auth/check-email`

Pre-flight email check used by the signup form. Validates format, looks up MX records, blocks disposable providers, and reports whether the email is already registered.

- **Auth:** Public
- **Request body:**

  ```json
  { "email": "ahmad@trace.ps" }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `email` | string | Yes | `@IsEmail()` |

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "valid": true,
      "available": true,
      "reason": null
    }
  }
  ```

- **Errors:** `400` if email is malformed.

---

#### POST `/auth/signup`

Register a user. On success the user is created with status `pending` (awaiting email verification) but is **immediately logged in**: the response carries an access + refresh token. The user can use the API while unverified, but must verify before some restricted actions (varies per resource).

- **Auth:** Public
- **DTO:** [SignupDto](src/auth/dto/signup.dto.ts)
- **Request body:**

  ```json
  {
    "username": "ahmad_writer",
    "email": "ahmad@trace.ps",
    "password": "Test@1234",
    "full_name": "Ahmad Khalil",
    "phone_number": "+970591234567"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `username` | string | Yes | Unique |
  | `email` | string | Yes | Must be a valid email; unique |
  | `password` | string | Yes | Min 8 chars; ≥1 lowercase, 1 uppercase, 1 digit |
  | `full_name` | string | No | – |
  | `phone_number` | string | No | – |

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "accessToken": "eyJhbGciOi…",
      "refreshToken": "eyJhbGciOi…",
      "user": {
        "id": "9f83a17e-d4c8-4f1e-9d0a-4d3a31a85b27",
        "username": "ahmad_writer",
        "full_name": "Ahmad Khalil",
        "email": "ahmad@trace.ps",
        "status": "pending",
        "roles": ["user"]
      }
    }
  }
  ```

- **Errors:**
  - `409 Conflict` — email or username already registered.
  - `400 Bad Request` — password fails complexity check or any field invalid.

---

#### POST `/auth/login`

Login. Accepts either email **or** username in the `email` field. If the user is an admin with 2FA enabled, the response is the 2FA challenge shape instead of the regular token pair.

- **Auth:** Public
- **DTO:** [LoginDto](src/auth/dto/login.dto.ts)
- **Request body:**

  ```json
  { "email": "admin@trace.ps", "password": "Test@1234" }
  ```

- **Success — 200 (regular)**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "accessToken": "eyJhbGciOi…",
      "refreshToken": "eyJhbGciOi…",
      "user": {
        "id": "…",
        "username": "admin",
        "full_name": "Site Admin",
        "email": "admin@trace.ps",
        "roles": ["admin", "user"]
      }
    }
  }
  ```

- **Success — 200 (2FA required)**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "requires_2fa": true,
      "temp_token": "eyJhbGciOi…"
    }
  }
  ```

- **Errors:**
  - `401 Unauthorized` — invalid credentials, account `pending`/`suspended`/`inactive`.

---

#### POST `/auth/verify-email`

Activate the email address using the token from the verification email.

- **Auth:** Public
- **Request body:**

  ```json
  { "token": "eyJhbGciOi…" }
  ```

- **Success — 200**

  ```json
  { "status": 200, "message": "Email verified successfully" }
  ```

- **Errors:**
  - `400 Bad Request` — invalid/expired token, or email is already verified.

---

#### POST `/auth/resend-verification`

- **Auth:** Bearer
- **Request body:** *(none)*
- **Success — 200**

  ```json
  { "status": 200, "message": "Verification email sent" }
  ```

- **Errors:** `429` if cooldown active; `400` if already verified.

---

#### POST `/auth/forgot-password`

Always returns 200 — even if the email is not registered — to avoid leaking account existence.

- **Auth:** Public
- **DTO:** [ForgotPasswordDto](src/auth/dto/forgot-password.dto.ts)
- **Request body:**

  ```json
  { "email": "ahmad@trace.ps" }
  ```

- **Success — 200**

  ```json
  { "status": 200, "message": "If the email exists, a reset link has been sent" }
  ```

- **Errors:** `429` if cooldown active.

---

#### POST `/auth/resend-reset-email`

Same body, same response, same cooldown (60 s) as `/auth/forgot-password`. Use when the user reports not receiving the first email.

---

#### POST `/auth/reset-password`

Consume a password-reset token and set a new password. On success **all refresh tokens for the user are revoked** (forces re-login on every device).

- **Auth:** Public
- **DTO:** [ResetPasswordDto](src/auth/dto/reset-password.dto.ts)
- **Request body:**

  ```json
  {
    "token": "eyJhbGciOi…",
    "newPassword": "NewPass@123",
    "confirmPassword": "NewPass@123"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `token` | string | Yes | Reset token (purpose `password-reset`, 1 h expiry, single use) |
  | `newPassword` | string | Yes | Min 8, uppercase + lowercase + digit |
  | `confirmPassword` | string | Yes | Must equal `newPassword` |

- **Success — 200**

  ```json
  { "status": 200, "message": "Password reset successfully" }
  ```

- **Errors:**
  - `400 Bad Request` — invalid/expired token, "passwords do not match", or token has already been used.

---

#### POST `/auth/set-new-password`

Identical effect to `/auth/reset-password`, but the reset token is supplied in the `Authorization: Bearer <reset_token>` header. Useful for SPA flows that prefer not to round-trip the token through a body field.

- **Auth:** Reset-token in header
- **Request body:**

  ```json
  { "newPassword": "NewPass@123", "confirmPassword": "NewPass@123" }
  ```

---

#### POST `/auth/logout`

Revoke a single refresh token (the one supplied) or, if `refreshToken` is omitted, **all** the user's active refresh tokens.

- **Auth:** Bearer
- **Request body:**

  ```json
  { "refreshToken": "eyJhbGciOi…" }
  ```

- **Success — 200**

  ```json
  { "status": 200, "message": "Logged out" }
  ```

---

#### POST `/auth/refresh-token`

- **Auth:** Public *(but the refresh token in the body must be valid)*
- **Request body:**

  ```json
  {
    "refreshToken": "eyJhbGciOi…",
    "accessToken": "eyJhbGciOi…"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `refreshToken` | string | Yes | Will be consumed (deleted) on success |
  | `accessToken` | string | No | Expired access token used to scope the lookup; performance optimization |

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "accessToken": "eyJhbGciOi…",
      "refreshToken": "eyJhbGciOi…"
    }
  }
  ```

- **Errors:** `401 Unauthorized` — token invalid, expired, or already consumed.

---

#### GET `/auth/me`

- **Auth:** Bearer
- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "id": "…",
      "username": "admin",
      "full_name": "Site Admin",
      "email": "admin@trace.ps",
      "status": "active",
      "two_factor_enabled": true,
      "email_verified_at": "2026-04-12T08:11:44.000Z",
      "roles": ["admin", "user"],
      "createdAt": "2026-01-02T08:00:00.000Z"
    }
  }
  ```

---

#### POST `/auth/change-password`

- **Auth:** Bearer
- **DTO:** [ChangePasswordDto](src/auth/dto/change-password.dto.ts)
- **Request body:**

  ```json
  {
    "currentPassword": "Test@1234",
    "newPassword": "NewPass@123",
    "confirmPassword": "NewPass@123"
  }
  ```

- **Success — 200** — `{ "status": 200, "message": "Password changed" }`. All other refresh tokens are revoked.
- **Errors:** `401` if `currentPassword` is wrong; `400` if new == current or passwords don't match.

---

#### POST `/auth/2fa/setup`

Generate a TOTP secret and a QR-code data URL the user can scan in an authenticator app.

- **Auth:** Bearer (admin only — service-level check)
- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "secret": "JBSWY3DPEHPK3PXP",
      "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo…"
    }
  }
  ```

#### POST `/auth/2fa/verify`

Confirm the freshly-set-up TOTP. On success, 2FA becomes active and the response carries 8 single-use backup codes.

- **Auth:** Bearer
- **Request body:** `{ "code": "123456" }`
- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "backup_codes": ["a1b2c3d4", "e5f6g7h8", "…"]
    }
  }
  ```

#### POST `/auth/2fa/validate`

Complete a 2FA-required login. Accepts a TOTP code **or** a single-use backup code in `code`.

- **Auth:** Public *(temp token in body)*
- **Request body:**

  ```json
  { "temp_token": "eyJhbGciOi…", "code": "123456" }
  ```

- **Success — 200** — same shape as `/auth/login` (regular).
- **Errors:** `401` if temp token expired or code invalid.

#### POST `/auth/2fa/disable`

- **Auth:** Bearer
- **Request body:** `{ "password": "Test@1234" }`
- **Success — 200** — `{ "status": 200, "message": "2FA disabled" }`.

---

### Users

User CRUD (admin) plus profile management (self / admin).

**Source:** [src/users/users.controller.ts](src/users/users.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | Bearer + admin | List users with filters & pagination |
| POST | `/users` | Bearer + admin | Create a user |
| GET | `/users/:id` | Bearer | Get user by id |
| PATCH | `/users/:id` | Bearer + admin | Update a user |
| DELETE | `/users/:id` | Bearer + admin | Delete a user |
| GET | `/users/:id/roles` | Bearer | List the user's roles |
| GET | `/users/:id/profile` | Bearer | Get the user's profile |
| POST | `/users/:id/profile` | Bearer | Create the profile |
| PATCH | `/users/:id/profile` | Bearer | Upsert the profile |
| POST | `/users/:id/avatar` | Bearer | Upload avatar (multipart) |

---

#### GET `/users`

Admin-only directory listing.

- **Auth:** Bearer + `admin`
- **Query params:**

  | Param | Type | Required | Notes |
  |-------|------|----------|-------|
  | `page` | int | No | Default `1` |
  | `limit` | int | No | Default `10` |
  | `search` | string | No | Searches `username`, `full_name`, `email` |
  | `status` | enum | No | `active` \| `pending` \| `suspended` \| `inactive` |
  | `sortBy` | string | No | Default `createdAt` |
  | `order` | enum | No | `ASC` \| `DESC` |

- **Success — 200** — paginated envelope (see §4.3) with `data: User[]`.

---

#### POST `/users`

- **Auth:** Bearer + `admin`
- **DTO:** [CreateUserDto](src/users/dto/create-user.dto.ts)
- **Request body:**

  ```json
  {
    "full_name": "Layla Hadid",
    "email": "layla@trace.ps",
    "password": "Test@1234"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `full_name` | string | Yes | – |
  | `email` | string | Yes | Unique, valid email |
  | `password` | string | Yes | Min 6 (admin-create rule) |

- **Success — 201**

  ```json
  { "status": 201, "results": 1, "data": { "id": "…", "email": "layla@trace.ps", "…": "…" } }
  ```

- **Errors:** `409` (duplicate email), `400` (validation).

---

#### PATCH `/users/:id`

- **Auth:** Bearer + `admin`
- **DTO:** [UpdateUserDto](src/users/dto/update-user.dto.ts) (`PartialType(CreateUserDto)`)
- **Request body:** any subset of `CreateUserDto`.

---

#### POST `/users/:id/profile` and PATCH `/users/:id/profile`

Same DTO. `POST` creates; `PATCH` upserts.

- **Auth:** Bearer (no role restriction in the controller — service-level checks ensure self or admin)
- **DTO:** [CreateProfileDto / UpdateProfileDto](src/users/dto/user-profile.dto.ts)
- **Request body:**

  ```json
  {
    "display_name": "ahmad_k",
    "company": "Trace of the Tides",
    "job_title": "Storyteller",
    "personal_link": "https://ahmad.example",
    "location": "Ramallah",
    "about": "Heritage writer and editor.",
    "social_links": {
      "twitter": "@ahmad_k",
      "instagram": "ahmad_k",
      "linkedin": "ahmadk"
    }
  }
  ```

  All fields are optional.

- **Success — 200** — single-object envelope with the resulting profile.

---

#### POST `/users/:id/avatar`

Multipart upload. Accepted types: `image/jpeg`, `image/png`, `image/webp`. Max size: **5 MB**.

- **Auth:** Bearer
- **Content-Type:** `multipart/form-data`
- **Form fields:**

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `avatar` | file | Yes | – |

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "id": "…",
      "avatar_url": "https://storage.googleapis.com/…/avatars/…"
    }
  }
  ```

- **Errors:** `400` (missing file or unsupported MIME), `413` (over 5 MB).

---

### Roles & Permissions

Role CRUD, role assignment, and per-user permission overrides.

**Source:** [src/roles/roles.controller.ts](src/roles/roles.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/roles` | Bearer | List roles |
| GET | `/roles/:id` | Bearer | Get role by id |
| POST | `/roles` | Bearer + admin | Create role |
| PATCH | `/roles/:id` | Bearer + admin | Update role |
| DELETE | `/roles/:id` | Bearer + admin | Delete role |
| PATCH | `/roles/assign/:userId` | Bearer + admin | Assign a role to a user |
| PATCH | `/roles/revoke/:userId` | Bearer + admin | Revoke a role from a user |
| GET | `/roles/permissions/:userId` | Bearer + admin | List per-user permission overrides |
| POST | `/roles/permissions/:userId` | Bearer + admin | Grant or revoke a permission |
| DELETE | `/roles/permissions/:userId/:permissionId` | Bearer + admin | Remove an override (revert to role default) |

---

#### POST `/roles`

- **Auth:** Bearer + `admin`
- **DTO:** [CreateRoleDto](src/roles/dto/create-role.dto.ts)
- **Request body:**

  ```json
  { "name": "fact_checker", "description": "Reviews factual claims in submissions" }
  ```

---

#### PATCH `/roles/assign/:userId`

Adds a role to a user.

- **Auth:** Bearer + `admin`
- **Request body:**

  ```json
  { "role": "editor" }
  ```

- **Errors:** `404` (user or role not found), `409` (user already has the role).

---

#### PATCH `/roles/revoke/:userId`

Same body shape as `/roles/assign/:userId`; removes the role.

---

#### POST `/roles/permissions/:userId`

Explicitly grant **or** deny a fine-grained permission for a user, overriding their role-based default.

- **Auth:** Bearer + `admin`
- **Request body:**

  ```json
  { "permission": "content.publish", "granted": true }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `permission` | string | Yes | One of the strings in [Appendix B](#appendix-b--permissions) |
  | `granted` | boolean | Yes | `true` to grant, `false` to deny |

- **Success — 200** — single object describing the override.

---

### Follows

Public follower lists, authenticated follow toggle.

**Source:** [src/follows/follows.controller.ts](src/follows/follows.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/follows/toggle` | Bearer | Follow / unfollow a user |
| GET | `/follows/:userId/followers` | Public | Paginated followers |
| GET | `/follows/:userId/following` | Public | Paginated users this user follows |
| GET | `/follows/:userId/counts` | Public | Follower & following counts |
| GET | `/follows/check/:followingId` | Bearer | Whether the current user follows the target |

---

#### POST `/follows/toggle`

- **Auth:** Bearer
- **DTO:** [ToggleFollowDto](src/follows/dto/toggle-follow.dto.ts)
- **Request body:**

  ```json
  { "following_id": "9f83a17e-d4c8-4f1e-9d0a-4d3a31a85b27" }
  ```

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": { "following": true }
  }
  ```

- **Errors:** `404` if the target user does not exist; `400` on attempts to follow self.

---

## Content Authoring

### Articles

The platform's primary publishing surface. Articles support multiple content types (article, video, audio, thread, artwork, figma, trip, open_call), translations, blocks (paragraphs/quotes/images/galleries/etc.), tags, contributors, and a publish-schedule-archive workflow.

**Source:** [src/articles/articles.controller.ts](src/articles/articles.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/articles` | Public | List articles (paginated, filtered) |
| GET | `/articles/author/me` | Bearer | Current user's articles |
| GET | `/articles/author/me/stats` | Bearer | Current user's publishing stats |
| GET | `/articles/slug/:slug` | Public | Get article by slug (public page route) |
| GET | `/articles/collection/:collectionId` | Public | Articles in a collection + aggregate stats |
| GET | `/articles/:id` | Public | Article with blocks, tags, contributors, collection |
| GET | `/articles/:id/translations` | Public | All translations of an article |
| GET | `/articles/:id/related` | Public | Up to 4 related published articles |
| POST | `/articles` | Bearer | Create draft article (with blocks/tags) |
| PATCH | `/articles/:id` | Bearer (author or admin) | Update article |
| DELETE | `/articles/:id` | Bearer + admin | Delete article |
| PATCH | `/articles/:id/publish` | Bearer | Publish (requires ≥1 block) |
| PATCH | `/articles/:id/schedule` | Bearer | Schedule for future publish |
| PATCH | `/articles/:id/archive` | Bearer | Archive |
| PATCH | `/articles/:id/unpublish` | Bearer | Revert to draft |
| POST | `/articles/:id/view` | Public | Increment view count |
| GET | `/articles/:id/blocks` | Public | All blocks (ordered) |
| POST | `/articles/:id/blocks` | Bearer | Append a block |
| PATCH | `/articles/:id/blocks/reorder` | Bearer | Reorder blocks |
| PATCH | `/articles/:id/blocks/:blockId` | Bearer | Update a block |
| DELETE | `/articles/:id/blocks/:blockId` | Bearer | Remove a block |
| GET | `/articles/:id/contributors` | Public | List contributors |
| POST | `/articles/:id/contributors` | Bearer | Add contributor |
| DELETE | `/articles/:id/contributors/:contributorId` | Bearer | Remove contributor |

---

#### GET `/articles`

- **Auth:** Public
- **Query params:**

  | Param | Type | Notes |
  |-------|------|-------|
  | `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination (§9) |
  | `status` | enum | `draft` \| `published` \| `scheduled` \| `archived` \| `flagged` |
  | `content_type` | enum | `article` \| `video` \| `audio` \| `thread` \| `artwork` \| `figma` \| `trip` \| `open_call` |
  | `category` | string | – |
  | `language` | enum | `en` \| `ar` |

- **Success — 200** — paginated envelope; each `data[i]` is an article summary (id, title, slug, cover_image, excerpt, author, status, published_at, view_count, content_type, language).

---

#### POST `/articles`

Creates a new article in `draft` status owned by the authenticated user.

- **Auth:** Bearer
- **DTO:** [CreateArticleDto](src/articles/dto/article.dto.ts)
- **Request body:**

  ```json
  {
    "title": "The Future of Palestinian Heritage",
    "content_type": "article",
    "excerpt": "A deep dive into the preservation of cultural heritage…",
    "cover_image": "https://storage.googleapis.com/…/cover_heritage.jpg",
    "category": "Documentary",
    "language": "en",
    "visibility": "public",
    "seo_title": "Heritage Preservation in the Digital Age",
    "meta_description": "Exploring how digital tools help preserve Palestinian heritage",
    "collection_id": "9f83a17e-d4c8-4f1e-9d0a-4d3a31a85b27",
    "tag_ids": ["7c2…", "ab1…"],
    "blocks": [
      { "block_order": 1, "block_type": "paragraph", "content": "In the heart of Palestine…" },
      { "block_order": 2, "block_type": "image", "metadata": "{\"url\":\"img.jpg\",\"alt\":\"Old city walls\"}" }
    ]
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string | Yes | – |
  | `content_type` | string | No | One of `article`/`video`/`audio`/`thread`/`artwork`/`figma`/`trip`/`open_call` |
  | `excerpt` | string | No | Summary teaser |
  | `cover_image` | string | No | URL |
  | `media_url` | string | No | Hero video/audio URL (used for `video`/`audio` types) |
  | `media_duration` | int ≥ 0 | No | Minutes |
  | `edition` | string | No | Display badge |
  | `category` | string | No | – |
  | `language` | enum | No | `en` \| `ar` |
  | `visibility` | enum | No | `public` \| `private` \| `unlisted` |
  | `seo_title` | string | No | – |
  | `meta_description` | string | No | – |
  | `scheduled_at` | ISO date | No | Used together with `PATCH /:id/schedule` |
  | `collection_id` | UUID | No | Add to collection |
  | `translation_of` | UUID | No | Original article id this is a translation of |
  | `open_call_id` | UUID | No | Required when `content_type = open_call` |
  | `tag_ids` | UUID[] | No | – |
  | `blocks` | object[] | No | Inline create the article's blocks (see below) |

  **Block sub-DTO:** `{ block_order (int ≥ 1), block_type (enum), content?, metadata? (JSON string) }`. Block types: `paragraph`, `quote`, `image`, `gallery`, `callout`, `author_note`, `divider`, `video`, `audio`, `caption_text`, `meta_data`, `statistics`.

- **Success — 201** — single-object envelope: the new article with generated `id` and `slug`.

---

#### PATCH `/articles/:id`

Update any subset of `CreateArticleDto` plus a `status` field. If `blocks` or `tag_ids` are supplied they **replace** the existing relationships.

- **Auth:** Bearer (author of record, or any user with the `admin` role)
- **DTO:** [UpdateArticleDto](src/articles/dto/article.dto.ts)
- **Errors:** `403` if neither author nor admin.

---

#### PATCH `/articles/:id/publish`

Publish a draft article. The service requires the article has **at least 1 block**, and recalculates `reading_time` from block content.

- **Auth:** Bearer
- **Request body:** *(none)*
- **Success — 200** — the published article (with `published_at` set).
- **Errors:** `400` if no blocks; `404` if not found.

#### PATCH `/articles/:id/schedule`

- **Auth:** Bearer
- **Request body:** `{ "scheduled_at": "2026-05-12T09:00:00Z" }`
- **Success — 200** — article with `status: "scheduled"`.

#### PATCH `/articles/:id/archive` and `/unpublish`

Reversible state changes; no body. Archive marks `archived`; unpublish reverts to `draft`.

---

#### POST `/articles/:id/view`

Public counter. Call once per article-page load. Race-safe (atomic increment).

- **Auth:** Public
- **Success — 200** — `{ "status": 200, "results": 1, "data": { "view_count": 1247 } }`.

---

#### POST `/articles/:id/blocks`

- **Auth:** Bearer
- **DTO:** [CreateArticleBlockDto](src/articles/dto/article.dto.ts)
- **Request body:** see the block sub-DTO above.

#### PATCH `/articles/:id/blocks/reorder`

- **Auth:** Bearer
- **Request body:**

  ```json
  { "blockIds": ["block-uuid-3", "block-uuid-1", "block-uuid-2"] }
  ```

  The list must contain every block id exactly once; order in the array becomes the new `block_order`.

- **Errors:** `400` if `blockIds` is incomplete or contains foreign ids.

---

#### POST `/articles/:id/contributors`

- **Auth:** Bearer
- **DTO:** [AddContributorDto](src/articles/dto/article.dto.ts)
- **Request body:**

  ```json
  { "user_id": "9f83…", "role": "co-author" }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `user_id` | UUID | Yes | – |
  | `role` | enum | No | `main_contributor` \| `co-author` \| `contributor` \| `editor` \| `reviewer` (default `contributor`) |

---

### Collections

A loose grouping of articles or contributions (e.g., a curated series).

**Source:** [src/collections/collections.controller.ts](src/collections/collections.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/collections` | Public | List collections |
| GET | `/collections/:id` | Public | Get collection (with its contributions) |
| POST | `/collections` | Bearer | Create collection |
| PATCH | `/collections/:id` | Bearer | Update collection |
| DELETE | `/collections/:id` | Bearer | Delete collection |

#### POST `/collections`

- **Auth:** Bearer
- **Request body (Partial Collection model):**

  ```json
  {
    "name": "Stories from Jaffa",
    "description": "An evolving series on Jaffa's living heritage",
    "cover_image": "https://…/jaffa.jpg",
    "is_public": true
  }
  ```

  Fields are inferred from the `Collection` model (see [src/collections/models/collection.model.ts](src/collections/models/collection.model.ts) for the full set).

---

### Tags

Free-form taxonomy for articles, contributions, etc.

**Source:** [src/tags/tags.controller.ts](src/tags/tags.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tags` | Public | List tags |
| GET | `/tags/:id` | Public | Get tag |
| POST | `/tags` | Bearer | Create tag |
| PATCH | `/tags/:id` | Bearer + admin/editor | Update tag |
| DELETE | `/tags/:id` | Bearer + admin | Delete tag |

#### POST `/tags`

- **Auth:** Bearer
- **Request body:**

  ```json
  { "name": "Heritage", "slug": "heritage" }
  ```

  `slug` is derived from `name` if omitted.

---

### Writers

Public writer profiles surfaced on the website (different from auth/users — these are editorial profiles with a featured flag).

**Source:** [src/writer-profile/writer-profile.controller.ts](src/writer-profile/writer-profile.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/writers` | Public | List writers |
| GET | `/writers/featured` | Public | Featured writers strip |
| GET | `/writers/:id` | Public | Get profile by id |
| GET | `/writers/user/:userId` | Public | Get profile by user id |
| POST | `/writers` | Bearer + admin/editor | Create profile |
| PATCH | `/writers/:id` | Bearer + admin/editor | Update profile |
| DELETE | `/writers/:id` | Bearer + admin | Delete profile |

#### POST `/writers`

- **Auth:** Bearer + `admin` or `editor`
- **Request body (typical fields):**

  ```json
  {
    "user_id": "9f83…",
    "display_name": "Layla Hadid",
    "bio": "Jaffa-based heritage writer.",
    "avatar_url": "https://…/avatar.jpg",
    "is_featured": true,
    "social_links": { "twitter": "@laylahadid" }
  }
  ```

---

## Magazines

The platform hosts multiple magazines, each with its own issues, book club selections, and newsletter subscribers.

### Magazines

**Source:** [src/magazine/magazine.controller.ts](src/magazine/magazine.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/magazines` | Public | List magazines |
| GET | `/magazines/:id` | Public | Get magazine by id |
| GET | `/magazines/slug/:slug` | Public | Get magazine by slug |
| POST | `/magazines` | Bearer + admin | Create magazine |
| PATCH | `/magazines/:id` | Bearer + admin | Update magazine |
| DELETE | `/magazines/:id` | Bearer + admin | Delete magazine |

#### POST `/magazines`

- **Auth:** Bearer + `admin`
- **Request body (typical fields):**

  ```json
  {
    "name": "Trace Quarterly",
    "slug": "trace-quarterly",
    "description": "A quarterly magazine on Palestinian heritage.",
    "cover_image": "https://…/quarterly.jpg",
    "status": "active",
    "language": "en"
  }
  ```

- **Success — 201** — single-object envelope.

---

### Magazine Issues

**Source:** [src/magazine-issue/magazine-issue.controller.ts](src/magazine-issue/magazine-issue.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/magazine-issues` | Public | List issues |
| GET | `/magazine-issues/:id` | Public | Get issue by id |
| GET | `/magazine-issues/slug/:slug` | Public | Get issue by slug |
| POST | `/magazine-issues` | Bearer + admin/editor | Create issue |
| PATCH | `/magazine-issues/:id` | Bearer + admin/editor | Update issue |
| DELETE | `/magazine-issues/:id` | Bearer + admin | Delete issue |

#### GET `/magazine-issues`

- **Query params:** `page`, `limit`, `search`, `magazine_id` (filter by parent), `status`, `kind`.

#### POST `/magazine-issues`

- **Auth:** Bearer + `admin` or `editor`
- **Request body (typical fields):**

  ```json
  {
    "magazine_id": "9f83…",
    "title": "Issue 04 — Salt & Stone",
    "slug": "issue-04-salt-and-stone",
    "kind": "regular",
    "status": "draft",
    "cover_image": "https://…/issue-04.jpg",
    "summary": "Stories of coastal heritage.",
    "publish_date": "2026-06-01"
  }
  ```

---

### Book Club

Magazine-scoped reading-group selections.

**Source:** [src/book-club/book-club.controller.ts](src/book-club/book-club.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/book-club` | Public | List selections |
| GET | `/book-club/active` | Public | Active selections for a magazine *(query: `magazine_id` required)* |
| GET | `/book-club/:id` | Public | Get selection |
| POST | `/book-club` | Bearer + admin/editor | Create |
| PATCH | `/book-club/:id` | Bearer + admin/editor | Update |
| DELETE | `/book-club/:id` | Bearer + admin | Delete |

#### POST `/book-club`

- **Auth:** Bearer + `admin` or `editor`
- **Request body (typical fields):**

  ```json
  {
    "magazine_id": "9f83…",
    "book_title": "Mornings in Jenin",
    "author": "Susan Abulhawa",
    "cover_image": "https://…/jenin.jpg",
    "summary": "A multigenerational saga…",
    "discussion_url": "https://discuss.example/jenin",
    "starts_at": "2026-05-01",
    "ends_at": "2026-06-01",
    "status": "active"
  }
  ```

---

### Newsletter Subscribers

Per-magazine mailing list with a public double-opt-in flow.

**Source:** [src/newsletter-subscriber/newsletter-subscriber.controller.ts](src/newsletter-subscriber/newsletter-subscriber.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/newsletter-subscribers` | Bearer + admin/editor | List subscribers |
| POST | `/newsletter-subscribers/subscribe` | Public | Subscribe to a magazine |
| PATCH | `/newsletter-subscribers/:id/confirm` | Public | Confirm subscription via tokenized URL |
| PATCH | `/newsletter-subscribers/:id/unsubscribe` | Public | Unsubscribe |
| DELETE | `/newsletter-subscribers/:id` | Bearer + admin | Delete subscriber record |

#### POST `/newsletter-subscribers/subscribe`

- **Auth:** Public
- **Request body:**

  ```json
  {
    "magazine_id": "9f83…",
    "email": "ahmad@trace.ps",
    "user_id": "9f83…",
    "source": "footer-form"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `magazine_id` | UUID | Yes | – |
  | `email` | string | Yes | – |
  | `user_id` | UUID | No | Link the subscription to an existing account |
  | `source` | string | No | Free-form attribution (e.g. `"footer-form"`) |

- **Success — 200** — `{ "status": 200, "message": "Confirmation email sent" }`. The user receives a confirmation link → `PATCH /newsletter-subscribers/:id/confirm`.

---

## Submissions

### Open Calls

Public-facing calls for submissions (articles, videos, audio, slides). Includes a dynamic application form per call (defined by the editor) and a participant lifecycle (active → approved/rejected/withdrawn).

**Source:** [src/open call/open-call.controller.ts](src/open%20call/open-call.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/open-calls/active` | Public | Active calls only (deadline not passed) |
| GET | `/open-calls/:id` | Public | Get call details (with participants) |
| POST | `/open-calls/:id/join` | Public *(quota-guarded; multipart)* | Join (basic info form, optional files) |
| POST | `/open-calls/:id/apply` | Public *(quota-guarded; multipart)* | Apply with dynamic form answers + files |
| POST | `/open-calls/:id/apply-editor` | Bearer | Apply for editor role via this call |
| DELETE | `/open-calls/:id/leave` | Bearer | Withdraw |
| GET | `/open-calls/stats/overview` | Bearer + admin/editor | Stats for admin dashboard |
| GET | `/open-calls` | Bearer + admin/editor | All calls (any status) |
| POST | `/open-calls` | Bearer + admin/editor | Create call |
| PATCH | `/open-calls/:id` | Bearer + admin/editor | Update call |
| PATCH | `/open-calls/:id/publish` | Bearer + admin/editor | Set status to `open` |
| PATCH | `/open-calls/:id/schedule` | Bearer + admin/editor | Schedule future publish |
| PATCH | `/open-calls/:id/close` | Bearer + admin/editor | Close call |
| PATCH | `/open-calls/:id/reopen` | Bearer + admin | Reopen a closed call |
| DELETE | `/open-calls/:id` | Bearer + admin | Delete call |
| GET | `/open-calls/:id/participants` | Bearer + admin/editor | List participants |
| PATCH | `/open-calls/:id/participants/:participantId` | Bearer + admin/editor | Update participant status/role |
| PATCH | `/open-calls/:id/participants/:participantId/link-contribution` | Bearer | Attach an existing contribution |
| DELETE | `/open-calls/:id/participants/:participantId` | Bearer + admin | Remove participant |

> **Upload limits.** All upload endpoints accept up to **10 files**, each **≤ 20 MB**. Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`, `audio/mpeg`, `video/mp4`, MS Word (`.doc`, `.docx`). The `UploadQuotaGuard` further caps cumulative uploads per submitter.

---

#### POST `/open-calls`

Create an open call. Open calls are content-rich: they have a body composed of `content_blocks`, a `settings` block (status/category/tags), and a `application_form` schema describing fields applicants must fill in.

- **Auth:** Bearer + `admin` or `editor`
- **DTO:** [CreateOpenCallDto](src/open%20call/dto/open-call.dto.ts)
- **Request body:**

  ```json
  {
    "title": "Voices of the Coast — Spring Edition",
    "content_blocks": [
      { "type": "paragraph", "value": "We invite essays, audio…", "order": 1 },
      { "type": "image", "value": "https://…/banner.jpg", "order": 2 }
    ],
    "application_form": {
      "fields": [
        { "id": "name", "label": "Full Name", "type": "text", "required": true },
        { "id": "pitch", "label": "Pitch (300 words)", "type": "textarea", "required": true },
        { "id": "sample", "label": "Sample work (PDF/audio)", "type": "file", "required": false }
      ]
    },
    "settings": {
      "status": "open",
      "category": "essay",
      "language": "en",
      "visibility": "public",
      "tags": ["coast", "heritage"]
    },
    "action": "publish",
    "main_media": { "type": "image", "url": "https://…/banner.jpg", "size_mb": 1.4 },
    "seo": { "title": "Open Call — Voices of the Coast", "meta_description": "Submit essays, audio, and visuals…" },
    "timeline_start": "2026-05-01",
    "timeline_end": "2026-06-30",
    "tags": ["coast", "heritage"],
    "language": "en",
    "visibility": "public"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string | Yes | – |
  | `content_blocks` | object[] | Yes | Each `{ type, value, order }` |
  | `application_form` | object | Yes | `{ fields: [{ id, label, type, required }] }` — referenced when applicants submit |
  | `settings` | object | Yes | `{ status, category?, tags?, language?, visibility? }` |
  | `action` | enum | Yes | `publish` \| `draft` \| `schedule` |
  | `main_media` | object | No | `{ type, url, size_mb }` |
  | `seo` | object | No | `{ title, meta_description }` |
  | `scheduled_at` | ISO date | No | Required when `action = schedule` |
  | `timeline_start` / `timeline_end` | ISO date | No | Submission window |
  | `tags`, `language`, `visibility` | – | No | Mirror `settings` for top-level filtering |
  | `type` | enum | No | `article` \| `video` \| `audio` \| `slide` |

- **Success — 201** — single-object envelope with the created open call.

---

#### POST `/open-calls/:id/join` (public)

Public participation flow. Accepts basic personal info plus up to 10 files. If the caller is authenticated, the JWT's `sub` is auto-attached as `user_id`.

- **Auth:** Public *(quota-guarded)*
- **Content-Type:** `multipart/form-data`
- **DTO:** [JoinOpenCallDto](src/open%20call/dto/join-open-call.dto.ts)
- **Form fields (sample):**

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `first_name`, `last_name` | string | Yes | – |
  | `email` | string | Yes | Confirmation email is sent here |
  | `phone_number` | string | No | – |
  | `terms_agreed` | boolean | Yes | Must be `true` |
  | `files[]` | file | No | Up to 10, each ≤ 20 MB |

- **Errors:**
  - `400` — open call is not active (closed, deadline passed, draft).
  - `409` — caller has already joined.

---

#### POST `/open-calls/:id/apply` (public)

Submit answers to the dynamic `application_form` defined on the open call.

- **Auth:** Public *(quota-guarded)*
- **Content-Type:** `multipart/form-data`
- **DTO:** [ApplyOpenCallDto](src/open%20call/dto/apply-open-call.dto.ts)
- **Form fields:**

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `answers` | JSON object | Yes | Keys must match the `id` values in the call's `application_form.fields`. Send as a JSON string in the multipart body. |
  | `terms_agreement` | boolean | Yes | Must be `true` |
  | `user_id` | UUID | No | Auto-filled from JWT if authenticated |
  | `files[]` | file | No | Referenced by `id` from the form schema |

- **Success — 201** — single-object envelope with the participation record.
- **Errors:**
  - `400` — required form fields missing or call closed.
  - `409` — caller already applied.

---

#### Open-call workflow patches

| Endpoint | Body | Effect |
|----------|------|--------|
| `PATCH /open-calls/:id/publish` | – | `status` → `open` |
| `PATCH /open-calls/:id/schedule` | `{ "scheduled_at": "ISO" }` | `status` → `scheduled` |
| `PATCH /open-calls/:id/close` | – | `status` → `closed` |
| `PATCH /open-calls/:id/reopen` | – | reopens a closed call (admin) |

---

#### PATCH `/open-calls/:id/participants/:participantId`

- **Auth:** Bearer + `admin` or `editor`
- **Request body:**

  ```json
  { "status": "approved", "role": "contributor" }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `status` | enum | No | `active` \| `approved` \| `rejected` \| `withdrawn` |
  | `role` | enum | No | `participant` \| `contributor` \| `reviewer` |

---

### Contributions

Multimedia community submissions (independent from open calls, though contributions can be linked to an open call). Supports **guest submission** — uploaders don't have to be logged in.

**Source:** [src/contributions/contributions.controller.ts](src/contributions/contributions.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/contributions` | Public *(quota-guarded; multipart)* | Submit a contribution (with files) |
| GET | `/contributions/types` | Public | List contribution types |
| GET | `/contributions/types/:id` | Public | Get type |
| POST | `/contributions/types` | Bearer + admin | Create type |
| PATCH | `/contributions/types/:id` | Bearer + admin | Update type |
| DELETE | `/contributions/types/:id` | Bearer + admin | Delete type |
| GET | `/contributions` | Public | List contributions (paginated, filtered) |
| GET | `/contributions/:id` | Public | Get contribution (with files, type, user, collections) |
| PATCH | `/contributions/:id` | Bearer | Update contribution |
| PATCH | `/contributions/:id/status` | Bearer + admin/editor | Change status |
| DELETE | `/contributions/:id` | Bearer | Delete |

#### POST `/contributions` (guest-friendly)

- **Auth:** Public *(quota-guarded)*; if authenticated, `user_id` is auto-set from the JWT
- **Content-Type:** `multipart/form-data`
- **DTO:** [CreateContributionDto](src/contributions/dto/create-contribution.dto.ts)
- **Form fields:**

  ```jsonc
  // multipart fields:
  {
    "type_id": "9f83…",                 // contribution type id (optional)
    "title": "Old Jaffa Door",
    "description": "Photograph from the Old City…",
    "collection_id": "ab1…",            // optional
    "contributor_name": "Ahmad Khalil",
    "contributor_email": "ahmad@trace.ps",
    "contributor_phone": "+970591234567", // optional
    "consent_given": true,              // REQUIRED — must equal true
    "open_call_id": "9f83…"             // optional, links to an open call
  }
  // plus: files[] up to 10, each ≤ 20 MB
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string ≤ 255 | Yes | – |
  | `description` | string | Yes | – |
  | `contributor_name` | string | Yes | – |
  | `contributor_email` | string (email) | Yes | – |
  | `consent_given` | boolean | Yes | Must be `true` |
  | `type_id` | UUID | No | – |
  | `collection_id` | UUID | No | – |
  | `open_call_id` | UUID | No | If set, the contribution is linked to that call |
  | `contributor_phone` | string | No | – |

- **Success — 201** — single-object envelope with the new contribution and its uploaded file metadata.
- **Errors:** `400` (missing required fields, unsupported MIME, oversized file, `consent_given !== true`); `429` (per-uploader quota exceeded by `UploadQuotaGuard`).

---

#### PATCH `/contributions/:id/status`

- **Auth:** Bearer + `admin` or `editor`
- **DTO:** [UpdateContributionStatusDto](src/contributions/dto/update-contribution.dto.ts)
- **Request body:**

  ```json
  { "status": "published" }
  ```

  Statuses: `draft`, `pending`, `published`, `flagged`.

---

### Issue Pledges

A reader-funding mechanism — supporters pledge an amount toward a specific magazine issue. The capture endpoint is intended to be called by a payment-provider webhook once funds are captured.

**Source:** [src/issue-pledge/issue-pledge.controller.ts](src/issue-pledge/issue-pledge.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/issue-pledges` | Bearer + admin/editor | List pledges (filter by `issue_id`, `status`) |
| GET | `/issue-pledges/:id` | Bearer | Get pledge |
| POST | `/issue-pledges` | Public | Create pledge (guest allowed) |
| POST | `/issue-pledges/:id/capture` | Bearer + admin | Mark pledge captured (webhook) |
| PATCH | `/issue-pledges/:id` | Bearer + admin | Update pledge |
| DELETE | `/issue-pledges/:id` | Bearer + admin | Delete pledge |

#### POST `/issue-pledges`

- **Auth:** Public
- **Request body (typical fields):**

  ```json
  {
    "issue_id": "9f83…",
    "supporter_name": "Ahmad Khalil",
    "supporter_email": "ahmad@trace.ps",
    "amount": 50,
    "currency": "USD",
    "message": "Looking forward to issue 04!",
    "user_id": "9f83…"
  }
  ```

- **Success — 201** — pledge with `status: "pending"`. Capture happens out-of-band via the payment provider, which calls `POST /issue-pledges/:id/capture`.

---

## Trips

Curated heritage tours. Each trip has a stops itinerary, participants (with optional waitlist), pricing/capacity rules, and a draft → published → ongoing → completed → cancelled lifecycle.

**Source:** [src/trips/trips.controller.ts](src/trips/trips.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trips` | Public | List trips |
| GET | `/trips/archive` | Public | Completed/cancelled archive |
| GET | `/trips/:id` | Public | Trip with stops & participants |
| POST | `/trips` | Bearer | Create trip (draft) |
| PATCH | `/trips/:id` | Bearer | Update trip |
| PATCH | `/trips/:id/publish` | Bearer | Publish (requires ≥1 stop) |
| PATCH | `/trips/:id/archive` | Bearer + admin/editor | Archive |
| PATCH | `/trips/:id/cancel` | Bearer | Cancel + notify participants |
| DELETE | `/trips/:id` | Bearer + admin | Delete |
| GET | `/trips/:id/stats` | Public | Counts & spots remaining |
| GET | `/trips/:id/stops` | Public | Ordered stops |
| POST | `/trips/:id/stops` | Bearer | Add stop |
| PATCH | `/trips/:id/stops/reorder` | Bearer | Reorder stops |
| PATCH | `/trips/:id/stops/:stopId` | Bearer | Update stop |
| DELETE | `/trips/:id/stops/:stopId` | Bearer | Remove stop |
| GET | `/trips/:id/participants` | Public | Participants list |
| POST | `/trips/:id/register` | Public | Register (guest or authed) |
| POST | `/trips/:id/apply` | Public *(multipart)* | Apply via dynamic form + files |
| POST | `/trips/:id/cancel-registration` | Bearer | Cancel own registration |
| PATCH | `/trips/:id/participants/:participantId/status` | Bearer + admin/editor | Update participant status |

---

#### POST `/trips`

- **Auth:** Bearer
- **DTO:** [CreateTripDto](src/trips/dto/trip.dto.ts)
- **Request body:**

  ```json
  {
    "title": "Stones of Hebron — Heritage Walk",
    "description": "Two-day itinerary through the Old City…",
    "cover_image": "https://…/hebron.jpg",
    "category": "heritage",
    "route_summary": "Hebron Old City → Glassblowing Quarter → Souq",
    "start_date": "2026-06-01T08:00:00Z",
    "end_date": "2026-06-02T18:00:00Z",
    "price": 75,
    "currency": "USD",
    "max_participants": 20,
    "min_participants": 6,
    "difficulty": "moderate",
    "duration_hours": 18,
    "tags": "[\"hebron\",\"old-city\"]",
    "languages": "[\"en\",\"ar\"]",
    "highlights": "[\"Glassblowing demo\",\"Souq lunch\"]",
    "moderator_name": "Layla Hadid",
    "status": "draft",
    "application_form": {
      "fields": [
        { "id": "diet", "label": "Dietary restrictions", "type": "text", "required": false },
        { "id": "experience", "label": "Hiking experience", "type": "select", "options": ["none","some","experienced"], "required": true }
      ]
    },
    "stops": [
      { "stop_order": 1, "title": "Old City Gate", "description": "Meeting point", "arrival_time": "2026-06-01T09:00:00Z", "duration_minutes": 30 },
      { "stop_order": 2, "title": "Glassblowing Quarter", "duration_minutes": 90 }
    ]
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string | Yes | – |
  | `description`, `cover_image`, `route_summary`, `category` | string | No | `category` examples: `cultural`, `historical`, `educational`, `heritage` |
  | `start_date`, `end_date` | ISO datetime | Yes | – |
  | `price` | number ≥ 0 | No | – |
  | `currency` | string | No | – |
  | `max_participants`, `min_participants` | int ≥ 1 | No | – |
  | `difficulty` | enum | No | `easy` \| `moderate` \| `challenging` |
  | `duration_hours` | number | No | – |
  | `tags`, `languages`, `highlights` | JSON-string | No | Send as a JSON-encoded string |
  | `moderator_name` | string | No | – |
  | `status` | enum | No | Initial status (default `draft`) |
  | `application_form` | object | No | Dynamic schema; `{ fields: [...] }` |
  | `stops` | object[] | No | Inline create (see stop fields below) |

  **Stop sub-DTO fields:** `stop_order` (int ≥ 1, **required**), `title` (**required**), `description?`, `location_id?` (UUID — existing location), `location?` (inline `CreateInlineLocationDto`), `arrival_time?` (ISO), `duration_minutes?` (int ≥ 1), `cover_image?`.

- **Success — 201** — single-object envelope; the new trip plus the inline stops if provided.

---

#### POST `/trips/:id/register`

Free-form registration. If the trip is full, the participant is auto-waitlisted.

- **Auth:** Public *(authenticated user is auto-recorded if a JWT is present)*
- **DTO:** [RegisterParticipantDto](src/trips/dto/trip.dto.ts)
- **Request body (typical fields):**

  ```json
  {
    "first_name": "Ahmad",
    "last_name": "Khalil",
    "email": "ahmad@trace.ps",
    "phone_number": "+970591234567",
    "notes": "Vegetarian"
  }
  ```

- **Success — 201** — `{ status: 201, results: 1, data: { participant_id, status: "registered" | "waitlisted" } }`.

---

#### POST `/trips/:id/apply`

Dynamic-form-based application matching the trip's `application_form`. Multipart so the form can include file fields.

- **Auth:** Public *(JWT honored if present)*
- **Content-Type:** `multipart/form-data`
- **DTO:** [ApplyTripDto](src/trips/dto/apply-trip.dto.ts)
- **Form fields:**

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `answers` | JSON object | Yes | Keys must match `application_form.fields[].id` |
  | `terms_agreement` | boolean | Yes | Must be `true` |
  | `user_id` | UUID | No | Auto-filled from JWT if authenticated |
  | `files[]` | file | No | Up to 10 |

- **Errors:** `400` if the trip is not accepting applications or required answers are missing.

---

#### PATCH `/trips/:id/stops/reorder`

- **Auth:** Bearer
- **Request body:**

  ```json
  { "stopIds": ["stop-uuid-2", "stop-uuid-1", "stop-uuid-3"] }
  ```

  Same semantics as article block reorder — array must include every existing stop id exactly once.

---

#### PATCH `/trips/:id/participants/:participantId/status`

- **Auth:** Bearer + `admin` or `editor`
- **Request body:** `{ "status": "approved" }` (typical values: `registered`, `waitlisted`, `approved`, `rejected`, `cancelled`)

---

## Collectives & Phases

### Collectives

A collective is a long-running group initiative (think: themed editorial collectives or fellowship cohorts). It has members, phases (timeline stages), and a public join form.

**Source:** [src/collectives/collectives.controller.ts](src/collectives/collectives.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/collectives` | Public | List collectives |
| GET | `/collectives/:id` | Public | Get collective with members |
| GET | `/collectives/:id/members` | Public | List members |
| POST | `/collectives/:id/join` | Public | Submit join request |
| POST | `/collectives` | Bearer | Create |
| PATCH | `/collectives/:id` | Bearer | Update |
| DELETE | `/collectives/:id` | Bearer | Delete |
| POST | `/collectives/:id/members` | Bearer | Add member |
| DELETE | `/collectives/:id/members/:userId` | Bearer | Remove member |

---

#### POST `/collectives/:id/join`

Public-facing join form (guest allowed; if authed, `user_id` is auto-attached).

- **Auth:** Public
- **DTO:** [JoinCollectiveDto](src/collectives/dto/join-collective.dto.ts)
- **Request body:**

  ```json
  {
    "first_name": "Layla",
    "last_name": "Hadid",
    "email": "layla@trace.ps",
    "phone_number": "+970591234567",
    "experience_field": "Photography",
    "traces": ["jaffa-stories", "old-city-archives"],
    "about": "I focus on coastal heritage…",
    "facebook": "layla.hadid",
    "twitter": "@laylahadid",
    "instagram": "laylahadid",
    "linkedin": "laylahadid",
    "custom_links": ["https://layla-portfolio.example"],
    "terms_agreed": true,
    "availability_type": "frequently",
    "availability_days": ["mon", "wed", "fri"],
    "availability_slots": {
      "mon": [{ "start": "09:00", "end": "12:00" }]
    },
    "availability_timezone": "Asia/Hebron"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `first_name`, `last_name` | string | Yes | – |
  | `email` | string | Yes | – |
  | `phone_number` | string | Yes | – |
  | `experience_field` | string | Yes | – |
  | `about` | string | Yes | – |
  | `terms_agreed` | boolean | Yes | Must be `true` |
  | `traces` | string[] | No | Selected TTT projects |
  | `facebook`, `twitter`, `instagram`, `linkedin` | string | No | – |
  | `custom_links` | string[] | No | – |
  | `availability_type` | enum | No | `frequently` \| `one_time` |
  | `availability_days` | string[] | No | – |
  | `availability_slots` | object | No | `{ <day>: [{ start, end }] }` |
  | `availability_date` | string | No | For `one_time` availability |
  | `availability_timezone` | string | No | IANA tz |
  | `user_id` | UUID | No | Auto-filled from JWT |

- **Errors:** `404` (collective not found), `409` (already a member).

---

#### POST `/collectives/:id/members`

- **Auth:** Bearer
- **Request body:** `{ "user_id": "9f83…", "role": "contributor" }`

---

### Phases

Ordered milestones inside a collective.

**Source:** [src/phases/phases.controller.ts](src/phases/phases.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/phases` | Public | List phases |
| GET | `/phases/collective/:collectiveId` | Public | Phases for a collective (ordered) |
| GET | `/phases/:id` | Public | Get phase |
| POST | `/phases` | Bearer + admin/manager | Create phase |
| PATCH | `/phases/:id` | Bearer + admin/manager | Update |
| PATCH | `/phases/collective/:collectiveId/reorder` | Bearer + admin/manager | Reorder phases |
| DELETE | `/phases/:id` | Bearer + admin/manager | Delete |

#### POST `/phases`

- **Auth:** Bearer + `admin` or `manager`
- **DTO:** [CreatePhaseDto](src/phases/dto/phase.dto.ts)
- **Request body:**

  ```json
  {
    "collective_id": "9f83…",
    "title": "Phase 1 — Discovery",
    "description": "Field research and source gathering",
    "phase_order": 1,
    "starts_at": "2026-05-01",
    "ends_at": "2026-06-15",
    "status": "active"
  }
  ```

#### PATCH `/phases/collective/:collectiveId/reorder`

- **Auth:** Bearer + `admin` or `manager`
- **Request body:** `{ "phase_ids": ["phase-uuid-2", "phase-uuid-1", "phase-uuid-3"] }`

---

### Groups

Lightweight groupings of users (more ad-hoc than collectives).

**Source:** [src/groups/groups.controller.ts](src/groups/groups.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/groups` | Public | List groups |
| GET | `/groups/:id` | Public | Get group with members |
| GET | `/groups/:id/members` | Public | List members |
| POST | `/groups` | Bearer | Create |
| PATCH | `/groups/:id` | Bearer | Update |
| DELETE | `/groups/:id` | Bearer | Delete |
| POST | `/groups/:id/members` | Bearer | Add member |
| DELETE | `/groups/:id/members/:userId` | Bearer | Remove member |

`POST /groups/:id/members` body: `{ "user_id": "9f83…", "role": "member" }`.

---

### People

"Person" profiles are biographical archive entries (historical or contemporary figures referenced in articles). Each person has biographical cards, life events, and timeline events.

**Source:** [src/person/person.controller.ts](src/person/person.controller.ts)

#### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/people` | Public | List profiles |
| GET | `/people/:id` | Public | Profile + cards + events + timeline |
| POST | `/people` | Bearer | Create profile |
| PATCH | `/people/:id` | Bearer | Update profile |
| DELETE | `/people/:id` | Bearer | Delete profile |
| GET | `/people/:id/cards` | Public | Biographical cards |
| POST | `/people/:id/cards` | Bearer | Add card |
| PATCH | `/people/cards/:cardId` | Bearer | Update card |
| DELETE | `/people/cards/:cardId` | Bearer | Delete card |
| GET | `/people/:id/life-events` | Public | Life events (chronological) |
| POST | `/people/:id/life-events` | Bearer | Add life event |
| PATCH | `/people/life-events/:eventId` | Bearer | Update |
| DELETE | `/people/life-events/:eventId` | Bearer | Delete |
| GET | `/people/:id/timeline` | Public | Timeline events |
| POST | `/people/:id/timeline` | Bearer | Add timeline event |
| PATCH | `/people/timeline/:eventId` | Bearer | Update |
| DELETE | `/people/timeline/:eventId` | Bearer | Delete |

#### POST `/people`

- **Auth:** Bearer
- **Request body (typical fields):**

  ```json
  {
    "full_name": "Mahmoud Darwish",
    "birth_year": 1941,
    "death_year": 2008,
    "biography": "Palestinian poet…",
    "image_url": "https://…/darwish.jpg",
    "tags": ["poet", "literature"]
  }
  ```

#### POST `/people/:id/cards`, `/life-events`, `/timeline`

All three sub-resources accept free-form bodies that include at minimum a `title` and a `date` (or `year`). Cards typically also have a `body` field; life and timeline events have an `event_date` and a `description`.

---

### References

Citations and source materials referenced by articles or contributions.

**Source:** [src/references/references.controller.ts](src/references/references.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/references` | Public | List references |
| GET | `/references/:id` | Public | Get reference |
| POST | `/references` | Bearer | Create |
| PATCH | `/references/:id` | Bearer | Update |
| DELETE | `/references/:id` | Bearer | Delete |

#### POST `/references`

- **Auth:** Bearer
- **Request body (typical fields):**

  ```json
  {
    "title": "Walking Through History",
    "author": "Said Tamari",
    "type": "book",
    "year": 2014,
    "publisher": "Cambridge University Press",
    "url": "https://example.org/walking-through-history",
    "isbn": "978-1107046063"
  }
  ```

---

## Engagement

### Comments

Threaded comments. A comment is owned by a user and attaches to a discussion (or is a reply to another comment).

**Source:** [src/comments/comments.controller.ts](src/comments/comments.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/comments` | Public | List comments |
| GET | `/comments/:id` | Public | Get comment with replies |
| POST | `/comments` | Bearer + role *(user/admin/editor/author/contributor)* | Create comment or reply |
| PATCH | `/comments/:id` | Bearer | Update comment |
| DELETE | `/comments/:id` | Bearer | Delete comment |

#### Query params for GET `/comments`

| Param | Type | Notes |
|-------|------|-------|
| `discussion_id` | UUID | Filter to one discussion |
| `user_id` | UUID | Filter by author |
| `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination |

#### POST `/comments`

- **Auth:** Bearer (any role except `guest`)
- **Request body:**

  ```json
  {
    "user_id": "9f83…",
    "discussion_id": "ab1…",
    "parent_id": "cd2…",
    "content": "I appreciate the angle on coastal heritage…"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `user_id` | UUID | Yes | – |
  | `discussion_id` | UUID | Yes | Parent thread |
  | `parent_id` | UUID | No | Set to make this a reply |
  | `content` | string | Yes | – |

---

### Reactions

Per-comment emoji reactions (`like`, `love`, `wow`, `sad`, `angry`).

**Source:** [src/reactions/reactions.controller.ts](src/reactions/reactions.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reactions/comment/:commentId` | Public | Reaction summary for a comment |
| GET | `/reactions` | Public | List all reactions (filtered) |
| GET | `/reactions/:id` | Public | Get reaction |
| POST | `/reactions/toggle` | Bearer | Toggle a reaction |
| DELETE | `/reactions/:id` | Bearer | Delete reaction by id |

#### POST `/reactions/toggle`

Idempotent toggle: same `(user_id, comment_id, type)` twice removes the reaction; submitting a different `type` switches.

- **Auth:** Bearer
- **Request body:**

  ```json
  { "user_id": "9f83…", "comment_id": "ab1…", "type": "love" }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `user_id` | UUID | Yes | – |
  | `comment_id` | UUID | Yes | – |
  | `type` | enum | Yes | `like` \| `love` \| `wow` \| `sad` \| `angry` |

- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": { "action": "added", "reaction": { "id": "…", "type": "love" } }
  }
  ```

  `action` is one of `added`, `removed`, or `switched`.

---

### Discussions

Top-level threads that comments attach to.

**Source:** [src/discussions/discussions.controller.ts](src/discussions/discussions.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/discussions` | Public | List discussions |
| GET | `/discussions/:id` | Public | Get with comments |
| POST | `/discussions` | Bearer | Create |
| PATCH | `/discussions/:id` | Bearer | Update |
| DELETE | `/discussions/:id` | Bearer | Delete |

#### POST `/discussions`

- **Auth:** Bearer
- **Request body (typical fields):**

  ```json
  {
    "title": "Voices on the future of Old Jaffa",
    "description": "Where does coastal heritage go from here?",
    "created_by": "9f83…"
  }
  ```

---

### Notifications

In-app notification feed. The whole controller is class-level guarded with `JwtAuthGuard + RolesGuard`, so every endpoint requires Bearer auth.

**Source:** [src/notifications/notifications.controller.ts](src/notifications/notifications.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Bearer | List all notifications (with filters) |
| GET | `/notifications/user/:userId` | Bearer | Notifications for a user |
| GET | `/notifications/user/:userId/unread-count` | Bearer | Unread count |
| GET | `/notifications/:id` | Bearer | Get notification |
| PATCH | `/notifications/:id/read` | Bearer | Mark single as read |
| PATCH | `/notifications/user/:userId/read-all` | Bearer | Mark all read |
| POST | `/notifications` | Bearer + admin | Create (admin only) |
| DELETE | `/notifications/:id` | Bearer | Delete |

#### Query params for GET `/notifications`

| Param | Type | Notes |
|-------|------|-------|
| `status` | enum | `unread` \| `read` |
| `type` | string | `system` / `review` / `update` (free-form in practice) |
| `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination |

#### POST `/notifications`

- **Auth:** Bearer + `admin`
- **Request body (typical fields):**

  ```json
  {
    "user_id": "9f83…",
    "type": "system",
    "title": "Your application was approved",
    "message": "Welcome to the Voices of the Coast collective.",
    "link": "/collectives/voc"
  }
  ```

---

## Boards (Whiteboarding)

A collaborative whiteboard surface. Each board has multiple pages; each page hosts elements (sticky notes, shapes, text, images, article-block embeds, layout grids). Elements can be linked by connectors. Boards also have a member list, a board-wide chat, and per-element comments.

**Source:** [src/boards/boards.controller.ts](src/boards/boards.controller.ts)

### Endpoint inventory

#### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/templates` | Public | List templates (filter `category`) |
| GET | `/boards/templates/:templateId` | Public | Get template |
| POST | `/boards/templates` | Bearer + admin | Create template |
| POST | `/boards/from-template/:templateId` | Bearer | Create board from template *(body: `{ title? }`)* |

#### Boards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards` | Public | List boards |
| POST | `/boards` | Bearer | Create (auto-creates Page 1 + owner member) |
| GET | `/boards/:id` | Bearer | Board with pages & members |
| PATCH | `/boards/:id` | Bearer (editor+) | Update |
| DELETE | `/boards/:id` | Bearer + admin | Delete |

#### Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/:id/members` | Bearer | List members |
| POST | `/boards/:id/members` | Bearer | Add member |
| PATCH | `/boards/:id/members/:memberId` | Bearer | Update role |
| DELETE | `/boards/:id/members/:memberId` | Bearer | Remove |

#### Pages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/:id/pages` | Bearer | List |
| POST | `/boards/:id/pages` | Bearer | Add |
| PATCH | `/boards/:id/pages/:pageId` | Bearer | Update title/order |
| DELETE | `/boards/:id/pages/:pageId` | Bearer | Delete (cascades elements/connectors) |

#### Elements

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/:id/pages/:pageId/elements` | Bearer | List page elements |
| POST | `/boards/:id/pages/:pageId/elements` | Bearer | Create element |
| PATCH | `/boards/:id/elements/reorder` | Bearer | Bulk z-index update |
| PATCH | `/boards/:id/elements/:elementId` | Bearer | Update element |
| DELETE | `/boards/:id/elements/:elementId` | Bearer | Delete (cascades connectors) |
| POST | `/boards/:id/elements/:elementId/duplicate` | Bearer | Duplicate |

#### Connectors

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/:id/pages/:pageId/connectors` | Bearer | List |
| POST | `/boards/:id/connectors` | Bearer | Create |
| PATCH | `/boards/:id/connectors/:connectorId` | Bearer | Update |
| DELETE | `/boards/:id/connectors/:connectorId` | Bearer | Delete |

#### Chat & Comments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/boards/:id/chat` | Bearer | List chat messages (paginated) |
| POST | `/boards/:id/chat` | Bearer | Send chat message |
| GET | `/boards/:id/elements/:elementId/comments` | Bearer | List element comments |
| POST | `/boards/:id/comments` | Bearer | Create comment |
| PATCH | `/boards/:id/comments/:commentId` | Bearer | Update / resolve comment |
| DELETE | `/boards/:id/comments/:commentId` | Bearer | Delete |

---

#### POST `/boards`

- **Auth:** Bearer
- **DTO:** [CreateBoardDto](src/boards/dto/board.dto.ts)
- **Request body:**

  ```json
  {
    "title": "Q3 Editorial Planning",
    "description": "Mood board for the autumn issue",
    "cover_image": "https://…/cover.jpg",
    "team_id": "9f83…",
    "visibility": "team",
    "settings": "{\"grid\":true,\"minimap\":true,\"background_color\":\"#FAFAFA\"}",
    "template_id": "9f83…"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string | Yes | – |
  | `description`, `cover_image` | string | No | – |
  | `team_id` | UUID | No | Owning team/group |
  | `visibility` | enum | No | `private` \| `team` \| `public` |
  | `settings` | JSON-string | No | `{ grid, minimap, background_color }` |
  | `template_id` | UUID | No | If set, board is seeded from this template |

#### POST `/boards/:id/pages/:pageId/elements`

- **Auth:** Bearer
- **DTO:** [CreateBoardElementDto](src/boards/dto/board.dto.ts)
- **Request body:**

  ```json
  {
    "element_type": "sticky_note",
    "x": 120, "y": 240,
    "width": 200, "height": 200,
    "rotation": 0,
    "z_index": 5,
    "content": "Idea: cover story on coastal heritage",
    "properties": "{\"color\":\"#FFE680\"}"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `element_type` | enum | Yes | `sticky_note` \| `rectangle` \| `circle` \| `triangle` \| `diamond` \| `text` \| `image` \| `article_block` \| `layout_grid` |
  | `x`, `y` | number | Yes | Coordinates |
  | `width`, `height` | number | No | Default 200 |
  | `rotation`, `z_index` | number | No | – |
  | `content` | string | No | Element text content |
  | `properties` | JSON-string | No | Type-specific extras |

#### PATCH `/boards/:id/elements/reorder`

- **Auth:** Bearer
- **DTO:** [ReorderElementsDto](src/boards/dto/board.dto.ts)
- **Request body:**

  ```json
  {
    "items": [
      { "element_id": "el-1", "z_index": 1 },
      { "element_id": "el-2", "z_index": 2 }
    ]
  }
  ```

#### POST `/boards/:id/connectors`

- **Auth:** Bearer
- **DTO:** [CreateBoardConnectorDto](src/boards/dto/board.dto.ts)
- **Request body (typical fields):**

  ```json
  {
    "page_id": "page-uuid",
    "from_element_id": "el-1",
    "to_element_id": "el-2",
    "label": "depends on",
    "style": "solid"
  }
  ```

---

## Knowledge Base

A library of books, articles, adventures, and locations — surfaced as a "knowledge" landing page on the site.

**Source:** [src/knowledge/knowledge.controller.ts](src/knowledge/knowledge.controller.ts)

### Books

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/knowledge/books` | Public | List books (filters: `genre`, `language`, `price_type`, `min_rating`, `magazine_id`) |
| GET | `/knowledge/books/:id` | Public | Get book |
| POST | `/knowledge/books` | Bearer | Create |
| PATCH | `/knowledge/books/:id` | Bearer | Update |
| DELETE | `/knowledge/books/:id` | Bearer | Delete |
| GET | `/knowledge/books/:id/reviews` | Public | List reviews |
| POST | `/knowledge/books/:id/reviews` | Public | Submit review (guest allowed) |
| DELETE | `/knowledge/books/reviews/:reviewId` | Bearer | Delete review |

#### POST `/knowledge/books`

- **Auth:** Bearer
- **Request body (typical fields):**

  ```json
  {
    "title": "The Mountain",
    "author": "Drora Tamari",
    "language": "en",
    "genre": "memoir",
    "isbn": "978-0593321027",
    "price_type": "paid",
    "price": 18.99,
    "currency": "USD",
    "cover_image": "https://…/the-mountain.jpg",
    "summary": "A century of memory…",
    "magazine_id": "9f83…"
  }
  ```

#### POST `/knowledge/books/:id/reviews` (public)

- **Auth:** Public
- **Request body:**

  ```json
  {
    "reviewer_name": "Ahmad Khalil",
    "rating": 5,
    "title": "Stunning",
    "body": "A masterful narrative…",
    "user_id": "9f83…"
  }
  ```

  Reviews submitted without `user_id` are stored as guest reviews.

### Articles, Adventures, Locations

The remaining knowledge sub-resources are simple CRUD with the same `Bearer` (create/update/delete) and `Public` (list/get) pattern:

| Resource | Endpoints |
|----------|-----------|
| Articles | `GET /knowledge/articles`, `GET /knowledge/articles/:id`, `POST /knowledge/articles`, `PATCH /knowledge/articles/:id`, `DELETE /knowledge/articles/:id` |
| Adventures | `GET /knowledge/adventures`, `GET /knowledge/adventures/:id`, `POST /knowledge/adventures`, `PATCH /knowledge/adventures/:id`, `DELETE /knowledge/adventures/:id` |
| Locations | `GET /knowledge/locations`, `GET /knowledge/locations/:id`, `POST /knowledge/locations`, `PATCH /knowledge/locations/:id`, `DELETE /knowledge/locations/:id` |

Use Swagger (`/api/docs`) for the per-resource field schemas — these are stored as flexible JSON model bodies.

---

## CMS Pages & Settings

Editor-driven content management for the public website (static pages, homepage section editor, navigation, footer, branding settings).

**Source:** [src/cms/cms.controller.ts](src/cms/cms.controller.ts)

### Endpoint inventory

#### Pages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cms/pages` | Public | List pages |
| GET | `/cms/pages/slug/:slug` | Public | Get page by slug (frontend rendering) |
| GET | `/cms/pages/:id` | Public | Get page by id |
| POST | `/cms/pages` | Bearer + admin | Create page |
| PATCH | `/cms/pages/:id` | Bearer + admin | Update page |
| PATCH | `/cms/pages/:id/publish` | Bearer + admin | Publish |
| DELETE | `/cms/pages/:id` | Bearer + admin | Delete (homepage cannot be deleted) |

#### Page Sections (homepage visual editor)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cms/pages/:id/sections` | Public | List sections (ordered) |
| POST | `/cms/pages/:id/sections` | Bearer + admin | Add section |
| PATCH | `/cms/pages/:id/sections/reorder` | Bearer + admin | Reorder *(body: `{ sectionIds: string[] }`)* |
| PATCH | `/cms/pages/:id/sections/:sectionId` | Bearer + admin | Update section |
| PATCH | `/cms/pages/:id/sections/:sectionId/toggle` | Bearer + admin | Toggle visibility |
| DELETE | `/cms/pages/:id/sections/:sectionId` | Bearer + admin | Remove section |

#### Site Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cms/settings` | Public | All settings (navigation, footer, branding, …) |
| GET | `/cms/settings/:key` | Public | Get a single setting |
| PATCH | `/cms/settings` | Bearer + admin | Upsert setting |
| DELETE | `/cms/settings/:key` | Bearer + admin | Delete setting |

#### POST `/cms/pages`

- **Auth:** Bearer + `admin`
- **DTO:** [CreatePageDto](src/cms/dto/cms.dto.ts)
- **Request body:**

  ```json
  {
    "title": "About Us",
    "slug": "about",
    "page_type": "static",
    "content": "<h1>About Us</h1><p>…</p>",
    "seo_title": "About Trace of the Tides",
    "meta_description": "Heritage storytelling platform…"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title`, `slug` | string | Yes | – |
  | `page_type` | enum | No | `homepage` \| `static` \| `custom` |
  | `content` | string (HTML) | No | – |
  | `seo_title`, `meta_description` | string | No | – |

#### PATCH `/cms/settings`

Upsert a single key/value pair (typical keys: `navigation`, `footer`, `branding`).

- **Auth:** Bearer + `admin`
- **DTO:** [UpdateSiteSettingsDto](src/cms/dto/cms.dto.ts)
- **Request body:**

  ```json
  {
    "key": "navigation",
    "value": "{\"links\":[{\"label\":\"Magazines\",\"href\":\"/magazines\"}]}"
  }
  ```

  `value` is a JSON-encoded string; the shape depends on the key.

---

## Author Dashboard & Settings

Self-service surface for authors. Class-level `@UseGuards(JwtAuthGuard)` — every endpoint requires Bearer auth.

**Source:** [src/author-dashboard/author-dashboard.controller.ts](src/author-dashboard/author-dashboard.controller.ts)

### Endpoint inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/author/stats` | Bearer | Stats (articles, contributions, reads, days active) |
| GET | `/author/dashboard` | Bearer | Profile + stats + recent items |
| GET | `/author/analytics` | Bearer | Top-performing articles |
| GET | `/author/supporters` | Bearer | Donors (filter `type`: all/one-time/recurring) |
| POST | `/author/supporters/:donationId/thank` | Bearer | Send thank-you |
| GET | `/author/settings/profile` | Bearer | Profile fields |
| PATCH | `/author/settings/profile` | Bearer | Update profile |
| GET | `/author/settings/notifications` | Bearer | Notification prefs |
| PATCH | `/author/settings/notifications` | Bearer | Update notification prefs |
| GET | `/author/settings/privacy` | Bearer | Privacy settings |
| PATCH | `/author/settings/privacy` | Bearer | Update privacy |
| PATCH | `/author/settings/password` | Bearer | Change password |
| GET | `/author/settings/availability` | Bearer | Availability status |
| PATCH | `/author/settings/availability` | Bearer | Update availability |
| POST | `/author/settings/account/deactivate` | Bearer | Deactivate (requires password) |
| POST | `/author/settings/account/reactivate` | Bearer | Reactivate |

#### PATCH `/author/settings/profile`

- **Auth:** Bearer
- **Request body (all fields optional):**

  ```json
  {
    "full_name": "Ahmad Khalil",
    "email": "ahmad@trace.ps",
    "avatar": "https://…/avatar.jpg",
    "display_name": "ahmad_k",
    "location": "Ramallah",
    "about": "Heritage writer.",
    "social_links": { "twitter": "@ahmad_k" },
    "birth_date": "1990-03-12",
    "gender": "male",
    "role_title": "Editor at Trace Quarterly",
    "company": "Trace of the Tides",
    "external_link": "https://ahmad.example"
  }
  ```

#### PATCH `/author/settings/notifications`

```json
{
  "article_updates": true,
  "new_followers": true,
  "new_contributors": true,
  "comments": false,
  "weekly_digest": true,
  "push_browser": false
}
```

#### PATCH `/author/settings/privacy`

```json
{
  "profile_visibility": "public",
  "show_email": false,
  "show_activity": true,
  "allow_follows": true
}
```

`profile_visibility`: `public` \| `followers` \| `private`.

#### PATCH `/author/settings/password`

```json
{
  "current_password": "Test@1234",
  "new_password": "NewPass@123",
  "confirm_password": "NewPass@123"
}
```

#### POST `/author/settings/account/deactivate`

```json
{ "password": "Test@1234" }
```

The account becomes `inactive` and is hidden from public listings.

---

## Tasks

Editorial task tracker. Class-level `@UseGuards(JwtAuthGuard)` — every endpoint requires auth.

**Source:** [src/tasks/tasks.controller.ts](src/tasks/tasks.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tasks` | Bearer + admin/editor | List all tasks |
| GET | `/tasks/my-tasks` | Bearer | Tasks assigned to me |
| GET | `/tasks/assigned-by-me` | Bearer + admin/editor | Tasks I assigned |
| GET | `/tasks/:id` | Bearer | Get task |
| POST | `/tasks` | Bearer + admin/editor | Create + assign |
| PATCH | `/tasks/:id` | Bearer + admin/editor | Update |
| PATCH | `/tasks/:id/status` | Bearer | Update status (assignees) |
| DELETE | `/tasks/:id` | Bearer + admin/editor | Delete |

#### POST `/tasks`

- **Auth:** Bearer + `admin` or `editor`
- **DTO:** [CreateTaskDto](src/tasks/dto/task.dto.ts)
- **Request body:**

  ```json
  {
    "title": "Edit cover essay for Issue 04",
    "description": "Substantive edit pass on the lead piece.",
    "assignee_id": "9f83…",
    "priority": "high",
    "due_date": "2026-05-20",
    "article_id": "ab1…",
    "contribution_id": null,
    "open_call_id": null
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `title` | string | Yes | – |
  | `assignee_id` | UUID | Yes | – |
  | `description` | string | No | – |
  | `priority` | enum | No | `low` \| `medium` \| `high` |
  | `due_date` | ISO date | No | – |
  | `article_id`, `contribution_id`, `open_call_id` | UUID | No | Resource the task relates to |

#### PATCH `/tasks/:id/status`

Used by assignees to track progress.

- **Auth:** Bearer
- **DTO:** [UpdateTaskStatusDto](src/tasks/dto/task.dto.ts)
- **Request body:** `{ "status": "in_progress" }` (`pending` \| `in_progress` \| `completed` \| `cancelled`)

---

## Messaging

Admin-driven inbox + broadcast + templates.

**Source:** [src/messaging/messaging.controller.ts](src/messaging/messaging.controller.ts)

### Endpoint inventory

#### Conversations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messaging/summary` | Bearer + admin | Dashboard summary |
| GET | `/messaging/conversations` | Bearer + admin | All conversations (admin inbox) |
| GET | `/messaging/conversations/me` | Bearer | Current user's conversations |
| GET | `/messaging/conversations/archived` | Bearer + admin | Archived conversations |
| GET | `/messaging/conversations/:id` | Bearer | Get conversation with messages |
| POST | `/messaging/conversations` | Bearer | Start a conversation (user) |
| POST | `/messaging/conversations/:id/reply` | Bearer | Reply |
| PATCH | `/messaging/conversations/:id/read` | Bearer | Mark as read |
| PATCH | `/messaging/conversations/:id/resolve` | Bearer + admin | Resolve |
| PATCH | `/messaging/conversations/:id/archive` | Bearer + admin | Archive |
| PATCH | `/messaging/conversations/:id/assign` | Bearer + admin | Assign to admin |

#### Broadcasts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messaging/broadcasts` | Bearer + admin | List broadcasts |
| POST | `/messaging/broadcasts` | Bearer + admin | Create (draft or send) |
| PATCH | `/messaging/broadcasts/:id/send` | Bearer + admin | Send a draft |
| DELETE | `/messaging/broadcasts/:id` | Bearer + admin | Delete draft |

#### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messaging/templates` | Bearer + admin | List templates |
| GET | `/messaging/templates/:id` | Bearer + admin | Get template |
| POST | `/messaging/templates` | Bearer + admin | Create template |
| PATCH | `/messaging/templates/:id` | Bearer + admin | Update |
| DELETE | `/messaging/templates/:id` | Bearer + admin | Delete |

#### Conversation filters (admin inbox)

| Param | Type | Notes |
|-------|------|-------|
| `status` | enum | `open` \| `pending` \| `resolved` \| `archived` |
| `category` | enum | `payment` \| `content` \| `account` \| `technical` \| `general` |
| `priority` | enum | `low` \| `normal` \| `high` \| `urgent` |
| `search` | string | Free-text |

#### POST `/messaging/conversations` (user)

- **Auth:** Bearer
- **Request body:**

  ```json
  {
    "subject": "Help with my draft",
    "message": "I can't publish article 9f83…",
    "category": "content",
    "priority": "normal"
  }
  ```

#### POST `/messaging/conversations/:id/reply`

- **Auth:** Bearer
- **Request body:** `{ "content": "Try clearing the cache.", "template_id": "9f83…" }` (`template_id` optional).

#### POST `/messaging/broadcasts`

- **Auth:** Bearer + `admin`
- **Request body:**

  ```json
  {
    "subject": "New issue out now",
    "message": "Issue 04 is live. Read it here…",
    "target_audience": "all",
    "priority": "normal",
    "template_id": "9f83…",
    "send": false
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `subject`, `message` | string | Yes | – |
  | `target_audience` | string | No | e.g. `all`, `subscribers`, `editors` |
  | `priority` | enum | No | `low` \| `normal` \| `high` \| `urgent` |
  | `template_id` | UUID | No | Pre-fill from template |
  | `send` | boolean | No | `true` to send immediately, otherwise saved as draft |

#### POST `/messaging/templates`

- **Auth:** Bearer + `admin`
- **Request body:** `{ "name": "Welcome", "category": "onboarding", "subject": "Welcome!", "body": "Hi {{name}}, …" }`

---

## Finance

The admin finance dashboard plus creator payout requests.

**Source:** [src/finance/finance.controller.ts](src/finance/finance.controller.ts)

### Endpoint inventory

#### Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finance/summary` | Bearer + admin | Dashboard summary cards |
| GET | `/finance/export` | Bearer + admin | Export report (JSON) — `period`: `7d`/`30d`/`90d`/`1y` |

#### Donations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finance/donations` | Bearer + admin | List donations |
| GET | `/finance/donations/chart` | Bearer + admin | Time-series chart |
| GET | `/finance/donations/:id` | Bearer + admin | Get donation |

#### Payouts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finance/payouts` | Bearer + admin | List payouts |
| POST | `/finance/payouts/request` | Bearer | Creator requests a payout |
| GET | `/finance/payouts/balance` | Bearer | Creator's available balance |
| PATCH | `/finance/payouts/:id/approve` | Bearer + admin | Approve |
| PATCH | `/finance/payouts/:id/reject` | Bearer + admin | Reject *(body: `{ reason }`)* |
| PATCH | `/finance/payouts/:id/complete` | Bearer + admin | Mark complete |

#### Fraud Flags

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finance/fraud-flags` | Bearer + admin | List flags (filters: `status`, `severity`) |
| PATCH | `/finance/fraud-flags/:id/investigate` | Bearer + admin | Mark under investigation |
| PATCH | `/finance/fraud-flags/:id/resolve` | Bearer + admin | Resolve *(body: `{ notes }`)* |
| PATCH | `/finance/fraud-flags/:id/block` | Bearer + admin | Block flagged user |

#### Invoices

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finance/invoices` | Bearer + admin | List (filter `type`: donation/payout/platform_fee) |
| GET | `/finance/invoices/:id` | Bearer + admin | Get invoice |

---

#### POST `/finance/payouts/request`

A creator requests a withdrawal of their available balance.

- **Auth:** Bearer
- **Request body:**

  ```json
  {
    "amount": 250.00,
    "currency": "USD",
    "payment_method": "bank_transfer",
    "payment_details": "{\"iban\":\"PS92…\",\"account_name\":\"Ahmad Khalil\"}"
  }
  ```

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `amount` | number > 0 | Yes | Must be ≤ available balance |
  | `currency` | string | No | Default `USD` |
  | `payment_method` | string | Yes | e.g. `bank_transfer`, `paypal` |
  | `payment_details` | JSON-string | No | Provider-specific account info |

- **Errors:** `400` if `amount` exceeds balance.

#### GET `/finance/payouts/balance`

- **Auth:** Bearer
- **Success — 200**

  ```json
  {
    "status": 200,
    "results": 1,
    "data": {
      "currency": "USD",
      "available_balance": 412.50,
      "pending_balance": 78.00,
      "lifetime_earned": 1240.00
    }
  }
  ```

#### PATCH `/finance/payouts/:id/reject`

- **Auth:** Bearer + `admin`
- **Request body:** `{ "reason": "Account details could not be verified" }`

#### Filters — `GET /finance/payouts`

| Param | Type | Notes |
|-------|------|-------|
| `status` | enum | `pending` \| `under_review` \| `approved` \| `rejected` \| `completed` |

#### Filters — `GET /finance/fraud-flags`

| Param | Type | Notes |
|-------|------|-------|
| `status` | enum | `open` \| `investigating` \| `resolved` \| `blocked` |
| `severity` | enum | `low` \| `medium` \| `high` \| `critical` |

---

## Donations

A simpler standalone donations resource (admin-only CRUD; webhooks/payment integration write here).

**Source:** [src/donations/donations.controller.ts](src/donations/donations.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/donations` | Bearer | Create a donation record |
| GET | `/donations` | Bearer | List donations |
| GET | `/donations/:id` | Bearer | Get donation |
| DELETE | `/donations/:id` | Bearer | Delete |

#### Filters — `GET /donations`

| Param | Type | Notes |
|-------|------|-------|
| `status` | enum | `pending` \| `completed` \| `failed` |
| `type` | enum | `one-time` \| `monthly` |
| `user_id` | UUID | Filter by donor |
| `page`, `limit`, `sortBy`, `order` | – | Standard pagination |

#### POST `/donations`

- **Auth:** Bearer
- **Request body (typical fields):**

  ```json
  {
    "user_id": "9f83…",
    "donor_name": "Ahmad Khalil",
    "donor_email": "ahmad@trace.ps",
    "amount": 25.00,
    "currency": "USD",
    "type": "one-time",
    "status": "completed",
    "payment_provider": "stripe",
    "provider_reference": "pi_3MQbq2GswQjK…",
    "message": "Keep up the great work!"
  }
  ```

---

## Files

Stored-file metadata (the actual binary lives in cloud storage; the database holds path + MIME + signed-URL helpers).

**Source:** [src/files/files.controller.ts](src/files/files.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/files` | Bearer | List files |
| GET | `/files/contribution/:contributionId` | Bearer | All files for a contribution |
| GET | `/files/:id` | Bearer | Get file metadata |
| GET | `/files/:id/url` | Bearer | Get a temporary signed URL for the file |
| POST | `/files` | Bearer | Create a file record |
| DELETE | `/files/:id` | Bearer | Delete |

#### GET `/files/:id/url`

- **Auth:** Bearer
- **Success — 200**

  ```json
  { "status": 200, "results": 1, "data": { "url": "https://storage.googleapis.com/…?signature=…" } }
  ```

  Signed URLs expire — request a fresh one each time you serve content.

#### Filters — `GET /files`

| Param | Type | Notes |
|-------|------|-------|
| `mime_type` | string | Exact MIME match |
| `contribution_id` | UUID | Filter by parent |
| `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination |

---

## Upload

Direct-upload endpoint that streams the file to cloud storage and returns a signed URL.

**Source:** [src/upload/upload.controller.ts](src/upload/upload.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | Bearer | Stream-upload a single file |

#### POST `/upload`

- **Auth:** Bearer
- **Content-Type:** `multipart/form-data`
- **Form fields:**

  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | `file` | file | Yes | One file per request |

- **Allowed MIME types** (see [src/common/constants/media-types.ts](src/common/constants/media-types.ts)):
  - **Images:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - **Audio:** `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/m4a`, `audio/aac`
  - **Video:** `video/mp4`, `video/webm`, `video/quicktime`, `video/x-matroska`

- **Max size:** `MAX_UPLOAD_SIZE` constant (see source). Files over the limit return **413 Payload Too Large**.

- **Success — 201**

  ```json
  {
    "status": 201,
    "results": 1,
    "data": {
      "path": "images/2026/04/26/abc-123.jpg",
      "url": "https://storage.googleapis.com/…?signature=…",
      "mimeType": "image/jpeg",
      "size": 482109
    }
  }
  ```

- **Errors:**
  - `400` — file missing or unsupported MIME.
  - `413` — file exceeds `MAX_UPLOAD_SIZE`.

---

## Partners

Sponsor / partner organizations displayed on the public site.

**Source:** [src/partners/partners.controller.ts](src/partners/partners.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/partners` | Public | List partners |
| GET | `/partners/:id` | Public | Get partner with linked donations |
| POST | `/partners` | Bearer + admin | Create partner |
| PATCH | `/partners/:id` | Bearer + admin | Update |
| DELETE | `/partners/:id` | Bearer + admin | Delete |

#### POST `/partners`

- **Auth:** Bearer + `admin`
- **Request body (typical fields):**

  ```json
  {
    "name": "Heritage Foundation",
    "logo_url": "https://…/heritage.png",
    "website": "https://heritage.example",
    "email": "contact@heritage.example",
    "phone": "+97225551212",
    "tier": "gold",
    "is_featured": true
  }
  ```

---

# Admin

The endpoints in this group power the admin Command Center UI. Every controller in this group is class-level guarded with `JwtAuthGuard + RolesGuard` plus role restrictions, so every endpoint in the tables below requires Bearer auth + the listed role(s).

## Admin Dashboard

A high-density "Command Center" surface that powers the admin home screen. Every endpoint requires `Bearer` (and is gated to staff roles via service-level checks).

**Source:** [src/dashboard/dashboard.controller.ts](src/dashboard/dashboard.controller.ts)

#### Endpoint inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Full dashboard in one call |
| GET | `/dashboard/stats` | Top-level KPI cards (`period`: `7d`/`30d`/`90d`/`1y`) |
| GET | `/dashboard/alerts` | Flagged content + pending reviews + editor apps |
| GET | `/dashboard/editor-applications` | Pending editor-role applications |
| POST | `/dashboard/applications/:id/approve` | Approve a role application |
| POST | `/dashboard/applications/:id/reject` | Reject a role application |
| GET | `/dashboard/content-overview` | Breakdown by category |
| GET | `/dashboard/users-by-role` | User counts per role |
| GET | `/dashboard/users` | User directory (filters: `role`, `status`, `search`) |
| GET | `/dashboard/content-library` | Browse contributions (filters: `type`, `status`, `search`) |
| GET | `/dashboard/finance/snapshot` | Donations / revenue / payouts / fees |
| GET | `/dashboard/finance/donations` | Donations list |
| GET | `/dashboard/recent-activity` | Recent platform activity |
| GET | `/dashboard/moderation/stats` | Moderation counts |
| GET | `/dashboard/moderation/reports` | Moderation reports |
| GET | `/dashboard/moderation/audit-log` | Audit trail |
| GET | `/dashboard/open-calls` | Open-calls overview |
| GET | `/dashboard/collections` | Collections overview |
| GET | `/dashboard/analytics/platform-growth` | User registration trends |
| GET | `/dashboard/analytics/content-performance` | Publishing & top-contributors trends |
| GET | `/dashboard/security-events` | Login / password / 2FA security events |

#### POST `/dashboard/applications/:id/approve` and `.../reject`

- **Auth:** Bearer (admin)
- **Body:** *(none)*
- **Effect:** Approval grants the requested role to the applicant; rejection removes the application record.

#### GET `/dashboard/security-events`

| Param | Type | Notes |
|-------|------|-------|
| `userId` | UUID | Filter to one user |
| `event_type` | enum | `login_success` \| `login_failed` \| `password_reset` \| `password_changed` \| `2fa_enabled` \| `2fa_disabled` \| `account_locked` |
| `from`, `to` | ISO date | Date range |
| `page`, `limit` | int | – |

---

## Analytics

Class-level `@Roles('admin')`. All endpoints require admin.

**Source:** [src/analytics/analytics.controller.ts](src/analytics/analytics.controller.ts)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/overview` | Platform overview, growth, trend charts (`period`) |
| GET | `/analytics/content-performance` | Top categories, top articles, type distribution (`period`) |
| GET | `/analytics/top-creators` | Top authors by views/contributions/earnings (`period`, `limit` default 10) |
| GET | `/analytics/conversion-funnel` | Visitor → editor funnel |
| GET | `/analytics/summary` | All entity counts in one call |

---

## Moderation

Logs of moderator actions on content (approvals, rejections, flags). Class-level `@Roles('admin', 'editor', 'moderator')`.

**Source:** [src/moderation/moderation.controller.ts](src/moderation/moderation.controller.ts)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/moderation` | Bearer + admin/editor/moderator | List logs |
| GET | `/moderation/:id` | Bearer + admin/editor/moderator | Get log |
| POST | `/moderation` | Bearer + admin/editor/moderator | Create log entry |
| DELETE | `/moderation/:id` | Bearer + admin | Delete log |

#### POST `/moderation`

- **Request body (typical fields):**

  ```json
  {
    "reviewer_id": "9f83…",
    "contribution_id": "ab1…",
    "action": "approved",
    "reason": "Content meets editorial standards"
  }
  ```

  `action`: `approved` \| `rejected` \| `flagged`.

#### Filters — `GET /moderation`

| Param | Type | Notes |
|-------|------|-------|
| `action` | enum | `approved` \| `rejected` \| `flagged` |
| `reviewer_id` | UUID | – |
| `contribution_id` | UUID | – |
| `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination |

---

## Audit Trails

Append-only log of all CRUD operations on tracked entities. Class-level `@Roles('admin')`.

**Source:** [src/audit-trails/audit-trails.controller.ts](src/audit-trails/audit-trails.controller.ts)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit-trails` | List entries |
| GET | `/audit-trails/:id` | Get entry |
| DELETE | `/audit-trails/:id` | Delete entry |

#### Filters

| Param | Type | Notes |
|-------|------|-------|
| `action` | enum | `CREATE` \| `UPDATE` \| `DELETE` |
| `entity_type` | string | e.g. `User`, `Article`, `Contribution` |
| `user_id` | UUID | The actor |
| `page`, `limit`, `search`, `sortBy`, `order` | – | Standard pagination |

#### Example entry

```json
{
  "id": "9f83…",
  "user_id": "ab1…",
  "action": "UPDATE",
  "entity_type": "Article",
  "entity_id": "cd2…",
  "changes": { "status": ["draft", "published"] },
  "timestamp": "2026-04-26T14:22:00Z"
}
```

---

## Logs

Activity log surface (separate from `audit-trails`; this is a more general operational log). Class-level `@Roles('admin')`.

**Source:** [src/logs/logs.controller.ts](src/logs/logs.controller.ts)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/logs` | List logs (filters mirror audit-trails) |
| GET | `/logs/:id` | Get log entry |
| DELETE | `/logs/:id` | Delete entry |

---

## Admin Engagements

Admin tools for moderating engagement (comments, discussions, badges).

**Source:** [src/engagements/engagements.controller.ts](src/engagements/engagements.controller.ts)

Class-level `@Roles('admin')`.

### Endpoint inventory

#### Stats

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/engagements/stats` | Engagement stats (comments, likes, discussions, badges) |

#### Comments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/engagements/comments` | List comments (filter `filter`: `all`/`flagged`) |
| PATCH | `/admin/engagements/comments/:id/flag` | Flag |
| PATCH | `/admin/engagements/comments/:id/unflag` | Unflag |
| DELETE | `/admin/engagements/comments/:id` | Delete (cascades replies) |

#### Discussions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/engagements/discussions` | Trending discussions |
| GET | `/admin/engagements/discussions/:id` | Get discussion + comments |
| PATCH | `/admin/engagements/discussions/:id/lock` | Lock (no new comments) |
| PATCH | `/admin/engagements/discussions/:id/unlock` | Unlock |

#### Badges

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/engagements/badges` | List badges with recipient counts |
| POST | `/admin/engagements/badges/create-and-award` | Create & optionally award to a role |
| POST | `/admin/engagements/badges/:badgeId/award` | Award an existing badge to a user |
| DELETE | `/admin/engagements/badges/:badgeId/users/:userId` | Revoke from user |
| GET | `/admin/engagements/badges/:badgeId/recipients` | List recipients |

#### POST `/admin/engagements/badges/create-and-award`

```json
{
  "name": "Founding Contributor",
  "icon": "https://…/badges/founding.svg",
  "role": "contributor",
  "reason": "First 100 contributors"
}
```

If `role` is provided, the badge is auto-awarded to all users with that role.

#### POST `/admin/engagements/badges/:badgeId/award`

```json
{
  "user_id": "9f83…",
  "username": "ahmad_writer",
  "description": "Outstanding service",
  "criteria": "Manually selected"
}
```

Provide either `user_id` **or** `username` to identify the recipient.

---

## System Settings

Admin configuration: categories, tags, badges, email templates, localisation, guidelines. Class-level `@Roles('admin')`.

**Source:** [src/system-settings/system-settings.controller.ts](src/system-settings/system-settings.controller.ts)

### Endpoint inventory

| Section | Endpoints |
|---------|-----------|
| Health | `GET /admin/system-settings/health` |
| Categories | `GET/POST/PATCH/DELETE /admin/system-settings/categories[/:id]` |
| Tags | `GET/POST/PATCH/DELETE /admin/system-settings/tags[/:id]` |
| Badges | `GET/POST/PATCH/DELETE /admin/system-settings/badges[/:id]` |
| Email Templates | `GET/POST/PATCH/DELETE /admin/system-settings/email-templates[/:id]` |
| Localisation | `GET/PATCH /admin/system-settings/localisation` |
| Guidelines | `GET/PATCH /admin/system-settings/guidelines` |

#### POST `/admin/system-settings/categories`

```json
{ "name": "Heritage", "slug": "heritage", "description": "Stories rooted in cultural heritage" }
```

`DELETE` rejects the request if the category still has linked items.

#### POST `/admin/system-settings/badges`

```json
{
  "name": "Active Reader",
  "description": "Read 50 articles",
  "icon": "https://…/badges/reader.svg",
  "criteria_type": "articles_read",
  "criteria_value": 50
}
```

#### POST `/admin/system-settings/email-templates`

```json
{
  "name": "Welcome Email",
  "category": "onboarding",
  "subject": "Welcome to Trace of the Tides",
  "body": "Hi {{full_name}}, …"
}
```

`GET /admin/system-settings/email-templates/:id` includes a list of available substitution variables for each template category.

#### PATCH `/admin/system-settings/localisation`

```json
{
  "default_language": "en",
  "timezone": "Asia/Hebron",
  "date_format": "YYYY-MM-DD",
  "enable_multi_language": true
}
```

#### PATCH `/admin/system-settings/guidelines`

```json
{
  "community_guidelines": "<h2>Community Guidelines</h2><p>…</p>",
  "content_policy": "<h2>Content Policy</h2><p>…</p>",
  "enable_multi_language_guidelines": true
}
```

---

# Part 3 — Appendices

## Appendix A — Roles

Source: [src/enums/role.enum.ts](src/enums/role.enum.ts)

| Role | Typical scope |
|------|---------------|
| `admin` | Full platform access; only role allowed to delete most resources, configure system settings, and manage finance |
| `editor` | Create/update articles, magazines, magazine-issues, open-calls; trip archive; moderation |
| `manager` | Create/update phases inside collectives |
| `moderator` | Create moderation log entries |
| `analyst` | (Reserved for read-only analytics access) |
| `support` | (Reserved for messaging / customer-support workflows) |
| `developer` | (Reserved for staff with developer-only views) |
| `author` | Authoring rights on articles & contributions |
| `contributor` | Submit contributions, comment, react |
| `artist` | Same baseline as `contributor` plus artwork-specific UI gates |
| `user` | Default role at signup. Read public content, comment, react, follow |
| `guest` | Unauthenticated request marker; not assigned in DB |

## Appendix B — Permissions

Source: [src/common/constants/permissions.ts](src/common/constants/permissions.ts)

Use these strings as the `permission` field in `POST /roles/permissions/:userId`.

| Permission | Purpose |
|------------|---------|
| `content.publish` | Override the publish gate (would otherwise require role) |
| `content.delete` | Hard-delete content |
| `content.feature` | Mark content as featured |
| `moderation.approve` | Approve flagged items |
| `moderation.reject` | Reject flagged items |
| `moderation.flag` | Flag items |
| `finance.view` | View finance dashboard |
| `finance.approve_payout` | Approve creator payouts |
| `users.manage` | Create / update users |
| `users.suspend` | Suspend a user account |
| `open_calls.manage` | Full CRUD on open calls |
| `analytics.view` | Access analytics endpoints |
| `messaging.broadcast` | Send platform-wide broadcasts |

## Appendix C — Common Status Enums

| Resource | Field | Values |
|----------|-------|--------|
| User | `status` | `active`, `pending`, `suspended`, `inactive` |
| Article | `status` | `draft`, `published`, `scheduled`, `archived`, `flagged` |
| Article | `content_type` | `article`, `video`, `audio`, `thread`, `artwork`, `figma`, `trip`, `open_call` |
| Article | `visibility` | `public`, `private`, `unlisted` |
| Article block | `block_type` | `paragraph`, `quote`, `image`, `gallery`, `callout`, `author_note`, `divider`, `video`, `audio`, `caption_text`, `meta_data`, `statistics` |
| Article contributor | `role` | `main_contributor`, `co-author`, `contributor`, `editor`, `reviewer` |
| Trip | `status` | `draft`, `published`, `ongoing`, `completed`, `cancelled` |
| Trip | `difficulty` | `easy`, `moderate`, `challenging` |
| Trip participant | `status` | `registered`, `waitlisted`, `approved`, `rejected`, `cancelled` |
| Open Call | `status` | `draft`, `open`, `scheduled`, `closed` |
| Open Call | `type` | `article`, `video`, `audio`, `slide` |
| Open Call participant | `status` | `active`, `approved`, `rejected`, `withdrawn` |
| Open Call participant | `role` | `participant`, `contributor`, `reviewer` |
| Contribution | `status` | `draft`, `pending`, `published`, `flagged` |
| Task | `status` | `pending`, `in_progress`, `completed`, `cancelled` |
| Task | `priority` | `low`, `medium`, `high` |
| Donation | `status` | `pending`, `completed`, `failed` |
| Donation | `type` | `one-time`, `monthly` |
| Payout | `status` | `pending`, `under_review`, `approved`, `rejected`, `completed` |
| Fraud flag | `status` | `open`, `investigating`, `resolved`, `blocked` |
| Fraud flag | `severity` | `low`, `medium`, `high`, `critical` |
| Invoice | `type` | `donation`, `payout`, `platform_fee` |
| Invoice | `status` | `draft`, `issued`, `paid`, `cancelled` |
| Conversation | `status` | `open`, `pending`, `resolved`, `archived` |
| Conversation | `category` | `payment`, `content`, `account`, `technical`, `general` |
| Conversation | `priority` | `low`, `normal`, `high`, `urgent` |
| Broadcast | `status` | `draft`, `sent`, `scheduled` |
| Newsletter subscriber | `status` | `pending`, `confirmed`, `unsubscribed` |
| Notification | `status` | `unread`, `read` |
| Reaction | `type` | `like`, `love`, `wow`, `sad`, `angry` |
| Audit / Log | `action` | `CREATE`, `UPDATE`, `DELETE` |
| Security event | `event_type` | `login_success`, `login_failed`, `password_reset`, `password_changed`, `2fa_enabled`, `2fa_disabled`, `account_locked` |
| CMS Page | `status` | `draft`, `published` |
| CMS Page | `page_type` | `homepage`, `static`, `custom` |

## Appendix D — Pagination Contract

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int ≥ 1 | `1` | 1-indexed page number |
| `limit` | int 1–100 | `10` (varies by endpoint) | Items per page |
| `search` | string | – | Free-text search over the resource's primary text fields |
| `sortBy` | string | `createdAt` | Field to sort by |
| `order` | `ASC` \| `DESC` | `DESC` | Sort direction |

Resource-specific filters (`status`, `type`, `category`, …) are documented per endpoint above.

### Response meta shape

```json
{
  "status": 200,
  "results": 10,
  "data": [ /* up to `limit` items */ ],
  "meta": {
    "total": 247,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
```

`results` is the count of items in **this page** (`data.length`), not the total. Use `meta.total` for the unfiltered total and `meta.totalPages` to drive UI paginators.

## Appendix E — DTO Index

For the canonical schemas of each request body, jump to the DTO source in the repo:

| Resource | DTOs |
|----------|------|
| Auth | [login.dto.ts](src/auth/dto/login.dto.ts), [signup.dto.ts](src/auth/dto/signup.dto.ts), [check-email.dto.ts](src/auth/dto/check-email.dto.ts), [forgot-password.dto.ts](src/auth/dto/forgot-password.dto.ts), [reset-password.dto.ts](src/auth/dto/reset-password.dto.ts), [change-password.dto.ts](src/auth/dto/change-password.dto.ts), [setup-2fa.dto.ts](src/auth/dto/setup-2fa.dto.ts) |
| Users | [create-user.dto.ts](src/users/dto/create-user.dto.ts), [update-user.dto.ts](src/users/dto/update-user.dto.ts), [user-profile.dto.ts](src/users/dto/user-profile.dto.ts) |
| Roles | [create-role.dto.ts](src/roles/dto/create-role.dto.ts), [update-role.dto.ts](src/roles/dto/update-role.dto.ts) |
| Follows | [toggle-follow.dto.ts](src/follows/dto/toggle-follow.dto.ts) |
| Articles | [article.dto.ts](src/articles/dto/article.dto.ts) |
| Trips | [trip.dto.ts](src/trips/dto/trip.dto.ts), [apply-trip.dto.ts](src/trips/dto/apply-trip.dto.ts) |
| Open Calls | [open-call.dto.ts](src/open%20call/dto/open-call.dto.ts), [join-open-call.dto.ts](src/open%20call/dto/join-open-call.dto.ts), [apply-open-call.dto.ts](src/open%20call/dto/apply-open-call.dto.ts) |
| Contributions | [create-contribution.dto.ts](src/contributions/dto/create-contribution.dto.ts), [update-contribution.dto.ts](src/contributions/dto/update-contribution.dto.ts), [contribution-type.dto.ts](src/contributions/dto/contribution-type.dto.ts) |
| Boards | [board.dto.ts](src/boards/dto/board.dto.ts) |
| Tasks | [task.dto.ts](src/tasks/dto/task.dto.ts) |
| Phases | [phase.dto.ts](src/phases/dto/phase.dto.ts) |
| Collectives | [join-collective.dto.ts](src/collectives/dto/join-collective.dto.ts) |
| CMS | [cms.dto.ts](src/cms/dto/cms.dto.ts) |

For resources whose request bodies pass through as `any` (Collections, Tags, Writers, Magazines, Magazine Issues, Book Club, Comments, Reactions, Discussions, Donations, References, Groups, Partners, People, Knowledge sub-resources, System Settings, Author Dashboard, Messaging), the canonical schema is the underlying Sequelize model file — see `src/<resource>/models/*.ts`. Swagger UI (`/api/docs`) renders these against the live schema.

---

## Document End

For corrections, gaps, or new endpoints added since this snapshot, prefer:

1. The live Swagger UI at `/api/docs` for any endpoint added to a controller.
2. Source-of-truth controllers under `src/<resource>/<resource>.controller.ts`.
3. This document, regenerated from a known commit (top of file: "Document Status").

