import type { Metadata } from 'next';
import { companyInfo } from '@/lib/company';
import { LegalPage, LegalSection } from '../legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service | I Hate Invoices',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="May 24, 2026">
      <LegalSection title="Service">
        <p>
          I Hate Invoices is an invoicing tool operated by {companyInfo.legalName}. You can create client records, build invoices, download PDFs, and track invoice status.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You are responsible for keeping your login credentials secure and for the invoice, client, and business information you enter into the service.
        </p>
      </LegalSection>

      <LegalSection title="Billing">
        <p>
          The free plan includes up to 3 invoices per month. The Pro plan is listed at $7 per month and is billed through Stripe when paid billing is enabled.
        </p>
        <p>
          Paid subscriptions renew automatically until canceled. You can cancel through the billing portal when it is available, and cancellation keeps access active through the end of the paid billing period.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>
          Do not use the service for fraud, illegal billing, spam, malware distribution, harassment, or activity that harms the platform or other users.
        </p>
      </LegalSection>

      <LegalSection title="No Professional Advice">
        <p>
          Invoice templates and status tools are provided for convenience. They are not legal, tax, accounting, or financial advice.
        </p>
      </LegalSection>

      <LegalSection title="Support">
        <p>
          For account, billing, or cancellation help, contact {companyInfo.legalName} at {companyInfo.contactEmail}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
