import type { MetadataRoute } from 'next';

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.ihateinvoices.com').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ['/', '/login', '/signup', '/forgot-password', '/terms', '/privacy', '/refunds'].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified,
  }));
}
