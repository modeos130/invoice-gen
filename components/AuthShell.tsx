import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md';
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  width = 'md',
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <section className="auth-intro" aria-label="I Hate Invoices">
          <Link href="/" className="auth-brand">
            <span className="auth-brand-mark">IHI</span>
            <span>
              <strong>I Hate Invoices</strong>
              <small>Simple invoice software</small>
            </span>
          </Link>
          <p>
            A focused workspace for client records, invoice drafts, PDF exports,
            and payment status.
          </p>
        </section>

        <section className={`auth-card auth-card-${width}`} aria-labelledby="auth-title">
          <div className="auth-card-header">
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
