import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'How to Start a Club or Organization'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'How to Start a Club or Organization',
    subtitle: '30+ step-by-step formation guides for clubs, nonprofits, and community groups',
    category: 'Formation Guides',
  })
}
