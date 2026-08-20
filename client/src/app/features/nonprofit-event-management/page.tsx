import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Calendar, CreditCard, QrCode, Users, Mail, BarChart3 } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildHowToSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { getRelatedContent } from'@/lib/data/content-links'

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Nonprofit Event Management Software ${CURRENT_YEAR} - Registration & Ticketing`,
    description:`Event management software built for nonprofits. Online registration, ticketing, payment processing, QR check-in, and attendee communications. Plans from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
    slug:'features/nonprofit-event-management',
    keywords:'nonprofit event management software, event management for nonprofits, nonprofit event management, nonprofit event registration, nonprofit event planning software, event management software for nonprofits',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is nonprofit event management software?',
    answer:'Nonprofit event management software handles registration, ticketing, payment collection, attendee communication, and check-in for nonprofit events. It differs from general event platforms like Eventbrite by integrating directly with your member database - so you can track which donors, volunteers, and members attend each event without re-entering data.',
  },
  {
    question:'How does GatherGrove handle nonprofit event registration?',
    answer:'GatherGrove creates a public registration page for each event with capacity limits, waitlists, and optional payment collection via Stripe. Attendees register online with their name and email. Members who are already in your GatherGrove directory are recognized automatically, linking their registration to their member profile for engagement tracking.',
  },
  {
    question:'Can nonprofits collect event payments through GatherGrove?',
    answer:'Yes. GatherGrove integrates with Stripe for secure payment processing. You can set ticket prices, offer early-bird pricing, and accept credit card payments directly on your event registration page. All payments are deposited to your organization\'s Stripe account. There are no platform fees from GatherGrove on any plan - you only pay Stripe\'s standard processing rate.',
  },
  {
    question:'Does GatherGrove support free nonprofit events?',
    answer:'Yes. Many nonprofit events - volunteer orientations, board meetings, community forums - are free. GatherGrove handles free event registration with RSVP tracking, capacity limits, waitlists, and automated reminders, with no payment setup required.',
  },
  {
    question:'What types of nonprofit events can GatherGrove manage?',
    answer:'GatherGrove manages fundraising galas, volunteer appreciation dinners, annual meetings, community outreach events, workshops, training sessions, membership drives, and recurring program sessions. The platform supports both one-time and recurring events with multi-session scheduling.',
  },
  {
    question:'How does event check-in work for nonprofits?',
    answer:'GatherGrove generates a unique QR code for each registered attendee. At the event, staff scan QR codes with any smartphone camera to check in attendees instantly. The admin dashboard shows real-time attendance counts and identifies no-shows for follow-up.',
  },
  {
    question:'Is there free event management software for nonprofits?',
    answer:`Yes. GatherGrove includes full event management - registration pages, capacity limits, waitlists, QR check-in, attendee communications, and payment processing. Plans start at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial (credit card required).`,
  },
]

