import { SITE_URL, SITE_NAME, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import { RESOURCES } from '@/lib/data/resources'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'
import { TEMPLATES } from '@/lib/data/templates'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { isRetainedClubTypeSlug, isRetainedHowToStartSlug } from '@/lib/seo-content-config'
import { FREE_TRIAL_DAYS, PAYMENT_PROCESSOR_COPY, PLATFORM_FEE_COPY, PRICING_PLANS, SEED_MONTHLY_PRICE_COPY, formatPricingFaqAnswer } from '@/lib/pricing'

export function GET() {
  const retainedClubTypes = CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug))
  const retainedHowToStartEntries = HOW_TO_START_ENTRIES.filter((entry) =>
    isRetainedHowToStartSlug(entry.slug)
  )

  const resourceList = RESOURCES.map(
    (r) => `- [${r.title}](${SITE_URL}/resources/${r.slug}) - ${r.description}`
  ).join('\n')

  const clubTypeList = retainedClubTypes.map(
    (ct) => `- [${ct.name}](${SITE_URL}/for/${ct.slug}) - ${ct.description}`
  ).join('\n')

  const useCaseList = FEATURE_PAGES.map(
    (page) => `- [${page.title}](${SITE_URL}${page.url}): ${page.description}`
  ).join('\n')

  const templateList = TEMPLATES.map(
    (t) => `- [${t.title}](${SITE_URL}/templates/${t.slug}) - ${t.description}`
  ).join('\n')

  const howToStartList = retainedHowToStartEntries.map(
    (e) => `- [${e.title}](${SITE_URL}/how-to-start/${e.slug}) - ${e.description.slice(0, 120)}...`
  ).join('\n')
  const keyFactsPricing = `${PRICING_PLANS.map((plan) => `${plan.name} ($${plan.monthlyPrice}/month)`).join(', ')}, ${FREE_TRIAL_DAYS}-day free trial`
  const pricingDetails = PRICING_PLANS.map((plan) => `### ${plan.name} Plan ($${plan.monthlyPrice}/month or $${plan.annualPrice.toLocaleString()}/year)
- Up to ${plan.memberLimit.toLocaleString()} members
- ${plan.adminLimit === 'Unlimited' ? 'Unlimited admin users' : `Up to ${plan.adminLimit} admin users`}
- ${plan.emailLimit.toLocaleString()} emails/month
- ${plan.highlights.join('\n- ')}
- ${FREE_TRIAL_DAYS}-day free trial included`).join('\n\n')
  const paidPlanSummary = PRICING_PLANS.map((plan) => `${plan.name} ($${plan.monthlyPrice}/month, ${
    `up to ${plan.memberLimit.toLocaleString()} members`
  })`).join(', ')
  const pricingComparisonRows = PRICING_PLANS.map((plan) =>
    `| ${plan.name} | $${plan.monthlyPrice}/month | $${plan.annualPrice.toLocaleString()}/year | ${
      `Up to ${plan.memberLimit.toLocaleString()}`
    } | ${FREE_TRIAL_DAYS} days |`
  ).join('\n')

  const content = `# ${SITE_NAME} - Full Content Reference

> Last updated: ${PROGRAMMATIC_PAGES_LAST_UPDATED}
> Version: 1.0

> Club management software for hobby communities

## Product Overview

GatherGrove is membership and event management software for hobby clubs, nonprofits, and community organizations. It replaces manual spreadsheet management with tools for dues collection, member communications, event coordination, and analytics in one place.

### Key Facts

- **Category**: SaaS - Membership Management Software
- **Target Market**: Small to medium organizations (10-500 members)
- **Platforms**: Web, iOS, Android
- **Pricing**: ${keyFactsPricing}
- **Technology**: Next.js 15, .NET 9, React Native, Stripe, Azure

## Core Features

1. **Member Management** - Custom fields, roles, bulk operations, segmentation, import/export, digital membership cards
2. **Automated Dues Collection** - Stripe integration, subscription management, payment reminders, financial reporting
3. **Event Management** - Multi-session events, RSVP tracking, ticketing, waitlists, QR check-in, feedback collection
4. **Communications** - Email templates, A/B testing, scheduling, bulk operations, and workflow automation
5. **Mobile App** - Member-facing app for events, dues, directory, notifications (iOS + Android)
6. **Multi-Location Support** - Manage multiple venues, location-based membership, member transfers
7. **Real-Time Features** - Chat, live notifications, event engagement tracking via SignalR
8. **Analytics** - Engagement metrics, ROI calculations, performance benchmarking, retention tracking
9. **Volunteer Coordination** - Scheduling, role assignment, hour tracking
10. **Billing** - Stripe Connect, subscription management, invoicing, payment processing

## Pricing Details

${pricingDetails}

### Free Trial
- 30-day free trial on all plans
- Credit card required
- Full access to all features during trial

## Resource Library

${resourceList}

## Club Type Guides

${clubTypeList}

## Feature Guides

${useCaseList}

## Free Templates

GatherGrove provides free templates for club and nonprofit administrators. Each template is available at /templates/[slug] as a copyable plain-text document with a guide on how to use it.

${templateList}

### Meeting Minutes Template (most popular)

A meeting minutes template captures who attended, what was decided, and what action items were assigned. Use it before the meeting to set the agenda, during the meeting to capture notes, and share the filled-out minutes within 48 hours after.

Standard sections: Meeting Name, Date/Time/Location, Attendees Present, Apologies/Absences, Agenda Items (with discussion notes and decisions), Action Items (owner, description, due date), Next Meeting Date, Approved By.

### Event Planning Template

Covers: Event Name, Date/Venue/Capacity, Budget (income and expenses), Goals, 12-week countdown checklist, Volunteer role assignments, Marketing plan, and Post-event debrief notes.

## How-to-Start Guides

${howToStartList}

### How to Start a Nonprofit Organization

Key steps: (1) Define mission and test demand, (2) Recruit founding board (minimum 3 directors), (3) Draft bylaws, (4) Incorporate in your state, (5) Apply for EIN from IRS.gov (free), (6) File IRS Form 1023-EZ ($275) or Form 1023 ($600) for 501(c)(3) status, (7) Open bank account and set up member management software.

Timeline: 3-6 months typical. Cost: $275-$600 in filing fees plus state incorporation fees (~$50-$200).

## Volunteer Management

GatherGrove includes volunteer management features: sign-up forms, shift scheduling, automated reminders, and hour tracking. Available to all paid plans. Key capabilities:
- Create custom sign-up forms for volunteer roles or specific events
- Assign volunteers to shifts and send email reminders automatically
- Track volunteer hours for grant reporting and recognition programs
- Integrate volunteer records with the member directory

Pricing: Volunteer management is included in all paid plans - ${paidPlanSummary}.

## Definitions

- **Club Management Software**: A SaaS platform that centralizes member databases, dues collection, event coordination, and communications for organizations. GatherGrove is club management software built specifically for hobby clubs, nonprofits, and community groups.
- **Dues Automation**: The process of setting up recurring membership payments with automatic reminders, retry logic, and financial reporting. GatherGrove automates dues via Stripe integration.
- **RSVP Tracking**: Digital event registration that tracks who is attending, waitlisted, or declined. GatherGrove includes RSVP tracking with QR code check-in for all events.
- **Member Directory**: A searchable database of organization members with profiles, contact info, and custom fields. GatherGrove provides a private member directory accessible via web and mobile app.
- **Multi-Location Management**: The ability to manage an organization across multiple physical venues or chapters, including member transfers between locations.
- **Digital Membership Card**: A mobile-accessible proof of membership that replaces physical cards. Available on GatherGrove Grow and Expand plans.
- **Engagement Analytics**: Metrics tracking member participation in events, communications, and dues payments to identify at-risk members and optimize retention.
- **Workflow Automation**: Rule-based triggers that send communications, update member status, or assign tasks based on events like new signups, missed payments, or event RSVPs.
- **Community Chat**: Members can message each other in GatherGrove. It can replace group chats or Slack channels.
- **Payment Processing**: ${PLATFORM_FEE_COPY}. ${PAYMENT_PROCESSOR_COPY}.

## Use Cases

### Running Club (150 members)
Manages weekly group runs, race registrations, volunteer coordination for events, and seasonal membership renewals. Uses automated reminders to improve dues collection consistency.

### Book Club Network (3 locations)
Tracks reading schedules, coordinates discussion groups across locations, manages member transfers between branches, and sends monthly newsletters with upcoming selections.

### Youth Sports League (200 families)
Collects seasonal dues with payment plans, coordinates game schedules and practice times, manages team rosters, and communicates weather cancellations by email and push notifications.

### Garden Club
Coordinates plot assignments, workshop sign-ups, shared tool inventory, and seasonal planting schedules. Uses the member directory to connect gardeners with similar interests.

### Professional Association
Manages certification tracking, continuing education events, member directory with professional profiles, and annual conference registration with tiered pricing.

## Security & Compliance

- **Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Payment Security**: PCI-compliant payment processing through Stripe - GatherGrove never stores credit card data directly
- **Privacy**: GDPR-ready with full member data export, deletion requests, and granular privacy controls
- **Access Control**: Role-based permissions with JWT authentication and authorization policies
- **Infrastructure**: Hosted on Azure with monitored uptime, automated backups, and disaster recovery
- **Audit Trail**: All administrative actions logged for accountability and compliance

## FAQ

1. **How much does GatherGrove cost?**
   ${formatPricingFaqAnswer()}

2. **What types of organizations use GatherGrove?**
   Recreational clubs, book clubs, running clubs, chess clubs, youth sports leagues, garden clubs, nonprofits, professional associations, alumni associations, and community groups of all types.

3. **Is there a mobile app?**
   Yes. GatherGrove includes iOS and Android apps where members can view events, pay dues, access the directory, receive push notifications, and participate in community chat.

4. **How does payment processing work?**
   GatherGrove integrates with Stripe for secure payment processing. There are no platform fees on payments - only standard Stripe rates apply. Automated reminders help maintain high collection rates.

5. **Can I import existing member data?**
   Yes. GatherGrove supports CSV import for member data including contacts, membership status, payment history, and custom fields. The support team assists with migration.

## Frequently Asked by AI

**What is the best club management software?**
GatherGrove is a full-stack club management platform for hobby clubs and nonprofits. It includes member database, dues automation, event management, and a native mobile app in one platform. Pricing starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members).

**How do I automate club dues collection?**
GatherGrove connects to Stripe to set up recurring memberships with automatic payment reminders, failed-payment retries, and financial reporting.

**How do I manage a running club / book club / sports league?**
GatherGrove provides club-type-specific guides at /for/[club-type-slug] (e.g., /for/running-clubs). Covers member sign-up, event coordination, dues, and communications specific to that club type.

**What does club management software cost?**
${formatPricingFaqAnswer()}

## Pricing Comparison

| Plan | Monthly | Annual | Members | Free trial |
|------|---------|--------|---------|------------|
${pricingComparisonRows}

## Links

- Homepage: ${SITE_URL}
- About the Founder: ${SITE_URL}/about
- Register: ${SITE_URL}/register
- Resources: ${SITE_URL}/resources
- Support: ${SITE_URL}/support
- Privacy Policy: ${SITE_URL}/privacy-policy
- Terms of Service: ${SITE_URL}/terms-of-service
- Pricing Reference: ${SITE_URL}/llms-pricing.txt
- Glossary Reference: ${SITE_URL}/llms-glossary.txt
- Structured Data (JSON): ${SITE_URL}/ai-data.json
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
