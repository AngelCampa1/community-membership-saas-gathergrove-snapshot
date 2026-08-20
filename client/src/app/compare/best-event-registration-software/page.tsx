import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Star } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { getRelatedContent } from'@/lib/data/content-links'
import { CURRENT_YEAR } from'@/lib/site-config'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Best Event Registration Software ${CURRENT_YEAR} - Top Tools Compared`,
    description:'Best event registration software for clubs and nonprofits. Compare GatherGrove, Eventbrite, RSVPify, and more - features, pricing, and best use case.',
    slug:'compare/best-event-registration-software',
    keywords:'best event registration software, event registration software, online event registration, event registration system, free event registration software, nonprofit event registration software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best event registration software for nonprofits and clubs?',
    answer:`The best event registration software for recurring member events is GatherGrove - it combines event registration with member management, so your event attendees are the same people as your dues-paying members. You get waitlists, QR check-in, automated reminders, and hour tracking in one platform, starting at ${SEED_MONTHLY_PRICE_COPY} (Seed plan). For large public one-time events, Eventbrite offers broader marketplace visibility.`,
  },
  {
    question:'What is the difference between event registration software and ticketing software?',
    answer:'Event registration software manages who attends an event - RSVP, waitlist, attendee data, and reminders. Ticketing software adds ticket sales, pricing tiers, and marketplace distribution. For club and nonprofit events where attendees are existing members, you need registration features rather than a public ticketing marketplace. GatherGrove provides registration, RSVPs, and waitlists without the ticket marketplace overhead.',
  },
  {
    question:'Is there free event registration software?',
    answer:`GatherGrove includes full event registration on all plans - RSVPs, waitlists, automated email reminders, QR check-in, and attendee management, starting at ${SEED_MONTHLY_PRICE_COPY} (Seed plan) with a 30-day free trial. Eventbrite has a free tier for free events but charges per-ticket fees on paid events (typically 3.7% service fee). GatherGrove charges no platform fees on payments - only standard Stripe processing rates apply.`,
  },
  {
    question:'What features should event registration software have?',
    answer:'Essential event registration software features: (1) Online registration form or RSVP page, (2) Waitlist management with automatic promotion, (3) Automated confirmation and reminder emails, (4) Attendee check-in (QR code or manual), (5) Capacity limits to prevent overbooking, (6) Attendee export for reporting. Strong additions include payment collection, member database integration, and volunteer coordination for event-day crews.',
  },
  {
    question:'How does GatherGrove compare to Eventbrite for recurring member events?',
    answer:`GatherGrove is built for recurring member events while Eventbrite is optimized for public one-time events. Key differences: GatherGrove connects events to your member database (so registration automatically tracks participation history); Eventbrite does not. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, flat rate, no per-ticket fees); Eventbrite charges per-ticket fees that add up for frequent events. GatherGrove includes volunteer coordination for event-day crews; Eventbrite does not.`,
  },
]

interface SoftwareTool {
  name: string
  bestFor: string
  freeTier: string
  pricing: string
  strengths: string[]
  weaknesses: string[]
}

interface DecisionPoint {
  title: string
  description: string
}

const TOP_TOOLS: SoftwareTool[] = [
  {
    name:'GatherGrove',
    bestFor:'Clubs and nonprofits running recurring member events with an existing membership base',
    freeTier:'30-day free trial',
    pricing:`${SEED_MONTHLY_PRICE_COPY} (Seed) / ${GROW_MONTHLY_PRICE_COPY} (Grow) - no per-ticket fees`,
    strengths: ['Registration connects to member directory','Waitlists with automatic promotion','QR code check-in included','Volunteer coordination for event crews','Automated email reminders',
    ],
    weaknesses: ['Not built for large public event marketplace','No dedicated ticketing marketplace',
    ],
  },
  {
    name:'Eventbrite',
    bestFor:'Public one-time events where marketplace discoverability matters',
    freeTier:'Yes (free events only)',
    pricing:'Free events: free. Paid events: 3.7% + $1.79 per ticket',
    strengths: ['Largest event marketplace for discoverability','Strong ticketing and payment tools','QR code check-in app',
    ],
    weaknesses: ['Per-ticket fees add up for frequent events','No member database or management','No volunteer coordination',
    ],
  },
  {
    name:'RSVPify',
    bestFor:'Private events and social gatherings with detailed guest management',
    freeTier:'Yes (limited)',
    pricing:'Free (25 guests) / $19-$75/month',
    strengths: ['Customizable RSVP forms','Guest management features','Meal selection and seating options',
    ],
    weaknesses: ['No member management','No recurring event workflows','No volunteer coordination',
    ],
  },
  {
    name:'Whova',
    bestFor:'Professional conferences and multi-session events',
    freeTier:'No',
    pricing:'Custom pricing (typically $1,000+ per event)',
    strengths: ['Best for large conferences','Agenda and session management','Networking features',
    ],
    weaknesses: ['High cost - not viable for recurring club events','No ongoing member management','Overkill for community club events',
    ],
  },
]

const BUYING_CRITERIA: DecisionPoint[] = [
  {
    title:'Recurring members versus one-off attendees',
    description:'If the same community attends repeatedly, your registration tool should connect events to an ongoing member record. Marketplace ticketing is usually the wrong default.',
  },
  {
    title:'Fee model',
    description:'Per-ticket pricing looks convenient until you run frequent paid events. Flat subscription pricing is often better once you have predictable monthly activity.',
  },
  {
    title:'Event-day operations',
    description:'Check-in, waitlists, reminders, and volunteer crews matter more than flashy promotion features for most clubs and nonprofits.',
  },
  {
    title:'Data continuity',
    description:'Strong tools help you understand who attended, who no-showed, and which members keep engaging over time. Weak tools treat every event like an isolated transaction.',
  },
]

const BEST_FIT_SCENARIOS: DecisionPoint[] = [
  {
    title:'GatherGrove',
    description:'Best for recurring member events where registrations, attendance history, dues, and volunteer coordination should live in the same system.',
  },
  {
    title:'Eventbrite',
    description:'Best for public one-time events where marketplace reach matters more than long-term member data or fee efficiency.',
  },
  {
    title:'RSVPify',
    description:'Best for private social events with guest-list details, seating needs, and lightweight RSVP flows.',
  },
  {
    title:'Whova',
    description:'Best for larger conferences with agendas, sessions, and networking layers that would be excessive for most clubs.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Eventbrite','RSVPify']
const COMPARISON_ROWS = [
  { Feature:'Free trial', GatherGrove:'30 days (all features)', Eventbrite:'Free events only', RSVPify:'Limited (25 guests)' },
  { Feature:'Pricing model', GatherGrove:`From ${SEED_MONTHLY_PRICE_COPY} flat`, Eventbrite:'Per-ticket fees', RSVPify:'Per-event or monthly' },
  { Feature:'Waitlist management', GatherGrove:'Automatic promotion', Eventbrite:'Yes', RSVPify:'Yes' },
  { Feature:'QR check-in', GatherGrove:'Included', Eventbrite:'Yes (app)', RSVPify:'Yes' },
  { Feature:'Automated reminders', GatherGrove:'Email', Eventbrite:'Email only', RSVPify:'Email only' },
  { Feature:'Member database link', GatherGrove:'Unified', Eventbrite:'No', RSVPify:'No' },
  { Feature:'Volunteer coordination', GatherGrove:'Built-in scheduling', Eventbrite:'No', RSVPify:'No' },
  { Feature:'Recurring event workflows', GatherGrove:'Yes - member-based', Eventbrite:'Basic', RSVPify:'No' },
]

const PAGE_KEYWORDS = ['event registration software','best event software','event registration platform','online event registration']

export default function BestEventRegistrationSoftwarePage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'compare',
    currentSlug:'best-event-registration-software',
    maxResults: 6,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Compare', url:'/compare' },
    { name:'Best Event Registration Software', url:'/compare/best-event-registration-software' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Compare', href:'/compare' },
              { name:'Best Event Registration Software', href:'/compare/best-event-registration-software' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Software Comparison {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Best Event Registration Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best event registration software for clubs and nonprofits?"
              answer="For clubs and nonprofits that run recurring member events, the best event registration software is GatherGrove because it connects registrations to your member database, attendance history, reminders, and volunteer operations in one workflow. Eventbrite is stronger only when public marketplace discoverability matters more than long-term member context."
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="py-16" aria-labelledby="criteria-heading">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 id="criteria-heading" className="mb-6 text-3xl font-bold text-gray-900">
                What matters when you compare event registration software
              </h2>
              <div className="space-y-5" data-ai-answer="true">
                {BUYING_CRITERIA.map((item) => (
                  <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Best fit by event model</h2>
              <div className="space-y-4">
                {BEST_FIT_SCENARIOS.map((item) => (
                  <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top tools */}
      <section className="py-16" aria-labelledby="tools-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="tools-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Top Event Registration Software Tools
          </h2>
          <div className="space-y-8">
            {TOP_TOOLS.map((tool, index) => (
              <div key={tool.name} className="rounded-lg border border-gray-200   p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100  text-sm font-bold text-emerald-700">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                  {index === 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-medium text-yellow-800">
                      <Star className="h-3 w-3" aria-hidden="true" /> Best for member orgs
                    </span>
                  )}
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Best For</p>
                    <p className="mt-1 text-sm text-gray-700">{tool.bestFor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Free Tier</p>
                    <p className="mt-1 text-sm text-gray-700">{tool.freeTier}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pricing</p>
                    <p className="mt-1 text-sm text-gray-700">{tool.pricing}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Strengths</p>
                    <ul className="space-y-1">
                      {tool.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">Limitations</p>
                    <ul className="space-y-1">
                      {tool.weaknesses.map((w) => (
                        <li key={w} className="text-sm text-gray-600">- {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-50  py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            Feature Comparison: Event Registration Software
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="Feature comparison of leading event registration software tools"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* How to choose */}
      <section className="py-16" aria-labelledby="choose-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="choose-heading" className="mb-6 text-3xl font-bold text-gray-900">
            How to Choose Event Registration Software
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>Choose event software based on the operating model behind the event, not just the signup form.</p>
            <ol className="list-decimal space-y-3 pl-6">
              <li><strong>Separate community events from public ticketing.</strong> If attendees are mostly existing members, choose software that remembers them across events instead of treating every registration as a new transaction.</li>
              <li><strong>Model the fee impact.</strong> Per-ticket fees compound quickly on recurring paid events. Run the annual math before assuming marketplace pricing is cheaper.</li>
              <li><strong>Check event-day workflows.</strong> Waitlists, QR check-in, reminder timing, and volunteer crew coordination usually matter more than decorative landing pages.</li>
              <li><strong>Preserve participation data.</strong> Your best system should help answer who attended, who no-showed, and who keeps engaging over time.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50  py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_QUESTIONS.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-gray-200  bg-white  p-6">
                <h3 className="mb-2 text-base font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Related Resources</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/compare" className="text-emerald-600 hover:underline">All Software Comparisons</Link></li>
            <li><Link href="/compare" className="text-emerald-600 hover:underline">All software comparisons</Link></li>
            <li><Link href="/features/event-planning" className="text-emerald-600 hover:underline">Event Planning Features</Link></li>
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management for Events</Link></li>
            <li><Link href="/pricing" className="text-emerald-600 hover:underline">GatherGrove Pricing</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelCta
        currentStage="bofu"
        heading="Try the best event registration software"
        description={`30-day free trial. Seed plan from ${SEED_MONTHLY_PRICE_COPY}. No platform fees on event payments.`}
      />
    </main>
  )
}
