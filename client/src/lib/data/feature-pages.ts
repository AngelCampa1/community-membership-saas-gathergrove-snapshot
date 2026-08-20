import { USE_CASES } from './use-cases'

export type FeaturePageEntry = {
  slug: string
  title: string
  description: string
  keywords: string[]
  url: `/features/${string}`
  pageType: 'core' | 'specialized'
}

export const SPECIALIZED_FEATURE_PAGES: FeaturePageEntry[] = [
  {
    slug: 'nonprofit-event-management',
    title: 'Nonprofit Event Management Software',
    description: 'Online registration, ticketing, payment collection, QR check-in, and attendee communications for nonprofit events.',
    keywords: ['nonprofit event management software', 'nonprofit event registration', 'nonprofit event planning software'],
    url: '/features/nonprofit-event-management',
    pageType: 'specialized',
  },
  {
    slug: 'community-management-software',
    title: 'Community Management Software',
    description: 'Member directory, event coordination, dues collection, real-time chat, and analytics in one platform for clubs and nonprofits.',
    keywords: ['community management software', 'community management platform', 'community engagement software'],
    url: '/features/community-management-software',
    pageType: 'specialized',
  },
  {
    slug: 'member-database',
    title: 'Member Database Software',
    description: 'Structured member profiles with custom fields, roles, search, CSV import/export, and engagement tracking.',
    keywords: ['member database software', 'membership database', 'member management system'],
    url: '/features/member-database',
    pageType: 'specialized',
  },
]

export const FEATURE_PAGES: FeaturePageEntry[] = [
  ...USE_CASES.map((uc) => ({
    slug: uc.slug,
    title: uc.title,
    description: uc.description,
    keywords: uc.keywords,
    url: `/features/${uc.slug}` as const,
    pageType: 'core' as const,
  })),
  ...SPECIALIZED_FEATURE_PAGES,
]

export function getAllFeaturePageSlugs(): string[] {
  return FEATURE_PAGES.map((page) => page.slug)
}
