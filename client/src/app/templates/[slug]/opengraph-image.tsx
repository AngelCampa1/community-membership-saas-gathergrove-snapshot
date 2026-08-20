import { getTemplateBySlug, TEMPLATES } from '@/lib/data/templates'
import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Free Template'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }))
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const template = getTemplateBySlug(slug)
  if (!template) {
    return buildOgImageResponse({ title: 'Free Club Template - GatherGrove' })
  }
  return buildOgImageResponse({
    title: template.title,
    subtitle: template.description.length > 120 ? template.description.slice(0, 120) + '...' : template.description,
    category: 'Free Template',
  })
}
