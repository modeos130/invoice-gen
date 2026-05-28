import type { Metadata } from 'next';
import { companyInfo } from '@/lib/company';
import { LegalPage, LegalSection } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | I Hate Invoices',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 24, 2026">
      <LegalSection title="Information We Collect">
        <p>
          We collect account email addresses, authentication records, invoice data, client data you enter, billing status, and basic technical information needed to operate the app.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Information">
        <p>
          We use this information to provide the invoicing service, secure accounts, save invoice records, enforce plan limits, process billing, respond to support requests, and improve reliability.
        </p>
      </LegalSection>

      <LegalSection title="Service Providers">
        <p>
          Supabase provides authentication and database services, Vercel hosts the application, and Stripe processes paid subscriptions. Payment card details are handled by Stripe, not stored directly by I Hate Invoices.
        </p>
      </LegalSection>

      <LegalSection title="Data Control">
        <p>
          You can update or delete invoice and client information inside the app where controls are available. For account-level deletion or data questions, contact {companyInfo.legalName} at {companyInfo.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use hosted authentication, route protection, row-level database policies, and server-side billing checks. No internet service can guarantee perfect security, so keep your password private and report suspicious account activity.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
