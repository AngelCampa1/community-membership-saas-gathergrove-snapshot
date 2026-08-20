import { buildOgImageResponse } from '@/lib/og-image-template'
import { getHowToStartEntryBySlug } from '@/lib/data/how-to-start'

export const alt = 'GatherGrove'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getHowToStartEntryBySlug(slug)
  if (!entry) {
    return buildOgImageResponse({ title: 'How to Start a Club', category: 'Formation Guide' })
  }

  return buildOgImageResponse({
    title: entry.title,
    subtitle: entry.description.slice(0, 120) + (entry.description.length > 120 ? '...' : ''),
    category: 'Formation Guide',
  })
}
