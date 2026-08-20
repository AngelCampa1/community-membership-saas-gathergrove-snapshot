import { SITE_URL, SITE_NAME, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import { GLOSSARY_ENTRIES, GLOSSARY_CATEGORIES } from '@/lib/data/glossary'
import { isRetainedGlossarySlug } from '@/lib/seo-content-config'

export function GET() {
  const retainedEntries = GLOSSARY_ENTRIES.filter((entry) => isRetainedGlossarySlug(entry.slug))
  const categoryBlocks = GLOSSARY_CATEGORIES.map((category) => {
    const entries = retainedEntries.filter((e) => e.category === category)
    const entryList = entries
      .map(
        (e) =>
          `### ${e.term}\n${e.definition}\n- URL: ${SITE_URL}/glossary/${e.slug}\n- Category: ${category}`
      )
      .join('\n\n')
    return `## ${category.charAt(0).toUpperCase() + category.slice(1)} (${entries.length} terms)\n\n${entryList}`
  }).join('\n\n---\n\n')

  const content = `# ${SITE_NAME} - Club Management Glossary

> Last updated: ${PROGRAMMATIC_PAGES_LAST_UPDATED}
> Version: 1.0
> Total terms: ${retainedEntries.length}

This glossary defines key terms used in club management, membership organizations, and community administration. Each term links to a dedicated page with extended definitions, FAQ, and related terms.

${categoryBlocks}

## Links

- Glossary hub: ${SITE_URL}/glossary
- Full product reference: ${SITE_URL}/llms-full.txt
- Pricing: ${SITE_URL}/llms-pricing.txt
- Homepage: ${SITE_URL}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=86400',
      'Last-Modified': new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toUTCString(),
    },
  })
}
