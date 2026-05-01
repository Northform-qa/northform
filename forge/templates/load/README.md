# k6 Load Test Template

k6 scripts for smoke, load, and stress testing a client's API or web application.

---

## ⚠️ Safety Warning

**Never run load or stress scenarios against a production environment without explicit written sign-off from the client.**

Load tests generate significant artificial traffic. Against production, they can:
- Trigger rate limits or WAF blocks
- Affect real users
- Generate unexpected costs on pay-per-request infrastructure
- Set off on-call alerts

Always confirm: _which environment_, _which scenario_, and _what VU count_ before running. Get it in writing.

Default: run smoke only. Smoke is always safe — 2 VUs for 30 seconds.

---

## When to Use Each Scenario

| Scenario | VUs | Duration | Use when |
|---|---|---|---|
| `smoke` | 2 | 30s | Confirming the app responds under minimal load. Run in CI on every push. |
| `load` | Up to `K6_MAX_VUS` | ~2 min | Validating the app handles expected concurrent users. Run on staging before a launch or major release. |
| `stress` | Up to `K6_MAX_VUS × 2` | ~3.5 min | Finding the breaking point. Run on a dedicated test environment, never production. |

---

## How to Run Locally

Install k6: https://k6.io/docs/getting-started/installation/

```bash
# Smoke test (default — always safe)
K6_BASE_URL=https://staging.client.com k6 run forge/templates/load/smoke.js

# Load test — confirm K6_MAX_VUS with the client first
K6_BASE_URL=https://staging.client.com K6_SCENARIO=load K6_MAX_VUS=20 k6 run forge/templates/load/smoke.js

# Stress test — staging only, never production
K6_BASE_URL=https://staging.client.com K6_SCENARIO=stress K6_MAX_VUS=50 k6 run forge/templates/load/smoke.js
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `K6_BASE_URL` | `http://localhost:3000` | Base URL of the environment under test |
| `K6_SCENARIO` | `smoke` | Which scenario to run: `smoke`, `load`, or `stress` |
| `K6_MAX_VUS` | `20` | Peak virtual users for load and stress scenarios |

---

## Adapting for a Client

1. Copy `forge/templates/load/smoke.js` to `clients/client-[slug]/load/smoke.js`
2. Replace the `/health` request with the client's key endpoint(s)
3. Add flows relevant to the client's use case (login, browse, checkout, etc.)
4. Set thresholds in `options.thresholds` to match the client's SLA

---

## CI Default

The CI workflow (`load.yml`) runs the smoke scenario only. This keeps CI fast and safe. Load and stress scenarios are run manually via `workflow_dispatch` or locally.

To trigger a manual run from CI with a different scenario, use **Actions → Run workflow** and pass `K6_SCENARIO=load` as an environment override — or update the workflow env block temporarily and revert after the run.
