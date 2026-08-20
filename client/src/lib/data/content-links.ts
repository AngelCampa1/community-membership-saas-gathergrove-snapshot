import { CLUB_TYPES } from './club-types'
import { USE_CASES } from './use-cases'
import { RESOURCES } from './resources'
import { GLOSSARY_ENTRIES } from './glossary'
import { HOW_TO_START_ENTRIES } from './how-to-start'
import { COMPARISONS } from './comparisons'
import { ALTERNATIVES } from './alternatives'
import { TEMPLATES } from './templates'
import { BLOG_POSTS } from './blog-posts'
import {
  isRetainedAlternativeSlug,
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedGlossarySlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

export type ContentPageType =
  | 'for'
  | 'features'
  | 'resources'
  | 'glossary'
  | 'how-to-start'
  | 'compare'
  | 'alternatives'
  | 'best'
  | 'statistics'
  | 'switch-from'
  | 'volunteer-management'
  | 'templates'
  | 'blog'

export type FunnelStage = 'tofu' | 'mofu' | 'bofu'

export interface ContentLink {
  title: string
  href: string
  description: string
  type: ContentPageType
  slug: string
  funnelStage: FunnelStage
}

interface ContentLinkSource {
  title: string
  slug: string
  keywords: string[]
  type: ContentPageType
  description: string
  funnelStage: FunnelStage
}

export function getFunnelStageForType(type: ContentPageType): FunnelStage {
  switch (type) {
    case 'glossary':
    case 'how-to-start':
    case 'resources':
    case 'templates':
    case 'blog':
      return 'tofu'
    case 'for':
    case 'features':
      return 'mofu'
    case 'volunteer-management':
      return 'mofu'
    case 'compare':
    case 'alternatives':
    case 'best':
    case 'statistics':
    case 'switch-from':
      return 'bofu'
    default: {
      const _exhaustive: never = type
      throw new Error(`Unhandled ContentPageType: ${_exhaustive}`)
    }
  }
}

let _registryCache: ContentLinkSource[] | null = null

function getRegistry(): ContentLinkSource[] {
  if (!_registryCache) {
    _registryCache = buildRegistry()
  }
  return _registryCache
}

export function _resetRegistryForTesting(): void {
  _registryCache = null
}

function buildRegistry(): ContentLinkSource[] {
  const sources: ContentLinkSource[] = []

  for (const ct of CLUB_TYPES.filter((entry) => isRetainedClubTypeSlug(entry.slug))) {
    sources.push({
      title: ct.name,
      slug: ct.slug,
      keywords: ct.keywords,
      type: 'for',
      description: ct.description,
      funnelStage: 'mofu',
    })
  }

  for (const uc of USE_CASES) {
    sources.push({
      title: uc.title,
      slug: uc.slug,
      keywords: uc.keywords,
      type: 'features',
      description: uc.description,
      funnelStage: 'mofu',
    })
  }

  for (const r of RESOURCES) {
    sources.push({
      title: r.title,
      slug: r.slug,
      keywords: r.keywords,
      type: 'resources',
      description: r.description,
      funnelStage: 'tofu',
    })
  }

  for (const g of GLOSSARY_ENTRIES.filter((entry) => isRetainedGlossarySlug(entry.slug))) {
    sources.push({
      title: g.term,
      slug: g.slug,
      keywords: g.keywords,
      type: 'glossary',
      description: g.definition,
      funnelStage: 'tofu',
    })
  }

  for (const h of HOW_TO_START_ENTRIES.filter((entry) => isRetainedHowToStartSlug(entry.slug))) {
    sources.push({
      title: h.title,
      slug: h.slug,
      keywords: h.keywords,
      type: 'how-to-start',
      description: h.description,
      funnelStage: 'tofu',
    })
  }

  for (const c of COMPARISONS.filter((entry) => isRetainedComparisonSlug(entry.slug))) {
    sources.push({
      title: c.title,
      slug: c.slug,
      keywords: c.keywords,
      type: 'compare',
      description: c.description,
      funnelStage: 'bofu',
    })
  }

  for (const alt of ALTERNATIVES.filter((entry) => isRetainedAlternativeSlug(entry.slug))) {
    sources.push({
      title: alt.title,
      slug: alt.slug,
      keywords: alt.keywords,
      type: 'alternatives',
      description: alt.metaDescription,
      funnelStage: 'bofu',
    })
  }

  for (const tmpl of TEMPLATES) {
    sources.push({
      title: tmpl.title,
      slug: tmpl.slug,
      keywords: tmpl.keywords,
      type: 'templates',
      description: tmpl.description,
      funnelStage: 'tofu',
    })
  }

  for (const bp of BLOG_POSTS) {
    const funnelStage: FunnelStage =
      bp.buyerStage === 'decision' ? 'bofu' : bp.buyerStage === 'consideration' ? 'mofu' : 'tofu'
    sources.push({
      title: bp.title,
      slug: bp.slug,
      keywords: bp.keywords,
      type: 'blog',
      description: bp.description,
      funnelStage,
    })
  }

  // Volunteer management cluster pages (static, not in a data array)
  const volunteerCluster: ContentLinkSource[] = [
    {
      title: 'Volunteer Management Software for Nonprofits',
      slug: 'for-nonprofits',
      keywords: ['volunteer', 'nonprofit', 'volunteer management', 'nonprofit volunteer software', 'volunteer coordination'],
      type: 'volunteer-management',
      description: 'Free and paid volunteer management software tailored for nonprofit organizations.',
      funnelStage: 'mofu',
    },
    {
      title: 'Free Volunteer Management Software',
      slug: 'free',
      keywords: ['volunteer', 'free', 'volunteer management', 'free volunteer software', 'no cost volunteer tool'],
      type: 'volunteer-management',
      description: 'Compare free volunteer management software options for clubs and nonprofits.',
      funnelStage: 'mofu',
    },
    {
      title: 'Volunteer Scheduling Software',
      slug: 'scheduling',
      keywords: ['volunteer', 'scheduling', 'volunteer scheduling', 'schedule volunteers', 'shift management'],
      type: 'volunteer-management',
      description: 'Volunteer scheduling software that makes sign-ups, shifts, and reminders easy.',
      funnelStage: 'mofu',
    },
    {
      title: 'Best Volunteer Management Software',
      slug: 'best-software',
      keywords: ['volunteer', 'best volunteer management', 'volunteer management software', 'top volunteer tools', 'volunteer app'],
      type: 'volunteer-management',
      description: 'Ranked comparison of the best volunteer management software for clubs and nonprofits.',
      funnelStage: 'mofu',
    },
  ]
  sources.push(...volunteerCluster)

  // SEO gap pages - static feature pages at /features/* and /volunteer-management/*
  const seoGapPages: ContentLinkSource[] = [
    {
      title: 'Volunteer Hour Tracking Software',
      slug: 'hour-tracking',
      keywords: ['volunteer hour tracking', 'volunteer hours', 'service hour tracking', 'volunteer time tracking', 'log volunteer hours'],
      type: 'volunteer-management',
      description: 'Track and report volunteer hours with automated logging, approval workflows, and exportable reports.',
      funnelStage: 'mofu',
    },
    {
      title: 'Nonprofit Event Management Software',
      slug: 'nonprofit-event-management',
      keywords: ['nonprofit event management', 'nonprofit event software', 'event management nonprofit', 'fundraiser event software'],
      type: 'features',
      description: 'Plan, promote, and manage nonprofit events with registration, ticketing, and volunteer coordination.',
      funnelStage: 'mofu',
    },
    {
      title: 'Community Management Software',
      slug: 'community-management-software',
      keywords: ['community management software', 'community platform', 'community engagement software', 'online community management'],
      type: 'features',
      description: 'Build and manage online communities with member directories, forums, events, and communications.',
      funnelStage: 'mofu',
    },
    {
      title: 'Member Database Software',
      slug: 'member-database',
      keywords: ['member database', 'member database software', 'membership database', 'member management system', 'member directory software'],
      type: 'features',
      description: 'Centralized member database with custom fields, search, segmentation, and import/export.',
      funnelStage: 'mofu',
    },
  ]
  sources.push(...seoGapPages)

  // Best-X comparison pages - these are static routes at /compare/best-*
  // and are intentionally NOT in the COMPARISONS data array (which only stores 1-vs-1 pages).
  const bestXPages: ContentLinkSource[] = [
    {
      title: 'Best Membership Management Software',
      slug: 'best-membership-management-software',
      keywords: ['membership management software', 'best membership software', 'membership platform', 'member management'],
      type: 'compare',
      description: 'Ranked review of the best membership management software for clubs and associations.',
      funnelStage: 'bofu',
    },
    {
      title: 'Best Club Management Software',
      slug: 'best-club-management-software',
      keywords: ['club management software', 'best club software', 'club platform', 'club management tool'],
      type: 'compare',
      description: 'Ranked review of the best club management software for hobby clubs and organizations.',
      funnelStage: 'bofu',
    },
    {
      title: 'Best Event Registration Software',
      slug: 'best-event-registration-software',
      keywords: ['event registration software', 'best event software', 'event registration platform', 'online event registration'],
      type: 'compare',
      description: 'Ranked review of the best event registration software for clubs and nonprofits.',
      funnelStage: 'bofu',
    },
  ]
  sources.push(...bestXPages)

  return sources
}

export function hrefForType(type: ContentPageType, slug: string): string {
  switch (type) {
    case 'for':
      return `/for/${slug}`
    case 'features':
      return `/features/${slug}`
    case 'resources':
      return `/resources/${slug}`
    case 'glossary':
      return `/glossary/${slug}`
    case 'how-to-start':
      return `/how-to-start/${slug}`
    case 'compare':
      return `/compare/${slug}`
    case 'alternatives':
      return `/alternatives/${slug}`
    case 'best':
      return `/best/${slug}`
    case 'statistics':
      return `/statistics/${slug}`
    case 'switch-from':
      return `/switch-from/${slug}`
    case 'volunteer-management':
      return `/volunteer-management/${slug}`
    case 'templates':
      return `/templates/${slug}`
    case 'blog':
      return `/blog/${slug}`
    default: {
      const _exhaustive: never = type
      throw new Error(`Unhandled ContentPageType: ${_exhaustive}`)
    }
  }
}

function scoreOverlap(pageKeywords: string[], sourceKeywords: string[]): number {
  const normalizedPage = pageKeywords.map((k) => k.toLowerCase())
  let score = 0
  for (const sk of sourceKeywords) {
    const lower = sk.toLowerCase()
    for (const pk of normalizedPage) {
      if (lower.includes(pk) || pk.includes(lower)) {
        score++
        break
      }
    }
  }
  return score
}

export function getRelatedContent(opts: {
  keywords: string[]
  currentType: ContentPageType
  currentSlug: string
  maxResults?: number
  filterStage?: FunnelStage
}): ContentLink[] {
  const { keywords, currentType, currentSlug, maxResults = 6, filterStage } = opts
  const registry = getRegistry()

  const scored = registry
    .filter((s) => !(s.type === currentType && s.slug === currentSlug))
    .filter((s) => filterStage === undefined || s.funnelStage === filterStage)
    .map((s) => ({
      source: s,
      score: scoreOverlap(keywords, s.keywords),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  return scored.map((s) => ({
    title: s.source.title,
    href: hrefForType(s.source.type, s.source.slug),
    description: s.source.description,
    type: s.source.type,
    slug: s.source.slug,
    funnelStage: s.source.funnelStage,
  }))
}

/**
 * Returns link targets suitable for in-body auto-linking.
 * Prioritizes glossary terms (exact phrase matches) and feature page titles.
 * Excludes the current page to avoid self-links.
 */
export function getAutoLinkTargets(opts: {
  currentType: ContentPageType
  currentSlug: string
}): Array<{ phrase: string; href: string }> {
  const { currentType, currentSlug } = opts
  const registry = getRegistry()

  return registry
    .filter((s) => !(s.type === currentType && s.slug === currentSlug))
    .filter((s) => s.type === 'glossary' || s.type === 'features')
    .map((s) => ({
      phrase: s.title,
      href: hrefForType(s.type, s.slug),
    }))
    .sort((a, b) => b.phrase.length - a.phrase.length) // longer phrases first to prevent partial matches
}

export function getNextFunnelContent(opts: {
  keywords: string[]
  currentType: ContentPageType
  currentSlug: string
  maxResults?: number
}): ContentLink[] {
  const currentStage = getFunnelStageForType(opts.currentType)
  const nextStage: FunnelStage | undefined =
    currentStage === 'tofu' ? 'mofu' : currentStage === 'mofu' ? 'bofu' : undefined

  if (!nextStage) return []

  return getRelatedContent({ ...opts, filterStage: nextStage })
}
