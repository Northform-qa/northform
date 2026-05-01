import { test, expect } from '@playwright/test';
import { NorthformPage } from '../pages/northform-page';

test.describe('Smoke: northformqa.ca', () => {
  test('homepage loads with title and hero content', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('navigate to homepage', async () => {
      await northformPage.navigateTo();
    });

    await test.step('page title contains brand name', async () => {
      await expect(page).toHaveTitle(/northform/i);
    });

    await test.step('hero heading is present and non-empty', async () => {
      await expect(northformPage.heroHeading).toBeVisible();
      const text = await northformPage.heroHeading.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    });
  });

  test('primary navigation elements are visible', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('navigate to homepage', async () => {
      await northformPage.navigateTo();
    });

    await test.step('all primary nav links visible', async () => {
      await expect(northformPage.navServices).toBeVisible();
      await expect(northformPage.navApproach).toBeVisible();
      await expect(northformPage.navEngagements).toBeVisible();
      await expect(northformPage.navAbout).toBeVisible();
      await expect(northformPage.navContact).toBeVisible();
    });
  });

  test('primary nav links scroll to page sections without error', async ({ page }) => {
    const northformPage = new NorthformPage(page);

    await test.step('navigate to homepage', async () => {
      await northformPage.navigateTo();
    });

    const navLocators = [
      northformPage.navServices,
      northformPage.navApproach,
      northformPage.navEngagements,
      northformPage.navAbout,
      northformPage.navContact,
    ];

    for (const locator of navLocators) {
      // Read the actual href so this test stays correct even if the site renames its anchors
      const href = await locator.getAttribute('href');
      const label = await locator.innerText();

      await test.step(`${label} nav link resolves to ${href}`, async () => {
        await locator.click();
        if (href?.startsWith('#')) {
          await expect(page).toHaveURL(new RegExp(href.slice(1), 'i'));
        }
        // Page title unchanged proves no navigation to a 404 error page
        await expect(page).toHaveTitle(/northform/i);
      });
    }
  });
});
