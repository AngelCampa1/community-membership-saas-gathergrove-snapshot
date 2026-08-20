import { RESOURCES } from '@/lib/data/resources'
import { BLOG_POSTS } from '@/lib/data/blog-posts'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, BLOG_LAST_UPDATED } from '@/lib/site-config'

export const dynamic = 'force-static'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const items = RESOURCES.map((r) => {
    const url = `${SITE_URL}/resources/${r.slug}`
    const pubDate = new Date(r.dateModified).toUTCString()
    return `    <item>
      <title>${escapeXml(r.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(r.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(r.category)}</category>
    </item>`
  }).join('\n')

  const blogItems = BLOG_POSTS.map((bp) => {
    const url = `${SITE_URL}/blog/${bp.slug}`
    const pubDate = new Date(bp.dateModified).toUTCString()
    return `    <item>
      <title>${escapeXml(bp.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(bp.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(bp.category)}</category>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} - Club Management Resources</title>
    <link>${SITE_URL}/resources</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date(BLOG_LAST_UPDATED).toUTCString()}</lastBuildDate>
${items}
${blogItems}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
