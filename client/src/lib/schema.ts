import {
  SITE_URL,
  SITE_NAME,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_AUTHOR_LINKEDIN,
  TWITTER_PROFILE_URL,
  LINKEDIN_URL,
  LOGO_PATH,
  SUPPORT_EMAIL,
} from './site-config'
import { FREE_TRIAL_DAYS, PRICING_CURRENCY, PRICING_PLANS, formatPricingFaqAnswer } from './pricing'

// ---------------------------------------------------------------------------
// Schema interfaces
// ---------------------------------------------------------------------------

export interface OrganizationSchema {
  '@context': string
  '@type': 'Organization'
  name: string
  description: string
  url: string
  foundingDate: string
  logo: string
  sameAs: string[]
  contactPoint: {
    '@type': 'ContactPoint'
    contactType: string
    email: string
  }
}

export interface SoftwareApplicationSchema {
  '@context': string
  '@type': 'SoftwareApplication'
  name: string
  applicationCategory: string
  operatingSystem: string
  description: string
  url: string
  author: { '@type': 'Organization'; name: string }
  offers: Array<{
    '@type': 'Offer'
    name: string
    price: string
    priceCurrency: string
    priceSpecification: {
      '@type': 'UnitPriceSpecification'
      price: string
      priceCurrency: string
      unitText: string
    }
    description: string
  }>
  featureList: string[]
}

export interface WebSiteSchema {
  '@context': string
  '@type': 'WebSite'
  name: string
  url: string
  potentialAction: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

export interface FAQPageSchema {
  '@context': string
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

export interface ArticleSchema {
  '@context': string
  '@type': 'Article'
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  author: { '@type': 'Person'; name: string; url: string }
  publisher: { '@type': 'Organization'; name: string; logo: { '@type': 'ImageObject'; url: string }; url: string }
  mainEntityOfPage: { '@type': 'WebPage'; '@id': string }
  keywords?: string[]
  speakable?: { '@type': 'SpeakableSpecification'; cssSelector: string[] }
}

export interface BreadcrumbSchema {
  '@context': string
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

export interface ServiceSchema {
  '@context': string
  '@type': 'Service'
  name: string
  description: string
  serviceType: string
  provider: { '@type': 'Organization'; name: string; url: string }
  areaServed: { '@type': 'Country'; name: string }
  hasOfferCatalog: {
    '@type': 'OfferCatalog'
    name: string
    itemListElement: Array<{
      '@type': 'Offer'
      name: string
      description: string
      price: string
      priceCurrency: string
    }>
  }
  termsOfService: string
  availableChannel: { '@type': 'ServiceChannel'; serviceUrl: string; serviceType: string }
}

export interface EventSchema {
  '@context': string
  '@type': 'Event'
  name: string
  description: string
  eventAttendanceMode: string
  eventStatus: string
  organizer: { '@type': 'Organization'; name: string; url: string }
  offers: {
    '@type': 'Offer'
    availability: string
    price: string
    priceCurrency: string
    validFrom: string
    url: string
  }
  performer: { '@type': 'Organization'; name: string }
}

export interface ItemListSchema {
  '@context': string
  '@type': 'ItemList'
  name: string
  description: string
  numberOfItems: number
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    description: string
    url: string
  }>
}

export interface PersonSchema {
  '@context': string
  '@type': 'Person'
  name: string
  url: string
  jobTitle: string
  worksFor: { '@type': 'Organization'; name: string; url: string }
  sameAs: string[]
  description?: string
}

// ---------------------------------------------------------------------------
// Builder functions
// ---------------------------------------------------------------------------

export function buildOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    description: 'All-in-one membership and event management platform for organizations',
    url: SITE_URL,
    foundingDate: '2024',
    logo: `${SITE_URL}${LOGO_PATH}`,
    sameAs: [TWITTER_PROFILE_URL, LINKEDIN_URL],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
    },
  }
}

export function buildPersonSchema(): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_AUTHOR_NAME,
    url: `${SITE_URL}/about`,
    jobTitle: 'Founder',
    worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    sameAs: [SITE_AUTHOR_LINKEDIN, TWITTER_PROFILE_URL],
    description:
      'Founder of GatherGrove, a membership and event management platform for hobby clubs and community organizations.',
  }
}

