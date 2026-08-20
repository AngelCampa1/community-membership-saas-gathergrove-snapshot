import { buildOgImageResponse } from '@/lib/og-image-template'
import { getGlossaryEntryBySlug } from '@/lib/data/glossary'

export const alt = 'GatherGrove'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getGlossaryEntryBySlug(slug)
  if (!entry) {
    return buildOgImageResponse({ title: 'GatherGrove Glossary', category: 'Glossary' })
  }

  return buildOgImageResponse({
    title: entry.term,
    subtitle: entry.definition.slice(0, 120) + (entry.definition.length > 120 ? '...' : ''),
    category: 'Glossary',
  })
}
