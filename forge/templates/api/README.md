# API Testing Template

Two tools, two purposes:

- **Bruno** — interactive API exploration. Open the collection in Bruno desktop, switch environments, fire requests, inspect responses. Use this when first mapping out a client API or reproducing a reported issue.
- **Vitest** — automated API contract tests. Runs in CI on every push. Use this to lock in the API contract and catch regressions.

---

## Bruno Collection

The collection is at `bruno/`. Open the `bruno/` folder in the [Bruno desktop app](https://www.usebruno.com/) to get started.

### Environments

| Environment | When to use |
|---|---|
| `local` | API running on your machine |
| `staging` | Client's staging environment |
| `production` | Read-only exploration only — never write requests against production |

Set secret values (`authToken`) in Bruno's environment secrets panel — they are excluded from the collection files via `vars:secret`.

### Included requests

- `GET /health` — confirms API is reachable
- `GET /items` — lists resources (authenticated)
- `POST /items` — creates a resource (authenticated)

Replace these with the client's actual endpoints. Keep the pattern: one `.bru` file per request, grouped in folders by resource.

---

## Vitest API Tests

Tests are at `tests/api.spec.ts`. They run against a live API specified by `API_BASE_URL`.

### Auth patterns

**Bearer token** (default in template):
```typescript
headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
```

**API key (header)**:
```typescript
headers: { 'X-Api-Key': process.env.API_KEY || '' }
```

**Basic auth**:
```typescript
const encoded = Buffer.from(`${user}:${password}`).toString('base64');
headers: { Authorization: `Basic ${encoded}` }
```

### Running locally

```bash
cd clients/client-[slug]/api
npm install

# Against a local API
API_BASE_URL=http://localhost:3000 npm test

# Against staging (with auth)
API_BASE_URL=https://staging.client.com API_AUTH_TOKEN=your-token npm test
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://localhost:3000` | Base URL of the API under test |
| `API_AUTH_TOKEN` | *(empty)* | Bearer token — auth tests skipped if not set |

---

## CI

The `api.yml` workflow runs `npm test` against `API_BASE_URL_[SLUG]` and `API_AUTH_TOKEN_[SLUG]` secrets. The auth test is skipped if `API_AUTH_TOKEN` is empty, so the workflow works for unauthenticated APIs without modification.
