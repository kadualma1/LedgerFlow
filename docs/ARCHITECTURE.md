# Architecture & design decisions

This document describes the implementation **as it exists today**. Planned components are identified explicitly.

## Layers

### Domain (`src/domain/entities`)

- `Organization`: identity, name, base currency, lifecycle, and timestamps.
- `User`: identity, normalized email, verification timestamp, account lifecycle.
- `Membership`: association identifiers, role, lifecycle, and timestamps. This entity currently exists in the domain only.

Entities expose `create()` and `restore()` factories, `toState()` serialization, and named business operations. They do not import Drizzle or the PostgreSQL driver.

### Infrastructure (`src/infrastructure`)

- `database/schema.ts`: Drizzle definitions for organizations and users.
- `database/pool.ts` / `database/db.ts`: PostgreSQL driver and Drizzle setup.
- `repositories/`: persistence operations for organizations and users.

Current repository methods include inserts, updates, ID lookups, and case-insensitive user email lookup.

## Business boundaries

An organization can contain multiple memberships, and a user can belong to multiple organizations. Membership persistence and foreign-key constraints are still planned. Roles are `ADMIN`, `OPERATOR`, and `VIEWER`.

## Known limitations (tracked for future implementation)

1. **No versioned migrations:** manually provisioned SQL constraints and indexes are not yet fully represented by Drizzle migrations.
2. **Missing authorization boundary:** repository methods are internal; they do not enforce access rights by themselves. Do not expose them directly as public API handlers.
3. **Currency invariants require transactions:** preventing base-currency changes after financial activity requires an authoritative database check within a transaction.
4. **Concurrent writes:** whole-entity updates can overwrite stale state. Introduce optimistic concurrency or more granular update commands before multi-user use.
5. **Email verification:** domain transitions exist, but secure verification tokens and message delivery are not implemented.
6. **Administrative membership invariants:** checking and preserving at least one active organization administrator requires a transactional service.
7. **Not production ready:** no deployed API, authentication, authorization, accounting subsystem, or user interface yet.

## Testing approach

Vitest integration tests exercise repository operations against a dedicated `ledgerflow_test` PostgreSQL database. The test configuration and suites guard against accidentally using the development database. Tests clean up the records they create. Automated CI integration testing awaits migration-based database setup.

## Development direction

Domain modeling → database migrations → membership persistence → application services → API/authentication → financial domain → React frontend.
