# forge/templates/playwright

Base Playwright + TypeScript project template using Page Object Model. Copy this into `clients/client-[slug]/playwright/` when onboarding a new client, then swap in their `BASE_URL` and replace the sample pages and tests.

## Structure

```
playwright/
├── playwright.config.ts      Base config — set BASE_URL via env var
├── package.json
├── tsconfig.json
├── pages/
│   ├── base-page.ts          Abstract BasePage all POMs extend
│   └── home-page.ts          Sample page object (replace with client pages)
└── tests/
    └── home.spec.ts          Sample test (replace with client tests)
```

## Setup

```bash
npm install
npx playwright install --with-deps chromium
```

## Running Tests

```bash
# All tests, all configured browsers
npm test

# Single browser
npx playwright test --project=chromium

# Headed (useful during authoring)
npm run test:headed

# Interactive UI mode
npm run test:ui
```

## Client Onboarding Checklist

1. Copy this directory to `clients/client-[slug]/playwright/`
2. Update `baseURL` default in `playwright.config.ts` (or set `BASE_URL` env var in CI)
3. Delete `pages/home-page.ts` and `tests/home.spec.ts`
4. Create client-specific page objects in `pages/` extending `BasePage`
5. Add tests in `tests/`
6. Wire `BASE_URL` secret in the client's GitHub Actions workflow

## POM Conventions

- Every page object extends `BasePage`
- Locators are defined as `private readonly` class fields in the constructor
- Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
- Tests use `test.describe` + `test.step` — no exceptions
