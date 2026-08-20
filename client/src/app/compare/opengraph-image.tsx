import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove vs Competitors'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Compare Club Management Software',
    subtitle: 'GatherGrove vs Wild Apricot, ClubExpress, MemberPlanet, and more',
    category: 'Comparisons',
  })
}
