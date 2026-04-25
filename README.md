# Trace of the Tides — Backend API

A NestJS-powered backend for the **Heritage Storytelling Platform**, a community-driven digital archive dedicated to preserving Palestinian history, culture, and lived experiences.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

This API serves as the backbone for **Trace of the Tides**, enabling community members to contribute stories, documents, and memories through open calls, discover curated collections of historical content, participate in collaborative trips, manage magazines and book clubs, and engage in discussions around Palestinian heritage. The platform supports content moderation, TOTP-based 2FA, fine-grained role/permission management, real-time notifications via WebSockets, scheduled jobs, and full audit logging.

**Base URL (local):** `http://localhost:3001`

**Interactive API Explorer (Swagger UI):** `http://localhost:3001/api/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Node.js / TypeScript) |
| Database | PostgreSQL with Sequelize ORM (`sequelize-typescript`) |
| Authentication | JWT Bearer — 1h access token, 30d refresh token, TOTP 2FA (`otplib`) |
| Authorization | Role-based (`@Roles`) + fine-grained permission overrides (`@RequirePermission`) |
| File Storage | Google Cloud Storage (GCS) via `@google-cloud/storage` |
| Caching / Rate-limiting | Redis (`ioredis`) — refresh-token store, cooldown service, throttler |
| Real-time | WebSockets via `socket.io` / `@nestjs/websockets` |
| Email | Nodemailer (SMTP) |
| Scheduled Jobs | `@nestjs/schedule` (cron tasks) |
| Security | Helmet, global throttler (20 req/60 s per IP) |
| Validation | `class-validator` + `class-transformer` (global pipe, `whitelist: true`) |
| API Docs | `@nestjs/swagger` + Swagger UI at `/api/docs` |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- Docker & Docker Compose (for pgAdmin)
- A running PostgreSQL instance (local or remote)
- A Redis instance (local or remote)

### Installation

```bash
npm install
```

### Start pgAdmin (optional)

```bash
docker-compose up -d
```

pgAdmin will be available at `http://localhost:8080` (default credentials: `admin@admin.com` / `admin1234`).

> **Note:** The Compose file does not spin up a PostgreSQL container. Point `DATABASE_URL` at your own instance.

### Running the Application

```bash
# development (watch mode)
npm run start:dev

# debug mode
npm run start:debug

# production
npm run start:prod
```

The server starts on **port 3001** by default.

---

## Environment Variables

Create a `.env` file in the project root. All required variables are listed below.

```env
# ── Database ────────────────────────────────────────────────
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# ── JWT ─────────────────────────────────────────────────────
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_refresh_jwt_secret
JWT_REFRESH_EXPIRES_IN=30d

# ── Redis ───────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password   # if required

# ── Google Cloud Storage ────────────────────────────────────
GCS_BUCKET_NAME=your-gcs-bucket
GCS_PROJECT_ID=your-gcp-project-id
# Path to service account key file, or use ADC (recommended for Cloud Run)
GCS_KEY_FILE=./service-account.json

# ── Email (SMTP) ─────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM="Trace of the Tides <no-reply@example.com>"

# ── App ──────────────────────────────────────────────────────
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## API Documentation

### Interactive Explorer

The full, live API reference — try every endpoint, inspect schemas, and authorize with a JWT — is available at:

```
GET /api/docs
```

### Comprehensive Reference

A developer-friendly Markdown reference (auth flows, request/response examples, error shapes, all 44 resources) lives at:

```
docs/api/API_REFERENCE.md
```

### Quick Reference

#### Authentication flow

```
POST /auth/signup            Register a new account
POST /auth/login             Login → { accessToken, refreshToken }
                             or → { requires_2fa: true, temp_token }  (if 2FA enabled)
