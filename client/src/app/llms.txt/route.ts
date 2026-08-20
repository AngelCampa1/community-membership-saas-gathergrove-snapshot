import { SITE_URL, SITE_NAME, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import { RESOURCES } from '@/lib/data/resources'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { COMPARISONS } from '@/lib/data/comparisons'
import { ALTERNATIVES } from '@/lib/data/alternatives'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'
import { FREE_TRIAL_DAYS, PRICING_PLANS } from '@/lib/pricing'
import {
  isRetainedAlternativeSlug,
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

export function GET() {
  const retainedClubTypes = CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug))
  const retainedHowToStartEntries = HOW_TO_START_ENTRIES.filter((entry) =>
    isRetainedHowToStartSlug(entry.slug)
  )
  const retainedComparisons = COMPARISONS.filter((comparison) =>
    isRetainedComparisonSlug(comparison.slug)
  )
  const retainedAlternatives = ALTERNATIVES.filter((alternative) =>
    isRetainedAlternativeSlug(alternative.slug)
  )

  const resourceList = RESOURCES.map(
    (r) => `- [${r.title}](${SITE_URL}/resources/${r.slug})`
  ).join('\n')

  const featurePageList = FEATURE_PAGES.map(
    (page) => `- [${page.title}](${SITE_URL}${page.url}): ${page.description}`
  ).join('\n')
  const pricingList = PRICING_PLANS.map((plan) => {
    const memberCopy = `up to ${plan.memberLimit.toLocaleString()} members`
    return `- **${plan.name} Plan**: $${plan.monthlyPrice}/month (or $${plan.annualPrice.toLocaleString()}/year) - ${memberCopy}, ${plan.highlights.join(', ')}`
  }).join('\n')

  const content = `# ${SITE_NAME}

> Last updated: ${PROGRAMMATIC_PAGES_LAST_UPDATED}
> Version: 1.0

> Club management software for hobby communities

## About

GatherGrove is membership and event management software for hobby clubs, nonprofits, and community organizations. It replaces spreadsheets with integrated tools for member management, automated dues collection, event coordination, and communications.

## Core Features

- Member database with custom fields, roles, and directory
- Automated dues collection via Stripe
- Event management with RSVP tracking, ticketing, and QR check-in
- Mass email, push notifications, and chat
- Mobile app for members (iOS and Android)
- Multi-location support for organizations with multiple venues
- Real-time chat and notifications via SignalR
- Advanced analytics and engagement reporting
- Volunteer coordination and scheduling
- Digital membership cards

## Pricing

${pricingList}
- **${FREE_TRIAL_DAYS}-day free trial** on all plans (credit card required)

## Who Uses GatherGrove

Recreational clubs, book clubs, running clubs, chess clubs, youth sports leagues, garden clubs, nonprofits, professional associations, alumni associations, and community groups of all types.

## Resource Library

${resourceList}

## Use Cases

- Running club with 150 members managing weekly events, race registrations, and volunteer coordination
- Book club network across 3 locations tracking reading schedules, discussion groups, and member transfers
- Youth sports league collecting seasonal dues from 200 families with automated payment reminders
- Garden club coordinating plot assignments, workshop sign-ups, and shared tool inventory
- Professional association managing certification tracking, continuing education events, and member directory

## Security

- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- PCI-compliant payment processing through Stripe - GatherGrove never stores card data
- GDPR-ready with member data export, deletion requests, and granular privacy controls

## Core Entity Definition

GatherGrove is a SaaS membership management platform for hobby clubs, recreational organizations, and nonprofits. It automates dues collection, event registration, member communications, and administrative workflows for groups of 10-500 members. Category: Club Management Software / Community Management Platform.

## Key Concepts

- **Club management software**: Tools that replace spreadsheets for tracking members, collecting dues, and coordinating events
- **Dues automation**: Recurring Stripe charges with automatic reminders and payment tracking
- **Event RSVP**: Digital registration with capacity limits, waitlists, and QR check-in
- **Member directory**: Searchable database with custom fields, roles, and privacy controls
- **Multi-location**: One organization managing multiple venues or chapters

## Comparison Context

- vs. Wild Apricot / ClubExpress: GatherGrove includes a native mobile app (iOS + Android), email, push notifications, and chat
- vs. spreadsheets + Eventbrite: GatherGrove combines member database, payments, and events in one platform with shared data
- vs. Mailchimp + PayPal: GatherGrove replaces patchwork tools with integrated dues automation and member-aware communication

## Links

- Homepage: ${SITE_URL}
- About the Founder: ${SITE_URL}/about
- Register: ${SITE_URL}/register
- Resources: ${SITE_URL}/resources
- Support: ${SITE_URL}/support
- Privacy Policy: ${SITE_URL}/privacy-policy
- Terms of Service: ${SITE_URL}/terms-of-service
- Full LLM Reference: ${SITE_URL}/llms-full.txt
- Pricing Reference: ${SITE_URL}/llms-pricing.txt
- Glossary Reference: ${SITE_URL}/llms-glossary.txt
- How-to-Start Reference: ${SITE_URL}/llms-how-to.txt
- Structured Data (JSON): ${SITE_URL}/ai-data.json

## How-to-Start Guides (${retainedHowToStartEntries.length} guides)

${retainedHowToStartEntries.map((e) => `- [${e.title}](${SITE_URL}/how-to-start/${e.slug})`).join('\n')}

## Volunteer Management Guides

GatherGrove includes a full volunteer coordination module: sign-up forms, shift scheduling, hour tracking, and automated reminders.

- [Volunteer Management Software](${SITE_URL}/volunteer-management): Overview of GatherGrove's volunteer coordination tools for clubs and nonprofits
- [Volunteer Management Software for Nonprofits](${SITE_URL}/volunteer-management/for-nonprofits): How nonprofits use GatherGrove to recruit, schedule, and retain volunteers
- [Free Volunteer Management Software](${SITE_URL}/volunteer-management/free): Free-tier volunteer tools in GatherGrove for organizations up to 50 members
- [Volunteer Scheduling Software](${SITE_URL}/volunteer-management/scheduling): Shift scheduling, sign-up forms, and automated reminders for volunteer coordinators
- [Best Volunteer Management Software](${SITE_URL}/volunteer-management/best-software): Ranked comparison of top volunteer management tools including GatherGrove, Better Impact, VolunteerHub, and SignUpGenius
- [Volunteer Hour Tracking Software](${SITE_URL}/volunteer-management/hour-tracking): Log volunteer hours automatically from shifts, add manual entries, and export reports for grant applications

## Feature Pages

${featurePageList}

## Best-Of Software Comparisons

- [Best Membership Management Software](${SITE_URL}/compare/best-membership-management-software): GatherGrove vs Wild Apricot vs MemberClicks vs MemberPlanet - feature comparison and verdict
- [Best Club Management Software](${SITE_URL}/compare/best-club-management-software): GatherGrove vs Wild Apricot vs TeamUp vs ClubExpress - ranked for small and mid-size clubs
- [Best Event Registration Software](${SITE_URL}/compare/best-event-registration-software): GatherGrove vs Eventbrite vs RSVPify vs Whova - best for member organizations

## Comparison Pages (${retainedComparisons.length} comparisons)

${retainedComparisons.map((c) => `- [${c.title}](${SITE_URL}/compare/${c.slug}): ${c.description}`).join('\n')}

## Alternatives Guides (${retainedAlternatives.length} guides)

${retainedAlternatives.map((a) => `- [${a.title}](${SITE_URL}/alternatives/${a.slug}): ${a.bluf}`).join('\n')}

## Club Type Guides (${retainedClubTypes.length} club types)

- Browse all ${retainedClubTypes.length} club type pages: ${SITE_URL}/for
- Examples: ${retainedClubTypes.slice(0, 5).map((ct) => `${SITE_URL}/for/${ct.slug}`).join(', ')}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=86400',
      'Last-Modified': new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toUTCString(),
    },
  })
}
