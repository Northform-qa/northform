import { test, expect } from '@playwright/test';
import { NorthformPage } from '../pages/northform-page';

test.describe('Contact form', () => {
  // Shared setup: stub Turnstile and scroll to the contact section before each test.
  // The NorthformPage instance created here attaches routes/init scripts to `page`;
  // new instances in individual tests reuse the same page object, not a fresh browser context.
  test.beforeEach(async ({ page }) => {
    const northformPage = new NorthformPage(page);
    await northformPage.stubTurnstile();
    await northformPage.navigateTo();
    await northformPage.scrollToContactSection();
  });

  test('happy path: valid submission shows success confirmation', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    // Intercept the form submission POST to avoid live submissions in CI.
    // VERIFY: tighten this pattern to the actual endpoint after first headed run
    //         (e.g. '**/api/contact**' or '**/formspree.io/**')
    await page.route('**', async route => {
      const req = route.request();
      if (req.method() === 'POST' && ['fetch', 'xhr'].includes(req.resourceType())) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('fill contact form with valid data', async () => {
      await northformPage.fillContactForm({
        name:    'Test User',
        email:   'test@northformqa.ca',
        message: 'Automated test submission — please ignore.',
      });
    });

    await test.step('submit the form', async () => {
      await northformPage.submitContactForm();
    });

    await test.step('success confirmation is visible', async () => {
      // VERIFY: update this text pattern to match the actual post-submission UI state
      await expect(
        page.getByText(/thank you|message sent|we.ll be in touch|sent|received/i)
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test('validation: empty form is not accepted', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('attempt to submit without filling any fields', async () => {
      await northformPage.submitContactForm();
    });

    await test.step('form does not transition to success state', async () => {
      // The form has no visible error messages for empty fields but blocks submission.
      // Asserting no success text appeared is the correct observable outcome.
      // VERIFY: update success text pattern if the actual confirmation copy changes
      await expect(
        page.getByText(/thank you|message sent|we.ll be in touch|sent|received/i)
      ).not.toBeVisible();
    });

    await test.step('contact form is still visible', async () => {
      await expect(northformPage.nameInput).toBeVisible();
    });
  });

  test('validation: invalid email format is rejected', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('fill name but enter a malformed email', async () => {
      await northformPage.fillContactForm({
        name:  'Test User',
        email: 'not-a-valid-email',
      });
    });

    await test.step('attempt to submit', async () => {
      await northformPage.submitContactForm();
    });

    await test.step('email field fails native email validation', async () => {
      // The input is type="email" — the browser blocks submission and checkValidity() returns false
      const isValid = await northformPage.emailInput.evaluate(
        (el: HTMLInputElement) => el.checkValidity()
      );
      expect(isValid).toBe(false);
    });
  });
});
