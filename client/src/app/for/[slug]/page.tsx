import { Metadata } from'next'
import { notFound, permanentRedirect } from'next/navigation'
import Link from'next/link'
import { ArrowRight, CheckCircle } from'lucide-react'
import { CLUB_TYPES, getClubTypeBySlug } from'@/lib/data/club-types'
import { getRelatedContent } from'@/lib/data/content-links'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQPageSchema, buildClubTypeHowToSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { PROGRAMMATIC_PAGES_LAST_UPDATED } from'@/lib/site-config'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { AutoLinkedText } from'@/components/seo/AutoLinkedText'
import { getRetiredClubTypeRedirect, isRetainedClubTypeSlug } from'@/lib/seo-content-config'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateStaticParams() {
  return CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug)).map((ct) => ({ slug: ct.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const clubType = getClubTypeBySlug(slug)
  if (!clubType) return {}
  if (!isRetainedClubTypeSlug(slug)) {
    const destination = getRetiredClubTypeRedirect(slug)
    if (destination) {
      return {
        alternates: { canonical: destination },
        robots: { index: false, follow: true },
      }
    }
  }

  return createPageMetadata({
    title: `Best ${clubType.name} Software - Free 30-Day Trial`,
    description: `${clubType.description.length <= 120 ? clubType.description : clubType.description.slice(0, 117) +'...'} Free 30-day trial.`,
    slug: `for/${clubType.slug}`,
    keywords: clubType.keywords.join(','),
    noIndex: !isRetainedClubTypeSlug(clubType.slug),
  })
}


export default async function ClubTypePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const clubType = getClubTypeBySlug(slug)
  if (!clubType) notFound()
  if (!isRetainedClubTypeSlug(slug)) {
    const destination = getRetiredClubTypeRedirect(slug)
    if (destination) permanentRedirect(destination)
  }

  const relatedTypes = clubType.relatedSlugs
    .map((relatedSlug) => getClubTypeBySlug(relatedSlug))
    .filter((related) => related && isRetainedClubTypeSlug(related.slug))
    .filter(Boolean)

  const crossSiloLinks = getRelatedContent({
    keywords: clubType.keywords,
    currentType:'for',
    currentSlug: clubType.slug,
    maxResults: 6,
  })

  const helpfulGuides = getRelatedContent({
    keywords: clubType.keywords,
    currentType:'for',
    currentSlug: clubType.slug,
    maxResults: 3,
    filterStage:'tofu',
  })

  const generatedFaqs = [
    {
      question: `What is the best software for managing ${clubType.name.toLowerCase()}?`,
      answer: `GatherGrove is purpose-built for ${clubType.name.toLowerCase()} and similar organizations. It provides ${clubType.features.slice(0, 3).join(',').toLowerCase()}, and more - all in one platform. Start your 30-day free trial.`,
    },
    {
      question: `How much does ${clubType.singularName.toLowerCase()} management software cost?`,
      answer: `GatherGrove offers a 30-day free trial. Credit card required. Seed is ${SEED_MONTHLY_PRICE_COPY} for up to 100 members. Grow is ${GROW_MONTHLY_PRICE_COPY} for up to 200 members. Expand is ${UNLIMITED_MONTHLY_PRICE_COPY} for up to 2,000 members.`,
    },
    {
      question: `Can GatherGrove handle ${clubType.name.toLowerCase()} with multiple locations?`,
      answer: `Yes. GatherGrove supports multi-location organizations with location-based membership, member transfers, and location-specific events and communications.`,
    },
  ]

  const faqQuestions = [...(clubType.faqs ?? []), ...generatedFaqs]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd
        schema={buildArticleSchema({
          title: `${clubType.name} Management Software`,
          description: clubType.description,
          slug: `for/${clubType.slug}`,
          datePublished:'2024-01-01',
          dateModified: PROGRAMMATIC_PAGES_LAST_UPDATED,
          keywords: clubType.keywords,
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'For', url:'/for' },
          { name: clubType.name, url: `/for/${clubType.slug}` },
        ])}
      />
      <JsonLd schema={buildFAQPageSchema(faqQuestions)} />
      <JsonLd schema={buildClubTypeHowToSchema({ clubTypeName: clubType.name, slug: clubType.slug, features: clubType.features })} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Club Types', href:'/for' },
              { name: clubType.name, href: `/for/${clubType.slug}` },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            For {clubType.name}
          </span>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            The All-in-One Platform for {clubType.name}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Last updated: {new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toLocaleDateString('en-US', { month:'long', year:'numeric' })}
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600" data-ai-answer="true">
            {clubType.description}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/resources/complete-guide-club-management"
              className="inline-flex items-center rounded-lg border border-gray-300  bg-white  px-6 py-3 text-base font-semibold text-gray-700  shadow-sm hover:bg-gray-50"
            >
              Read the Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Long Description */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          {clubType.bluf && (
            <p className="mb-6 text-xl font-medium leading-relaxed text-gray-900" data-ai-answer="true">
              {clubType.bluf}
            </p>
          )}
          <AutoLinkedText
            text={clubType.longDescription}
            currentType="for"
            currentSlug={clubType.slug}
            maxLinks={3}
            className="text-lg leading-relaxed text-gray-700"
          />
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50  py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            Features for {clubType.name}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubType.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-lg bg-white  p-6 shadow-sm"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helpful Guides */}
      <PseoRelatedCards
        heading="Helpful Guides"
        items={helpfulGuides}
      />

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqQuestions.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-gray-200   p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Club Types */}
      {relatedTypes.length > 0 && (
        <section className="bg-gray-50  py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Also Popular
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedTypes.map((related) => related && (
                <Link
                  key={related.slug}
                  href={`/for/${related.slug}`}
                  className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">{related.name}</h3>
                  <p className="text-sm text-gray-600">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross-Silo Related Content */}
      <PseoRelatedCards
        heading="Related Guides & Resources"
        items={crossSiloLinks}
      />

      {/* Funnel Progression */}
      <FunnelNextSteps
        keywords={clubType.keywords}
        currentType="for"
        currentSlug={clubType.slug}
      />

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to simplify your {clubType.singularName.toLowerCase()}?
          </h2>
          <p className="mb-8 text-lg text-emerald-100">
            Built for organizations like yours. Start your 30-day free trial today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-white  px-8 py-3 text-base font-semibold text-emerald-700  shadow-sm hover:bg-emerald-50"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
