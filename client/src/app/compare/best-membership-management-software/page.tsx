import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Star } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildItemListSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { getRelatedContent } from'@/lib/data/content-links'
import { CURRENT_YEAR, SITE_URL } from'@/lib/site-config'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Best Membership Management Software ${CURRENT_YEAR} - Top Tools Compared`,
    description:'Best membership management software for clubs and nonprofits. Compare GatherGrove, Wild Apricot, MemberClicks, and more - features and pricing.',
    slug:'compare/best-membership-management-software',
    keywords:'best membership management software, membership management software, membership management software for nonprofits, membership management system, best membership software for clubs',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best membership management software overall?',
    answer:`The best membership management software depends on your organization size and needs. For small clubs and nonprofits: GatherGrove (${SEED_MONTHLY_PRICE_COPY} Seed plan, mobile app included). For mid-size associations with 500-5,000 members: Wild Apricot or MemberClicks. For large trade associations and professional societies: YourMembership or Fonteva. GatherGrove is the best choice for clubs that need member management, dues automation, volunteer coordination, and mobile access in one platform at the lowest cost.`,
  },
  {
    question:'What features should membership management software include?',
    answer:'Essential membership management software features: (1) Member database with custom fields and roles, (2) Online dues collection with automated renewals, (3) Event registration and RSVP management, (4) Email communications and newsletters, (5) Member directory with privacy controls, (6) Reporting on dues status and engagement. Strong additions include a mobile app, volunteer tools, push alerts, and community chat.',
  },
  {
    question:'What is the best free membership management software?',
    answer:`GatherGrove offers the most affordable entry-level membership management with a 30-day free trial and a Seed plan at ${SEED_MONTHLY_PRICE_COPY} (up to 100 members), including dues collection, event management, member directory, and automated communications. Wild Apricot and MemberClicks start at $60-$400/month with no free tier.`,
  },
  {
    question:'How much does membership management software cost?',
    answer:`Membership management software pricing ranges from ${SEED_MONTHLY_PRICE_COPY} (GatherGrove Seed, up to 100 members) to ${GROW_MONTHLY_PRICE_COPY} (GatherGrove Grow, up to 200 members) to $66+/month (Wild Apricot) to $500-$1,000+/month for enterprise platforms like MemberClicks or Fonteva. Most clubs and small nonprofits spend $9-$66/month depending on member count and features.`,
  },
  {
    question:'Is GatherGrove the best membership management software for clubs?',
    answer:'GatherGrove is purpose-built for hobby clubs, community organizations, and small nonprofits. It combines member database, dues automation (Stripe), event management, volunteer coordination, and native mobile apps in one platform. Competitors like Wild Apricot include more website-building tools but cost significantly more and lack mobile apps. For clubs under 500 members that prioritize mobile access and simplicity, GatherGrove is the strongest option.',
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
    bestFor:'Hobby clubs, small nonprofits, and community organizations under 500 members',
    freeTier:'30-day free trial',
    pricing:`${SEED_MONTHLY_PRICE_COPY} / ${GROW_MONTHLY_PRICE_COPY} / ${UNLIMITED_MONTHLY_PRICE_COPY}`,
    strengths: [`Seed plan from ${SEED_MONTHLY_PRICE_COPY} - lowest entry price`,'Native iOS and Android member app','Volunteer coordination built-in','Email and push alerts included','Simple flat pricing, no per-member fees',
    ],
    weaknesses: ['No built-in website builder','Not optimized for large trade associations',
    ],
  },
  {
    name:'Wild Apricot',
    bestFor:'Nonprofits and associations needing a built-in website and established workflows',
    freeTier:'No',
    pricing:'$60-$180+/month depending on contacts',
    strengths: ['Established platform since 2006','Built-in website builder','Strong event management',
    ],
    weaknesses: ['No native mobile app','Higher cost for comparable member counts','No built-in push alerts',
    ],
  },
  {
    name:'MemberClicks',
    bestFor:'Professional associations and trade organizations with 500+ members',
    freeTier:'No',
    pricing:'$400-$800+/month',
    strengths: ['Deep association management features','Conference registration tools','AMS integrations',
    ],
    weaknesses: ['High cost - not viable for small orgs','Complex to configure','No free tier',
    ],
  },
  {
    name:'MemberPlanet',
    bestFor:'Organizations needing fundraising tools alongside membership management',
    freeTier:'Limited free tier',
    pricing:'Free (limited) / $40-$80+/month',
    strengths: ['Fundraising and donation tools','Chapter management','Group messaging',
    ],
    weaknesses: ['Limited mobile experience','No community chat','Less polished than alternatives',
    ],
  },
]

const BUYING_CRITERIA: DecisionPoint[] = [
  {
    title:'Core operating model',
    description:'Most clubs need a clean member record, renewals, events, and communications before they need heavyweight association management. Buy for the jobs you run every week.',
  },
  {
    title:'Mobile member experience',
    description:'If members regularly RSVP, pay dues, or check updates on their phones, mobile quality matters more than a long checklist of back-office features.',
  },
  {
    title:'Renewal workflow',
    description:'Look past invoice creation. The real test is recurring billing, failed-payment handling, overdue visibility, and how much chasing your team still does by hand.',
  },
  {
    title:'Communication depth',
    description:'Email is basic. If your club needs app alerts or chat, make that a must-have.',
  },
]

const BEST_FIT_SCENARIOS: DecisionPoint[] = [
  {
    title:'GatherGrove',
    description:'Best for clubs and member organizations that want fast setup, low monthly cost, strong mobile usage, and one tool for dues, events, volunteer work, and communications.',
  },
  {
    title:'Wild Apricot',
    description:'Best when a built-in website and established association workflows matter more than native mobile quality or multi-channel member communication.',
  },
  {
    title:'MemberClicks',
    description:'Best for larger professional associations that can justify heavier implementation overhead and a higher monthly spend.',
  },
  {
    title:'MemberPlanet',
    description:'Best when fundraising is a central buying trigger and the organization is comfortable with a weaker member experience.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Wild Apricot','MemberClicks']
const COMPARISON_ROWS = [
  { Feature:'Free trial', GatherGrove:'30 days','Wild Apricot':'30 days', MemberClicks:'Demo only' },
  { Feature:'Starting price', GatherGrove:`${SEED_MONTHLY_PRICE_COPY}`,'Wild Apricot':'~$66/month', MemberClicks:'~$400/month' },
  { Feature:'Native mobile app', GatherGrove:'iOS & Android','Wild Apricot':'No', MemberClicks:'No' },
  { Feature:'Online dues collection', GatherGrove:'Stripe (automated)','Wild Apricot':'Yes', MemberClicks:'Yes' },
  { Feature:'Event management', GatherGrove:'RSVP, waitlists, QR','Wild Apricot':'Yes', MemberClicks:'Yes' },
  { Feature:'Volunteer coordination', GatherGrove:'Built-in scheduling','Wild Apricot':'Limited', MemberClicks:'No' },
  { Feature:'Email communications', GatherGrove:'Included','Wild Apricot':'Included', MemberClicks:'Included' },
  { Feature:'Community chat', GatherGrove:'Real-time built-in','Wild Apricot':'No', MemberClicks:'No' },
  { Feature:'Website builder', GatherGrove:'No','Wild Apricot':'Yes', MemberClicks:'Yes' },
]

const PAGE_KEYWORDS = ['membership management software','best membership software','membership platform','member management']

export default function BestMembershipManagementSoftwarePage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'compare',
    currentSlug:'best-membership-management-software',
    maxResults: 6,
  })
  const itemListSchema = buildItemListSchema({
    name: `Best Membership Management Software ${CURRENT_YEAR}`,
    description:'Top membership management software tools compared by features, pricing, and best use case',
    items: TOP_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.bestFor,
      url:
        tool.name ==='GatherGrove'
          ? `${SITE_URL}/features`
          : tool.name ==='Wild Apricot'
            ? `${SITE_URL}/alternatives/wild-apricot`
            : tool.name ==='MemberPlanet'
              ? `${SITE_URL}/alternatives/memberplanet`
              : `${SITE_URL}/compare/best-membership-management-software`,
    })),
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Compare', url:'/compare' },
    { name:'Best Membership Management Software', url:'/compare/best-membership-management-software' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={itemListSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Compare', href:'/compare' },
              { name:'Best Membership Management Software', href:'/compare/best-membership-management-software' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Software Comparison {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Best Membership Management Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best membership management software?"
              answer="For most small clubs and member organizations, the best membership management software is GatherGrove because it handles the operational core well: member records, recurring dues, events, volunteer coordination, and mobile access without the price and setup drag of legacy association platforms. Heavier tools make sense only once you genuinely need enterprise association workflows."
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
                What actually separates strong membership software from weak software
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
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Best fit by organization type</h2>
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
            Top Membership Management Software Tools
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
            Feature Comparison: Membership Management Software
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="Feature comparison of leading membership management software tools"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* How to choose */}
      <section className="py-16" aria-labelledby="choose-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="choose-heading" className="mb-6 text-3xl font-bold text-gray-900">
            How to Choose Membership Management Software
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>Shortlist tools by workflow fit first, then by price.</p>
            <ol className="list-decimal space-y-3 pl-6">
              <li><strong>Map the daily jobs.</strong> If your team mostly chases renewals, updates records, runs events, and coordinates volunteers, choose the system that makes those jobs lighter instead of the one with the longest enterprise feature list.</li>
              <li><strong>Pressure-test renewals.</strong> Ask how recurring billing, failed cards, overdue visibility, and manual exceptions work. This is where admin burden compounds quickly.</li>
              <li><strong>Check the member-side experience.</strong> If members mostly interact on mobile, a weak phone experience will hurt RSVP rates, dues completion, and announcement reach.</li>
              <li><strong>Buy only as much complexity as you will use.</strong> Many small organizations overpay for chapter, committee, and website tooling they will barely touch.</li>
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
            <li><Link href="/compare/wild-apricot" className="text-emerald-600 hover:underline">GatherGrove vs Wild Apricot - Detailed Comparison</Link></li>
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software</Link></li>
            <li><Link href="/features/event-planning" className="text-emerald-600 hover:underline">Event Planning Features</Link></li>
            <li><Link href="/pricing" className="text-emerald-600 hover:underline">GatherGrove Pricing</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelCta
        currentStage="bofu"
        heading="Try the best membership management software - free trial"
        description="Start your 30-day trial. Full features, credit card required to activate."
      />
    </main>
  )
}
