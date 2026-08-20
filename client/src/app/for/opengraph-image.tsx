import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove for Every Club Type'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Club Management Software for Every Club Type',
    subtitle: 'Book clubs, running clubs, nonprofits, youth sports leagues, and 80+ more',
    category: 'Club Solutions',
  })
}
