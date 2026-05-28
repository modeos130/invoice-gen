import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ihateinvoices.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/clients', '/invoice'],
    },
    sitemap: `${appUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
