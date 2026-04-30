#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const REPO_ROOT = path.resolve(__dirname, '../..');
const PLAYWRIGHT_TEMPLATE  = path.join(REPO_ROOT, 'forge/templates/playwright');
const WORKFLOW_TEMPLATE    = path.join(REPO_ROOT, 'forge/templates/workflows/playwright.yml');
const CLIENTS_DIR          = path.join(REPO_ROOT, 'clients');
const WORKFLOWS_DIR        = path.join(REPO_ROOT, '.github/workflows');

const COPY_EXCLUDE = new Set(['node_modules', 'playwright-report', 'test-results', '.playwright']);

// ─── input helpers ────────────────────────────────────────────────────────────

let rl: readline.Interface | null = null;

function prompt(question: string): Promise<string> {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl!.question(question, resolve));
}

function closePrompt() {
  if (rl) { rl.close(); rl = null; }
}

function validateSlug(slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    return 'Slug must be lowercase alphanumeric with optional hyphens (e.g. acme, acme-corp)';
  return null;
}

function validateUrl(url: string): string | null {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:')
      return 'URL must use http or https';
    return null;
  } catch {
    return 'Invalid URL — expected format: https://app.client.com';
  }
}

function toClientName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── file operations ──────────────────────────────────────────────────────────

function copyTemplate(src: string, dst: string): void {
  fs.cpSync(src, dst, {
    recursive: true,
    filter: (srcPath: string) => {
      const rel = path.relative(src, srcPath);
      if (!rel) return true; // root dir itself
      return !rel.split(/[\\/]/).some(part => COPY_EXCLUDE.has(part));
    },
  });
}

function transformWorkflow(content: string, slug: string): string {
  const clientName = toClientName(slug);
  const secretName = `PLAYWRIGHT_BASE_URL_${slug.toUpperCase().replace(/-/g, '_')}`;
  return content
    // Strip the template header block (contiguous comment lines at top + trailing blank line)
    .replace(/^(?:#[^\n]*\n)+\n/, '')
    // Replace workflow name
    .replace('"[TEMPLATE] Playwright Tests"', `"Client ${clientName} — Playwright Tests"`)
    // Replace all client-SLUG tokens
    .replace(/client-SLUG/g, `client-${slug}`)
    // Replace the secret placeholder with the client-namespaced secret name
    .replace('PLAYWRIGHT_BASE_URL_SLUG', secretName)
    // Strip all # REPLACE trailing comments (with or without colon)
    .replace(/\s+# REPLACE.*$/gm, '');
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let slug    = (args[0] ?? '').trim();
  let baseUrl = (args[1] ?? '').trim();

  try {
    // Collect + validate slug
    while (true) {
      if (!slug) slug = (await prompt('Client slug (e.g. acme, acme-corp): ')).trim();
      const err = validateSlug(slug);
      if (err) { console.error(`  ✗ ${err}`); slug = ''; continue; }
      break;
    }

    // Guard: refuse to overwrite an existing client
    if (fs.existsSync(path.join(CLIENTS_DIR, `client-${slug}`))) {
      console.error(`\n✗  clients/client-${slug} already exists — aborting to prevent overwrite.`);
      process.exit(1);
    }

    // Collect + validate base URL
    while (true) {
      if (!baseUrl) baseUrl = (await prompt('Client base URL (e.g. https://app.acme.com): ')).trim();
      const err = validateUrl(baseUrl);
      if (err) { console.error(`  ✗ ${err}`); baseUrl = ''; continue; }
      break;
    }
  } finally {
    closePrompt();
  }

  const clientDir  = path.join(CLIENTS_DIR, `client-${slug}`);
  const clientName = toClientName(slug);
  const today = new Date().toISOString().split('T')[0];

  console.log(`\nScaffolding client-${slug}...\n`);

  // 1. Copy Playwright template → clients/client-[slug]/playwright/
  const playwrightDst = path.join(clientDir, 'playwright');
  copyTemplate(PLAYWRIGHT_TEMPLATE, playwrightDst);
  console.log(`  ✓  clients/client-${slug}/playwright/`);

  // 2. Create integration placeholder
  const integrationDir = path.join(clientDir, 'integration');
  fs.mkdirSync(integrationDir, { recursive: true });
  fs.writeFileSync(
    path.join(integrationDir, 'README.md'),
    `# clients/client-${slug}/integration\n\nIntegration test environment for ${clientName}. Scaffold from \`forge/templates/integration/\` when integration tests are in scope.\n`,
  );
  console.log(`  ✓  clients/client-${slug}/integration/`);

  // 3. Create client README
  fs.writeFileSync(
    path.join(clientDir, 'README.md'),
    [
      `# Client: ${clientName}`,
      '',
      '| | |',
      '|---|---|',
      `| **Slug** | client-${slug} |`,
      `| **Base URL** | ${baseUrl} |`,
      `| **Onboarded** | ${today} |`,
      '',
      '## Next Steps',
      '',
      `- [ ] Set \`PLAYWRIGHT_BASE_URL_${slug.toUpperCase().replace(/-/g, '_')}\` secret in GitHub → Settings → Secrets → Actions`,
      `  - Value: \`${baseUrl}\``,
      `- [ ] Push and confirm \`.github/workflows/client-${slug}-playwright.yml\` passes in Actions`,
      `- [ ] Delete sample pages and tests in \`playwright/pages/\` and \`playwright/tests/\``,
      '- [ ] Begin authoring client-specific page objects in `playwright/pages/`',
      '- [ ] Begin authoring tests in `playwright/tests/`',
      '',
      '## Stack',
      '',
      '_Document client stack here._',
      '',
      '## Notes',
      '',
      '_Engagement notes, contacts, special instructions._',
      '',
    ].join('\n'),
  );
  console.log(`  ✓  clients/client-${slug}/README.md`);

  // 4. Copy + transform workflow → .github/workflows/client-[slug]-playwright.yml
  fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
  const workflowSrc = fs.readFileSync(WORKFLOW_TEMPLATE, 'utf8');
  const workflowOut = transformWorkflow(workflowSrc, slug);
  const workflowDst = path.join(WORKFLOWS_DIR, `client-${slug}-playwright.yml`);
  fs.writeFileSync(workflowDst, workflowOut);
  console.log(`  ✓  .github/workflows/client-${slug}-playwright.yml`);

  // 5. Completion summary
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${clientName} scaffolded successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Manual steps before first CI run:

  1. Set GitHub secret
       Name:  PLAYWRIGHT_BASE_URL_${slug.toUpperCase().replace(/-/g, '_')}
       Value: ${baseUrl}
       Where: repo → Settings → Secrets and variables → Actions

  2. Commit and push:
       git add clients/client-${slug} .github/workflows/client-${slug}-playwright.yml
       git commit -m "feat: scaffold client-${slug}"
       git push

  3. Confirm the workflow passes in GitHub Actions

  4. Delete the sample pages/tests and begin authoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(err => {
  console.error('\n✗ ', err.message ?? err);
  process.exit(1);
});
