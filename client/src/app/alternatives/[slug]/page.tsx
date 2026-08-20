import { notFound, permanentRedirect } from'next/navigation'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, XCircle } from'lucide-react'
import { getAllAlternativeSlugs, getAlternativeBySlug } from'@/lib/data/alternatives'
import { getRelatedContent } from'@/lib/data/content-links'
import { Header } from'@/components/shared/Header'
import { Footer } from'@/components/shared/Footer'
import { JsonLd } from'@/components/seo/JsonLd'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildItemListSchema } from'@/lib/schema'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { FunnelCta, PseoRelatedCards } from'@/components/pseo'
import { SITE_NAME, CURRENT_YEAR } from'@/lib/site-config'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { getRetiredAlternativeRedirect, isRetainedAlternativeSlug } from'@/lib/seo-content-config'

interface AlternativesPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllAlternativeSlugs()
    .filter((slug) => isRetainedAlternativeSlug(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: AlternativesPageProps): Promise<Metadata> {
  const { slug } = await params
  const alt = getAlternativeBySlug(slug)
  if (!alt) return {}
  if (!isRetainedAlternativeSlug(slug)) {
    const destination = getRetiredAlternativeRedirect(slug)
    if (destination) {
      return {
        alternates: { canonical: destination },
        robots: { index: false, follow: true },
      }
    }
  }

  const desc = alt.metaDescription.length > 155
    ? alt.metaDescription.slice(0, 152) +'…'
    : alt.metaDescription

  return createPageMetadata({
    title: alt.title,
    description: desc,
    slug: `alternatives/${slug}`,
    noIndex: !isRetainedAlternativeSlug(slug),
  })
}

export default async function AlternativesSlugPage({ params }: AlternativesPageProps) {
  const { slug } = await params
  const alt = getAlternativeBySlug(slug)
  if (!alt) return notFound()
  if (!isRetainedAlternativeSlug(slug)) {
    const destination = getRetiredAlternativeRedirect(slug)
    if (destination) permanentRedirect(destination)
  }

  const relatedContent = getRelatedContent({
    keywords: alt.keywords,
    currentType:'alternatives',
    currentSlug: slug,
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(alt.faq)
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Alternatives', url:'/alternatives' },
    { name: alt.title, url: `/alternatives/${slug}` },
  ])
  const itemListSchema = buildItemListSchema({
    name: `Top ${alt.competitorName} Alternatives`,
    description: `The best alternatives to ${alt.competitorName} for club management in ${CURRENT_YEAR}.`,
    items: alt.alternatives.map((a) => ({
      name: a.name,
      url: a.name === SITE_NAME ?'/pricing' :'#alternatives',
      description: a.bestFor,
    })),
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={itemListSchema} />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Breadcrumbs items={[
            { name:'Home', href:'/' },
            { name:'Alternatives', href:'/alternatives' },
            { name: alt.title, href: `/alternatives/${slug}` },
          ]} />
        </div>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {alt.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed" data-ai-answer="true">
            {alt.bluf}
          </p>
        </div>

        {/* Intro */}
        <div className="prose prose-lg  max-w-none mb-12">
          <p data-ai-answer="true">{alt.intro}</p>
        </div>

        {/* Why Switch */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Why Clubs Look for {alt.competitorName} Alternatives
          </h2>
          <ul className="space-y-3">
            {alt.whySwitchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground" data-ai-answer="true">{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Alternatives */}
        <section className="mb-12" id="alternatives">
          <h2 className="text-2xl font-bold mb-6">
            Top {alt.competitorName} Alternatives
          </h2>
          <div className="space-y-4">
            {alt.alternatives.map((a) => (
              <div key={a.name} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-2" data-ai-answer="true">
                  <strong>Best for:</strong> {a.bestFor}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Pricing:</strong> {a.pricing}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-link to comparison page */}
        {alt.compareSlug && (
          <div className="rounded-xl border border-border bg-muted/30 p-6 mb-12">
            <p className="text-sm text-muted-foreground mb-3">
              Want a feature-by-feature breakdown?
            </p>
            <Link
              href={`/compare/${alt.compareSlug}`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              GatherGrove vs {alt.competitorName} - full comparison
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {alt.faq.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Browse all */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Looking at other options?</p>
          <Link
            href="/alternatives"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Browse all alternatives guides <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </main>
      {relatedContent.length > 0 && (
        <PseoRelatedCards
          heading="Explore Related Resources"
          items={relatedContent}
        />
      )}
      <FunnelCta currentStage="bofu" />
      <Footer />
    </div>
  )
}
