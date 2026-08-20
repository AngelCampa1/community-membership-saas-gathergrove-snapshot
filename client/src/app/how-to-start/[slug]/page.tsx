import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import { notFound, permanentRedirect } from'next/navigation'
import Link from'next/link'
import {
  HOW_TO_START_ENTRIES,
  getHowToStartEntryBySlug,
} from'@/lib/data/how-to-start'
import { getClubTypeBySlug } from'@/lib/data/club-types'
import { getResourceBySlug } from'@/lib/data/resources'
import { getRelatedContent } from'@/lib/data/content-links'
import { createPageMetadata } from'@/lib/marketing-metadata'
import {
  buildHowToSchema,
  buildBreadcrumbSchema,
  buildFAQPageSchema,
  buildArticleSchema,
} from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoFaq } from'@/components/pseo/PseoFaq'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { AutoLinkedText } from'@/components/seo/AutoLinkedText'
import { PROGRAMMATIC_PAGES_LAST_UPDATED, CURRENT_YEAR } from'@/lib/site-config'
import {
  getRetiredHowToStartRedirect,
  isRetainedClubTypeSlug,
  isRetainedHowToStartSlug,
} from'@/lib/seo-content-config'

export function generateStaticParams() {
  return HOW_TO_START_ENTRIES.filter((e) => isRetainedHowToStartSlug(e.slug)).map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getHowToStartEntryBySlug(slug)
  if (!entry) return {}
  if (!isRetainedHowToStartSlug(slug)) {
    const destination = getRetiredHowToStartRedirect(slug)
    if (destination) {
      return {
        alternates: { canonical: destination },
        robots: { index: false, follow: true },
      }
    }
  }

  const desc = entry.description.length > 155
    ? entry.description.slice(0, 152) +'…'
    : entry.description

  return createPageMetadata({
    title: `${entry.title} - Step-by-Step Guide ${CURRENT_YEAR}`,
    description: desc,
    slug: `how-to-start/${entry.slug}`,
    keywords: entry.keywords.join(','),
    noIndex: !isRetainedHowToStartSlug(entry.slug),
  })
}

