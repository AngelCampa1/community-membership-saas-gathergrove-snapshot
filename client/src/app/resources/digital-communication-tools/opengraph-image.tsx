import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'Digital Communication Tools for Clubs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('digital-communication-tools')
}
