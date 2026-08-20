import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Free Club Templates'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Free Club & Organization Templates',
    subtitle: 'Meeting minutes, event planning, budgets, rosters & more - free to copy and use',
    category: 'Free Templates',
  })
}
