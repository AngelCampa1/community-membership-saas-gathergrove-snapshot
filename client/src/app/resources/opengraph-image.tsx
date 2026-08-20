import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Resource Library'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Club Management Resource Library',
    subtitle: 'Guides, templates, and best practices for running a successful club or nonprofit',
    category: 'Resources',
  })
}
