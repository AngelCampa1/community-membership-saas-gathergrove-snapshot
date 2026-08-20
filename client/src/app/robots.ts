import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  // Single wildcard rule covers all bots (including AI crawlers like GPTBot,
  // ClaudeBot, PerplexityBot). A separate AI bot rule with a narrow allow list
  // would override the wildcard and block AI bots from crawling content pages
  // (resources, club types, use cases) - preventing AI citations entirely.
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin/', '/app/', '/api/', '/activate-account/', '/payment/', '/events/pay/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
