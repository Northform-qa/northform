# Integration Test Onboarding Runbook

How to onboard a client onto the Docker Compose integration test template — from blank workspace to a passing CI pipeline.

The template lives at `forge/templates/integration/`. This runbook covers when to use it, how to adapt it for the client's actual stack, and how to wire up CI.

---

## When to Use Integration Tests vs Playwright

**Use Playwright** when you need to test what users see and do in a browser: page loads, navigation, form submissions, UI states.

**Use integration tests** when you need to verify that services talk to each other correctly at the API level: database reads and writes, cache behaviour, service health, request validation. These tests hit real infrastructure rather than a browser.

**Use both** when a client has a backend API and a public-facing UI. Playwright covers the user-facing surface; integration tests cover the service layer underneath it.

**Do not use integration tests** for clients with no accessible API or backend service. If everything runs on a third-party SaaS stack (Webflow, Shopify, etc.), Playwright alone is sufficient.

---

## Step 1 — Copy the Template

The client workspace is created by the onboarding script, but the integration directory is not. Copy the template manually:

```bash
cp -r forge/templates/integration/ clients/client-[slug]/integration/
```

You should now have:

```
clients/client-[slug]/integration/
├── docker-compose.yml
├── docker-compose.ci.yml
├── .env.example
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
├── tests/
│   └── api.test.ts
└── api/
    ├── Dockerfile
    ├── server.js
    ├── package.json
    └── .dockerignore
```

---

## Step 2 — Decide How to Target the Client's API

There are two approaches, depending on whether the client has a publicly reachable staging environment.

### Option A — Stub approach (most common for new clients)

Adapt `api/server.js` to model the client's actual API surface. Keep the stub minimal — only implement the routes the tests need to exercise. The stub runs in Docker alongside the real database and cache, so it tests real data persistence even though the application code is simplified.

Use this when:
- The client's real app isn't reachable from CI
- You need control over the application layer to test specific behaviours
- The client stack isn't containerised yet

### Option B — Point at a real staging environment

Remove the `api` service from `docker-compose.yml` entirely. Set `API_URL` in the CI workflow to the client's staging environment URL. Keep the `db` and `redis` services if the tests need to seed or inspect database state; remove them if tests are purely HTTP-level.

Use this when:
- The client has a stable staging environment with a public URL
- You only need to verify API contract behaviour, not data persistence details

The template is built for Option A. Option B requires removing the `api` service from the compose files before anything else.

---

## Step 3 — Adapt the Docker Compose Stack

### Default stack

The template ships with three services: `api` (Node/Express stub), `db` (PostgreSQL 16), `redis` (Redis 7). Adapt each to match the client's actual stack.

### Swap PostgreSQL for MySQL

In `docker-compose.yml`, replace the `db` service:

```yaml
# Before (Postgres)
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: appdb
    POSTGRES_USER: appuser
    POSTGRES_PASSWORD: apppassword
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
    interval: 5s
    timeout: 5s
    retries: 12
  volumes:
    - postgres_data:/var/lib/postgresql/data
  networks:
    - integration-net
```

```yaml
# After (MySQL)
db:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: appdb
    MYSQL_USER: appuser
    MYSQL_PASSWORD: apppassword
    MYSQL_ROOT_PASSWORD: rootpassword
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uappuser", "-papppassword"]
    interval: 5s
    timeout: 5s
    retries: 12
  volumes:
    - mysql_data:/var/lib/mysql
  networks:
    - integration-net
```

Also update the `volumes` block at the bottom of the file:

```yaml
volumes:
  mysql_data:    # was postgres_data
  redis_data:
```

Update the `DATABASE_URL` in the `api` service environment to match:

```yaml
DATABASE_URL: mysql://appuser:apppassword@db:3306/appdb
```

### Remove Redis

If the client's stack has no cache layer, delete the `redis` service block from `docker-compose.yml` and `docker-compose.ci.yml`. Also:

- Remove `redis` from the `api` service `depends_on` block
- Remove `REDIS_URL` from the `api` service environment
- Delete the `redis_data` volume entry
- In `api/server.js`, remove the Redis client initialisation and any cache logic

### Remove the API stub (Option B only)

If pointing at a real staging environment, delete the entire `api` service block and the `api/` directory. Set `API_URL` in the CI workflow environment instead of relying on `docker compose` to expose it.

---

## Step 4 — Update Credentials and Environment Variables

