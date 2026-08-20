import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Clock, FileText, BarChart3, Download, Users, Smartphone } from'lucide-react'
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
import { VOLUNTEER_MANAGEMENT_LINKS } from'@/lib/data/volunteer-management-links'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
const PAGE_KEYWORDS = ['volunteer hour tracking','volunteer hours','service hour tracking','volunteer time tracking','log volunteer hours']

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Hour Tracking Software ${CURRENT_YEAR} - Log & Report Hours`,
    description:`Track volunteer hours with automated logging, exportable reports for grant applications, and per-volunteer history. From ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members.`,
    slug:'volunteer-management/hour-tracking',
    keywords:'volunteer hour tracking, volunteer hours tracker, volunteer time tracking, volunteer hour tracking software, volunteer hour tracking app, free volunteer hour tracking, track volunteer hours',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is volunteer hour tracking software?',
    answer:'Volunteer hour tracking software records the time each volunteer contributes to an organization. It replaces paper sign-in sheets and spreadsheets with digital logs that calculate totals automatically. GatherGrove tracks hours per volunteer, per event, and per shift - then exports the data for grant applications, annual reports, and volunteer recognition programs.',
  },
  {
    question:'How does GatherGrove track volunteer hours?',
    answer:'GatherGrove logs hours in two ways. First, when a volunteer completes a scheduled shift, the system records the shift duration automatically. Second, administrators can manually log hours for unscheduled contributions - like a board member who spent 3 hours preparing a fundraiser. All hours appear on the volunteer\'s profile and in organization-wide reports.',
  },
  {
    question:'Can I export volunteer hours for grant reporting?',
    answer:'Yes. GatherGrove exports volunteer hour data as CSV files that include volunteer name, date, hours logged, event name, and role. Grant applications from organizations like AmeriCorps, United Way, and local government agencies typically require this level of detail. You can filter exports by date range, volunteer, or event before downloading.',
  },
  {
    question:'How much does volunteer hour tracking software cost?',
    answer:`GatherGrove\'s Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} for organizations with up to 100 members and includes full hour tracking features - automated shift logging, manual hour entry, per-volunteer history, and CSV export. A 30-day trial is included. Organizations over 100 members can upgrade to ${GROW_MONTHLY_PRICE_COPY} on the Grow plan.`,
  },
  {
    question:'What is the difference between a volunteer hour tracking spreadsheet and dedicated software?',
    answer:'A spreadsheet requires manual data entry for every volunteer and every shift, has no automated totals across events, and creates version-control problems when multiple people edit the file. Dedicated volunteer hour tracking software like GatherGrove logs hours automatically from scheduled shifts, calculates running totals per volunteer, and generates exportable reports without formula errors or duplicate entries.',
  },
  {
    question:'Can volunteers log their own hours?',
    answer:'Yes. Volunteers can submit their hours through the GatherGrove member portal or mobile app. Administrators review and approve submitted hours before they appear in official reports. This reduces the administrative burden on coordinators while keeping records accurate.',
  },
  {
    question:'Does GatherGrove track hours by event and by volunteer?',
    answer:'Yes. Every hour log in GatherGrove is linked to both a volunteer profile and a specific event or shift. You can view total hours per volunteer (useful for recognition and certificates) or total hours per event (useful for measuring event impact and grant reporting). Both views are available in the admin dashboard.',
  },
]

