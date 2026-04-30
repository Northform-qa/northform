# Playwright Test Authoring Runbook

How to use the Playwright Generator Skill to write tests for a new client feature — from blank workspace to passing suite.

The Skill itself is documented at `skills/playwright-generator/SKILL.md`. This runbook covers the process around it: when to use each tier, how to fill the input template, how to review the output, how to handle VERIFY items, and how to validate locally.

---

## Step 1 — Choose Your Tier

Read the acceptance criteria for what needs to be tested and pick a tier.

**Use Tier 1 (Smoke)** when:
- You're onboarding a new client and need a baseline before deeper coverage
- The ask is "confirm the site loads and key elements are visible"
- You're validating after a site change that shouldn't have broken anything

**Use Tier 2 (Interaction)** when:
- There's a user-facing form, flow, or interactive feature to cover
- You need to prove a happy path works end to end
- You need to prove invalid input is rejected

**Use both** for a new client engagement — Tier 1 smoke tests as the foundation, Tier 2 interaction tests for the primary feature.

---

## Step 2 — Explore the Site First

Before filling the input template, spend 5–10 minutes on the actual site. You're looking for:

- **Site type** — is it a single-page app (SPA) or does each link load a new URL? SPAs need special handling (see constraints below).
- **Navigation structure** — what links are in the nav? Are they hash-based anchors, router links, or full page loads?
- **Key interactive elements** — forms, buttons, modals. What are the field labels/placeholders? Is there a CAPTCHA or third-party widget?
- **Form behaviour** — does the form submit to an external service (Formspree, Netlify Forms, etc.)? What does a success state look like?

If you find constraints, note them for the input template. The more you discover upfront, the fewer VERIFY iterations you'll need.

---

## Step 3 — Fill the Input Template

Copy the input template from `skills/playwright-generator/SKILL.md` and fill it in. Then paste it into Claude Code with the instruction: **"Generate Playwright page objects and tests for this site using the Northform Forge standards in SKILL.md."**

Be specific in the "Key flows" and "Known constraints" fields — vague input produces vague output.

---

## Step 4 — Review the Test Plan

Before accepting the generated code, review the proposed tests as a list:

- Does every flow in the acceptance criteria have a test?
- Are the test titles human-readable to a non-technical client?
- Is the happy path covered before the negative cases?
- Are there any flows that should be out of scope (e.g. authenticated flows, email delivery verification)?

If something is missing or wrong, correct the input template and regenerate rather than patching the output by hand.

---

## Step 5 — Save the Output Files

Save generated files to:

```
clients/client-[slug]/playwright/
├── pages/[name]-page.ts
└── tests/
    ├── smoke.spec.ts
    └── [feature].spec.ts
```

Delete the sample files before saving:
- `pages/home-page.ts` → delete
- `tests/home.spec.ts` → delete

---

## Step 6 — Resolve VERIFY Items

The generated code will contain `// VERIFY:` comments marking assumptions that need to be confirmed against the live site.

Run the tests in headed mode so you can see what's happening:

```bash
cd clients/client-[slug]/playwright
BASE_URL=https://www.client.com npx playwright test --headed
```

For each VERIFY item:
1. Watch what actually happens at that point in the test
2. Update the selector, assertion, or text pattern to match reality
3. Remove the `// VERIFY:` comment

Do not push tests that still contain unresolved VERIFY items.

---

## Step 7 — Run and Validate Locally

Once VERIFY items are resolved, run the full suite headlessly:

```bash
BASE_URL=https://www.client.com npm test
```

All tests must pass locally before committing. Check:
- [ ] No test is skipped or pending
- [ ] No `test.only` left in any file (will fail CI due to `forbidOnly`)
- [ ] Test titles are meaningful — open the HTML report and read them as a client would

To open the HTML report after a local run:

```bash
npx playwright show-report
```

---

## Worked Example — northformqa.ca

This is the process used to author the demo client tests.

**Site exploration findings:**
- Next.js SPA — all content on one page, hash-based navigation (`#services`, `#approach`, etc.)
- Nav labels ("Approach", "Engagements") don't match their href anchors (`#process`, `#engagements`) — confirmed by running tests and reading the URL after each click
- Contact form fields have no `id`, `name`, or `aria-label` — only placeholder text is available for selectors
- Cloudflare Turnstile on the form — must be stubbed in CI (blocks headless submission otherwise)
- Form POST endpoint unknown — intercepted all fetch/XHR POSTs with `page.route()` to avoid live submissions and inbox pollution

**Tier chosen:** Both — Tier 1 smoke tests plus Tier 2 contact form tests.

**Files created:**
- `pages/northform-page.ts` — single POM for the whole site (appropriate for a single-page app)
- `tests/smoke.spec.ts` — 3 tests: homepage load, nav visibility, nav link resolution
- `tests/contact-form.spec.ts` — 3 tests: happy path, empty form blocked, invalid email rejected

**VERIFY items encountered and resolved:**
- Nav link names — initial assumptions ("Process", "Pricing") were wrong; corrected after first run by reading the actual element text
- Message textarea placeholder — long custom placeholder text, not just "Message"; switched to `#contact textarea` CSS selector
- Submit button — matched 3 elements (nav, hero, form); scoped to `#contact button[type="submit"]`
- Form validation style — no `required` attribute, no `aria-invalid`; empty form silently blocked, email validated via browser native `type="email"`
- Success message text — unknown until first headed run with mocked POST; VERIFY comment left in place, updated after observing actual confirmation text

**6 tests, all passing locally and in CI.**
