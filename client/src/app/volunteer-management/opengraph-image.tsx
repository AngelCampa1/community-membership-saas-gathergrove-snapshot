import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Volunteer Management Software'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Volunteer Management Software',
    subtitle: 'Sign-up forms, shift scheduling, hour tracking, and automated reminders',
    category: 'Volunteer Management',
  })
}