export default async function HowToStartPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getHowToStartEntryBySlug(slug)
  if (!entry) notFound()
  if (!isRetainedHowToStartSlug(slug)) {
    const destination = getRetiredHowToStartRedirect(slug)
    if (destination) permanentRedirect(destination)
  }

  const relatedClubTypeEntries = entry.relatedClubTypes
    .map((s) => getClubTypeBySlug(s))
    .filter((clubType) => clubType && isRetainedClubTypeSlug(clubType.slug))
    .filter(Boolean)

  const relatedResourceEntries = entry.relatedResources
    .map((s) => getResourceBySlug(s))
    .filter(Boolean)

  const crossSiloLinks = getRelatedContent({
    keywords: entry.keywords,
    currentType:'how-to-start',
    currentSlug: entry.slug,
    maxResults: 6,
  })

  const siblingGuides = getRelatedContent({
    keywords: entry.keywords,
    currentType:'how-to-start',
    currentSlug: entry.slug,
    maxResults: 3,
    filterStage:'tofu',
  }).filter((link) => link.type ==='how-to-start')

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd
        schema={buildHowToSchema({
          name: entry.title,
          description: entry.description,
          slug: entry.slug,
          steps: entry.steps,
          estimatedCost: entry.estimatedStartupCost,
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'How to Start', url:'/how-to-start' },
          { name: entry.title, url: `/how-to-start/${entry.slug}` },
        ])}
      />
      <JsonLd schema={buildFAQPageSchema(entry.faqQuestions)} />
      <JsonLd
        schema={buildArticleSchema({
          title: entry.title,
          description: entry.description,
          slug: `how-to-start/${entry.slug}`,
          datePublished: PROGRAMMATIC_PAGES_LAST_UPDATED,
          dateModified: PROGRAMMATIC_PAGES_LAST_UPDATED,
          keywords: entry.keywords,
        })}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'How to Start', href:'/how-to-start' },
              { name: entry.title, href: `/how-to-start/${entry.slug}` },
            ]} />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            {entry.title}
          </h1>
          <p className="text-xl leading-relaxed text-gray-700" data-ai-answer="true">{entry.description}</p>
          <p className="mt-4 text-sm text-gray-500">
            Last updated:{''}
            {new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toLocaleDateString('en-US', {
              month:'long',
              year:'numeric',
            })}
          </p>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="border-b border-t border-gray-200  bg-gray-50  py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Estimated Startup Cost
              </p>
              <p className="mt-1 font-semibold text-gray-900">{entry.estimatedStartupCost}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Min. Members to Launch
              </p>
              <p className="mt-1 font-semibold text-gray-900">{entry.minMembersToLaunch}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Steps to Formation
              </p>
              <p className="mt-1 font-semibold text-gray-900">{entry.steps.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            How to Start a {entry.orgType}: Step-by-Step
          </h2>
          <ol className="space-y-8">
            {entry.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">{step.title}</h3>
                  <AutoLinkedText
                    text={step.description}
                    currentType="how-to-start"
                    currentSlug={entry.slug}
                    maxLinks={2}
                    className="text-gray-700  leading-relaxed"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Legal Requirements */}
      <section className="bg-amber-50  py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Legal Requirements</h2>
          <p className="text-gray-700  leading-relaxed">{entry.legalRequirements}</p>
          <p className="mt-4 text-sm text-gray-500">
            <em>
              Note: Requirements vary by state. Consult a local attorney for specific guidance on
              your organization.
            </em>
          </p>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Common Mistakes to Avoid</h2>
          <ul className="space-y-3">
            {entry.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 text-red-500">✗</span>
                <span className="text-gray-700">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tools You'll Need */}
      <section className="bg-gray-50  py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Tools You&apos;ll Need</h2>
          <ul className="space-y-3">
            {entry.toolsNeeded.map((tool, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 text-emerald-600">✓</span>
                <span className="text-gray-700">{tool}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related Club Types (TOFU → MOFU bridge) */}
      {relatedClubTypeEntries.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Software Built for Your Club Type
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedClubTypeEntries.map((ct) =>
                ct ? (
                  <Link
                    key={ct.slug}
                    href={`/for/${ct.slug}`}
                    className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
                  >
                    <h3 className="mb-2 font-semibold text-gray-900">{ct.name}</h3>
                    <p className="line-clamp-2 text-sm text-gray-600">{ct.description}</p>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* Further Reading (same-silo resources) */}
      {relatedResourceEntries.length > 0 && (
        <section className="bg-gray-50  py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Further Reading
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedResourceEntries.map((r) =>
                r ? (
                  <Link
                    key={r.slug}
                    href={`/resources/${r.slug}`}
                    className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
                  >
                    <span className="text-xs text-gray-500">{r.category}</span>
                    <h3 className="mb-2 mt-1 font-semibold text-gray-900">{r.title}</h3>
                    <p className="line-clamp-2 text-sm text-gray-600">{r.description}</p>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* Similar Formation Guides (P6 - how-to-start siblings) */}
      {siblingGuides.length > 0 && (
        <PseoRelatedCards
          heading="Similar Formation Guides"
          items={siblingGuides}
        />
      )}

      {/* Cross-Silo Related Content */}
      <PseoRelatedCards
        heading="Related Resources"
        items={crossSiloLinks}
      />

      {/* Funnel Progression */}
      <FunnelNextSteps
        keywords={entry.keywords}
        currentType="how-to-start"
        currentSlug={entry.slug}
      />

      {/* FAQ */}
      <PseoFaq questions={entry.faqQuestions} />

      {/* CTA */}
      <FunnelCta
        currentStage="tofu"
        heading={`Ready to manage your ${entry.orgType}?`}
        description="GatherGrove gives you member management, dues collection, and event tools in one place. Start with a 30-day free trial."
      />
      <Footer />
    </main>
  )
}