const HOW_TO_STEPS = [
  {
    title:'Create your organization in GatherGrove',
    description:`Sign up at gathergrove.club/register. Add your organization name, type, and volunteer roster. Seed plan from ${SEED_MONTHLY_PRICE_COPY} for up to 100 members - 30-day trial included, credit card required to activate.`,
  },
  {
    title:'Set up events or volunteer opportunities with shifts',
    description:'Create events with named shifts, time slots, and capacity limits. When volunteers sign up for a shift, GatherGrove pre-populates the hours based on shift duration.',
  },
  {
    title:'Hours are logged automatically after each shift',
    description:'When a scheduled shift ends, GatherGrove records the hours against each volunteer who was signed up. Administrators can adjust hours if a volunteer arrived late or left early.',
  },
  {
    title:'Log additional hours manually for unscheduled work',
    description:'For volunteer contributions outside of scheduled shifts - committee meetings, preparation work, phone calls - administrators or volunteers can submit manual hour entries with a date, duration, and description.',
  },
  {
    title:'Export reports for grants, annual reports, and recognition',
    description:'Download CSV exports filtered by date range, volunteer, or event. Use the data for grant applications, board reports, IRS documentation, or annual volunteer appreciation events.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Spreadsheet','Paper Sign-In Sheet']
const COMPARISON_ROWS = [
  { Feature:'Automatic hour calculation', GatherGrove:'From shift duration', Spreadsheet:'Manual formulas','Paper Sign-In Sheet':'Manual addition' },
  { Feature:'Per-volunteer running totals', GatherGrove:'Automatic', Spreadsheet:'Pivot tables required','Paper Sign-In Sheet':'Not available' },
  { Feature:'Export for grant reports', GatherGrove:'One-click CSV', Spreadsheet:'Manual formatting','Paper Sign-In Sheet':'Retype everything' },
  { Feature:'Hours linked to events', GatherGrove:'Automatic', Spreadsheet:'Manual cross-reference','Paper Sign-In Sheet':'Not available' },
  { Feature:'Volunteer self-service logging', GatherGrove:'Portal & mobile app', Spreadsheet:'Shared file access issues','Paper Sign-In Sheet':'Not available' },
  { Feature:'Multi-user access', GatherGrove:'Role-based dashboard', Spreadsheet:'Conflict-prone sharing','Paper Sign-In Sheet':'Single copy' },
]

const TRACKING_FEATURES = [
  {
    icon: Clock,
    title:'Automatic Shift-Based Logging',
    description:'When a volunteer completes a scheduled shift, GatherGrove records the hours automatically based on shift start and end times. No manual entry needed for scheduled work.',
  },
  {
    icon: FileText,
    title:'Manual Hour Entry',
    description:'Log hours for unscheduled volunteer work - committee meetings, event preparation, phone outreach. Each entry includes date, duration, description, and the volunteer\'s name.',
  },
  {
    icon: BarChart3,
    title:'Per-Volunteer and Per-Event Reports',
    description:'View running hour totals by volunteer (for recognition and certificates) or by event (for impact measurement and grant reporting). Filter by date range, role, or location.',
  },
  {
    icon: Download,
    title:'CSV Export for Grant Applications',
    description:'Export volunteer hour data as CSV with volunteer name, date, hours, event, and role. Compatible with AmeriCorps, United Way, and local government grant reporting formats.',
  },
  {
    icon: Smartphone,
    title:'Mobile Hour Submission',
    description:'Volunteers submit hours from the GatherGrove mobile app (iOS and Android). Administrators review and approve submissions before they appear in official totals.',
  },
  {
    icon: Users,
    title:'Connected to Your Member Directory',
    description:'Volunteer hours are linked to member profiles in GatherGrove\'s directory. See each member\'s total contribution alongside their contact info, event history, and role assignments.',
  },
]

export default function VolunteerHourTrackingPage() {
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'volunteer-management',
    currentSlug:'hour-tracking',
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const howToSchema = buildHowToSchema({
    name:'How to Track Volunteer Hours with GatherGrove',
    description:'Step-by-step guide to logging volunteer hours automatically from shifts, adding manual entries, and exporting reports for grant applications.',
    slug:'volunteer-management/hour-tracking',
    steps: HOW_TO_STEPS,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'Hour Tracking', url:'/volunteer-management/hour-tracking' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={howToSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Volunteer Management', href:'/volunteer-management' },
              { name:'Hour Tracking', href:'/volunteer-management/hour-tracking' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Volunteer Hour Tracking
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Hour Tracking Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What does volunteer hour tracking software do?"
              answer={`Volunteer hour tracking software records the time each volunteer contributes, calculates running totals automatically, and exports reports for grant applications and annual reports. GatherGrove logs hours from scheduled shifts automatically and supports manual entries for unscheduled work. Plans start at ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members.`}
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

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Hour Tracking Tools Built for Volunteer Coordinators
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {TRACKING_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 rounded-lg border border-gray-200  bg-white  p-6 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600" data-ai-answer="true">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to steps */}
      <section className="bg-gray-50  py-16" aria-labelledby="howto-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="howto-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            How to Track Volunteer Hours in GatherGrove
          </h2>
          <ol className="space-y-6">
            {HOW_TO_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600" data-ai-answer="true">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            Volunteer Hour Tracking Software vs. Spreadsheets
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove hour tracking vs. manual volunteer hour recording methods"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-gray-50  py-16" aria-labelledby="usecases-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="usecases-heading" className="mb-6 text-3xl font-bold text-gray-900">
            Who Needs Volunteer Hour Tracking?
          </h2>
          <div className="space-y-4">
            {[
              { org:'Nonprofits applying for grants', detail:'AmeriCorps, United Way, and government grants require documented volunteer hours. GatherGrove exports data in the format funders expect.' },
              { org:'Schools and PTAs', detail:'Track parent volunteer hours for required service commitments. Per-family hour totals update automatically after each event.' },
              { org:'Youth organizations', detail:'Students earning community service credit need verified hour logs. GatherGrove records include date, organization, and supervisor approval.' },
              { org:'Community clubs', detail:'Running clubs, garden clubs, and hobby groups that coordinate volunteer-run events need to know who contributed what - for recognition and planning.' },
              { org:'Houses of worship', detail:'Track ministry volunteer hours across multiple programs - food banks, youth groups, outreach events - with one unified log per member.' },
            ].map(({ org, detail }) => (
              <div key={org} className="flex items-start gap-3 rounded-lg border border-gray-200  bg-white  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">{org}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_QUESTIONS.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-gray-200   p-6">
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
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/free" className="text-emerald-600 hover:underline">Free Volunteer Management Software</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="volunteer-management" currentSlug="hour-tracking" />

      {/* More Volunteer Guides */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">More Volunteer Management Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER_MANAGEMENT_LINKS.filter((link) => link.href !=='/volunteer-management/hour-tracking').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group block bg-white  rounded-lg border border-gray-200  p-5 hover:border-emerald-400 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900  group-hover:text-emerald-700  mb-1">{link.title}</h3>
                <p className="text-sm text-gray-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FunnelCta currentStage="mofu" heading="Replace your volunteer hour spreadsheet today" description={`From ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members. Automated hour logging included.`} />
      <Footer />
    </main>
  )
}
