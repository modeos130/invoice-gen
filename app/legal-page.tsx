import type { ReactNode } from 'react';
import Link from 'next/link';
import { companyInfo } from '@/lib/company';

type LegalPageProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-3xl">
        <nav className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            I Hate Invoices
          </Link>
          <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
            Get Started
          </Link>
        </nav>

        <header className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent2)' }}>
            {companyInfo.legalName}
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--text3)' }}>
            Last updated: {updated}
          </p>
        </header>

        <div className="space-y-7 text-sm leading-6" style={{ color: 'var(--text2)' }}>
          {children}

          <section className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
              Company Contact
            </h2>
            <p>{companyInfo.legalName}</p>
            <p>{companyInfo.entityType}</p>
            <p>
              Email:{' '}
              <a href={`mailto:${companyInfo.contactEmail}`} className="font-medium hover:underline" style={{ color: 'var(--accent2)' }}>
                {companyInfo.contactEmail}
              </a>
            </p>
            <p>Phone: {companyInfo.phone}</p>
            <p>{companyInfo.location}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