export function buildSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GatherGrove Membership Management Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description:
      'Complete membership and event management solution for organizations including member management, dues collection, event coordination, and communication tools.',
    url: SITE_URL,
    author: { '@type': 'Organization', name: SITE_NAME },
    offers: PRICING_PLANS.map((plan) => ({
      '@type': 'Offer' as const,
      name: `${plan.name} Plan`,
      price: String(plan.monthlyPrice),
      priceCurrency: PRICING_CURRENCY,
      priceSpecification: {
        '@type': 'UnitPriceSpecification' as const,
        price: String(plan.monthlyPrice),
        priceCurrency: PRICING_CURRENCY,
        unitText: 'monthly',
      },
      description: `${plan.name} supports up to ${plan.memberLimit.toLocaleString()} members. ${FREE_TRIAL_DAYS}-day free trial.`,
    })),
    featureList: [
      'Member database management',
      'Automated dues collection',
      'Event management with RSVP tracking',
      'Email, push notifications, and chat',
      'Mobile app for members',
      'Payment processing integration',
      'Custom member fields',
      'Analytics and reporting',
    ],
  }
}

export function buildWebsiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/resources?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildFAQPageSchema(
  questions: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question' as const,
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: q.answer,
      },
    })),
  }
}

export function buildArticleSchema(opts: {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified: string
  keywords?: string[]
  speakableCssSelectors?: string[]
}): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}/${opts.slug}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
      url: `${SITE_URL}${SITE_AUTHOR_URL}`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}${LOGO_PATH}` },
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/${opts.slug}`,
    },
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    ...(opts.speakableCssSelectors
      ? { speakable: { '@type': 'SpeakableSpecification' as const, cssSelector: opts.speakableCssSelectors } }
      : {}),
  }
}

export interface BlogPostingSchema {
  '@context': string
  '@type': 'BlogPosting'
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  author: { '@type': 'Person'; name: string; url: string }
  publisher: { '@type': 'Organization'; name: string; logo: { '@type': 'ImageObject'; url: string }; url: string }
  mainEntityOfPage: { '@type': 'WebPage'; '@id': string }
  keywords?: string[]
  speakable?: { '@type': 'SpeakableSpecification'; cssSelector: string[] }
}

export function buildBlogPostingSchema(opts: {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified: string
  keywords?: string[]
}): BlogPostingSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}/blog/${opts.slug}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
      url: `${SITE_URL}${SITE_AUTHOR_URL}`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}${LOGO_PATH}` },
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${opts.slug}`,
    },
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-ai-answer]', '#key-takeaways'],
    },
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export function buildServiceSchema(): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'GatherGrove Membership Management Service',
    description:
      'Complete membership management solution including member database, dues collection, event management, and communication tools for organizations.',
    serviceType: 'Membership Management Software',
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'United States' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'GatherGrove Plans',
      itemListElement: PRICING_PLANS.map((plan) => ({
        '@type': 'Offer' as const,
        name: `${plan.name} Plan`,
        description: `${plan.name} supports up to ${plan.memberLimit.toLocaleString()} members. ${FREE_TRIAL_DAYS}-day free trial.`,
        price: String(plan.monthlyPrice),
        priceCurrency: PRICING_CURRENCY,
      })),
    },
    termsOfService: `${SITE_URL}/terms-of-service`,
    availableChannel: { '@type': 'ServiceChannel', serviceUrl: SITE_URL, serviceType: 'Web Application' },
  }
}

export function buildEventSchema(): EventSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'GatherGrove Member Events',
    description:
      'Community events managed through GatherGrove\'s event management platform with RSVP tracking, ticketing, and check-in.',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'USD',
      validFrom: '2024-01-01',
      url: SITE_URL,
    },
    performer: { '@type': 'Organization', name: 'GatherGrove Community' },
  }
}

export function buildItemListSchema(opts: {
  name: string
  description: string
  items: Array<{ name: string; url: string; description: string }>
}): ItemListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    description: opts.description,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: item.name,
      description: item.description,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export interface WebApplicationSchema {
  '@context': string
  '@type': 'WebApplication'
  name: string
  description: string
  url: string
  applicationCategory: string
  operatingSystem: string
  isAccessibleForFree: boolean
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
  }
  author: { '@type': 'Organization'; name: string; url: string }
}

export function buildWebApplicationSchema(opts: {
  name: string
  description: string
  slug: string
}): WebApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}/${opts.slug}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

// ---------------------------------------------------------------------------
// pSEO expansion builders
// ---------------------------------------------------------------------------

