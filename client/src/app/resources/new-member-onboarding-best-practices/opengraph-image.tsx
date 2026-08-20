import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'New Member Onboarding Best Practices'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('new-member-onboarding-best-practices')
}
