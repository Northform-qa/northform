import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class HomePage extends BasePage {
  private readonly getStartedLink: Locator;
  private readonly heroHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.heroHeading = page.getByRole('heading', { level: 1 });
  }

  async navigateTo() {
    await this.goto('/');
  }

  async clickGetStarted() {
    await this.getStartedLink.click();
  }

  async getHeroHeadingText(): Promise<string> {
    return this.heroHeading.innerText();
  }
}
