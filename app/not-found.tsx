import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="fallback-page">
      <section className="fallback-panel" aria-labelledby="not-found-title">
        <FileQuestion aria-hidden="true" size={34} />
        <p className="fallback-kicker">Page not found</p>
        <h1 id="not-found-title">This invoice page is not available.</h1>
        <p>
          The link may be old, mistyped, or no longer connected to an invoice record.
        </p>
        <Link className="button primary" href="/">
          <Home aria-hidden="true" size={18} />
          Go Home
        </Link>
      </section>
    </main>
  );
}
