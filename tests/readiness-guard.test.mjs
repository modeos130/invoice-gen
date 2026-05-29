import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { requiredFiles, runReadinessGuard, runtimeFilesToScan } from '../scripts/readiness-guard.mjs';

const fixtureRoots = [];

function writeFixtureFile(root, file, contents = 'I Hate Invoices\n') {
  const target = join(root, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'ihi-readiness-'));
  fixtureRoots.push(root);

  const files = new Set([...requiredFiles, ...runtimeFilesToScan]);
  for (const file of files) {
    writeFixtureFile(root, file);
  }

  writeFixtureFile(
    root,
    'package.json',
    JSON.stringify({ scripts: { verify: 'next build', smoke: 'node smoke', readiness: 'node guard' } })
  );

  return root;
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('readiness guard', () => {
  it('passes a complete fixture', () => {
    expect(runReadinessGuard(createFixture())).toEqual([]);
  });

  it('reports missing required files', () => {
    const root = createFixture();
    unlinkSync(join(root, 'app/api/invoices/route.ts'));

    expect(runReadinessGuard(root)).toContain('missing required file: app/api/invoices/route.ts');
  });

  it('blocks stale runtime copy', () => {
    const root = createFixture();
    writeFixtureFile(root, 'app/page.tsx', 'DJ Booman\n');

    expect(runReadinessGuard(root).some((failure) => failure.includes('forbidden runtime copy'))).toBe(true);
  });

  it('blocks unsaved PDF export on the new invoice page', () => {
    const root = createFixture();
    writeFixtureFile(root, 'app/invoice/new/page.tsx', 'PDFDownloadLink\n');

    expect(runReadinessGuard(root)).toContain(
      'new invoice page must not include unsaved PDF export token: PDFDownloadLink'
    );
  });
});
