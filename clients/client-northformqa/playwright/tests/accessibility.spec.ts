import { test, expect } from '@playwright/test';
import { NorthformPage } from '../pages/northform-page';
import { scanPage, formatViolations } from '../helpers/accessibility';

test.describe('Accessibility: northformqa.ca', () => {
  test('homepage has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('navigate to homepage', async () => {
      await northformPage.navigateTo();
    });

    await test.step('scan for WCAG 2.1 AA violations', async () => {
      // If violations are found on the live site, two options:
      //   1. Fix the underlying a11y issue on northformqa.ca (preferred)
      //   2. Suppress known accepted exceptions via ignoreRules, e.g.:
      //      ignoreRules: ['label']  // placeholder-only inputs — known site constraint
      const { failing, warnings } = await scanPage(page);

      if (warnings.length > 0) {
        console.warn(
          `\nModerate a11y violations (not failing the test):\n\n` +
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
