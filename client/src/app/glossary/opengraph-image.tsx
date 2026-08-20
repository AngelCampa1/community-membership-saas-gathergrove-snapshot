import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'Club Management Glossary'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Club Management Glossary',
    subtitle: '140+ definitions for membership, events, governance, and nonprofit terms',
    category: 'Glossary',
  })
}