export interface DefinedTermSchema {
  '@context': string
  '@type': 'DefinedTerm'
  name: string
  description: string
  url: string
  termCode: string
  inDefinedTermSet: {
    '@type': 'DefinedTermSet'
    name: string
    url: string
  }
}

export function buildDefinedTermSchema(opts: {
  term: string
  definition: string
  slug: string
  category: string
}): DefinedTermSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: opts.term,
    description: opts.definition,
    url: `${SITE_URL}/glossary/${opts.slug}`,
    termCode: opts.category,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Club Management Glossary',
      url: `${SITE_URL}/glossary`,
    },
  }
}

export interface HowToSchema {
  '@context': string
  '@type': 'HowTo'
  name: string
  description: string
  url: string
  step: Array<{
    '@type': 'HowToStep'
    position: number
    name: string
    text: string
  }>
  totalTime?: string
  estimatedCost?: {
    '@type': 'MonetaryAmount'
    currency: string
    value: string
  }
}

export function buildHowToSchema(opts: {
  name: string
  description: string
  slug: string
  steps: Array<{ title: string; description: string }>
  estimatedCost?: string
}): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}/${opts.slug}`,
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep' as const,
      position: i + 1,
      name: s.title,
      text: s.description,
    })),
    ...(opts.estimatedCost
      ? {
          estimatedCost: {
            '@type': 'MonetaryAmount' as const,
            currency: 'USD',
            value: opts.estimatedCost,
          },
        }
      : {}),
  }
}

export function buildClubTypeHowToSchema(opts: {
  clubTypeName: string
  slug: string
  features: string[]
}): HowToSchema {
  const steps = [
    { title: 'Create your club account', text: `Sign up for GatherGrove and set up your ${opts.clubTypeName.toLowerCase()} profile in under 5 minutes. Add your club name, description, and logo.` },
    { title: 'Import or add your members', text: `Import existing members from a CSV spreadsheet or add them manually. Assign roles, set custom fields, and send welcome emails automatically.` },
    { title: 'Configure dues and payments', text: `Connect your Stripe account to enable online dues collection. Set your membership fee, billing period, and automatic renewal reminders.` },
    ...opts.features.slice(0, 3).map((feature) => ({
      title: `Set up ${feature.toLowerCase()}`,
      text: `Configure ${feature.toLowerCase()} for your ${opts.clubTypeName.toLowerCase()} using GatherGrove's built-in tools. Members can access this feature from any device.`,
    })),
    { title: 'Invite members and launch', text: `Send invitations to your members by email or share a direct join link. Members create their own profiles and the club is ready to go.` },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Set Up ${opts.clubTypeName} Management Software`,
    description: `Step-by-step guide to setting up GatherGrove for your ${opts.clubTypeName.toLowerCase()}, including member management, dues collection, and event coordination.`,
    url: `${SITE_URL}/for/${opts.slug}`,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep' as const,
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  }
}

// ---------------------------------------------------------------------------
// Default FAQ questions (used by root StructuredData)
// ---------------------------------------------------------------------------

export const DEFAULT_FAQ_QUESTIONS = [
  {
    question: 'What is the best club management software?',
    answer:
      'GatherGrove is a comprehensive membership and event management platform for hobby clubs, nonprofits, and community organizations. It consolidates member management, automated dues collection, event coordination, and multi-channel communication into one integrated platform with mobile apps for iOS and Android.',
  },
  {
    question: 'How much does club management software cost?',
    answer: formatPricingFaqAnswer(),
  },
  {
    question: 'What types of organizations can use GatherGrove?',
    answer:
      'GatherGrove is designed for recreational clubs, professional associations, nonprofits, community groups, alumni associations, hobby clubs, sports leagues, book clubs, running clubs, and any small to medium-sized membership organization that needs to manage members, events, and payments.',
  },
  {
    question: 'Does GatherGrove replace spreadsheets for club management?',
    answer:
      'Yes. GatherGrove replaces spreadsheets, separate payment tools, and email services with one platform. It automates dues collection via Stripe, sends member emails, simplifies event coordination with RSVP tracking and QR check-in, and provides analytics dashboards.',
  },
  {
    question: 'Is there a mobile app for club members?',
    answer:
      'Yes, GatherGrove includes native mobile apps for iOS and Android on all paid plans. Members can view events, RSVP, pay dues, access the member directory, use digital membership cards, and receive push notifications directly on their mobile devices.',
  },
]
