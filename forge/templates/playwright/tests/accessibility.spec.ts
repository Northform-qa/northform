import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import { scanPage, formatViolations } from '../helpers/accessibility';

// Replace HomePage with the client's page class and update the URL/scope as needed.
test.describe('Accessibility: homepage', () => {
  test('homepage has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step('navigate to homepage', async () => {
      await homePage.navigateTo();
    });

    await test.step('scan for WCAG 2.1 AA violations', async () => {
      // Pass ignoreRules to suppress known, accepted exceptions — document each one:
      // e.g. ignoreRules: ['label']  // form inputs use placeholder only — known site constraint
      const { failing, warnings } = await scanPage(page);

      if (warnings.length > 0) {
        console.warn(
          `\nModerate a11y violations on this page (not failing the test):\n\n` +
          formatViolations(warnings),
        );
      }

      expect(
        failing,
        `Found ${failing.length} critical/serious WCAG 2.1 AA violation(s):\n\n` +
        formatViolations(failing),
      ).toHaveLength(0);
    });
  });
});
