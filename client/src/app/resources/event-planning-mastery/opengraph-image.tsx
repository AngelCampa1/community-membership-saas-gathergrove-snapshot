import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'Event Planning Mastery for Club Administrators'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('event-planning-mastery')
}