const HOW_TO_STEPS = [
  {
    title:'Create your nonprofit organization in GatherGrove',
    description:`Sign up at gathergrove.club/register with your organization name and type. Import your existing member list or start fresh. Plans from ${SEED_MONTHLY_PRICE_COPY}.`,
  },
  {
    title:'Create an event with registration settings',
    description:'Set the event name, date, location, description, and capacity. Choose whether to collect payment, enable waitlists, or require approval for registrations.',
  },
  {
    title:'Share the registration page with your audience',
    description:'GatherGrove generates a public registration URL. Share it by email, social media, your website, or GatherGrove email.',
  },
  {
    title:'Monitor registrations and send communications',
    description:'Track registrations in real time from your admin dashboard. Send updates, reminders, or last-minute changes to all registered attendees with one click.',
  },
  {
    title:'Check in attendees with QR codes on event day',
    description:'Each registrant receives a QR code. Scan with any smartphone at the door. Real-time attendance dashboard shows who has arrived and who is missing.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Eventbrite','Google Forms + Spreadsheet']
const COMPARISON_ROWS = [
  { Feature:'Member database integration', GatherGrove:'Built-in', Eventbrite:'No','Google Forms + Spreadsheet':'No' },
  { Feature:'Payment processing', GatherGrove:'Stripe (no platform fee)', Eventbrite:'Eventbrite fees apply','Google Forms + Spreadsheet':'Not available' },
  { Feature:'QR code check-in', GatherGrove:'Included', Eventbrite:'Paid plans only','Google Forms + Spreadsheet':'Not available' },
  { Feature:'Waitlist management', GatherGrove:'Automatic', Eventbrite:'Available','Google Forms + Spreadsheet':'Manual' },
  { Feature:'Attendee email communications', GatherGrove:'Built-in mass email', Eventbrite:'Basic messaging','Google Forms + Spreadsheet':'Separate tool needed' },
  { Feature:'Recurring event support', GatherGrove:'Multi-session events', Eventbrite:'Separate events','Google Forms + Spreadsheet':'Manual duplication' },
  { Feature:'Attendee engagement history', GatherGrove:'Per-member across all events', Eventbrite:'Per-event only','Google Forms + Spreadsheet':'Not available' },
]

const EVENT_FEATURES = [
  {
    icon: Calendar,
    title:'Online Event Registration',
    description:'Create public registration pages with capacity limits, waitlists, and custom fields. Attendees register in seconds. Members in your directory are recognized automatically.',
  },
  {
    icon: CreditCard,
    title:'Payment Collection via Stripe',
    description:'Accept credit card payments for fundraisers, galas, and ticketed events. Set ticket prices, early-bird rates, and member discounts. No platform fees from GatherGrove.',
  },
  {
    icon: QrCode,
    title:'QR Code Check-In',
    description:'Each registrant receives a unique QR code. Scan with any smartphone at the door for instant check-in. Real-time attendance dashboard shows arrival status.',
  },
  {
    icon: Mail,
    title:'Attendee Communications',
    description:'Send event updates, reminders, and follow-ups to all registered attendees by email. Schedule automated reminders 24 hours and 1 hour before the event.',
  },
  {
    icon: Users,
    title:'Member-Aware Attendance',
    description:'Event attendance links to member profiles in your directory. Track engagement across all events - see which members are active and which have disengaged.',
  },
  {
    icon: BarChart3,
    title:'Event Analytics and Feedback',
    description:'Post-event dashboards show attendance rates, payment totals, and no-show rates. Collect attendee feedback with built-in surveys to improve future events.',
  },
]

const PAGE_KEYWORDS = ['nonprofit event management','nonprofit event software','event management nonprofit','fundraiser event software']

export default function NonprofitEventManagementPage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const howToSchema = buildHowToSchema({
    name:'How to Manage Nonprofit Events with GatherGrove',
    description:'Step-by-step guide to creating events, collecting registrations and payments, and checking in attendees at nonprofit events.',
    slug:'features/nonprofit-event-management',
    steps: HOW_TO_STEPS,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Features', url:'/features' },
    { name:'Nonprofit Event Management', url:'/features/nonprofit-event-management' },
  ])
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'features',
    currentSlug:'nonprofit-event-management',
    maxResults: 6,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={howToSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Features', href:'/features' },
              { name:'Nonprofit Event Management Software', href:'/features/nonprofit-event-management' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-primary/10  px-4 py-1 text-sm font-medium text-primary">
            Nonprofit Event Management
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground  md:text-5xl">
            Nonprofit Event Management Software
          </h1>
          <div className="mx-auto mb-8 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Problem</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                Nonprofit event teams often manage registration, payment, check-in, and follow-up in separate systems.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Solution</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                GatherGrove connects registration pages, Stripe payments, QR check-in, attendee messages, and member engagement history.
              </p>
            </div>
          </div>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is nonprofit event management software?"
              answer={`Nonprofit event management software handles online registration, ticketing, payment collection, attendee communications, and QR check-in for nonprofit events. GatherGrove connects event data directly to your member database - so attendance, donations, and engagement are tracked per member across all events. Plans start at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Create Your First Event Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Event Management Tools for Nonprofits
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {EVENT_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 rounded-lg border border-border  bg-card  p-6 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground" data-ai-answer="true">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to steps */}
      <section className="bg-muted/40  py-16" aria-labelledby="howto-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="howto-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            How to Manage Nonprofit Events in GatherGrove
          </h2>
          <ol className="space-y-6">
            {HOW_TO_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground" data-ai-answer="true">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-foreground">
            Nonprofit Event Management Software Comparison
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove vs. Eventbrite vs. manual methods for nonprofit event management"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Event types */}
      <section className="bg-muted/40  py-16" aria-labelledby="eventtypes-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="eventtypes-heading" className="mb-6 text-3xl font-bold text-foreground">
            Nonprofit Event Types GatherGrove Supports
          </h2>
          <div className="space-y-4">
            {[
              { event:'Fundraising galas and dinners', detail:'Ticketed events with payment collection, table assignments, and post-event thank-you communications.' },
              { event:'Volunteer orientations', detail:'Free registration events with capacity limits. Attendees are added to your volunteer roster automatically.' },
              { event:'Annual meetings and board sessions', detail:'RSVP tracking with member-only access. Attach agendas and documents to the event page.' },
              { event:'Community outreach events', detail:'Public registration pages shareable on social media. Track attendance by new contacts vs. existing members.' },
              { event:'Workshops and training sessions', detail:'Multi-session events with per-session registration. Track completion across a series of training events.' },
              { event:'Membership drives', detail:'Registration that converts attendees into new members. Collect dues at registration with Stripe integration.' },
            ].map(({ event, detail }) => (
              <div key={event} className="flex items-start gap-3 rounded-lg border border-border  bg-card  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">{event}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_QUESTIONS.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border   p-6">
                <h3 className="mb-2 text-base font-semibold text-foreground">{faq.question}</h3>
                <p className="text-muted-foreground" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-xl font-bold text-foreground">Related Resources</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features" className="text-primary hover:underline">All GatherGrove Features</Link></li>
            <li><Link href="/compare/best-event-registration-software" className="text-primary hover:underline">Best Event Registration Software</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-primary hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/resources/event-planning-mastery" className="text-primary hover:underline">Event Planning Guide</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="features" currentSlug="nonprofit-event-management" />

      <FunnelCta
        currentStage="mofu"
        heading="Manage your nonprofit events in one place"
        description={`Plans from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. No platform fees on payments.`}
      />
    </main>
  )
}
