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

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Best Club Management Software ${CURRENT_YEAR} - Top Tools for Clubs`,
    description:'Best club management software for hobby clubs and sports teams. Compare GatherGrove, Wild Apricot, ClubExpress, and more - features and pricing.',
    slug:'compare/best-club-management-software',
    keywords:'best club management software, club management software, club management app, best club software, sports club management software, hobby club management software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best club management software?',
    answer:`The best club management software for small to mid-size clubs is GatherGrove - starting at ${SEED_MONTHLY_PRICE_COPY} (Seed plan), with native iOS/Android apps, dues automation, event management, volunteer coordination, email, and push alerts. For larger clubs needing a website builder, Wild Apricot is a well-established alternative. For fitness-focused clubs and studios, TeamUp offers specialized class scheduling.`,
  },
  {
    question:'What does club management software do?',
    answer:'Club management software handles: (1) Member database - profiles, roles, custom fields, directory; (2) Dues collection - automated recurring payments via Stripe or other processors; (3) Event management - RSVP, waitlists, QR check-in; (4) Communications - email and push notifications; (5) Volunteer coordination - shift scheduling, hour tracking; (6) Reporting - engagement metrics, dues status, attendance. Good club software replaces spreadsheets, separate email tools, and manual payment follow-ups.',
  },
  {
    question:'What is the best free club management software?',
    answer:`GatherGrove offers a 30-day free trial with full feature access, then starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) - the most affordable full-featured club management option. Wild Apricot, ClubExpress, and TeamUp start at $66-$99/month. SignUpGenius offers a free sign-up tool but is not club management software.`,
  },
  {
    question:'What is the best club management software for sports clubs?',
    answer:'For membership-based sports clubs (running clubs, swim teams, tennis clubs, youth leagues), GatherGrove provides the right combination of member management, dues, event scheduling, and volunteer coordination. For fitness studios and gyms with class-based scheduling, TeamUp is better optimized for that booking flow. GatherGrove is purpose-built for clubs organized around a shared activity with recurring members.',
  },
  {
    question:'How much does club management software cost?',
    answer:`Club management software pricing ranges from ${SEED_MONTHLY_PRICE_COPY} (GatherGrove Seed, up to 100 members) to ${GROW_MONTHLY_PRICE_COPY} (GatherGrove Grow, up to 200 members) to $66+/month (Wild Apricot) to $99-$200+/month (TeamUp, ClubExpress). GatherGrove is the most cost-effective full-featured option at ${SEED_MONTHLY_PRICE_COPY} entry price.`,
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
    bestFor:'Hobby clubs, running clubs, sports leagues, and community organizations',
    freeTier:'30-day free trial',
    pricing:`${SEED_MONTHLY_PRICE_COPY} / ${GROW_MONTHLY_PRICE_COPY} / ${UNLIMITED_MONTHLY_PRICE_COPY}`,
    strengths: [`Seed plan from ${SEED_MONTHLY_PRICE_COPY} - lowest entry price`,'Native iOS and Android app for members','Volunteer coordination built-in','Email and push alerts included','Flat pricing - not per-member',
    ],
    weaknesses: ['No built-in website builder','Best for clubs under 500 members',
    ],
  },
  {
    name:'Wild Apricot',
    bestFor:'Clubs and associations that need a built-in public website',
    freeTier:'No',
    pricing:'$60-$180+/month',
    strengths: ['Built-in website and member portal','Established platform with 20+ years','Strong event registration',
    ],
    weaknesses: ['No native mobile app','Higher cost per member count','No built-in push alerts',
    ],
  },
  {
    name:'TeamUp',
    bestFor:'Fitness studios, gyms, and class-based sports academies',
    freeTier:'No',
    pricing:'$99-$300+/month',
    strengths: ['Best-in-class class booking and scheduling','Membership packages with session limits','Kiosk check-in mode',
    ],
    weaknesses: ['High cost for general clubs','No volunteer coordination','Designed for classes, not member clubs',
    ],
  },
  {
    name:'ClubExpress',
    bestFor:'Large clubs and associations needing deep customization',
    freeTier:'No',
    pricing:'Quote-based - typically $50-$200+/month',
    strengths: ['Highly configurable','Chapter and committee management','Built-in website with content management',
    ],
    weaknesses: ['Complex to set up and maintain','No native mobile app','No built-in push alerts',
    ],
  },
]

const BUYING_CRITERIA: DecisionPoint[] = [
  {
    title:'Member workflow fit',
    description:'The best club software should fit the way your members already operate: recurring dues, event RSVPs, announcements, and volunteer coordination for the same shared activity.',
  },
  {
    title:'Mobile-first participation',
    description:'If members mainly interact on their phones, native mobile quality matters more than a broad but shallow admin feature list.',
  },
  {
    title:'Cost versus complexity',
    description:'Many clubs buy software meant for larger associations and then use a fraction of it. Favor a system that removes work without forcing a heavy setup project.',
  },
  {
    title:'Public website versus member operations',
    description:'Some teams need a built-in website. Others already have a site and need a stronger member operating layer. Decide which problem matters more before you compare pricing.',
  },
]

const BEST_FIT_SCENARIOS: DecisionPoint[] = [
  {
    title:'GatherGrove',
    description:'Best for hobby clubs, community groups, leagues, and member organizations that need dues, events, communications, and volunteer coordination in one place.',
  },
  {
    title:'Wild Apricot',
    description:'Best when you want a built-in website and can accept a weaker mobile experience plus a higher price floor.',
  },
  {
    title:'TeamUp',
    description:'Best for class-heavy studios and sports academies where booking sessions matters more than club-style membership operations.',
  },
  {
    title:'ClubExpress',
    description:'Best for larger clubs that need deeper administrative customization and are comfortable with a more complex setup.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Wild Apricot','TeamUp']
const COMPARISON_ROWS = [
  { Feature:'Free trial', GatherGrove:'30 days','Wild Apricot':'30 days', TeamUp:'30 days' },
  { Feature:'Starting price', GatherGrove:`${SEED_MONTHLY_PRICE_COPY}`,'Wild Apricot':'~$66/month', TeamUp:'~$99/month' },
  { Feature:'Native mobile app', GatherGrove:'iOS & Android','Wild Apricot':'No', TeamUp:'iOS & Android' },
  { Feature:'Member dues automation', GatherGrove:'Stripe recurring','Wild Apricot':'Yes', TeamUp:'Membership packages' },
  { Feature:'Event management', GatherGrove:'RSVP, waitlists, QR','Wild Apricot':'Yes', TeamUp:'Class booking' },
  { Feature:'Volunteer coordination', GatherGrove:'Built-in scheduling','Wild Apricot':'Limited', TeamUp:'No' },
  { Feature:'Email communications', GatherGrove:'Included','Wild Apricot':'Included', TeamUp:'Included' },
  { Feature:'Website builder', GatherGrove:'No','Wild Apricot':'Yes', TeamUp:'No' },
  { Feature:'Community chat', GatherGrove:'Real-time built-in','Wild Apricot':'No', TeamUp:'No' },
]

const PAGE_KEYWORDS = ['club management software','best club software','club platform','club management tool']

export default function BestClubManagementSoftwarePage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'compare',
    currentSlug:'best-club-management-software',
    maxResults: 6,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Compare', url:'/compare' },
    { name:'Best Club Management Software', url:'/compare/best-club-management-software' },
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
              { name:'Best Club Management Software', href:'/compare/best-club-management-software' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Software Comparison {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Best Club Management Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best club management software?"
              answer="For most member-based clubs, the best club management software is GatherGrove because it handles the work clubs actually run every week: dues, events, volunteer coordination, communications, and mobile member access. Other tools only pull ahead when you need a built-in website or a class-booking workflow more than a club operating system."
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
                What matters when you evaluate club management software
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
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Best fit by club model</h2>
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
            Top Club Management Software Tools
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
                      <Star className="h-3 w-3" aria-hidden="true" /> Best for small clubs
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
            Feature Comparison: Club Management Software
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="Feature comparison of leading club management software tools"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* How to choose */}
      <section className="py-16" aria-labelledby="choose-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="choose-heading" className="mb-6 text-3xl font-bold text-gray-900">
            How to Choose Club Management Software
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>Choose software based on the way your club actually runs, not the broadest feature grid.</p>
            <ol className="list-decimal space-y-3 pl-6">
              <li><strong>Match the activity model.</strong> General clubs need dues, member records, events, and communications. Studios and academies often need class scheduling first. Do not confuse those categories.</li>
              <li><strong>Check the member experience.</strong> If members manage dues and RSVPs on their phones, poor mobile UX will show up as lower participation and slower collections.</li>
              <li><strong>Review the admin workload.</strong> Ask how the platform handles reminders, overdue members, check-in, and volunteer coordination. That is where clubs either save time or create more of it.</li>
              <li><strong>Be honest about website needs.</strong> If you already have a site, buying a platform mainly for its website builder is usually the wrong trade.</li>
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
            <li><Link href="/compare/wild-apricot" className="text-emerald-600 hover:underline">GatherGrove vs Wild Apricot</Link></li>
            <li><Link href="/compare/teamup" className="text-emerald-600 hover:underline">GatherGrove vs TeamUp</Link></li>
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software</Link></li>
            <li><Link href="/for/youth-sports-leagues" className="text-emerald-600 hover:underline">GatherGrove for Youth Sports Leagues</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelCta
        currentStage="bofu"
        heading="Try the best club management software"
        description={`30-day free trial on all plans. Seed plan from ${SEED_MONTHLY_PRICE_COPY}. See why GatherGrove tops the list.`}
      />
    </main>
  )
}
