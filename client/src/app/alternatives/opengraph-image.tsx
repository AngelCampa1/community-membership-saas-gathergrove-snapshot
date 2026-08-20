import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'GatherGrove Alternatives'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Club Management Software Alternatives',
    subtitle: 'Compare GatherGrove with Wild Apricot, Springly, ClubExpress, and others',
    category: 'Alternatives',
  })
}
