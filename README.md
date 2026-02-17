# Trace of the Tides — Backend API

A NestJS-powered backend for the **Heritage Storytelling Platform**, a community-driven digital archive dedicated to preserving Palestinian history, culture, and lived experiences.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Roles](#roles)
  - [Contributions](#contributions)
  - [Files](#files)
  - [Collections](#collections)
  - [Open Calls](#open-calls)
  - [Discussions & Comments](#discussions--comments)
  - [Reactions](#reactions)
  - [People (Biographical & Timeline)](#people-biographical--timeline)
  - [Tags & References](#tags--references)
  - [Notifications](#notifications)
  - [Moderation](#moderation)
  - [Partners & Donations](#partners--donations)
  - [Logs & Audits](#logs--audits)
  - [Search](#search)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

This API serves as the backbone for **Trace of the Tides**, enabling community members to contribute stories, documents, and memories through open calls, discover curated collections of historical content, and participate in discussions around Palestinian heritage. The platform supports content moderation, biographical timelines, tagging systems, partner/donation management, and full audit logging.

**Base URL:** `http://localhost:4000/api`

---

## Tech Stack

- **Framework:** NestJS (Node.js / TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based
- **File Storage:** Multipart upload support (Supabase Storage / AWS S3)

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker & Docker Compose (for PostgreSQL and pgAdmin)

### Installation

```bash
$ npm install
```

### Start the Database

```bash
$ docker-compose up -d
```

This spins up PostgreSQL and pgAdmin. pgAdmin will be accessible for database management.

### Running the Application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## Environment Variables

Create a `.env` file in the project root based on this example:

```env
# Database Credentials (Match the 'db' service in Compose)
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB= your_database 

# The connection string for your app container
# format: postgresql://[USER]:[PASSWORD]@[CONTAINER_NAME]:[PORT]/[DB_NAME]
DATABASE_URL=postgresql://admin:your_password@postgres_db:5432/TTT

# pgAdmin Credentials
PGADMIN_DEFAULT_EMAIL=your_email@example.com
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password

# App Secrets
JWT_SECRET=your_jwt_secret
```

---

## API Reference

### Authentication

| Method | Endpoint         | Description                    | Auth |
|--------|------------------|--------------------------------|------|
| POST   | `/auth/register` | Register a new user            | No   |
| POST   | `/auth/login`    | Login and receive a JWT token  | No   |

**Register body:** `full_name` (required), `email` (required), `password` (required), `phone_number` (optional)

**Login body:** `email` (required), `password` (required)

---

### Users

| Method | Endpoint             | Description                 | Auth  |
|--------|----------------------|-----------------------------|-------|
| GET    | `/users`             | Get all users               | Admin |
| POST   | `/users`             | Create a new user           | Admin |
| GET    | `/users/:id`         | Get user profile by ID      | Yes   |
| GET    | `/users/:id/profile` | Get detailed user profile   | Yes   |

---

### Roles

| Method | Endpoint | Description           | Auth  |
|--------|----------|-----------------------|-------|
| GET    | `/roles` | List all roles        | Yes   |
| POST   | `/roles` | Create a new role     | Admin |

---

### Contributions

| Method | Endpoint                    | Description                        | Auth  |
|--------|-----------------------------|------------------------------------|-------|
| GET    | `/contributions`            | Get all contributions              | Yes   |
| POST   | `/contributions`            | Submit a contribution              | Yes   |
| GET    | `/contributions/:id`        | Get a specific contribution        | Yes   |
| PATCH  | `/contributions/:id`        | Update contribution details        | Yes   |
| DELETE | `/contributions/:id`        | Delete a contribution              | Yes   |
| PATCH  | `/contributions/:id/status` | Update contribution status         | Admin |

**Create body:** `title` (required), `description` (required), `type_id` (required), `user_id` (required), `collection_id` (optional)

---

### Files

| Method | Endpoint | Description                          | Auth |
|--------|----------|--------------------------------------|------|
| POST   | `/files` | Upload a file linked to contribution | Yes  |

Accepts `multipart/form-data` with `file` (required) and `contribution_id` (optional).

---

### Collections

| Method | Endpoint                          | Description                              | Auth  |
|--------|-----------------------------------|------------------------------------------|-------|
| GET    | `/collections`                    | Get all collections                      | Yes   |
| POST   | `/collections`                    | Create a new collection                  | Admin |
| GET    | `/collections/:id/contributions`  | List contributions under a collection    | Yes   |

---

### Open Calls

| Method | Endpoint                          | Description                              | Auth  |
|--------|-----------------------------------|------------------------------------------|-------|
| GET    | `/open-calls`                     | List all open calls                      | Yes   |
| POST   | `/open-calls`                     | Create a new open call                   | Admin |
| POST   | `/open-calls/:id/join`            | Join an open call                        | Yes   |
| POST   | `/open-calls/:id/contributions`   | Submit a contribution under an open call | Yes   |

---

### Discussions & Comments

| Method | Endpoint                        | Description                    | Auth |
|--------|---------------------------------|--------------------------------|------|
| GET    | `/discussions`                  | List all discussions           | Yes  |
| POST   | `/discussions`                  | Create a new discussion        | Yes  |
| GET    | `/discussions/:id/comments`     | Get comments for a discussion  | Yes  |
| POST   | `/discussions/:id/comments`     | Add a comment to a discussion  | Yes  |
| POST   | `/comments/:id/replies`         | Reply to a comment             | Yes  |

---

### Reactions

| Method | Endpoint     | Description                          | Auth |
|--------|--------------|--------------------------------------|------|
| GET    | `/reactions`  | List all reactions                   | Yes  |
| POST   | `/reactions`  | React to a comment (like, dislike, love) | Yes  |

---

### People (Biographical & Timeline)

| Method | Endpoint               | Description                            | Auth  |
|--------|------------------------|----------------------------------------|-------|
| GET    | `/people`              | List all person profiles               | Yes   |
| POST   | `/people`              | Create a new person profile            | Admin |
| GET    | `/people/:id/timeline` | Get life events/timeline for a person  | Yes   |

---

### Tags & References

| Method | Endpoint      | Description                               | Auth  |
|--------|---------------|-------------------------------------------|-------|
| GET    | `/tags`       | List all tags                             | Yes   |
| POST   | `/tags`       | Create a new tag                          | Admin |
| POST   | `/references` | Add a reference linked to a contribution  | Yes   |

---

### Notifications

| Method | Endpoint          | Description                | Auth |
|--------|-------------------|----------------------------|------|
| GET    | `/notifications`  | List user notifications    | Yes  |
| PATCH  | `/notifications`  | Mark notification as read  | Yes  |

---

### Moderation

| Method | Endpoint           | Description                            | Auth  |
|--------|--------------------|----------------------------------------|-------|
| GET    | `/moderation/logs` | Get moderation logs                    | Admin |
| POST   | `/moderation/logs` | Add moderation action for contribution | Admin |

---

### Partners & Donations

| Method | Endpoint     | Description              | Auth  |
|--------|--------------|--------------------------|-------|
| GET    | `/partners`  | List all partners        | Yes   |
| POST   | `/partners`  | Create a new partner     | Admin |
| GET    | `/donations` | List all donations       | Yes   |
| POST   | `/donations` | Record a new donation    | Yes   |

---

### Logs & Audits

| Method | Endpoint        | Description                    | Auth  |
|--------|-----------------|--------------------------------|-------|
| GET    | `/logs`         | Retrieve system activity logs  | Admin |
| GET    | `/audit-trails` | Retrieve audit trail entries   | Admin |

---

### Search

| Method | Endpoint  | Description                                         | Auth |
|--------|-----------|-----------------------------------------------------|------|
| GET    | `/search` | Search across collections, contributions, and people | Yes  |

**Query params:** `keyword` (search term), `type` (`collection`, `contribution`, `person`)

---

## Project Structure

```
src/
├── auth/              # Authentication module (register, login, JWT)
├── users/             # User management
├── roles/             # Role-based access control
├── contributions/     # Content contributions CRUD
├── files/             # File upload handling
├── collections/       # Curated content collections
├── open-calls/        # Community open calls
├── discussions/       # Discussion threads
├── comments/          # Comment & reply system
├── reactions/         # Reaction system (like, dislike, love)
├── people/            # Biographical profiles & timelines
├── tags/              # Tagging system
├── references/        # Contribution references
├── notifications/     # User notification system
├── moderation/        # Content moderation
├── partners/          # Partner management
├── donations/         # Donation tracking
├── logs/              # System activity logs
├── audit-trails/      # Audit trail entries
├── search/            # Cross-entity search
├── common/            # Shared guards, decorators, pipes
└── main.ts            # Application entry point
```

---

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

---

## Deployment

```bash
# build for production
$ npm run build

# start production server
$ npm run start:prod
```

---

## License

This project is part of the Trace of the Tides initiative for Palestinian cultural preservation.
