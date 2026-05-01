import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export interface A11yViolation {
  id:          string;
  impact:      string;
  description: string;
  helpUrl:     string;
  elements:    string[];
}

export interface A11yScanResult {
  /** critical + serious — the test should fail on these */
  failing:  A11yViolation[];
  /** moderate — logged as a warning, does not fail the test */
  warnings: A11yViolation[];
}

const FAILING_IMPACTS = new Set(['critical', 'serious']);

/**
 * Runs an axe-core scan scoped to WCAG 2.1 AA rules.
 *
 * @param page        - Playwright Page (must already be on the target URL)
 * @param ignoreRules - Optional rule IDs to suppress, e.g. known site exceptions.
 *                      Document each suppressed rule with a comment at the call site
 *                      explaining the business justification.
 */
export async function scanPage(
  page: Page,
  options: { ignoreRules?: string[] } = {},
): Promise<A11yScanResult> {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);

  if (options.ignoreRules?.length) {
    builder = builder.disableRules(options.ignoreRules);
  }

  const { violations } = await builder.analyze();

  const mapped: A11yViolation[] = violations.map(v => ({
    id:          v.id,
    impact:      v.impact ?? 'unknown',
    description: v.description,
    helpUrl:     v.helpUrl,
    elements:    v.nodes.map(n => n.html),
  }));

  return {
    failing:  mapped.filter(v => FAILING_IMPACTS.has(v.impact)),
    warnings: mapped.filter(v => v.impact === 'moderate'),
  };
}

/** Formats violations into a human-readable string for test failure messages. */
export function formatViolations(violations: A11yViolation[]): string {
  return violations.map(v =>
    [
      `[${v.impact.toUpperCase()}] ${v.id}`,
      `  ${v.description}`,
      `  Help:     ${v.helpUrl}`,
      `  Affected: ${v.elements.length} element(s)`,
      ...v.elements.map(el => `    ${el}`),
    ].join('\n'),
  ).join('\n\n');
}
