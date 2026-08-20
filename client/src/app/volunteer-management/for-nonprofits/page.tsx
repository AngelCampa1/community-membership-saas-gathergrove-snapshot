import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Heart, FileText, BarChart3, Users } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildServiceSchema } from'@/lib/schema'
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

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
const PAGE_KEYWORDS = ['volunteer','nonprofit','volunteer management','nonprofit volunteer software','volunteer coordination']

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Best Volunteer Management Software for Nonprofits ${CURRENT_YEAR}`,
    description:`Volunteer management software for nonprofits. Sign-up forms, shift scheduling, hour tracking, and grant-ready export reports - from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
    slug:'volunteer-management/for-nonprofits',
    keywords:'volunteer management software for nonprofits, nonprofit volunteer management, volunteer management for nonprofits, best volunteer management software for nonprofits, free volunteer management software for nonprofits',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best volunteer management software for nonprofits?',
    answer:`GatherGrove is purpose-built volunteer management software for nonprofits and community organizations. It combines volunteer sign-up forms, shift scheduling, hour tracking, and automated reminders in one platform. Plans start at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) with a 30-day free trial. Other options include Better Impact (enterprise-focused, higher cost) and VolunteerHub (event-heavy nonprofits).`,
  },
  {
    question:'Is there free volunteer management software for nonprofits?',
    answer:`GatherGrove offers a 30-day free trial. Credit card required. Seed is ${SEED_MONTHLY_PRICE_COPY} for up to 100 members. Grow is ${GROW_MONTHLY_PRICE_COPY} for up to 200 members. Expand is ${UNLIMITED_MONTHLY_PRICE_COPY} for up to 2,000 members.`,
  },
  {
    question:'How does volunteer management software help nonprofits track hours for grant reporting?',
    answer:'GatherGrove logs volunteer hours per person and per event. You can export hour reports filtered by volunteer name, date range, or project - formatted for grant applications, annual reports, and board presentations. This is critical for grant compliance where funders require documentation of volunteer contributions.',
  },
  {
    question:'Can volunteers sign up without creating an account?',
    answer:'Yes. GatherGrove generates a public sign-up link for each volunteer opportunity. Volunteers click the link, fill in their name and contact info, and are assigned to their shift - no GatherGrove account required. This removes friction and increases sign-up rates.',
  },
  {
    question:'Does GatherGrove work for nonprofits with multiple programs or committees?',
    answer:'Yes. You can organize volunteers by program, committee, or event type. Create separate sign-up forms for different programs and track hours independently. Segment your member and volunteer records with custom fields to match your organization\'s structure.',
  },
  {
    question:'How does GatherGrove compare to Better Impact for nonprofits?',
    answer:'Better Impact is a dedicated volunteer management platform used by large nonprofits and hospitals, with pricing starting around $500-$1,000/year for smaller orgs. GatherGrove is broader - it covers member management, dues, events, and volunteer coordination - making it more cost-effective for small to mid-sized nonprofits that need more than just volunteer tracking.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Spreadsheets + Email']
const COMPARISON_ROWS = [
  { Feature:'Volunteer sign-up forms', GatherGrove:'Built-in, public link','Spreadsheets + Email':'Manual sign-up tracking' },
  { Feature:'Hour tracking for grants', GatherGrove:'Per-volunteer logs + export','Spreadsheets + Email':'Manual calculation' },
  { Feature:'Automated reminders', GatherGrove:'Email included','Spreadsheets + Email':'Manual follow-up' },
  { Feature:'Grant-ready reports', GatherGrove:'One-click export by date/program','Spreadsheets + Email':'Manual formatting required' },
  { Feature:'Member + volunteer unified', GatherGrove:'Single platform','Spreadsheets + Email':'Separate lists to maintain' },
  { Feature:'Free trial', GatherGrove:`30-day trial, from ${SEED_MONTHLY_PRICE_COPY}`,'Spreadsheets + Email':'Free but no automation' },
]

const NONPROFIT_FEATURES = [
  {
    icon: FileText,
    title:'Grant-Ready Hour Reports',
    description:'Export volunteer hour logs by person, date range, or program. Reports are formatted for grant applications, IRS Form 990 reporting, and board presentations.',
  },
  {
    icon: Heart,
    title:'Public Volunteer Sign-Up Forms',
    description:'Share a link on your website or social media. Volunteers register themselves for specific shifts - no GatherGrove account required, reducing barriers to participation.',
  },
  {
    icon: Users,
    title:'Unified Member + Volunteer Records',
    description:'Your volunteer records connect directly to your member directory. Track who is both a dues-paying member and a volunteer without duplicate data entry.',
  },
  {
    icon: BarChart3,
    title:'Compliance-Ready Tracking',
    description:'Log hours against specific programs or funding sources. This level of granularity is required by many foundation and government grants.',
  },
]

