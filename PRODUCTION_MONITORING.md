# I Hate Invoices Production Monitoring

This runbook covers the baseline production checks for `https://www.ihateinvoices.com`.

## Monitors To Keep Active

| Monitor | Target | Expected result | Why it matters |
|---|---|---|---|
| Public site | `https://www.ihateinvoices.com/` | `200` | Confirms the public site is reachable. |
| App health | `https://www.ihateinvoices.com/api/health` | `200` JSON with `ok: true` | Confirms the deployed Next.js API surface is responding without checking secrets or customer data. |
| Login page | `https://www.ihateinvoices.com/login` | `200` | Confirms the auth entry point is reachable. |

UptimeRobot can monitor the public site and `/api/health`. Keep alert recipients current before any paid public launch.

## Fast Incident Triage

1. Confirm the symptom.
   - Is the site down, or is one workflow failing?
   - Check `/api/health` first. A healthy response looks like:

```json
{
  "ok": true,
  "service": "ihateinvoices",
  "timestamp": "2026-05-29T00:00:00.000Z"
}
```

2. Check the latest deployment.

```bash
vercel ls ihateinvoices --scope admin-26436872s-projects
vercel inspect <deployment-url> --scope admin-26436872s-projects
```

3. Check server errors.

```bash
vercel logs https://www.ihateinvoices.com --scope admin-26436872s-projects --since 30m --status-code 500 --no-follow --expand
```

4. Check CI on the current `main` branch.

```bash
gh run list --repo modeos130/invoice-gen --branch main --limit 5
```

5. Run route smoke locally or against a preview URL.

```bash
npm run verify
npm run readiness
SMOKE_BASE_URL=https://www.ihateinvoices.com npm run smoke
```

## Workflow-Specific Checks

| Symptom | First checks | Likely owner/developer action |
|---|---|---|
| Site or API health is down | Vercel deployment status, Vercel logs, DNS/SSL in Vercel | Roll back to previous known-good deployment if recent release caused it. |
| Login/signup/password reset fails | Supabase Auth logs, Supabase redirect URL allowlist, `/auth/callback` logs | Fix Supabase Auth settings or callback route issue. |
| Invoice/client save fails | Vercel logs for `/api/invoices`, archive routes, Supabase table schema | Confirm hosted migrations and RLS policies match repo source. |
| Upgrade checkout fails | Vercel logs for `/api/billing/checkout`, Stripe API logs, Vercel Stripe env values | Fix Stripe live key/price/customer state; do not expose keys in screenshots. |
| Billing portal fails | Vercel logs for `/api/billing/portal`, Stripe Customer Portal settings | Confirm portal is configured in live mode and customer id exists. |
| Pro status does not update after checkout | Stripe webhook delivery logs, Vercel logs for `/api/stripe/webhook`, Supabase `stripe_webhook_events` rows | Re-send failed Stripe webhook after fixing the cause. |
| PDF download fails | Browser console, saved invoice detail route, React PDF server/client errors | Confirm invoice is saved before PDF export and route can load invoice data. |

## Safety Rules During Incidents

- Do not rotate production keys unless there is evidence of exposure or compromise.
- Do not paste secrets into chat, screenshots, GitHub issues, or docs.
- Do not run destructive SQL during incident triage without explicit owner approval.
- Do not delete Stripe customers, subscriptions, invoices, clients, or invoice rows to "clean up" a symptom.
- Prefer Vercel rollback for bad deploys and additive database fixes for missing schema.

## Rollback Checklist

1. Identify the last known-good Vercel deployment.
2. Promote that deployment in Vercel.
3. Confirm `/`, `/login`, `/dashboard` unauthenticated redirect, `/api/health`, and `/api/billing/status` unauthenticated `401`.
4. If billing was affected, check Stripe webhook delivery and replay only the failed events after the route is fixed.
5. Write an incident note with:
   - Start and end time
   - Affected routes
   - Customer impact
   - Root cause
   - Fix or rollback performed
   - Follow-up prevention task

## Future Upgrade

Add dedicated error tracking, such as Sentry, before scaling paid traffic. That requires an owner-approved production DSN and privacy review so user data is not over-collected.
