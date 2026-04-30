# forge/templates/integration

Stack-agnostic integration test environment: a generic API + Postgres + Redis topology.
Copy into `clients/client-[slug]/integration/` and adapt for the client's actual services.

## Structure

```
integration/
├── docker-compose.yml          Base environment (API + Postgres + Redis)
├── docker-compose.ci.yml       CI override (restart: no, clean teardown)
├── .env.example                Credential defaults — copy to .env for local dev
├── vitest.config.ts            Test timeouts (generous for cold Docker starts)
├── package.json                Test runner (Vitest)
├── tsconfig.json
├── tests/
│   └── api.test.ts             Health check + CRUD integration tests
└── api/
    ├── Dockerfile
    ├── package.json
    └── server.js               Demo stub — replace with client's actual service
```

## Running locally

```bash
# 1. Start services and wait for all health checks to pass
docker compose up -d --wait

# 2. Install test dependencies (first time only)
npm install

# 3. Run tests
npm test

# 4. Stop and clean up
docker compose down
```

To persist data between runs, named volumes (`postgres_data`, `redis_data`) are used.
Run `docker compose down -v` to remove volumes and start fresh.

## Running in CI

```bash
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait
npm test
docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v
```

The CI override sets `restart: "no"` on all services to prevent restart loops
from inflating CI minutes. Named volumes are removed by `down -v` on teardown.

## Adapting for a real client

### Replace the API stub

The `api/` directory contains a minimal Express stub for template validation.
For a real engagement, either:

- **Point at the client's deployed staging environment** — set `API_URL` env var
  in the test workflow and remove the `api` service from `docker-compose.yml`
- **Replace the stub** — swap `api/server.js` with a targeted stub of the client's
  actual API surface (auth endpoints, key business flows, etc.)

### Switching from Postgres to MySQL

1. Replace the `db` service image: `mysql:8.0`
2. Update the healthcheck: `mysqladmin ping -h localhost -u$$MYSQL_USER -p$$MYSQL_PASSWORD`
3. Update the connection string format in `api/server.js` and use a MySQL client
   (`mysql2` instead of `pg`)
4. Update `DATABASE_URL` format: `mysql://user:password@db:3306/dbname`

### Removing Redis

If the client has no cache layer, remove the `redis` service and `redis_data` volume
from `docker-compose.yml`, remove the Redis dependency from `api/server.js`,
and remove `REDIS_URL` from environment config.

### Removing the API stub entirely

If tests run against the client's own deployed environment (not a local Docker stack),
remove the `api` service from `docker-compose.yml` and set `API_URL` to the target
environment URL in the workflow's `env:` block.

## Credentials

Default credentials in `docker-compose.yml` are for local dev only:

| Variable | Default |
|---|---|
| `POSTGRES_DB` | `appdb` |
| `POSTGRES_USER` | `appuser` |
| `POSTGRES_PASSWORD` | `apppassword` |

For real clients: copy `.env.example` to `.env`, fill in real values, and add `.env`
to `.gitignore`. Never commit credentials.