const USE_CASES = [
  { org:'Community food banks', use:'Shift scheduling for distribution days, hour tracking for federal grant compliance' },
  { org:'Animal shelters', use:'Dog walker and adoption event volunteers, background check tracking' },
  { org:'Literacy programs', use:'Tutor scheduling, volunteer hour documentation for funding reports' },
  { org:'Youth sports leagues', use:'Coach and referee volunteer coordination, event-day crew management' },
  { org:'Environmental nonprofits', use:'Cleanup day crew sign-ups, ongoing stewardship volunteer management' },
  { org:'Faith-based organizations', use:'Service project volunteers, hospitality teams, committee members' },
]

export default function VolunteerManagementForNonprofitsPage() {
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'volunteer-management',
    currentSlug:'for-nonprofits',
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const serviceSchema = buildServiceSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'For Nonprofits', url:'/volunteer-management/for-nonprofits' },
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
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Volunteer Management', href:'/volunteer-management' },
              { name:'For Nonprofits', href:'/volunteer-management/for-nonprofits' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Nonprofit Volunteer Management
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management Software for Nonprofits
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best volunteer management software for nonprofits?"
              answer={`GatherGrove volunteer management software for nonprofits includes sign-up forms, shift scheduling, hour tracking for grant reporting, and automated email reminders - all in one platform. Plans start at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`}
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

      {/* Why nonprofits need dedicated software */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Why Nonprofits Need Volunteer Management Software
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              Spreadsheets and email chains work fine for your first 10 volunteers. Once your organization grows, they become a liability. Volunteer data gets lost, hours go untracked, and grant reports require hours of manual reconciliation.
            </p>
            <p>
              Volunteer management software built for nonprofits solves three core problems: <strong>coordination</strong> (who signed up for which shift), <strong>compliance</strong> (hour documentation required by funders), and <strong>communication</strong> (automated reminders that reduce no-shows).
            </p>
            <p>
              GatherGrove combines all three with your member management system, so the same platform that collects dues and manages events also handles your volunteer coordination - eliminating duplicate data entry and disconnected records.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50  py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Built for Nonprofit Volunteer Coordination
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {NONPROFIT_FEATURES.map(({ icon: Icon, title, description }) => (
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
            Volunteer Management for Every Type of Nonprofit
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
            GatherGrove vs. Spreadsheets for Nonprofit Volunteer Management
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove vs. manual tools for nonprofit volunteer management"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Grant Reporting Section */}
      <section className="py-16" aria-labelledby="grant-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="grant-heading" className="mb-6 text-3xl font-bold text-gray-900">
            Volunteer Hour Tracking for Grant Reporting
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              Many foundation grants and government contracts require nonprofits to document volunteer contributions as in-kind match. Without an organized system, producing these reports requires manually combing through attendance sheets and email confirmations.
            </p>
            <p>
              GatherGrove logs volunteer hours at the individual and event level. At any point, you can export a report showing total hours contributed by each volunteer, filtered by time period, event type, or program area - exactly the format most grant applications require.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Export hours by volunteer name, date range, or program</li>
              <li>Export format suitable for grant applications and IRS Form 990 Schedule O volunteer contribution documentation</li>
              <li>Download as CSV for grant application attachments</li>
              <li>Board-level summaries for annual reports and donor stewardship</li>
            </ul>
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
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/free" className="text-emerald-600 hover:underline">Free Volunteer Management Software</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/how-to-start/nonprofit-organization" className="text-emerald-600 hover:underline">How to Start a Nonprofit Organization</Link></li>
            <li><Link href="/for/nonprofit-organization" className="text-emerald-600 hover:underline">GatherGrove for Nonprofits</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="volunteer-management" currentSlug="for-nonprofits" />

      {/* More Volunteer Guides */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">More Volunteer Management Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER_MANAGEMENT_LINKS.filter((link) => link.href !=='/volunteer-management/for-nonprofits').map((link) => (
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

      <FunnelCta currentStage="mofu" heading="Free volunteer management for nonprofits" description="Sign-up forms, hour tracking, and automated reminders - all included. Start your 30-day trial today." />
      <Footer />
    </main>
  )
}