POST /auth/2fa/validate      Submit TOTP code to complete 2FA login
POST /auth/refresh-token     Rotate access token using refresh token
POST /auth/logout            Revoke refresh token
GET  /auth/me                Current authenticated user + roles
```

#### Key resource groups

| Group | Base Path | Notes |
|---|---|---|
| Users | `/users` | Profile, avatar, follow system |
| Roles & Permissions | `/roles` | Assign roles, per-user permission overrides |
| Articles | `/articles` | Block-based content, contributors, scheduling |
| Collections | `/collections` | Curated sets of content |
| Open Calls | `/open calls` | Community submission drives with file uploads |
| Contributions | `/contributions` | Guest-friendly submissions (JWT optional) |
| Trips | `/trips` | Itineraries with registration, waitlist, applications |
| Collectives | `/collectives` | Groups / phases / people |
| Magazines | `/magazine`, `/magazine-issue` | Issues, book clubs, newsletter subscribers |
| Discussions & Comments | `/discussions`, `/comments` | Threaded replies, reactions |
| Boards | `/boards` | Whiteboard templates, pages, elements, connectors |
| Knowledge | `/knowledge` | Books, articles, adventures, locations |
| CMS | `/cms` | Pages, sections, site settings |
| Messaging | `/messaging` | Conversations, broadcasts, templates |
| Finance | `/finance`, `/donations` | Payouts, fraud flags, invoices, exports |
| Files & Uploads | `/files`, `/upload` | GCS-backed signed URLs, upload quotas |
| Admin | `/dashboard`, `/analytics`, `/moderation`, `/audit-trails`, `/logs` | |
| Tasks | `/tasks` | Task management |
| Partners | `/partners` | Partner management |

All response bodies follow the standard envelope:

```json
{
  "status": 200,
  "results": 1,
  "data": { }
}
```

All errors follow:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/auth/login"
}
```

---

## Project Structure

```
src/
├── auth/                  # JWT auth, 2FA (TOTP), refresh tokens, email verification
├── users/                 # User profiles, avatar, account settings
├── roles/                 # Role assignment, fine-grained permission overrides
├── follows/               # Follow / unfollow between users
│
├── articles/              # Block-based articles, contributors, scheduling
├── collections/           # Curated content collections
├── tags/                  # Tagging system
├── writer-profile/        # Writer public profiles
│
├── magazine/              # Magazine management
├── magazine-issue/        # Magazine issues and pledges
├── book-club/             # Book club features
├── newsletter-subscriber/ # Newsletter subscription
│
├── open call/             # Community open calls with file uploads
├── contributions/         # User and guest contributions
├── issue-pledge/          # Pledges on magazine issues
│
├── trips/                 # Trip itineraries, registration, waitlist
│
├── collectives/           # Collectives and group management
├── phases/                # Collective phases
├── groups/                # Sub-groups
├── person/                # Biographical profiles and timelines
├── references/            # Source references
│
├── comments/              # Comment and reply system
├── reactions/             # Reactions (emoji-based)
├── discussions/           # Discussion threads
├── notifications/         # User notification system (WebSocket + DB)
│
├── boards/                # Whiteboard templates, pages, elements
│
├── knowledge/             # Books, articles, adventures, locations
│
├── cms/                   # CMS pages and sections
├── system-settings/       # Global site settings
│
├── author-dashboard/      # Author analytics and settings
├── tasks/                 # Task management
│
├── messaging/             # Conversations, broadcasts, templates
│
├── finance/               # Finance summary, payouts, invoices, exports
├── donations/             # Donation tracking
│
├── files/                 # File records (GCS-backed)
├── upload/                # Upload endpoint with quota guard
├── storage/               # StorageService (GCS)
│
├── dashboard/             # Admin dashboard stats
├── analytics/             # Analytics snapshots and reports
├── moderation/            # Content moderation queue and actions
├── audit-trails/          # Audit trail entries
├── logs/                  # System activity logs
├── engagements/           # Admin engagement tracking
│
├── partners/              # Partner organisations
│
├── common/                # Shared guards, interceptors, filters, decorators, pipes
│   ├── constants/         # Permissions enum
│   ├── filters/           # AllExceptionsFilter
│   ├── guards/            # ThrottlerGuard, UploadQuotaGuard, PermissionsGuard
│   └── interceptors/      # ResponseInterceptor
├── enums/                 # Shared enums (Role, etc.)
├── email/                 # Email service (Nodemailer)
├── database/              # DB bootstrap / sync service
├── seeders/               # Database seed scripts
│
├── app.module.ts          # Root module — wires all 44 feature modules
└── main.ts                # Bootstrap: global pipes, Swagger, Helmet, CORS, port 3001
```

---

## Testing

```bash
# unit tests
npm run test

# unit tests in watch mode
npm run test:watch

# e2e tests
npm run test:e2e

# coverage report
npm run test:cov
```

---

## Deployment

The repository includes deployment configurations for multiple targets:

| File | Target |
|---|---|
| `Dockerfile` | Generic Docker container |
| `docker-compose.yml` | Local pgAdmin |
| `cloudbuild.yaml` | Google Cloud Build |
| `render.yaml` | Render.com |
| `DEPLOYMENT.md` | Step-by-step deployment guide |

```bash
# build
npm run build

# start production server
npm run start:prod
```

---

## License

This project is part of the Trace of the Tides initiative for Palestinian cultural preservation.
