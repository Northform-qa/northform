import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class NorthformPage extends BasePage {
  // .first() guards against duplicate locators from mobile + desktop nav markup
  readonly navServices: Locator;
  readonly navApproach: Locator;
  readonly navEngagements: Locator;
  readonly navAbout: Locator;
  readonly navContact: Locator;

  readonly heroHeading: Locator;

  // Contact form inputs have no id/name/aria-label — placeholder is the only stable selector
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly companyInput: Locator;
  readonly websiteInput: Locator;
  readonly timelineInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.navServices    = page.getByRole('link', { name: 'Services'    }).first();
    this.navApproach    = page.getByRole('link', { name: 'Approach'    }).first();
    this.navEngagements = page.getByRole('link', { name: 'Engagements' }).first();
    this.navAbout       = page.getByRole('link', { name: 'About'       }).first();
    this.navContact     = page.getByRole('link', { name: 'Contact'     }).first();

    this.heroHeading = page.getByRole('heading', { level: 1 });

    this.nameInput     = page.getByPlaceholder('Your name');
    this.emailInput    = page.getByPlaceholder('Email');
    this.companyInput  = page.getByPlaceholder('Company (optional)');
    this.websiteInput  = page.getByPlaceholder('Website (optional)');
    this.timelineInput = page.getByPlaceholder('Timeline (optional)');
    // Textarea has a long placeholder — select by element type scoped to the contact section
    this.messageInput  = page.locator('#contact textarea');
    // Three "Send intro" buttons exist (nav, hero, form) — scope to the form's submit button
    this.submitButton  = page.locator('#contact button[type="submit"]');
  }

  async navigateTo() {
    await this.goto('/');
  }

  async scrollToContactSection() {
    await this.navContact.click();
    // Wait for the contact form to be interactive before the test proceeds
    await this.nameInput.waitFor({ state: 'visible' });
  }

  // Prevents the real Turnstile challenge loading and auto-fires the callback with a fake
  // token so the form is submittable in headless/CI environments.
  // Must be called before navigateTo() — addInitScript only applies to the next navigation.
  async stubTurnstile() {
    await this.page.route('**/challenges.cloudflare.com/**', route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
    await this.page.addInitScript(() => {
      (window as any).turnstile = {
        render: (_el: unknown, params: { callback?: (token: string) => void }) => {
          params.callback?.('test-token');
          return 'widget-id';
        },
        reset:       () => {},
        getResponse: () => 'test-token',
        remove:      () => {},
      };
    });
  }

  async fillContactForm(data: {
    name: string;
    email: string;
    message?: string;
    company?: string;
    website?: string;
    timeline?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    if (data.message  !== undefined) await this.messageInput.fill(data.message);
    if (data.company  !== undefined) await this.companyInput.fill(data.company);
    if (data.website  !== undefined) await this.websiteInput.fill(data.website);
    if (data.timeline !== undefined) await this.timelineInput.fill(data.timeline);
  }

  async submitContactForm() {
    await this.submitButton.click();
  }
}
