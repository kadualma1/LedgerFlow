# LedgerFlow

**A multi-tenant financial management system built with a focus on domain modeling, data integrity, and maintainable backend architecture.**

> **Status: Backend foundation · Work in progress**  
> LedgerFlow is an actively developed portfolio project. It is not yet a production-ready financial platform.

## Overview

LedgerFlow explores the engineering challenges behind business financial software: representing organizations and users, managing organization memberships, preserving business invariants, and safely persisting state in a relational database.

Rather than starting with a UI, the project is being built from the domain outward: **domain entities → persistence → application services → API → frontend**.

### Currently implemented

- `Organization` domain entity with lifecycle operations and base-currency validation
- `User` domain entity with email normalization, account lifecycle, and verification state
- `Membership` domain entity with organization/user identifiers, roles (`ADMIN`, `OPERATOR`, `VIEWER`), and status transitions
- PostgreSQL persistence for organizations and users using Drizzle ORM
- Case-insensitive email lookup and database-enforced email uniqueness
- Vitest integration tests covering repository behavior and persistence round trips

**Not implemented yet:** membership persistence and foreign keys, authentication/authorization, accounting entries, financial transactions, application API, frontend, and automated database migrations.

## Technology stack

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js (ES modules) |
| Database | PostgreSQL |
| Query builder / ORM | Drizzle ORM |
| Database driver | `pg` |
| Testing | Vitest |
| Development tooling | `tsx`, TypeScript |

React is planned for the frontend but is **not part of the current implementation**.

## Architecture

The current codebase separates domain logic from infrastructure:

```text
src/
├── domain/
│   └── entities/
│       ├── Organization.ts
│       ├── User.ts
│       └── Membership.ts
└── infrastructure/
    ├── database/
    │   ├── pool.ts
    │   ├── db.ts
    │   └── schema.ts
    └── repositories/
        ├── OrganizationRepo.ts
        └── UserRepo.ts

tests/
└── integration/
    ├── OrganizationRepo.test.ts
    └── UserRepo.test.ts
```

Domain entities encapsulate business state and expose meaningful operations (`rename`, `deactivate`, `changeRole`, etc.). Their `create()` and `restore()` factories support new instances and reconstruction from stored records. Repositories translate between these entities and PostgreSQL through Drizzle.

See [Architecture & design decisions](docs/ARCHITECTURE.md) for current trade-offs and limitations.

## Local development

### Prerequisites

- Node.js and npm (a recent supported Node.js release)
- PostgreSQL

### Setup

```bash
 git clone https://github.com/kadualma1/LedgerFlow.git
 cd LedgerFlow
 npm ci
```

Copy `.env.example` to `.env` and configure your local PostgreSQL credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=ledgerflow_dev
DB_USER=ledgerflow_app
DB_PASSWORD=replace_with_local_password
```

**Database setup limitation:** The database schema is currently managed outside versioned migrations. You must provision the matching PostgreSQL tables, constraints, and unique index before running database-backed code. A reproducible migration workflow is a current priority; the repository is **not yet one-command setup**.

### Commands

```bash
npm run typecheck
npm run build
npm run test:integration
```

Integration tests require a **separate** database named `ledgerflow_test` and a local `.env.test` file with its connection settings. Never configure `.env.test` to point at your development or production database. Integration tests insert and remove test data.

> There is no HTTP server or frontend entry point yet. This repository currently demonstrates the domain and persistence layers.

## Engineering decisions

- **Explicit domain operations:** business state is modified through methods rather than exposed as public mutable fields.
- **Defensive date handling:** entities copy mutable `Date` values at their boundaries.
- **Persistence isolation:** Drizzle lives in infrastructure, not in domain entities.
- **Database constraints:** email uniqueness is enforced by PostgreSQL, not only by application-level checks.
- **No physical deletion in normal organization workflows:** lifecycle transitions preserve records for future audit requirements.

This is a learning and portfolio project with deliberate, documented limitations; see [Architecture & design decisions](docs/ARCHITECTURE.md).

## Roadmap

- [x] Organization and user domain entities
- [x] Organization and user repositories
- [x] PostgreSQL integration tests
- [x] Membership domain entity
- [ ] Versioned Drizzle migrations and reproducible database setup
- [ ] Membership persistence, foreign keys, and uniqueness constraints
- [ ] Transactional membership administration and last-admin protection
- [ ] Application services and access control
- [ ] HTTP API and authentication
- [ ] Financial transactions and accounting invariants
- [ ] React frontend and end-to-end flows
- [ ] Automated integration tests in CI

## Project goals

LedgerFlow is designed to demonstrate practical backend engineering skills: **relational data modeling, domain invariants, persistence boundaries, automated testing, transaction safety, and iterative delivery**.

## Author

Developed by [kadualma1](https://github.com/kadualma1) as a software engineering portfolio project.
