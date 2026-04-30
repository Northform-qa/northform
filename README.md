# Northform Forge

Internal platform for standing up and running test suites for client engagements.
Each client gets an isolated workspace with Playwright UI tests, integration tests, and a CI pipeline — ready to hand off.

---

## Before you start

You'll need:
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for integration tests)
- [Git](https://git-scm.com)

First-time setup after cloning:

```bash
npm install
```

---

## Onboarding a new client

Run the onboarding script and follow the prompts:

```bash
npx ts-node forge/scripts/onboard-client.ts
```

It will ask for:
- **Client slug** — a short lowercase identifier, e.g. `acme` or `acme-corp`
- **Base URL** — the URL of the environment under test, e.g. `https://staging.acme.com`

The script creates everything automatically:

```
clients/client-[slug]/
├── playwright/        UI test suite, ready to run
├── integration/       Docker Compose environment + integration tests
└── README.md          Client context and next-step checklist

.github/workflows/
└── client-[slug]-playwright.yml    CI pipeline, configured and ready
```

---

## After onboarding

Two steps before the first CI run:

**1. Set the GitHub secret**

Go to the repo on GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `PLAYWRIGHT_BASE_URL` | The client's base URL (e.g. `https://staging.acme.com`) |

**2. Commit and push**

The script prints the exact commands — copy and run them.

Once pushed, the Playwright workflow triggers automatically on every push to `main`.

---

## Running tests locally

**UI tests (Playwright):**

```bash
cd clients/client-[slug]/playwright
npm install
npx playwright install chromium
npm test
```

**Integration tests (Docker required):**

```bash
cd clients/client-[slug]/integration
docker compose up -d --wait
npm test
docker compose down
```

---

## Repo structure

```
forge/
  templates/      Base templates for Playwright, integration environments, and CI workflows
  scripts/        Automation (onboarding, reporting)
  docs/           Internal runbooks

clients/
  client-[slug]/  One directory per client — isolated and handoff-ready

skills/
  playwright-generator/   Internal tooling for authoring tests faster
```
