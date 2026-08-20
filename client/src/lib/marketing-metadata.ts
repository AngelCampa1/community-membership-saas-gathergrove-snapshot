import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME, OG_IMAGE_PATH } from './site-config'

interface PageMetadataOptions {
  title: string
  description: string
  slug: string
  keywords?: string
  ogImagePath?: string
  noIndex?: boolean
}

export function createPageMetadata(opts: PageMetadataOptions): Metadata {
  const fullTitle = `${opts.title} | ${SITE_NAME}`
  const canonicalUrl = `/${opts.slug}`
  const ogImage = opts.ogImagePath ?? OG_IMAGE_PATH

  return {
    title: { absolute: fullTitle },
    description: opts.description,
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: fullTitle,
      description: opts.description,
      images: [ogImage],
      url: `${SITE_URL}/${opts.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: opts.description,
      images: [ogImage],
    },
    ...(opts.noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}
