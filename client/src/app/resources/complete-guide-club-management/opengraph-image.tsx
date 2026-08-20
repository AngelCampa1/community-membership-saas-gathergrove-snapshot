import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'The Complete Guide to Club Management'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('complete-guide-club-management')
}
