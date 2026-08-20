import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'Club Management Template Library'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('template-library')
}
