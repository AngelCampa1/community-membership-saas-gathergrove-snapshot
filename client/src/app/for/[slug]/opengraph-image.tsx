import { buildOgImageResponse } from '@/lib/og-image-template'
import { getClubTypeBySlug } from '@/lib/data/club-types'

export const alt = 'GatherGrove'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const clubType = getClubTypeBySlug(slug)
  if (!clubType) {
    return buildOgImageResponse({ title: 'GatherGrove', category: 'Club Management' })
  }

  return buildOgImageResponse({
    title: `${clubType.name} Management Software`,
    subtitle: clubType.description,
    category: `For ${clubType.name}`,
  })
}
