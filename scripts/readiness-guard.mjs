import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const requiredFiles = [
  '.env.example',
  '.github/workflows/ci.yml',
  'app/api/invoices/route.ts',
  'app/api/billing/checkout/route.ts',
  'app/api/billing/portal/route.ts',
  'app/api/billing/status/route.ts',
  'app/api/stripe/webhook/route.ts',
  'app/error.tsx',
  'app/forgot-password/page.tsx',
  'app/not-found.tsx',
  'app/reset-password/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/refunds/page.tsx',
  'app/robots.ts',
  'app/sitemap.ts',
  'lib/request-security.ts',
  'lib/supabase-server.ts',
  'proxy.ts',
  'supabase/migrations/20260523095504_add_billing_subscriptions.sql',
  'supabase/migrations/20260529090606_atomic_invoice_create.sql',
];

export const runtimeFilesToScan = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/error.tsx',
  'app/login/page.tsx',
  'app/signup/page.tsx',
  'app/not-found.tsx',
  'app/verify-email/page.tsx',
  'app/forgot-password/page.tsx',
  'app/reset-password/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/refunds/page.tsx',
  'app/legal-page.tsx',
  'app/dashboard/page.tsx',
  'app/clients/page.tsx',
  'app/invoice/new/page.tsx',
  'app/invoice/[id]/page.tsx',
  'components/AuthShell.tsx',
  'components/PDFTemplate.tsx',
  'lib/company.ts',
];

const forbiddenRuntimeCopy = [
  /DJ\s+Booman/i,
  /Wyoming/i,
  /InvoiceGen/i,
  /opinionated/i,
];

export function runReadinessGuard(root = process.cwd()) {
  const failures = [];

  for (const file of requiredFiles) {
    if (!existsSync(join(root, file))) {
      failures.push(`missing required file: ${file}`);
    }
  }

  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const scriptName of ['verify', 'smoke', 'readiness']) {
    if (!packageJson.scripts?.[scriptName]) {
      failures.push(`missing package script: ${scriptName}`);
    }
  }

  const newInvoiceSource = readFileSync(join(root, 'app/invoice/new/page.tsx'), 'utf8');
  for (const blockedPdfToken of ['PDFDownloadLink', 'PDFTemplate']) {
    if (newInvoiceSource.includes(blockedPdfToken)) {
      failures.push(`new invoice page must not include unsaved PDF export token: ${blockedPdfToken}`);
    }
  }

  for (const file of runtimeFilesToScan) {
    const source = readFileSync(join(root, file), 'utf8');
    for (const pattern of forbiddenRuntimeCopy) {
      if (pattern.test(source)) {
        failures.push(`forbidden runtime copy ${pattern} found in ${file}`);
      }
    }
  }

  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = runReadinessGuard();

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL ${failure}`);
    }
    process.exit(1);
  }

  console.log('Readiness guard passed.');
}
