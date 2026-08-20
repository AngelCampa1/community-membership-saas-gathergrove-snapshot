import { JsonLd } from './JsonLd'
import { buildArticleSchema, buildBreadcrumbSchema, buildPersonSchema } from '@/lib/schema'
import type { ResourceEntry } from '@/lib/data/resources'

interface ResourceArticleJsonLdProps {
  resource: ResourceEntry
}

export function ResourceArticleJsonLd({ resource }: ResourceArticleJsonLdProps) {
  const articleSchema = buildArticleSchema({
    title: resource.title,
    description: resource.description,
    slug: `resources/${resource.slug}`,
    datePublished: resource.datePublished,
    dateModified: resource.dateModified,
    keywords: resource.keywords,
    speakableCssSelectors: ['#key-takeaways', 'h1', '[data-ai-answer]'],
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Resources', url: '/resources' },
    { name: resource.title, url: `/resources/${resource.slug}` },
  ])

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={buildPersonSchema()} />
    </>
  )
}
