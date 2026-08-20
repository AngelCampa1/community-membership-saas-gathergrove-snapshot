import { CLUB_TYPES } from './data/club-types'
import { HOW_TO_START_ENTRIES } from './data/how-to-start'
import { GLOSSARY_ENTRIES } from './data/glossary'
import { COMPARISONS } from './data/comparisons'
import { ALTERNATIVES } from './data/alternatives'

type SeoRedirect = {
  source: string
  destination: string
  permanent: boolean
}

export const RETAINED_CLUB_TYPE_SLUGS = [
  'book-clubs',
  'running-clubs',
  'chess-clubs',
  'photography-clubs',
  'hiking-clubs',
  'cycling-clubs',
  'swimming-clubs',
  'crossfit-clubs',
  'nonprofit-organizations',
  'youth-sports-leagues',
  'pta-pto-organizations',
  'professional-associations',
  'garden-clubs',
  'art-clubs',
  'disc-golf-clubs',
  'volleyball-clubs',
  'tennis-clubs',
  'pickleball-clubs',
  'rowing-clubs',
  'social-clubs',
] as const

export const RETAINED_HOW_TO_START_SLUGS = [
  'pickleball-club',
  'running-club',
  'cycling-club',
  'hiking-club',
  'tennis-league',
  'community-garden',
  'book-club',
  'photography-club',
  'board-game-group',
  'chess-club',
  'social-club',
  'volunteer-organization',
  'car-club',
] as const

export const RETAINED_GLOSSARY_SLUGS = [
  'board-of-directors',
  'bylaws',
  'quorum',
  'event-registration',
  'event-check-in',
  'no-show-rate',
  'dues-collection',
  'dues-automation',
  'member-directory',
  'member-portal',
  'digital-membership-card',
  'mobile-app',
  'association-management-system',
  'waitlist',
  'qr-code',
] as const

export const RETAINED_COMPARISON_SLUGS = [
  'wild-apricot',
  'clubexpress',
  'memberplanet',
  'spreadsheets',
  'teamup',
  'teamsnap',
] as const

export const RETAINED_ALTERNATIVE_SLUGS = [
  'wild-apricot',
  'clubexpress',
  'memberplanet',
  'spreadsheets',
  'teamsnap',
] as const

const RETAINED_CLUB_TYPE_SET = new Set<string>(RETAINED_CLUB_TYPE_SLUGS)
const RETAINED_HOW_TO_START_SET = new Set<string>(RETAINED_HOW_TO_START_SLUGS)
const RETAINED_GLOSSARY_SET = new Set<string>(RETAINED_GLOSSARY_SLUGS)
const RETAINED_COMPARISON_SET = new Set<string>(RETAINED_COMPARISON_SLUGS)
const RETAINED_ALTERNATIVE_SET = new Set<string>(RETAINED_ALTERNATIVE_SLUGS)
const CLUB_TYPE_SLUG_SET = new Set(CLUB_TYPES.map((entry) => entry.slug))
const HOW_TO_START_SLUG_SET = new Set(HOW_TO_START_ENTRIES.map((entry) => entry.slug))
const GLOSSARY_SLUG_SET = new Set(GLOSSARY_ENTRIES.map((entry) => entry.slug))
const COMPARISON_SLUG_SET = new Set(COMPARISONS.map((entry) => entry.slug))
const ALTERNATIVE_SLUG_SET = new Set(ALTERNATIVES.map((entry) => entry.slug))

const SEO_REDIRECTS: SeoRedirect[] = [
  {
    source: '/alternatives/signupgenius',
    destination: '/volunteer-management/best-software',
    permanent: true,
  },
  {
    source: '/compare/eventbrite',
    destination: '/compare/best-event-registration-software',
    permanent: true,
  },
  {
    source: '/glossary/recurring-payment',
    destination: '/resources/modern-dues-collection-best-practices',
    permanent: true,
  },
  {
    source: '/glossary/payment-gateway',
    destination: '/resources/modern-dues-collection-best-practices',
    permanent: true,
  },
  {
    source: '/glossary/payment-processor',
    destination: '/resources/modern-dues-collection-best-practices',
    permanent: true,
  },
  {
    source: '/glossary/merchant-account',
    destination: '/resources/modern-dues-collection-best-practices',
    permanent: true,
  },
] as const

export function isRetainedClubTypeSlug(slug: string): boolean {
  return RETAINED_CLUB_TYPE_SET.has(slug)
}

export function isRetainedHowToStartSlug(slug: string): boolean {
  return RETAINED_HOW_TO_START_SET.has(slug)
}

export function isRetainedGlossarySlug(slug: string): boolean {
  return RETAINED_GLOSSARY_SET.has(slug)
}

export function isRetainedComparisonSlug(slug: string): boolean {
  return RETAINED_COMPARISON_SET.has(slug)
}

export function isRetainedAlternativeSlug(slug: string): boolean {
  return RETAINED_ALTERNATIVE_SET.has(slug)
}

export function getSeoRedirects(): SeoRedirect[] {
  return [...SEO_REDIRECTS]
}

function getExplicitRedirectDestination(source: string): string | null {
  return SEO_REDIRECTS.find((entry) => entry.source === source)?.destination ?? null
}

export function getRetiredClubTypeRedirect(slug: string): string | null {
  if (!CLUB_TYPE_SLUG_SET.has(slug) || isRetainedClubTypeSlug(slug)) return null
  return '/for'
}

export function getRetiredHowToStartRedirect(slug: string): string | null {
  if (!HOW_TO_START_SLUG_SET.has(slug) || isRetainedHowToStartSlug(slug)) return null
  return '/how-to-start'
}

export function getRetiredGlossaryRedirect(slug: string): string | null {
  const explicit = getExplicitRedirectDestination(`/glossary/${slug}`)
  if (explicit) return explicit
  if (!GLOSSARY_SLUG_SET.has(slug) || isRetainedGlossarySlug(slug)) return null
  return '/glossary'
}

export function getRetiredComparisonRedirect(slug: string): string | null {
  const explicit = getExplicitRedirectDestination(`/compare/${slug}`)
  if (explicit) return explicit
  if (!COMPARISON_SLUG_SET.has(slug) || isRetainedComparisonSlug(slug)) return null
  return '/compare'
}

export function getRetiredAlternativeRedirect(slug: string): string | null {
  const explicit = getExplicitRedirectDestination(`/alternatives/${slug}`)
  if (explicit) return explicit
  if (!ALTERNATIVE_SLUG_SET.has(slug) || isRetainedAlternativeSlug(slug)) return null
  return '/alternatives'
}
