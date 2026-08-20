import { buildResourceOgImage } from '../_shared/og-helper'

export const alt = 'Nonprofit Membership Management - Complete Guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return buildResourceOgImage('nonprofit-membership-management-guide')
}
