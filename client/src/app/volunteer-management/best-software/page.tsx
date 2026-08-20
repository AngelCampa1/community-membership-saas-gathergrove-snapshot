import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Star } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema } from'@/lib/schema'
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
const PAGE_KEYWORDS = ['volunteer','best volunteer management','volunteer management software','top volunteer tools','volunteer app']

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Best Volunteer Management Software ${CURRENT_YEAR} - Top Tools Compared`,
    description:'Best volunteer management software for nonprofits and clubs. Compare GatherGrove, Better Impact, VolunteerHub, and more - features and pricing.',
    slug:'volunteer-management/best-software',
    keywords:'best volunteer management software, best volunteer management software for nonprofits, best volunteer management software free, top volunteer management software, volunteer management software comparison',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best volunteer management software overall?',
    answer:`The best volunteer management software depends on your organization\'s size and needs. For small nonprofits and clubs: GatherGrove (${SEED_MONTHLY_PRICE_COPY}, full-featured). For mid-size nonprofits needing dedicated volunteer tools: Better Impact or VolunteerHub. For large enterprise nonprofits: Volgistics or Galaxy Digital. GatherGrove is the best choice for organizations that need both member management and volunteer coordination in one platform.`,
  },
  {
    question:'What is the best free volunteer management software?',
    answer:`GatherGrove is the best volunteer management software with complete features - sign-up forms, shift scheduling, hour tracking, and automated reminders - from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. SignUpGenius offers free sign-up sheets but lacks hour tracking and automated reminders. There is no other tool that matches GatherGrove\'s feature set at this price point.`,
  },
  {
    question:'What features should I look for in volunteer management software?',
    answer:'Essential features for volunteer management software: (1) Volunteer sign-up forms or registration, (2) Shift scheduling with capacity limits, (3) Automated reminders before shifts, (4) Volunteer hour tracking for grant reporting, (5) Communication tools for sending updates, (6) Reporting and analytics. Bonus features: member directory integration, mobile app access for volunteers, and background check tracking.',
  },
  {
    question:'How much does volunteer management software cost?',
    answer:`Volunteer management software pricing ranges from ${SEED_MONTHLY_PRICE_COPY} (GatherGrove Seed, up to 100 members) to ${GROW_MONTHLY_PRICE_COPY} (GatherGrove Grow plan) up to $1,000-$2,000+/year for enterprise platforms like Volgistics or Better Impact for large nonprofits. Most mid-range tools charge $50-$150/month. GatherGrove is the most cost-effective option for small to mid-size organizations at ${GROW_MONTHLY_PRICE_COPY} for up to 200 members.`,
  },
  {
    question:'Is GatherGrove the right volunteer management software for my organization?',
    answer:'GatherGrove is the best fit if your organization: has under 200 members, needs both member management AND volunteer coordination in one platform, wants to avoid paying separately for a member system and a volunteer system, or is a hobby club, small nonprofit, PTO, or community organization. It may not be the best fit for large hospitals, universities, or enterprise nonprofits needing 500+ volunteer records with complex role hierarchies.',
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
    bestFor:'Clubs, small nonprofits, and orgs needing member + volunteer management in one platform',
    freeTier:'30-day free trial',
    pricing:`${SEED_MONTHLY_PRICE_COPY} / ${GROW_MONTHLY_PRICE_COPY} / ${UNLIMITED_MONTHLY_PRICE_COPY}`,
    strengths: [`Full volunteer features from ${SEED_MONTHLY_PRICE_COPY}`,'Member management + volunteer management unified','Mobile apps for iOS and Android','Automated reminders included','Simple pricing, no per-volunteer fees',
    ],
    weaknesses: ['Best suited for clubs under 500 members','Not built for hospital or enterprise volunteer programs',
    ],
  },
  {
    name:'Better Impact',
    bestFor:'Mid to large nonprofits needing dedicated volunteer management',
    freeTier:'No',
    pricing:'$500-$2,000+/year depending on size',
    strengths: ['Deep volunteer-specific features','Background check integrations','Volunteer portal with self-service hours',
    ],
    weaknesses: ['No free tier','Does not include member management or dues','Higher cost for small orgs',
    ],
  },
  {
    name:'VolunteerHub',
    bestFor:'Event-heavy nonprofits with large volunteer programs',
    freeTier:'No',
    pricing:'Custom pricing, typically $200-$500/month',
    strengths: ['Strong event-based scheduling','Kiosk check-in for large events','Waiver management',
    ],
    weaknesses: ['No free tier','Higher cost, built for enterprise','No member management features',
    ],
  },
  {
    name:'SignUpGenius',
    bestFor:'Simple one-off sign-up sheets without scheduling features',
    freeTier:'Yes (limited)',
    pricing:'Free / $9.99-$16.99/month',
    strengths: ['Easy to create a quick sign-up sheet','No account required for sign-ups',
    ],
    weaknesses: ['No hour tracking','No automated reminders on free plan','Not a full volunteer management system',
    ],
  },
]

