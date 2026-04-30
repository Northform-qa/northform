# Client Onboarding Runbook

How to stand up a new client workspace in Northform Forge — from nothing to a live CI pipeline with published test reports.

**Estimated time:** 20–30 minutes for a new engagement with a known base URL.

---

## Pre-Engagement Checklist

Before you start, confirm you have:

- [ ] The client's **base URL** — the environment tests will run against (e.g. `https://staging.acme.com`)
- [ ] A **client slug** — a short, lowercase identifier with no spaces (e.g. `acme`, `acme-corp`). This becomes the directory name and appears in workflow files.
- [ ] Node.js 20+ installed locally (`node --version`)
- [ ] Root dependencies installed (`npm install` from repo root, if not already done)
- [ ] Write access to the GitHub repo
- [ ] A decision made on GitHub Pages (see the [Pages Decision](#github-pages-decision) section below)

---

## Step 1 — Run the Onboarding Script

From the repo root:

```bash
npx ts-node forge/scripts/onboard-client.ts [slug] [base-url]
```

Example:

```bash
npx ts-node forge/scripts/onboard-client.ts acme https://staging.acme.com
```

The script will:
- Create `clients/client-[slug]/playwright/` — a Playwright test workspace, ready to run
- Create `clients/client-[slug]/integration/` — a placeholder for integration tests (scaffold later if in scope)
- Create `clients/client-[slug]/README.md` — client context and next-steps checklist
- Create `.github/workflows/client-[slug]-playwright.yml` — the CI workflow, configured for this client

If the slug already exists, the script aborts — it will never overwrite an existing client.

---

## Step 2 — Set the GitHub Secret

The CI workflow needs to know the client's base URL. This is stored as a GitHub secret, not hardcoded in the workflow file.

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `PLAYWRIGHT_BASE_URL_[SLUG_UPPER]` | The client's base URL |

The secret name is always the slug in uppercase with hyphens replaced by underscores. Examples:

| Slug | Secret name |
|---|---|
| `acme` | `PLAYWRIGHT_BASE_URL_ACME` |
| `acme-corp` | `PLAYWRIGHT_BASE_URL_ACME_CORP` |
| `northformqa` | `PLAYWRIGHT_BASE_URL_NORTHFORMQA` |

The onboard script prints the exact secret name to use at the end of its output — copy it from there.

---

## Step 3 — Write the Tests

The onboarded workspace includes sample page objects and tests. Replace them with client-specific tests before the first real CI run.

```
clients/client-[slug]/playwright/
├── pages/          ← delete samples, add client page objects here
└── tests/          ← delete samples, add client test specs here
```

See the **Playwright Test Authoring Runbook** (`forge/docs/runbooks/playwright-authoring.md`) for how to structure and author the tests using the Playwright Generator Skill.

Run tests locally to confirm they pass before pushing:

```bash
cd clients/client-[slug]/playwright
npm install
npx playwright install chromium
BASE_URL=https://staging.acme.com npm test
```

All tests should pass locally before you commit.

---

## Step 4 — Commit and Push

Stage the new client workspace and the generated workflow file:

```bash
git add clients/client-[slug]/ .github/workflows/client-[slug]-playwright.yml
git commit -m "feat: onboard client-[slug]"
git push
```

The Playwright CI workflow triggers automatically on push to `main`.

---

## Step 5 — Confirm CI Passes

Go to **GitHub → Actions tab** and watch the run for `client-[slug]-playwright.yml`.

Check:
- [ ] The job completes green
- [ ] All tests passed (expand the "Run Playwright tests" step)
- [ ] The `playwright-report-client-[slug]` artifact was uploaded (visible on the run summary page)

If CI fails, download the artifact and open `index.html` to diagnose. Common causes:
- Secret name typo (check the exact name set in Step 2)
- Tests were authored against a local environment that isn't reachable from CI
- A VERIFY item in the tests needs updating to match the live site

---

## Step 6 — Wire Up Pages Reporting

This is a manual step — the onboard script does not generate the publish-report workflow.

### 6a. Enable GitHub Pages on the repo

If not already enabled: **repo → Settings → Pages → Source → Deploy from a branch → `gh-pages` branch, `/ (root)` folder**.

The `gh-pages` branch is created automatically on the first publish run — you do not need to create it. If the branch doesn't appear in the dropdown yet, complete steps 6b–6c first and come back.

> See [Pages Decision](#github-pages-decision) below if you haven't resolved the public/private question yet.

### 6b. Create the publish-report workflow

Create `.github/workflows/client-[slug]-publish-report.yml`. Use the template at `forge/templates/workflows/publish-report.yml` as the base — replace every `REPLACE` marker:

| Placeholder | Replace with |
|---|---|
| Workflow `name` | `"Client [Name] — Publish Report"` |
| `workflow_run.workflows` value | Exact `name:` value from the client's playwright workflow file |
| Artifact `name` | `playwright-report-client-[slug]` |
| All `client-SLUG` tokens | `client-[slug]` |

The `workflow_run.workflows` value must be an **exact string match** — copy it directly from the `name:` field in the playwright workflow.

### 6c. Push and verify

```bash
git add .github/workflows/client-[slug]-publish-report.yml
git commit -m "ci: add Pages publish workflow for client-[slug]"
git push
```

The publish workflow fires automatically after the next Playwright run completes. Check the Actions tab for the publish workflow run, then confirm the report is live at:

```
https://northform-qa.github.io/northform/client-[slug]/latest/
```

The root dashboard at `https://northform-qa.github.io/northform/` lists all clients and updates automatically.

---

## Handoff Checklist

Before considering an engagement live:

- [ ] All tests pass locally
- [ ] CI is green in GitHub Actions
- [ ] Playwright HTML report artifact is uploading on each run
- [ ] Pages report is live and accessible at the public URL
- [ ] `clients/client-[slug]/README.md` is up to date with stack notes and contacts
- [ ] Sample pages/tests have been deleted and replaced with client-specific code
- [ ] Client has been given the Pages URL (if applicable)

---

## GitHub Pages Decision

GitHub Pages is free, but has a constraint on free-plan repos.

**The constraint:** GitHub Pages only works on public repos with the free GitHub plan. There is no way to keep the repo private and serve Pages for free — it's all or nothing.

Three options:

| Option | Cost | Trade-off |
|---|---|---|
| **Make the repo public** | Free | Test code and client slugs are publicly visible. Acceptable if test code isn't sensitive, but understand the exposure before promising this to a client. |
| **Upgrade to GitHub Pro/Team** | ~$4–9/user/month | Enables Pages on private repos. Right choice once revenue supports it. |
| **Defer Pages** | Free | Use the Actions artifact download as a fallback. Not a client-facing URL, but fully functional for internal use. Revisit when the first client signs. |

**Current status:** Repo is public. Pages is enabled and in use for the northformqa demo client.

When the first paying client is onboarded, revisit whether their test code should live in a separate private repo rather than this monorepo.
