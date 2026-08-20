import {
  SITE_URL,
  PROGRAMMATIC_PAGES_LAST_UPDATED,
  GLOSSARY_LAST_UPDATED,
  HOW_TO_START_LAST_UPDATED,
  CLUB_TYPES_LAST_UPDATED,
  COMPARISONS_LAST_UPDATED,
  ALTERNATIVES_LAST_UPDATED,
  TEMPLATES_LAST_UPDATED,
  VOLUNTEER_MGMT_LAST_UPDATED,
  BLOG_LAST_UPDATED,
} from '@/lib/site-config'
import { RESOURCES } from '@/lib/data/resources'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'
import { GLOSSARY_ENTRIES } from '@/lib/data/glossary'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { COMPARISONS } from '@/lib/data/comparisons'
import { ALTERNATIVES } from '@/lib/data/alternatives'
import { TEMPLATES } from '@/lib/data/templates'
import { BLOG_POSTS } from '@/lib/data/blog-posts'
import {
  isRetainedAlternativeSlug,
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedGlossarySlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export type SitemapEntry = {
  url: string
  lastModified: string
  changeFrequency: ChangeFrequency
  priority: number
}

export function buildXml(entries: SitemapEntry[]): string {
  // URLs come from static TypeScript constants only - no user input, no DB slugs.
  // If dynamic slugs are ever added, add XML escaping here before interpolating.
  const urls = entries
    .map(
      (e) =>
        `<url><loc>${e.url}</loc><lastmod>${e.lastModified}</lastmod><changefreq>${e.changeFrequency}</changefreq><priority>${e.priority}</priority></url>`
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function generateSitemapEntries(): SitemapEntry[] {
  const programmaticDate = PROGRAMMATIC_PAGES_LAST_UPDATED

  const staticPages: SitemapEntry[] = [
    { url: SITE_URL, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/pricing`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/ai-data.json`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms.txt`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms-full.txt`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms-pricing.txt`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms-glossary.txt`, lastModified: GLOSSARY_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms-how-to.txt`, lastModified: HOW_TO_START_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/llms-alternatives.txt`, lastModified: ALTERNATIVES_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/support`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: programmaticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms-of-service`, lastModified: programmaticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const resourcePages: SitemapEntry[] = [
    { url: `${SITE_URL}/resources`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.8 },
    ...RESOURCES.map((r) => ({
      url: `${SITE_URL}/resources/${r.slug}`,
      lastModified: r.dateModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  const hubPages: SitemapEntry[] = [
    { url: `${SITE_URL}/for`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/features`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/glossary`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.65 },
    { url: `${SITE_URL}/how-to-start`, lastModified: programmaticDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/volunteer-management`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/volunteer-management/for-nonprofits`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/free`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/scheduling`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/best-software`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/hour-tracking`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/for-schools`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/for-churches`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/volunteer-management/app`, lastModified: VOLUNTEER_MGMT_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/compare/best-membership-management-software`, lastModified: COMPARISONS_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/compare/best-club-management-software`, lastModified: COMPARISONS_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/compare/best-event-registration-software`, lastModified: COMPARISONS_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.75 },
  ]

  const clubTypePages: SitemapEntry[] = CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug)).map((ct) => ({
    url: `${SITE_URL}/for/${ct.slug}`,
    lastModified: CLUB_TYPES_LAST_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const featurePages: SitemapEntry[] = FEATURE_PAGES.map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: programmaticDate,
    changeFrequency: 'monthly' as const,
    priority: page.pageType === 'specialized' ? 0.75 : 0.65,
  }))

  const glossaryPages: SitemapEntry[] = GLOSSARY_ENTRIES.filter((e) => isRetainedGlossarySlug(e.slug)).map((e) => ({
    url: `${SITE_URL}/glossary/${e.slug}`,
    lastModified: GLOSSARY_LAST_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const howToStartPages: SitemapEntry[] = HOW_TO_START_ENTRIES.filter((e) => isRetainedHowToStartSlug(e.slug)).map((e) => ({
    url: `${SITE_URL}/how-to-start/${e.slug}`,
    lastModified: HOW_TO_START_LAST_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const comparePages: SitemapEntry[] = [
    { url: `${SITE_URL}/compare`, lastModified: COMPARISONS_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    ...COMPARISONS.filter((c) => isRetainedComparisonSlug(c.slug)).map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: COMPARISONS_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  const alternativesPages: SitemapEntry[] = [
    { url: `${SITE_URL}/alternatives`, lastModified: ALTERNATIVES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    ...ALTERNATIVES.filter((a) => isRetainedAlternativeSlug(a.slug)).map((a) => ({
      url: `${SITE_URL}/alternatives/${a.slug}`,
      lastModified: ALTERNATIVES_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  const templatePages: SitemapEntry[] = [
    { url: `${SITE_URL}/templates`, lastModified: TEMPLATES_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.75 },
    ...TEMPLATES.map((t) => ({
      url: `${SITE_URL}/templates/${t.slug}`,
      lastModified: TEMPLATES_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  const blogPages: SitemapEntry[] = [
    { url: `${SITE_URL}/blog`, lastModified: BLOG_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    ...BLOG_POSTS.map((bp) => ({
      url: `${SITE_URL}/blog/${bp.slug}`,
      lastModified: bp.dateModified,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7,
    })),
  ]

  const toolPages: SitemapEntry[] = [
    { url: `${SITE_URL}/tools`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/club-dues-calculator`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/tool-stack-cost-calculator`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/event-budget-planner`, lastModified: programmaticDate, changeFrequency: 'monthly', priority: 0.7 },
  ]

  return [
    ...staticPages,
    ...resourcePages,
    ...hubPages,
    ...clubTypePages,
    ...featurePages,
    ...glossaryPages,
    ...howToStartPages,
    ...comparePages,
    ...alternativesPages,
    ...templatePages,
    ...blogPages,
    ...toolPages,
  ]
}
