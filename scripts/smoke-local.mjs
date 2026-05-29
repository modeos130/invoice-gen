const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3028').replace(/\/$/, '');

const checks = [
  {
    method: 'GET',
    path: '/',
    expected: [200],
    responseHeaders: {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'content-security-policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://checkout.stripe.com https://billing.stripe.com; worker-src 'self' blob:; upgrade-insecure-requests",
    },
  },
  { method: 'GET', path: '/login', expected: [200] },
  { method: 'GET', path: '/signup', expected: [200] },
  { method: 'GET', path: '/forgot-password', expected: [200] },
  { method: 'GET', path: '/reset-password', expected: [200] },
  { method: 'GET', path: '/verify-email', expected: [200] },
  { method: 'GET', path: '/terms', expected: [200] },
  { method: 'GET', path: '/privacy', expected: [200] },
  { method: 'GET', path: '/refunds', expected: [200] },
  { method: 'GET', path: '/definitely-missing', expected: [404] },
  { method: 'GET', path: '/robots.txt', expected: [200] },
  { method: 'GET', path: '/sitemap.xml', expected: [200] },
  { method: 'GET', path: '/dashboard', expected: [200], redirectedTo: '/login' },
  { method: 'GET', path: '/clients', expected: [200], redirectedTo: '/login' },
  { method: 'GET', path: '/invoice/new', expected: [200], redirectedTo: '/login' },
  { method: 'GET', path: '/api/billing/status', expected: [401] },
  { method: 'POST', path: '/api/billing/checkout', expected: [401] },
  { method: 'POST', path: '/api/billing/portal', expected: [401] },
  { method: 'POST', path: '/api/stripe/webhook', expected: [400] },
  {
    method: 'POST',
    path: '/api/invoices',
    expected: [403],
    requestHeaders: { Origin: 'https://invalid.example' },
  },
];

let failures = 0;

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    method: check.method,
    headers: check.requestHeaders,
    redirect: 'follow',
  });

  const finalUrl = new URL(response.url);
  const statusOk = check.expected.includes(response.status);
  const redirectOk = check.redirectedTo ? finalUrl.pathname === check.redirectedTo : true;
  const missingHeaders = Object.entries(check.responseHeaders || {}).filter(
    ([name, value]) => response.headers.get(name) !== value
  );

  if (!statusOk || !redirectOk || missingHeaders.length > 0) {
    failures += 1;
    console.error(
      `FAIL ${check.method} ${check.path}: got ${response.status} ${finalUrl.pathname}, expected ${check.expected.join('/')} ${check.redirectedTo || ''}`.trim()
    );
    if (missingHeaders.length > 0) {
      for (const [name, value] of missingHeaders) {
        console.error(`  header ${name}: got ${response.headers.get(name) || '(missing)'}, expected ${value}`);
      }
    }
    continue;
  }

  console.log(`PASS ${check.method} ${check.path}: ${response.status}${check.redirectedTo ? ` -> ${finalUrl.pathname}` : ''}`);
}

if (failures > 0) {
  console.error(`Smoke checks failed: ${failures}`);
  process.exit(1);
}

console.log('Smoke checks passed.');
