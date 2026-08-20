import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import Link from'next/link'
import {
  HOW_TO_START_ENTRIES,
  HOW_TO_START_CATEGORIES,
  getHowToStartEntriesByCategory,
  type HowToStartCategory,
} from'@/lib/data/how-to-start'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildItemListSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { CURRENT_YEAR } from'@/lib/site-config'
import { isRetainedHowToStartSlug } from'@/lib/seo-content-config'

export const metadata: Metadata = createPageMetadata({
  title: `How to Start a Club | Practical Launch Guides [${CURRENT_YEAR}]`,
  description:'Practical launch guides for clubs and member organizations GatherGrove can support deeply. Learn setup, dues, events, and member operations without thin filler content.',
  slug:'how-to-start',
})

const CATEGORY_LABELS: Record<HowToStartCategory, string> = {
  sports:'Sports & Recreation',
  community:'Community & Civic',
  hobby:'Hobby & Interest',
  professional:'Professional & Networking',
  youth:'Youth Programs',
}

const CATEGORY_DESCRIPTIONS: Record<HowToStartCategory, string> = {
  sports:'Launch a sports club, league, or recreational team with step-by-step guidance.',
  community:'Form nonprofits, HOAs, PTOs, and other community organizations.',
  hobby:'Start a book club, photography group, gaming club, or any hobby organization.',
  professional:'Create networking groups, alumni associations, and professional organizations.',
  youth:'Establish youth sports teams, academic clubs, and development programs.',
}

const RETAINED_HOW_TO_START_ENTRIES = HOW_TO_START_ENTRIES.filter((entry) =>
  isRetainedHowToStartSlug(entry.slug)
)

export default function HowToStartHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd
        schema={buildItemListSchema({
          name:'How to Start a Club - Complete Guides',
          description:'Step-by-step formation guides for the club types GatherGrove can support deeply after launch.',
          items: RETAINED_HOW_TO_START_ENTRIES.map((e) => ({
            name: e.title,
            url: `/how-to-start/${e.slug}`,
            description: e.description.slice(0, 160),
          })),
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'How to Start', url:'/how-to-start' },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Formation Guides
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            How to Start a Club
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-xl text-gray-600">
            Step-by-step guides for practical club types where launch, dues, events, and member
            operations all need to work together from day one.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Category Sections */}
      {HOW_TO_START_CATEGORIES.map((category) => {
        const entries = getHowToStartEntriesByCategory(category).filter((entry) =>
          isRetainedHowToStartSlug(entry.slug)
        )
        if (entries.length === 0) return null
        return (
          <section key={category} className="py-16 odd:bg-gray-50">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {CATEGORY_LABELS[category]}
              </h2>
              <p className="mb-8 text-gray-600">{CATEGORY_DESCRIPTIONS[category]}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/how-to-start/${entry.slug}`}
                    className="group rounded-lg border border-gray-200  bg-white  p-5 transition-shadow hover:shadow-md"
                  >
                    <h3 className="mb-2 font-semibold text-gray-900  group-hover:text-emerald-700">
                      {entry.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {entry.description.slice(0, 120)}...
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100  px-2 py-0.5 text-xs text-gray-600">
                        {entry.steps.length} steps
                      </span>
                      <span className="rounded-full bg-emerald-50  px-2 py-0.5 text-xs text-emerald-700">
                        {entry.estimatedStartupCost.split(' ')[0]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Cross-Hub Navigation */}
      <HubCrossLinks currentHub="how-to-start" />

      {/* CTA */}
      <FunnelCta
        currentStage="tofu"
        heading="Ready to launch your organization?"
        description="GatherGrove gives you the tools to manage members, collect dues, and run events - everything you need after you form."
      />
      <Footer />
    </main>
  )
}
