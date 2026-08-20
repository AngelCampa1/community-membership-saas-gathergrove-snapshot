import { buildXml, generateSitemapEntries } from './sitemap-data'

export const dynamic = 'force-static'

export function GET(): Response {
  const xml = buildXml(generateSitemapEntries())
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
