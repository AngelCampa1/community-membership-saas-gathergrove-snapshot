import { getComparisonBySlug, getAllComparisonSlugs } from '@/lib/data/comparisons'
import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Comparison'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }))
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const comparison = getComparisonBySlug(slug)
  if (!comparison) {
    return buildOgImageResponse({ title: 'GatherGrove Comparison' })
  }
  return buildOgImageResponse({
    title: comparison.title,
    subtitle: comparison.description,
    category: 'Comparison',
  })
}
