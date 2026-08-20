import { SITE_URL, SITE_NAME, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import { HOW_TO_START_ENTRIES, HOW_TO_START_CATEGORIES } from '@/lib/data/how-to-start'
import { isRetainedHowToStartSlug } from '@/lib/seo-content-config'

export function GET() {
  const retainedEntries = HOW_TO_START_ENTRIES.filter((entry) =>
    isRetainedHowToStartSlug(entry.slug)
  )
  const categoryBlocks = HOW_TO_START_CATEGORIES.map((category) => {
    const entries = retainedEntries.filter((e) => e.category === category)
    const entryBlocks = entries
      .map((e) => {
        const steps = e.steps
          .map((s, i) => `  ${i + 1}. **${s.title}**: ${s.description}`)
          .join('\n')
        const faqs = e.faqQuestions
          .map((f) => `  - Q: ${f.question}\n    A: ${f.answer}`)
          .join('\n')
        return `### ${e.title}
- URL: ${SITE_URL}/how-to-start/${e.slug}
- Category: ${category}
- Estimated startup cost: ${e.estimatedStartupCost}
- Minimum members to launch: ${e.minMembersToLaunch}
- Legal requirements: ${e.legalRequirements}
- Steps (${e.steps.length} total):
${steps}
- FAQs:
${faqs}`
      })
      .join('\n\n')
    return `## ${category.charAt(0).toUpperCase() + category.slice(1)} (${entries.length} guides)\n\n${entryBlocks}`
  }).join('\n\n---\n\n')

  const content = `# ${SITE_NAME} - How to Start a Club Guides

> Last updated: ${PROGRAMMATIC_PAGES_LAST_UPDATED}
> Version: 1.0
> Total guides: ${retainedEntries.length}

Step-by-step guides for starting ${retainedEntries.length} types of clubs and community organizations. Each guide covers founding steps, legal requirements, estimated startup costs, minimum member count to launch, and common mistakes to avoid.

${categoryBlocks}

## Links

- How-to-start hub: ${SITE_URL}/how-to-start
- Club type guides: ${SITE_URL}/for
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
