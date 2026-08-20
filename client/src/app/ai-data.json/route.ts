import { SITE_URL, SITE_NAME, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import { RESOURCES } from '@/lib/data/resources'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'
import { COMPARISONS } from '@/lib/data/comparisons'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { DEFAULT_FAQ_QUESTIONS } from '@/lib/schema'
import {
  FREE_TRIAL_DAYS,
  PAYMENT_PROCESSOR_COPY,
  PLATFORM_FEE_COPY,
  PRICING_CURRENCY,
  PRICING_PLANS,
} from '@/lib/pricing'
import {
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

export function GET() {
  const retainedClubTypes = CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug))
  const retainedComparisons = COMPARISONS.filter((comparison) =>
    isRetainedComparisonSlug(comparison.slug)
  )
  const retainedHowToStartGuides = HOW_TO_START_ENTRIES.filter((entry) =>
    isRetainedHowToStartSlug(entry.slug)
  )

  const data = {
    name: SITE_NAME,
    description: 'All-in-one membership and event management platform for hobby clubs, nonprofits, and community organizations.',
    url: SITE_URL,
    lastUpdated: PROGRAMMATIC_PAGES_LAST_UPDATED,
    version: '1.0',
    category: 'Club Management Software',
    targetMarket: 'Small to medium organizations (10-500 members)',
    platforms: ['Web', 'iOS', 'Android'],
    pricing: {
      currency: PRICING_CURRENCY,
      plans: PRICING_PLANS.map((plan) => ({
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        memberLimit: plan.memberLimit,
        adminLimit: plan.adminLimit,
        emailLimit: plan.emailLimit,
        freeTrial: `${FREE_TRIAL_DAYS} days`,
        highlights: plan.highlights,
      })),
      platformFee: PLATFORM_FEE_COPY,
      paymentProcessor: PAYMENT_PROCESSOR_COPY,
    },
    features: [
      'Member database with custom fields, roles, and directory',
      'Automated dues collection via Stripe with payment reminders',
      'Event management with RSVP tracking, ticketing, waitlists, and QR check-in',
      'Mass communications: email and push notifications',
      'Native mobile app for iOS and Android',
      'Multi-location support with member transfers',
      'Real-time chat and community features via SignalR',
      'Advanced analytics, engagement metrics, and reporting',
      'Volunteer coordination and scheduling',
      'Digital membership cards',
    ],
    useCases: FEATURE_PAGES.map((page) => ({
      name: page.title,
      slug: page.slug,
      description: page.description,
      keywords: page.keywords,
      pageType: page.pageType,
      url: `${SITE_URL}${page.url}`,
    })),
    clubTypes: retainedClubTypes.map((ct) => ({
      name: ct.name,
      slug: ct.slug,
      url: `${SITE_URL}/for/${ct.slug}`,
    })),
    resources: RESOURCES.map((r) => ({
      title: r.title,
      slug: r.slug,
      url: `${SITE_URL}/resources/${r.slug}`,
      category: r.category,
    })),
    faq: DEFAULT_FAQ_QUESTIONS.map((q) => ({
      question: q.question,
      answer: q.answer,
    })),
    comparisons: {
      vsSpreadsheets: 'GatherGrove replaces spreadsheets with integrated member management, automated payments, and event coordination in one platform.',
      vsWildApricot: 'GatherGrove includes a native mobile app for iOS and Android. Wild Apricot does not.',
      vsMultipleTools: 'GatherGrove consolidates member database, payments, events, and communications into one platform, replacing Eventbrite + Mailchimp + PayPal + spreadsheets.',
    },
    comparisonPages: retainedComparisons.map((c) => ({
      slug: c.slug,
      title: c.title,
      competitor: c.competitorName,
      url: `${SITE_URL}/compare/${c.slug}`,
    })),
    howToStartGuides: retainedHowToStartGuides.map((e) => ({
      slug: e.slug,
      title: e.title,
      category: e.category,
      url: `${SITE_URL}/how-to-start/${e.slug}`,
      estimatedStartupCost: e.estimatedStartupCost,
      minMembersToLaunch: e.minMembersToLaunch,
      stepCount: e.steps.length,
    })),
    security: {
      encryption: 'TLS 1.3 in transit, AES-256 at rest',
      payments: 'PCI-compliant via Stripe - no card data stored',
      privacy: 'GDPR-ready with data export and deletion requests',
      hosting: 'Azure-hosted infrastructure with monitored uptime',
    },
    links: {
      homepage: SITE_URL,
      pricing: `${SITE_URL}/pricing`,
      register: `${SITE_URL}/register`,
      resources: `${SITE_URL}/resources`,
      about: `${SITE_URL}/about`,
      support: `${SITE_URL}/support`,
      llmsTxt: `${SITE_URL}/llms.txt`,
      llmsFullTxt: `${SITE_URL}/llms-full.txt`,
      llmsPricingTxt: `${SITE_URL}/llms-pricing.txt`,
      llmsGlossaryTxt: `${SITE_URL}/llms-glossary.txt`,
      glossary: `${SITE_URL}/glossary`,
      privacyPolicy: `${SITE_URL}/privacy-policy`,
      termsOfService: `${SITE_URL}/terms-of-service`,
    },
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=86400',
      'Last-Modified': new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toUTCString(),
    },
  })
}
