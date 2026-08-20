import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getComparisonBySlug, getAllComparisonSlugs } from '@/lib/data/comparisons'
import { getRelatedContent } from '@/lib/data/content-links'
import { SITE_NAME, CURRENT_YEAR } from '@/lib/site-config'
import { createPageMetadata } from '@/lib/marketing-metadata'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { ComparisonTable } from '@/components/seo/ComparisonTable'
import { QuickAnswer } from '@/components/seo/QuickAnswer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/schema'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from '@/components/pseo/PseoRelatedCards'
import { FunnelCta } from '@/components/pseo/FunnelCta'
import { getRetiredComparisonRedirect, isRetainedComparisonSlug } from '@/lib/seo-content-config'

interface ComparePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllComparisonSlugs()
    .filter((slug) => isRetainedComparisonSlug(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { slug } = await params
  const comparison = getComparisonBySlug(slug)
  if (!comparison) return {}
  if (!isRetainedComparisonSlug(slug)) {
    const destination = getRetiredComparisonRedirect(slug)
    if (destination) {
      return {
        alternates: { canonical: destination },
        robots: { index: false, follow: true },
      }
    }
  }

  const desc = comparison.metaDescription.length > 155
    ? comparison.metaDescription.slice(0, 152) + '…'
    : comparison.metaDescription

  return createPageMetadata({
    title: `${comparison.title} [${CURRENT_YEAR} Comparison]`,
    description: desc,
    slug: `compare/${slug}`,
    noIndex: !isRetainedComparisonSlug(slug),
  })
}

export default async function ComparisonPage({ params }: ComparePageProps) {
  const { slug } = await params
  const comparison = getComparisonBySlug(slug)
  if (!comparison) return notFound()
  if (!isRetainedComparisonSlug(slug)) {
    const destination = getRetiredComparisonRedirect(slug)
    if (destination) permanentRedirect(destination)
  }

  const relatedLinks = getRelatedContent({
    keywords: comparison.keywords,
    currentType: 'compare',
    currentSlug: slug,
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(
    comparison.faq.map((f) => ({ question: f.question, answer: f.answer }))
  )
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Compare', url: '/compare' },
    { name: comparison.title, url: `/compare/${slug}` },
  ])

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Compare', href: '/compare' },
    { name: comparison.title, href: `/compare/${slug}` },
  ]

  const tableHeaders = ['Feature', SITE_NAME, comparison.competitorName]
  const tableRows = comparison.features.map((f) => ({
    Feature: f.feature,
    [SITE_NAME]: f.gathergrove,
    [comparison.competitorName]: f.competitor,
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <article>
          <header className="space-y-4 mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              {comparison.title}
            </h1>
            <p className="text-xl text-muted-foreground" data-ai-answer="true">
              {comparison.intro}
            </p>
          </header>

          {/* Quick Answers */}
          {comparison.faq.length > 0 && (
            <QuickAnswer
              question={comparison.faq[0].question}
              answer={comparison.faq[0].answer}
            />
          )}

          {/* Feature Comparison Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Feature Comparison</h2>
            <ComparisonTable
              caption={`${SITE_NAME} vs ${comparison.competitorName} - Feature Comparison`}
              headers={tableHeaders}
              rows={tableRows}
              highlightColumn={1}
            />
          </section>

          {/* Verdict */}
          <section className="mb-12 bg-muted/30 rounded-lg p-6 border border-border/50">
            <h2 className="text-2xl font-bold mb-4">Our Honest Take</h2>
            <p className="text-muted-foreground leading-relaxed" data-ai-answer="true">
              {comparison.verdict}
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {comparison.faq.map((f) => (
                <div key={f.question} className="border-b border-border/50 pb-4">
                  <h3 className="font-semibold text-lg mb-2">{f.question}</h3>
                  <p className="text-muted-foreground" data-ai-answer="true">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Resources */}
          <PseoRelatedCards
            heading="Related Resources"
            items={relatedLinks}
          />

          {/* CTA */}
          <FunnelCta currentStage="bofu" />
        </article>
      </main>
      <Footer />
    </div>
  )
}
