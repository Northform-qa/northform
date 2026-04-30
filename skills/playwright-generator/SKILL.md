# Playwright Generator Skill

Internal Claude skill for authoring Playwright tests for a new client or feature. Produces production-ready TypeScript page objects and test specs following Northform Forge standards.

---

## Two Tiers

Choose the tier that matches the scope of what needs to be tested.

### Tier 1 — Smoke

Use when you need to confirm a site loads and core elements are present. Fast to write, fast to run.

Covers:
- Page loads without error
- Key headings, hero content, brand elements visible
- Primary navigation links present and responsive
- No obvious broken states on first load

### Tier 2 — Interaction

Use when you need to test a user flow. Builds on Tier 1.

Covers everything in Tier 1, plus:
- Form happy path (valid submission succeeds)
- Form validation (required fields, format errors)
- Navigation flows (clicking links, scrolling to sections)
- Dynamic UI states (success messages, error states, loading states)

---

## Input Template

Paste this into Claude Code (or Claude.ai) to generate tests. Fill every field — the more specific you are, the less iteration is required.

```
## Playwright Generator — Input

**URL:** [full URL, e.g. https://www.acme.com]

**Site type:** [SPA | multi-page | unknown]

**Tier:** [1 | 2 | both]

**Key flows to cover:**
- [e.g. Homepage loads with correct title and hero]
- [e.g. Contact form: valid submission shows confirmation]
- [e.g. Contact form: empty required fields blocked]
- [e.g. Contact form: invalid email rejected]

**Known constraints:**
- [e.g. Hash-based routing — page.goto('/') only, no direct hash navigation]
- [e.g. Cloudflare Turnstile on contact form — needs stubbing in CI]
- [e.g. No id/aria-label on form inputs — placeholder selectors only]
- [e.g. Third-party form service — intercept POST with page.route()]

**Output files:**
- pages/[name]-page.ts
- tests/smoke.spec.ts        (Tier 1)
- tests/[feature].spec.ts    (Tier 2)
```

Leave "Known constraints" blank if you haven't explored the site yet — VERIFY comments in the output will flag things to check.

---

## VERIFY Comments

The generator adds `// VERIFY:` comments anywhere it made an assumption that needs to be confirmed against the live site. These are not optional — every VERIFY item must be resolved before the tests are considered done.

Common VERIFY items:
- Selector that couldn't be confirmed without loading the page (placeholder text, button label, heading level)
- Success/error message text that only appears after an interaction
- Network endpoint for a form POST that requires a headed run to observe
- Hash values in nav links that may not match the visible link text

**How to handle them:** Run the tests locally in headed mode (`npx playwright test --headed`), observe the actual behaviour, and update the selector or assertion to match. Remove the VERIFY comment once confirmed.

---

## Output Standards

All generated code must conform to these standards. The generator will not produce scaffolding or pseudocode.

| Standard | Requirement |
|---|---|
| Language | TypeScript |
| Pattern | Page Object Model — all locators and interactions in page classes, never inline in test files |
| Selectors | `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → CSS (last resort, always with `// VERIFY:`) |
| Structure | `test.describe` for grouping, `test.step` with Arrange/Act/Assert |
| Waits | No `waitForTimeout` — use `toBeVisible()`, `waitForURL`, `waitForResponse` |
| Credentials | No hardcoded values — use `process.env.VAR_NAME` |
| Test titles | Human-readable to a non-technical client |
| Comments | Only where the WHY is non-obvious (selector workaround, constraint, VERIFY item) |

---

## Where to Save Output

```
clients/client-[slug]/playwright/
├── pages/[name]-page.ts       ← one file per page or major section
└── tests/
    ├── smoke.spec.ts           ← Tier 1 tests
    └── [feature].spec.ts      ← Tier 2 tests, named by feature
```

Delete the sample files (`pages/home-page.ts`, `tests/home.spec.ts`) before adding client-specific files.
