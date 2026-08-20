import { buildOgImageResponse } from '@/lib/og-image-template'
import { getUseCaseBySlug } from '@/lib/data/use-cases'

export const alt = 'GatherGrove'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const useCase = getUseCaseBySlug(slug)
  if (!useCase) {
    return buildOgImageResponse({ title: 'GatherGrove', category: 'Features' })
  }

  return buildOgImageResponse({
    title: useCase.title,
    subtitle: useCase.description,
    category: 'Feature',
  })
}
