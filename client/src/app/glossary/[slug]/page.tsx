import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import { notFound, permanentRedirect } from'next/navigation'
import Link from'next/link'
import {
  GLOSSARY_ENTRIES,
  getGlossaryEntryBySlug,
} from'@/lib/data/glossary'
import { getRelatedContent } from'@/lib/data/content-links'
import { createPageMetadata } from'@/lib/marketing-metadata'
import {
  buildDefinedTermSchema,
  buildBreadcrumbSchema,
  buildFAQPageSchema,
} from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { AutoLinkedText } from'@/components/seo/AutoLinkedText'
import { PseoFaq } from'@/components/pseo/PseoFaq'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { PROGRAMMATIC_PAGES_LAST_UPDATED, CURRENT_YEAR } from'@/lib/site-config'
import { getRetiredGlossaryRedirect, isRetainedGlossarySlug } from'@/lib/seo-content-config'

export function generateStaticParams() {
  return GLOSSARY_ENTRIES.filter((e) => isRetainedGlossarySlug(e.slug)).map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getGlossaryEntryBySlug(slug)
  if (!entry) return {}
  if (!isRetainedGlossarySlug(slug)) {
    const destination = getRetiredGlossaryRedirect(slug)
    if (destination) {
      return {
        alternates: { canonical: destination },
        robots: { index: false, follow: true },
      }
    }
  }

  return createPageMetadata({
    title: `${entry.term} - Definition & Guide [${CURRENT_YEAR}]`,
    description: entry.definition,
    slug: `glossary/${entry.slug}`,
    keywords: entry.keywords.join(','),
    noIndex: !isRetainedGlossarySlug(entry.slug),
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  governance:'Governance',
  nonprofit:'Nonprofit',
  events:'Events',
  volunteer:'Volunteer',
  membership:'Membership',
  financial:'Financial',
  communication:'Communication',
  technology:'Technology',
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getGlossaryEntryBySlug(slug)
  if (!entry) notFound()
  if (!isRetainedGlossarySlug(slug)) {
    const destination = getRetiredGlossaryRedirect(slug)
    if (destination) permanentRedirect(destination)
  }

  const relatedEntries = entry.relatedTerms
    .map((s) => getGlossaryEntryBySlug(s))
    .filter((related) => related && isRetainedGlossarySlug(related.slug))
    .filter(Boolean)

  const crossSiloLinks = getRelatedContent({
    keywords: entry.keywords,
    currentType:'glossary',
    currentSlug: entry.slug,
    maxResults: 6,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd
        schema={buildDefinedTermSchema({
          term: entry.term,
          definition: entry.definition,
          slug: entry.slug,
          category: entry.category,
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Glossary', url:'/glossary' },
          { name: entry.term, url: `/glossary/${entry.slug}` },
        ])}
      />
      <JsonLd schema={buildFAQPageSchema(entry.faqQuestions)} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Glossary', href:'/glossary' },
              { name: entry.term, href: `/glossary/${entry.slug}` },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            {CATEGORY_LABELS[entry.category] ?? entry.category}
          </span>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            {entry.term}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Last updated:{''}
            {new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toLocaleDateString('en-US', {
              month:'long',
              year:'numeric',
            })}
          </p>
        </div>
      </section>

      {/* Short Definition (snippet target) */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xl leading-relaxed text-gray-800">{entry.definition}</p>
        </div>
      </section>

      {/* Extended Explanation */}
      <section className="bg-gray-50  py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Understanding {entry.term}
          </h2>
          <AutoLinkedText
            text={entry.extendedDefinition}
            currentType="glossary"
            currentSlug={entry.slug}
            maxLinks={3}
            className="text-lg leading-relaxed text-gray-700"
          />
        </div>
      </section>

      {/* Related Terms */}
      {relatedEntries.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Related Terms
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedEntries.map(
                (related) =>
                  related && (
                    <Link
                      key={related.slug}
                      href={`/glossary/${related.slug}`}
                      className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
                    >
                      <h3 className="mb-2 font-semibold text-gray-900">
                        {related.term}
                      </h3>
                      <p className="line-clamp-2 text-sm text-gray-600">
                        {related.definition}
                      </p>
                    </Link>
                  )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cross-Silo Related Content */}
      <PseoRelatedCards
        heading="Explore More"
        items={crossSiloLinks}
      />

      {/* Funnel Progression */}
      <FunnelNextSteps
        keywords={entry.keywords}
        currentType="glossary"
        currentSlug={entry.slug}
      />

      {/* FAQ */}
      <PseoFaq questions={entry.faqQuestions} />

      {/* CTA */}
      <FunnelCta
        currentStage="tofu"
        heading={`Simplify ${CATEGORY_LABELS[entry.category]?.toLowerCase() ??'club'} management`}
        description="Start with a 30-day free trial on any plan. Cancel anytime."
      />
      <Footer />
    </main>
  )
}
