import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';

// Sample test demonstrating POM structure. Replace with client-specific pages and flows.
test.describe('Home page', () => {
  test('has correct page title', async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step('navigate to home', async () => {
      await homePage.navigateTo();
    });

    await test.step('verify page title', async () => {
      await expect(page).toHaveTitle(/Playwright/);
    });
  });

  test('get started link navigates to installation docs', async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step('navigate to home', async () => {
      await homePage.navigateTo();
    });

    await test.step('click Get started link', async () => {
      await homePage.clickGetStarted();
    });

    await test.step('verify navigation to intro page', async () => {
      await expect(page).toHaveURL(/intro/);
    });
  });
});