Copy `.env.example` to `.env` and fill in real values for local development:

```bash
cp clients/client-[slug]/integration/.env.example clients/client-[slug]/integration/.env
```

Add `.env` to `.gitignore` if it isn't already there. Never commit real credentials.

The compose file uses default credentials (`appuser` / `apppassword`) that are safe for local dev and CI. For a client with a real staging database, pass credentials via GitHub secrets in the CI workflow (see Step 6).

---

## Step 5 — Write the Tests

The template ships with `tests/api.test.ts` as a starting point. Replace or extend the test cases to cover the client's actual API contract.

Keep tests focused on observable behaviour at the HTTP level:

- Health endpoint returns expected shape
- Core entities can be created and retrieved
- Invalid input returns appropriate error codes

Do not test internal implementation details (database schema, cache keys, log output). Test the contract, not the internals.

The `waitForHealth()` function in `api.test.ts` is a reusable guard — it retries the `/health` endpoint until it responds or times out. Keep it in place when adapting the tests; it prevents flaky failures on cold Docker starts.

---

## Step 6 — Wire Up CI

Copy the integration workflow template and configure it for the client:

```bash
cp forge/templates/workflows/integration.yml \
   .github/workflows/client-[slug]-integration.yml
```

Open the file and resolve every `# REPLACE:` marker:

| Marker | What to set |
|---|---|
| Workflow name | `"Client [Name] — Integration Tests"` |
| Push branch | Match the client's main branch (usually `main`) |
| PR branch | Same as push branch |
| Working directory | `clients/client-[slug]/integration` |
| Node.js version | Match the client's Node version if known; default `20` |
| `cache-dependency-path` | `clients/client-[slug]/integration/package-lock.json` |

If the client requires secrets (e.g. real database credentials, a staging API key), add them to the workflow's `env` block:

```yaml
- name: Run integration tests
  run: npm test
  env:
    API_URL: http://localhost:3000
    DATABASE_URL: ${{ secrets.CLIENT_SLUG_DATABASE_URL }}
```

Add the corresponding secrets to the GitHub repo under **Settings → Secrets and variables → Actions**.

---

## Step 7 — Run Locally and Validate

From the client's integration directory:

```bash
cd clients/client-[slug]/integration

# Install test dependencies
npm install

# Start all services (blocks until health checks pass)
docker compose up -d --wait

# Run tests
npm test

# Tear down
docker compose down -v
```

All tests must pass before committing. If a service doesn't start, check the health check configuration — the most common issue is a wrong connection string or a missing environment variable.

To see service logs during debugging:

```bash
docker compose logs api
docker compose logs db
docker compose logs redis
```

---

## Step 8 — Validate with the Health Check Script

Once the CI workflow file exists and tests pass locally, run the client health check:

```bash
npx ts-node forge/scripts/check-client.ts [slug]
```

This confirms the expected directory structure and files are in place. The health check script does not verify integration test files specifically (only Playwright), so a green result means the client workspace is structurally complete — integration tests are a separate concern that should be validated manually at this step.

---

## Common Issues

**`docker compose up --wait` never resolves**

The `--wait` flag waits for all healthchecks to pass. If it hangs, the healthcheck is failing. Check:
- The healthcheck command is correct for the database image (e.g. `pg_isready` vs `mysqladmin ping`)
- The connection credentials match between the healthcheck and the environment block
- The service image pulled successfully (`docker compose logs db`)

**Tests timeout in CI on first run**

First run pulls Docker images cold — this can take 60–90 seconds. The `hookTimeout` in `vitest.config.ts` is set to 120 seconds to account for this. If tests still timeout, increase `hookTimeout` or add a `docker compose pull` step before the `up` step to pre-pull images during checkout.

**`DATABASE_URL` connection refused**

The `api` service depends on `db` being healthy before it starts, but `depends_on: condition: service_healthy` only guarantees the healthcheck passed — it does not guarantee the database accepts connections on the first attempt from the application layer. The `waitForHealth()` loop in the tests guards against this at the test layer. If the API stub crashes on startup, add retry logic to the database connection in `api/server.js`.

**MySQL authentication plugin error**

MySQL 8.0 defaults to `caching_sha2_password`. Some Node.js MySQL clients require `mysql_native_password`. If you see auth errors, add to the MySQL service environment:

```yaml
MYSQL_ROOT_PASSWORD: rootpassword
command: --default-authentication-plugin=mysql_native_password
```
