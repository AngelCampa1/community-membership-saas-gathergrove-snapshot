import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildSoftwareApplicationSchema } from'@/lib/schema'
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

import { GROW_MONTHLY_PRICE_COPY, SEED_ANNUAL_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
const PAGE_KEYWORDS = ['volunteer','affordable','volunteer management','volunteer software','volunteer tool']

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Free Volunteer Management Software ${CURRENT_YEAR} - Best Options`,
    description:`Affordable volunteer management software for nonprofits and clubs. GatherGrove Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} for up to 100 members - sign-up forms, hour tracking, and automated reminders included.`,
    slug:'volunteer-management/free',
    keywords:'volunteer management software, affordable volunteer management, volunteer management software for nonprofits, volunteer management app, volunteer scheduling software small organizations',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the most affordable volunteer management software for small nonprofits?',
    answer:`GatherGrove is designed for small nonprofits and clubs. The Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} (or ${SEED_ANNUAL_PRICE_COPY}) for organizations with up to 100 members and includes volunteer sign-up forms, shift scheduling, hour tracking, and automated email reminders. Other options include VolunteerMark (trial only, no long-term free tier) and SignUpGenius (sign-ups only, no hour tracking).`,
  },
  {
    question:'What does the GatherGrove Seed plan include for volunteer management?',
    answer:`The Seed plan (${SEED_MONTHLY_PRICE_COPY}) includes volunteer sign-up forms, shift scheduling with slot limits, volunteer hour tracking with export, automated email reminders, and a member directory integration - everything a small organization needs to manage volunteers without a spreadsheet.`,
  },
  {
    question:'Does GatherGrove offer a trial before I pay?',
    answer:'Yes. GatherGrove offers a 30-day free trial on all plans (credit card required). There are no platform fees on payments - only standard Stripe processing rates apply if you collect dues or event fees. Volunteer management features carry no per-use charges.',
  },
  {
    question:'What are the limitations of low-cost volunteer management software?',
    answer:'Most low-cost volunteer management tools have limitations on the number of volunteers, features (no hour tracking, no automated reminders), or require individual volunteers to create accounts. GatherGrove\'s Seed plan supports up to 100 members with full volunteer features - no account required for volunteers to sign up.',
  },
  {
    question:'How does the GatherGrove Seed plan compare to enterprise options?',
    answer:'Enterprise paid tools like Better Impact or Volgistics cost $500-$2,000+/year and are built for hospitals and large nonprofits. GatherGrove sits in the middle: affordable for small and growing organizations, with features that cover the needs of most clubs and community nonprofits.',
  },
  {
    question:'Can I upgrade if my organization grows past 100 members?',
    answer:`Yes. The GatherGrove Grow plan at ${GROW_MONTHLY_PRICE_COPY} supports up to 200 members. It includes 3,000 emails each month, reports, and priority support. The Expand plan at ${UNLIMITED_MONTHLY_PRICE_COPY} supports up to 2,000 members. It includes 50,000 emails each month. It also includes unlimited events and unlimited custom fields. All your data carries over when you upgrade.`,
  },
]

const TOOLS_COMPARISON_HEADERS = ['Tool','Starting Price','Hour Tracking','Automated Reminders','Member Limit']
const TOOLS_COMPARISON_ROWS = [
  { Tool:'GatherGrove Seed','Starting Price':`${SEED_MONTHLY_PRICE_COPY}`,'Hour Tracking':'Yes','Automated Reminders':'Yes','Member Limit':'100 members' },
  { Tool:'SignUpGenius','Starting Price':'Free (limited)','Hour Tracking':'No','Automated Reminders':'Paid only','Member Limit':'None (sign-ups only)' },
  { Tool:'VolunteerMark','Starting Price':'Trial only','Hour Tracking':'Yes','Automated Reminders':'Yes','Member Limit':'No free tier' },
  { Tool:'Spreadsheets','Starting Price':'Free','Hour Tracking':'Manual','Automated Reminders':'No','Member Limit':'None' },
]

const SEED_PLAN_FEATURES = ['Volunteer sign-up forms with public link sharing','Shift scheduling with slot capacity limits','Volunteer hour tracking per person and event','Automated email reminders (24hr and 1hr before shifts)','Member directory integration','Hour export for grant reporting (CSV)','Up to 100 members and volunteers','30-day free trial - credit card required to start',
]

export default function FreeVolunteerManagementPage() {
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'volunteer-management',
    currentSlug:'free',
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const softwareSchema = buildSoftwareApplicationSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'Seed Plan', url:'/volunteer-management/free' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={softwareSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Volunteer Management', href:'/volunteer-management' },
              { name:'Seed Plan', href:'/volunteer-management/free' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Seed Plan - {SEED_MONTHLY_PRICE_COPY}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management Software for Small Organizations
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is affordable volunteer management software for small nonprofits?"
              answer={`GatherGrove's Seed plan is volunteer management software built for small nonprofits and clubs. Starting at ${SEED_MONTHLY_PRICE_COPY} for up to 100 members, it includes volunteer sign-up forms, shift scheduling, hour tracking, and automated email reminders. A 30-day free trial is included - credit card required to start.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm text-gray-500">Seed plan from {SEED_MONTHLY_PRICE_COPY} for up to 100 members. 30-day trial included.</p>
        </div>
      </section>

      {/* What`s included */}
      <section className="py-16" aria-labelledby="seed-features-heading">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="seed-features-heading" className="mb-4 text-3xl font-bold text-gray-900">
            What GatherGrove&apos;s Seed Plan Includes
          </h2>
          <p className="mb-8 text-gray-600" data-ai-answer="true">
            GatherGrove&apos;s Seed plan is designed for small organizations managing up to 100 members. At ${SEED_MONTHLY_PRICE_COPY} (or ${SEED_ANNUAL_PRICE_COPY}), here is exactly what you get:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SEED_PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 rounded-lg border border-gray-200   p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-50  py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            Volunteer Management Software Compared
          </h2>
          <ComparisonTable
            headers={TOOLS_COMPARISON_HEADERS}
            rows={TOOLS_COMPARISON_ROWS}
            caption="Comparison of volunteer management software options for small organizations"
            highlightColumn={1}
          />
          <p className="mt-4 text-center text-sm text-gray-500">
            GatherGrove is the only option with hour tracking and automated reminders at an affordable monthly price.
          </p>
        </div>
      </section>

      {/* Who it is for */}
      <section className="py-16" aria-labelledby="who-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="who-heading" className="mb-6 text-3xl font-bold text-gray-900">
            Who Should Use the Seed Plan
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              The Seed plan is the right starting point for organizations that are:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Under 100 members</strong> - small nonprofits, community clubs, PTOs, and religious organizations looking for purpose-built volunteer tools</li>
              <li><strong>Transitioning off spreadsheets</strong> - any organization that manages volunteers in Google Sheets or Excel and wants automation without a large budget commitment</li>
              <li><strong>Testing a new program</strong> - established organizations adding a volunteer program for the first time, before committing to a larger platform</li>
              <li><strong>Bootstrapped nonprofits</strong> - organizations where every dollar counts and an affordable monthly tool reduces administrative overhead</li>
            </ul>
            <p>
              When your organization grows past 100 members or needs advanced analytics, GatherGrove&apos;s Grow plan is ${GROW_MONTHLY_PRICE_COPY} - built for organizations up to 200 members.
            </p>
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
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/pricing" className="text-emerald-600 hover:underline">GatherGrove Pricing - All Plans</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="volunteer-management" currentSlug="free" />

      {/* More Volunteer Guides */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">More Volunteer Management Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER_MANAGEMENT_LINKS.filter((link) => link.href !== '/volunteer-management/free').map((link) => (
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

      <FunnelCta currentStage="mofu" heading="Start managing volunteers today" description={`Seed plan from ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members. 30-day trial included.`} />
      <Footer />
    </main>
  )
}
