#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');

interface Check {
  label: string;
  pass: boolean;
  detail?: string;
}

function check(label: string, pass: boolean, detail?: string): Check {
  return { label, pass, detail };
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function dirExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

function runChecks(slug: string): Check[] {
  const clientDir  = path.join(REPO_ROOT, 'clients', `client-${slug}`);
  const playwrightDir = path.join(clientDir, 'playwright');
  const workflowFile  = path.join(REPO_ROOT, '.github', 'workflows', `client-${slug}-playwright.yml`);
  const secretName    = `PLAYWRIGHT_BASE_URL_${slug.toUpperCase().replace(/-/g, '_')}`;

  const checks: Check[] = [];

  // 1. Client directory
  checks.push(check(
    `Client directory exists (clients/client-${slug}/)`,
    dirExists(clientDir),
  ));

  // 2. Playwright directory
  checks.push(check(
    `Playwright directory exists (clients/client-${slug}/playwright/)`,
    dirExists(playwrightDir),
  ));

  // 3. playwright.config.ts
  checks.push(check(
    'playwright.config.ts present',
    fileExists(path.join(playwrightDir, 'playwright.config.ts')),
  ));

  // 4. package.json
  checks.push(check(
    'package.json present',
    fileExists(path.join(playwrightDir, 'package.json')),
  ));

  // 5. package-lock.json (required for npm ci in CI)
  checks.push(check(
    'package-lock.json present',
    fileExists(path.join(playwrightDir, 'package-lock.json')),
  ));

  // 6. tsconfig.json
  checks.push(check(
    'tsconfig.json present',
    fileExists(path.join(playwrightDir, 'tsconfig.json')),
  ));

  // 7. At least one test file
  const testsDir = path.join(playwrightDir, 'tests');
  const testFiles = dirExists(testsDir)
    ? fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'))
    : [];
  checks.push(check(
    `At least one test file in playwright/tests/`,
    testFiles.length > 0,
    testFiles.length > 0 ? `found: ${testFiles.join(', ')}` : 'no *.spec.ts files found',
  ));

  // 8. CI workflow file
  checks.push(check(
    `CI workflow exists (.github/workflows/client-${slug}-playwright.yml)`,
    fileExists(workflowFile),
  ));

  // 9. Secret name referenced in workflow
  if (fileExists(workflowFile)) {
    const workflowContent = fs.readFileSync(workflowFile, 'utf8');
    const secretReferenced = workflowContent.includes(secretName);
    checks.push(check(
      `Workflow references secret ${secretName}`,
      secretReferenced,
      secretReferenced ? undefined : `Expected to find ${secretName} in workflow — check secret naming`,
    ));
  } else {
    checks.push(check(
      `Workflow references secret ${secretName}`,
      false,
      'Skipped — workflow file not found',
    ));
  }

  return checks;
}

function main(): void {
  const slug = (process.argv[2] ?? '').trim();

  if (!slug) {
    console.error('Usage: npx ts-node forge/scripts/check-client.ts <slug>');
    console.error('Example: npx ts-node forge/scripts/check-client.ts acme');
    process.exit(1);
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`✗  Invalid slug "${slug}" — must be lowercase alphanumeric with optional hyphens`);
    process.exit(1);
  }

  console.log(`\nChecking client-${slug}...\n`);

  const checks = runChecks(slug);
  let failed = 0;

  for (const c of checks) {
    const icon   = c.pass ? '✓' : '✗';
    const detail = c.detail ? `  → ${c.detail}` : '';
    console.log(`  ${icon}  ${c.label}${detail}`);
    if (!c.pass) failed++;
  }

  console.log('');

  if (failed === 0) {
    console.log(`  client-${slug} looks good — ${checks.length}/${checks.length} checks passed.\n`);
  } else {
    console.log(`  ${failed} check${failed > 1 ? 's' : ''} failed — resolve the issues above before running CI.\n`);
    process.exit(1);
  }
}

main();
