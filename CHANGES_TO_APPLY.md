# Changes to apply locally

These files are a starter pack, not a modification of your remote GitHub repository.

1. Copy `README.md`, `.env.example`, `docs/ARCHITECTURE.md`, and `.github/workflows/quality.yml` to the corresponding paths in the LedgerFlow repository.
2. In the existing `package.json`, change `description` to:
   `A multi-tenant financial management platform built with TypeScript, Node.js, PostgreSQL, and Drizzle ORM.`
3. In `package.json` `scripts`, replace the placeholder `test` command and add:

```json
"typecheck": "tsc --noEmit",
"build": "tsc",
"test": "vitest run --config vitest.integration.config.ts",
"test:integration": "vitest run --config vitest.integration.config.ts"
```

   In the current repository, the only published test files are integration tests. This `test` alias deliberately executes those tests and therefore requires `.env.test` and PostgreSQL. It is NOT run by the initial CI workflow, which only type-checks and builds.
4. Keep `.env` and `.env.test` untracked. The existing `.gitignore` ignores both, and explicitly allows `.env.example`.
5. Validate locally: `npm run typecheck`, `npm run build`, and `npm run test:integration` (with ledgerflow_test configured).
6. In GitHub About settings, use the description from step 2, and topics:
   `typescript`, `nodejs`, `postgresql`, `drizzle-orm`, `vitest`, `backend`, `finance`, `domain-driven-design`.
7. `git add README.md .env.example docs/ARCHITECTURE.md .github/workflows/quality.yml package.json` then commit/push once local checks pass.

**Next phase:** define Drizzle migrations and a PostgreSQL CI service before enabling integration tests in GitHub Actions. Do not run `drizzle-kit push` against the existing populated development database without inspecting the diff and planning migration baselines.
