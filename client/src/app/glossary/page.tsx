import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import Link from'next/link'
import { GLOSSARY_ENTRIES, GLOSSARY_CATEGORIES } from'@/lib/data/glossary'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildItemListSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { CURRENT_YEAR } from'@/lib/site-config'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { isRetainedGlossarySlug } from'@/lib/seo-content-config'

export const metadata: Metadata = createPageMetadata({
  title: `Club Management Glossary | Membership, Dues, Events, and Governance [${CURRENT_YEAR}]`,
  description:'Plain-language definitions for the club management terms that matter most in member operations, dues collection, events, governance, and software evaluation.',
  slug:'glossary',
  keywords:'club management glossary, nonprofit glossary, membership terms, association terminology, volunteer management terms',
})

const RETAINED_GLOSSARY_ENTRIES = GLOSSARY_ENTRIES.filter((entry) => isRetainedGlossarySlug(entry.slug))

const CATEGORY_LABELS: Record<string, string> = {
  governance:'Governance & Parliamentary Procedure',
  nonprofit:'Nonprofit & Legal',
  events:'Event Management',
  volunteer:'Volunteer Management',
  membership:'Membership Management',
  financial:'Financial & Payments',
  communication:'Communication & Marketing',
  technology:'Technology & Software',
}

export default function GlossaryHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd
        schema={buildItemListSchema({
          name:'Club Management Glossary',
          description:'Comprehensive glossary of membership management, nonprofit, and club administration terms.',
          items: RETAINED_GLOSSARY_ENTRIES.map((e) => ({
            name: e.term,
            url: `/glossary/${e.slug}`,
            description: e.definition,
          })),
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Glossary', url:'/glossary' },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Glossary
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Club Management Glossary
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            A smaller, higher-value glossary focused on membership ops, event execution, dues, and
            software terms that help administrators make decisions faster.
          </p>
        </div>
      </section>

      {/* Category Sections */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          {GLOSSARY_CATEGORIES.map((category) => {
            const entries = RETAINED_GLOSSARY_ENTRIES.filter((e) => e.category === category)
            if (entries.length === 0) return null
            return (
              <div key={category} className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/glossary/${entry.slug}`}
                      className="rounded-lg border border-gray-200  bg-white  p-4 transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-900">{entry.term}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {entry.definition}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Cross-Hub Navigation */}
      <HubCrossLinks currentHub="glossary" />

      {/* CTA */}
      <FunnelCta currentStage="tofu" />
      <Footer />
    </main>
  )
}
