# AGENTS.md

Instructions for AI agents working in `proxies-service`.

## Architecture & Layout

- **Pattern**: Clean Architecture using native Node.js ESM (`"type": "module"`).
  - `src/domain/`: Core entities and repository/event bus interfaces (dependency-free).
  - `src/application/`: Application business logic, use cases (`src/application/use-cases/proxies/`), application errors (`src/application/errors/`, e.g. `ProxyAlreadyExistsError`), and DTO interfaces.
  - `src/adapters/`: Interface adapters (`ProxiesController`, `auth.middleware.ts`, `validation.middleware.ts`, Zod schemas in `proxies.validator.ts`, `NodeProxyEventBus`).
  - `src/config/`: Application configuration, logger (`logger.ts`), database initialization (`database.ts`), and MongoDB client (`mongodb.ts`).
  - `src/infrastructure/`: Frameworks, drivers, and external adapters:
    - `database/`: Repository factory (`proxy-repository.factory.ts`), LowDB repository implementation (`LowDbProxyRepository`), and MongoDB repository implementation (`MongoDbProxyRepository`).
    - `http/`: Express setup (`server.ts`), router composition root (`router.ts`), and route handlers (`routers/`).
    - `events/`: Global EventEmitter instance (`ProxiesEmitter`).
    - `process/`: Graceful process termination and connection cleanup (`graceful-shutdown.ts`).
  - `src/docs/`: OpenAPI / Swagger specification (`swagger.json`).
- **Persistence**: Configurable via `DATABASE_DRIVER` environment variable:
  - `lowdb` (default): File-based via `lowdb` writing to `config.json` at root directory (gitignored). Initialized in `src/config/database.ts`.
  - `mongodb`: Document-based via official `mongodb` driver. Configured with `MONGODB_URI` and `MONGODB_DATABASE`. Initialized in `src/config/mongodb.ts`.
- **Proxy Routing**: Express dynamically dispatches `/:namespace` routes to targets via `express-http-proxy` after static and management routes (`/`, `/docs`, `/metrics`, `/proxies`). Unmatched namespaces return 404.

## Critical Quirks

- **Authentication**: Auth middleware checks query parameter `?token=<TOKEN>` (`request.query.token`), **not** an `Authorization` header.
- **TOKEN Requirement**: When `ENABLE_PROXIES_CRUD='true'` (default), the `TOKEN` environment variable is strictly required on startup. Missing it causes the application to crash on boot.
- **Validation Rules**: Proxy namespaces must be at least 1 character long and match `/^[a-zA-Z0-9_-]+$/`. Targets must be valid URLs.
- **Import Extensions & Path Aliases**: TypeScript ESM imports require `.js` extensions (e.g. `import ... from '@/adapters/middlewares/auth.middleware.js'`). Use the `@/*` alias for cross-layer/distant imports, keeping relative paths (`./...`) only for nearby/sibling files.
- **Dependencies**: All packages added to `package.json` must have their versions pinned to an exact version (e.g., `"zod": "4.6.5"` instead of `^4.6.5` or `~4.6.5`).
- **Feature Flags**:
  - `ENABLE_PROXIES_CRUD`: Defaults to `'true'`. Toggles `/proxies` endpoints.
  - `ENABLE_METRICS_ROUTER`: Defaults to `'false'`. Toggles `/metrics` endpoint.
  - `ENABLE_SWAGGER`: Defaults to `'true'`. Toggles `/docs` endpoint.

## Developer Commands

```sh
# Development server with live reload and formatted logs
npm run start:dev

# Build (tsdown bundles to dist/index.mjs)
npm run build

# Typecheck (no package.json script exists)
npx tsc --noEmit

# Lint & autofix
npm run lint
npm run lint:fix

# Run all tests
npm test

# Run a single test file (unit test or integration test)
npm test -- src/adapters/controllers/proxies.controller.spec.ts
npm test -- test/healthcheck.spec.js

# Run tests matching a pattern/name
npm test -- -t "should proxy to the api"

# Coverage
npm run test:cov

# Standard verification pipeline
npm run lint && npx tsc --noEmit && npm test && npm run build
```

## Testing Quirks

- **Vitest**: Tests run via Vitest natively with ESM support.
- **Test Specs**:
  - **Unit Tests**: Reside collocated with source code in `src/**/*.spec.ts` using TypeScript.
  - **Integration / E2E Tests**: Reside in `test/*.spec.js` using ESM and Supertest.
- **Server/DB Isolation**: Integration tests import `server.ts` and `database.ts` dynamically with cache-busting queries (`?time=${Date.now()}`) via `test/helpers/load-server.js` and `test/helpers/load-db.js`.
- **HTTP Mocking**: External proxy target responses in tests are intercepted using `nock`.

## Git & Workflow

- **Branching**: Default working branch is `develop`. PRs merge from `develop` into `main`.
- **Commits**: Conventional Commits strictly enforced by Husky + Commitlint (`commitlint.config.js`). Never commit without explicit user permission.
