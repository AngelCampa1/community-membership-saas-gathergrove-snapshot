import { getResourceBySlug } from '@/lib/data/resources'
import { buildOgImageResponse } from '@/lib/og-image-template'

export function buildResourceOgImage(slug: string) {
  const resource = getResourceBySlug(slug)
  if (!resource) {
    return buildOgImageResponse({ title: 'GatherGrove Resources' })
  }
  return buildOgImageResponse({
    title: resource.title,
    category: resource.category,
  })
}
