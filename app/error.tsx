'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fallback-page" role="alert">
      <section className="fallback-panel" aria-labelledby="error-title">
        <AlertTriangle aria-hidden="true" size={34} />
        <p className="fallback-kicker">Something went wrong</p>
        <h1 id="error-title">The app could not finish that request.</h1>
        <p>
          Try again once. If the problem continues, contact support with what you were doing.
        </p>
        <div className="button-row">
          <button className="button primary" type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" size={18} />
            Try Again
          </button>
          <Link className="button secondary" href="/">
            <Home aria-hidden="true" size={18} />
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
