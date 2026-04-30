# forge/templates/playwright

Base Playwright configuration and Page Object Model scaffold. Used as the starting point when onboarding a new client's UI/E2E test suite.

## Contents (planned)

- `playwright.config.ts` — base config (timeouts, reporters, project definitions)
- `base-page.ts` — abstract BasePage class for POM
- `fixtures.ts` — shared test fixtures
- `tsconfig.json` — TypeScript config for test projects

## Usage

Copy this template into `clients/client-[slug]/playwright/` and customize for the client's environment (baseURL, auth, etc.).