const BUYING_CRITERIA: DecisionPoint[] = [
  {
    title:'Volunteer-only tool versus unified operations',
    description:'Many small organizations do not need a separate volunteer system and a separate membership system. They need one place for people, shifts, events, dues, and communications.',
  },
  {
    title:'Scheduling depth',
    description:'Look closely at shift creation, reminders, check-in, hour tracking, and how supervisors handle last-minute changes. This is where tools either save time or create more admin work.',
  },
  {
    title:'Program size',
    description:'Enterprise nonprofit platforms can make sense for very large, specialized programs. Smaller clubs and community organizations usually overpay for that complexity.',
  },
  {
    title:'Volunteer retention workflow',
    description:'The best platforms help you keep volunteers engaged after the first shift with attendance history, communication, and clear next steps.',
  },
]

const BEST_FIT_SCENARIOS: DecisionPoint[] = [
  {
    title:'GatherGrove',
    description:'Best for clubs, PTOs, and small nonprofits that need volunteer scheduling tied to member records, events, and recurring communication.',
  },
  {
    title:'Better Impact',
    description:'Best for larger nonprofits that need deeper volunteer-specific administration and can justify a dedicated volunteer platform.',
  },
  {
    title:'VolunteerHub',
    description:'Best for event-heavy organizations with large one-off volunteer crews and more specialized check-in requirements.',
  },
  {
    title:'SignUpGenius',
    description:'Best only for lightweight sign-up sheets when you do not need hour tracking, retention reporting, or a real volunteer system.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Better Impact','SignUpGenius']
const COMPARISON_ROWS = [
  { Feature:'Free trial', GatherGrove:'30-day free trial','Better Impact':'No', SignUpGenius:'Limited' },
  { Feature:'Starting price', GatherGrove:`${SEED_MONTHLY_PRICE_COPY}`,'Better Impact':'~$500/year', SignUpGenius:'$0' },
  { Feature:'Shift scheduling', GatherGrove:'Yes','Better Impact':'Yes', SignUpGenius:'Basic only' },
  { Feature:'Hour tracking', GatherGrove:'Yes','Better Impact':'Yes', SignUpGenius:'No' },
  { Feature:'Automated reminders', GatherGrove:'Email','Better Impact':'Email', SignUpGenius:'Paid only' },
  { Feature:'Member management', GatherGrove:'Yes - unified','Better Impact':'No', SignUpGenius:'No' },
  { Feature:'Mobile app', GatherGrove:'iOS & Android','Better Impact':'Mobile site only', SignUpGenius:'Mobile site' },
  { Feature:'Dues collection', GatherGrove:'Built-in (Stripe)','Better Impact':'No', SignUpGenius:'No' },
]

export default function BestVolunteerManagementSoftwarePage() {
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'volunteer-management',
    currentSlug:'best-software',
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'Best Software', url:'/volunteer-management/best-software' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Volunteer Management', href:'/volunteer-management' },
              { name:'Best Software', href:'/volunteer-management/best-software' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Software Comparison {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Best Volunteer Management Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best volunteer management software?"
              answer="For most small nonprofits, clubs, and community organizations, the best volunteer management software is GatherGrove because it covers sign-ups, scheduling, reminders, hour tracking, and ongoing member operations in one system. Dedicated enterprise tools become more relevant only when the volunteer program itself is large and specialized enough to justify a separate platform."
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
                What matters when you compare volunteer management software
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
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Best fit by program type</h2>
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
            Top Volunteer Management Software Tools
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
                      <Star className="h-3 w-3" aria-hidden="true" /> Best for small orgs
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
            Feature Comparison: Top Volunteer Management Software
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="Feature comparison of leading volunteer management software tools"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* How to choose */}
      <section className="py-16" aria-labelledby="choose-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="choose-heading" className="mb-6 text-3xl font-bold text-gray-900">
            How to Choose Volunteer Management Software
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>Choose software based on the shape of your volunteer program, not just on whether it can create a sign-up sheet.</p>
            <ol className="list-decimal space-y-3 pl-6">
              <li><strong>Separate lightweight sign-ups from real volunteer operations.</strong> If you need retention, hour tracking, reminders, and supervisor visibility, a simple sign-up sheet is not enough.</li>
              <li><strong>Decide whether volunteer data should live with member data.</strong> For many clubs and community organizations, splitting those systems creates duplicate records and more admin work.</li>
              <li><strong>Model the true cost.</strong> Cheap entry pricing means little if you still need a second tool for dues, events, or communications.</li>
              <li><strong>Buy for coordinator speed.</strong> The best system reduces follow-up, no-shows, and manual reporting for the people running the program.</li>
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
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/free" className="text-emerald-600 hover:underline">Free Volunteer Management Software</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/compare/wild-apricot" className="text-emerald-600 hover:underline">GatherGrove vs Wild Apricot</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="volunteer-management" currentSlug="best-software" />

      {/* More Volunteer Guides */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">More Volunteer Management Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER_MANAGEMENT_LINKS.filter((link) => link.href !=='/volunteer-management/best-software').map((link) => (
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

      <FunnelCta currentStage="mofu" heading="Try the best volunteer management software free" description="Start with a 30-day free trial. See why GatherGrove tops the list." />
      <Footer />
    </main>
  )
}
