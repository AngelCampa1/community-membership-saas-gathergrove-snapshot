import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Heart, Calendar, Users, Bell } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildServiceSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Management Software for Churches ${CURRENT_YEAR} | GatherGrove`,
    description:`Volunteer management software for churches and faith-based organizations. Coordinate Sunday service volunteers, food pantry teams, and ministry groups in one platform. Plans from ${SEED_MONTHLY_PRICE_COPY}.`,
    slug:'volunteer-management/for-churches',
    keywords:'volunteer management software for churches, church volunteer management, faith-based volunteer management, volunteer scheduling for churches, church volunteer coordinator software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best volunteer management software for churches?',
    answer:`GatherGrove is volunteer management software built for community organizations including churches and faith-based groups. It includes volunteer sign-up forms, shift scheduling, hour tracking, and automated reminders - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. For large churches with complex multi-ministry coordination, platforms like Planning Center Volunteers are designed specifically for church workflows.`,
  },
  {
    question:'Is there free church volunteer management software?',
    answer:`GatherGrove is built for faith-based organizations. You get shift scheduling, automated email reminders, volunteer hour tracking, and a member directory - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
  },
  {
    question:'How do churches coordinate Sunday service volunteers?',
    answer:'To coordinate Sunday volunteers, create recurring shifts for each role. Send reminders 24-48 hours before each service. Track who showed up. GatherGrove automates those steps and replaces manual spreadsheets.',
  },
  {
    question:'Can GatherGrove manage multiple ministry teams?',
    answer:'Yes. GatherGrove allows you to segment volunteers by ministry, committee, or program. Create separate sign-up forms for your food pantry team, hospitality committee, children\'s ministry volunteers, and event crews. Track hours and participation separately for each group.',
  },
  {
    question:'How does volunteer hour tracking help faith-based nonprofits?',
    answer:'Faith-based organizations that operate as 501(c)(3) nonprofits often need to document volunteer contributions for annual reports, grant applications, and donor stewardship. GatherGrove exports volunteer hour logs by person, date range, or ministry program - the format most funders require.',
  },
]

const CHURCH_FEATURES = [
  {
    icon: Calendar,
    title:'Recurring Shift Scheduling',
    description:'Set up Sunday service roles once and let the schedule repeat weekly. Assign greeters, ushers, AV teams, and children\'s ministry volunteers without recreating each week manually.',
  },
  {
    icon: Bell,
    title:'Automated Reminders',
    description:'Volunteers receive email reminders 24-48 hours before their shift. Reminders are sent automatically.',
  },
  {
    icon: Heart,
    title:'Public Sign-Up Links',
    description:'Share a link in your bulletin, email newsletter, or church app. Congregation members sign up for their preferred ministry role without needing to create an account.',
  },
  {
    icon: Users,
    title:'Multi-Ministry Organization',
    description:'Separate your volunteers by ministry or committee. Track hours and participation for your food pantry, hospitality team, worship crew, and event volunteers independently.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Spreadsheets + Email']
const COMPARISON_ROWS = [
  { Feature:'Recurring service schedules', GatherGrove:'Yes - set once, repeats automatically','Spreadsheets + Email':'Recreate each week manually' },
  { Feature:'Automated shift reminders', GatherGrove:'Email included','Spreadsheets + Email':'Manual emails' },
  { Feature:'Public sign-up links', GatherGrove:'Yes - shareable link, no account needed','Spreadsheets + Email':'Reply-to-email coordination' },
  { Feature:'Volunteer hour tracking', GatherGrove:'Per-volunteer logs + export','Spreadsheets + Email':'Manual tallying' },
  { Feature:'Multi-ministry organization', GatherGrove:'Separate groups and forms','Spreadsheets + Email':'Multiple spreadsheets to maintain' },
  { Feature:'Free trial', GatherGrove:'30-day free trial','Spreadsheets + Email':'Free but no automation' },
]

const USE_CASES = [
  { org:'Sunday service teams', use:'Greeters, ushers, AV crew, and welcome desk volunteers on a recurring weekly schedule' },
  { org:'Food pantry programs', use:'Weekly distribution day volunteers, hour tracking for food bank grant compliance' },
  { org:'Children\'s ministry', use:'Nursery workers, Sunday school teachers, and VBS program volunteers organized by session' },
  { org:'Community outreach events', use:'Holiday meal programs, clothing drives, and community service day volunteer coordination' },
  { org:'Hospitality committee', use:'Coffee hour hosts, wedding and event set-up crews, visitor welcome team scheduling' },
  { org:'Youth group', use:'Chaperones and leaders for youth events, retreats, and service projects' },
]

export default function VolunteerManagementForChurchesPage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const serviceSchema = buildServiceSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'For Churches', url:'/volunteer-management/for-churches' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Church Volunteer Management {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management Software for Churches
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best volunteer management software for churches?"
              answer={`GatherGrove is volunteer management software for churches and faith-based organizations. It includes recurring service schedules, automated reminders, volunteer hour tracking, and public sign-up links - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`}
            />
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/volunteer-management"
              className="inline-flex items-center rounded-lg border border-gray-300  bg-white  px-6 py-3 text-base font-semibold text-gray-700  hover:bg-gray-50"
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>

      {/* Why churches need dedicated software */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Why Church Volunteer Coordination Needs More Than a Spreadsheet
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              Coordinating church volunteers across multiple ministries - Sunday service teams, food pantry programs, hospitality committees, and community outreach events - creates real administrative overhead for staff and volunteer coordinators.
            </p>
            <p>
              Text chains and spreadsheets work for your first few volunteers. As your congregation grows and ministries multiply, manual coordination creates gaps: volunteers forget shifts, hour tracking falls behind, and reminder follow-up consumes staff time that belongs in ministry work.
            </p>
            <p>
              GatherGrove replaces the spreadsheet and the text chain with a single platform - recurring schedules, automated reminders, and hour logs that update themselves.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50  py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Built for Faith-Based Volunteer Coordination
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {CHURCH_FEATURES.map(({ icon: Icon, title, description }) => (
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

      {/* Use Cases */}
      <section className="py-16" aria-labelledby="use-cases-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="use-cases-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Volunteer Coordination for Every Ministry
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map(({ org, use }) => (
              <div key={org} className="flex items-start gap-3 rounded-lg border border-gray-200  bg-white  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">{org}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-50  py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            GatherGrove vs. Spreadsheets for Church Volunteer Management
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove vs. manual tools for church volunteer coordination"
            highlightColumn={1}
          />
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
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/for/faith-based-organizations" className="text-emerald-600 hover:underline">GatherGrove for Faith-Based Organizations</Link></li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Built for churches and faith-based organizations
          </h2>
          <p className="mb-8 text-lg text-emerald-100">
            Recurring schedules, automated reminders, and hour tracking - all included. Start with a 30-day free trial.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-white  px-8 py-3 text-base font-semibold text-emerald-700  shadow-sm hover:bg-emerald-50"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
