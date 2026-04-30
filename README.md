# Northform Forge

Internal test infrastructure platform for Northform QA. Not client-facing — this is the operational backbone used to stand up, run, and maintain test harnesses for client engagements.

## Structure

```
forge/          Core platform: templates, scripts, and internal docs
clients/        Per-client test workspaces (Playwright + integration tests)
skills/         Internal Claude Skills for test authoring tooling
```

## Quick Reference

| Directory | Purpose |
|---|---|
| `forge/templates/playwright/` | Base Playwright config and POM scaffold |
| `forge/templates/integration/` | Base Docker Compose environments |
| `forge/scripts/` | Automation scripts (client onboarding, reporting) |
| `forge/docs/` | Internal platform documentation |
| `clients/client-[slug]/` | Per-client test code (isolated, handoff-ready) |
| `skills/playwright-generator/` | Playwright test generation skill |

## Stack

- **UI/E2E Tests:** Playwright + TypeScript
- **Integration Environments:** Docker Compose
- **CI/CD:** GitHub Actions
- **Reporting:** GitHub Pages (static dashboards)
