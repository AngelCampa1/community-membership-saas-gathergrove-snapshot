import { getAlternativeBySlug, getAllAlternativeSlugs } from '@/lib/data/alternatives'
import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Alternative'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllAlternativeSlugs().map((slug) => ({ slug }))
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const alt_entry = getAlternativeBySlug(slug)
  if (!alt_entry) {
    return buildOgImageResponse({ title: 'GatherGrove Alternative' })
  }
  return buildOgImageResponse({
    title: alt_entry.title,
    subtitle: `Compare GatherGrove vs ${alt_entry.competitorName}`,
    category: 'Alternative',
  })
}
