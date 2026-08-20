import { Metadata } from'next'
import { notFound } from'next/navigation'
import Link from'next/link'
import { ArrowRight, CheckCircle, Zap } from'lucide-react'
import { USE_CASES, getUseCaseBySlug } from'@/lib/data/use-cases'
import { getClubTypeBySlug } from'@/lib/data/club-types'
import { getRelatedContent } from'@/lib/data/content-links'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQPageSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { PROGRAMMATIC_PAGES_LAST_UPDATED } from'@/lib/site-config'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'

export function generateStaticParams() {
  return USE_CASES.map((uc) => ({ slug: uc.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const useCase = getUseCaseBySlug(slug)
  if (!useCase) return {}

  const baseDesc = useCase.solution.length > 120
    ? useCase.solution.slice(0, 117) +'...'
    : useCase.solution
  const desc = `${baseDesc} 30-day free trial.`

  return createPageMetadata({
    title: `${useCase.title} for Clubs (30-Day Free Trial)`,
    description: desc,
    slug: `features/${useCase.slug}`,
    keywords: useCase.keywords.join(','),
  })
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const useCase = getUseCaseBySlug(slug)
  if (!useCase) notFound()

  const relatedTypes = useCase.relatedClubTypes
    .map((slug) => getClubTypeBySlug(slug))
    .filter(Boolean)

  const crossSiloLinks = getRelatedContent({
    keywords: useCase.keywords,
    currentType:'features',
    currentSlug: useCase.slug,
    maxResults: 6,
  })
  const lowerSolution = useCase.solution.charAt(0).toLowerCase() + useCase.solution.slice(1)

  const generatedFaqs = [
    {
      question: `What is the best ${useCase.title.toLowerCase()} software?`,
      answer: `GatherGrove handles ${useCase.title.toLowerCase()} for clubs with ${useCase.features.slice(0, 3).join(',').toLowerCase()}. ${useCase.solution}`,
    },
    {
      question: `How does GatherGrove handle ${useCase.title.toLowerCase()}?`,
      answer: `${useCase.problem} To fix that, ${lowerSolution} New clubs can try it free for 30 days.`,
    },
  ]

  const faqQuestions = [...(useCase.faqs ?? []), ...generatedFaqs]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd
        schema={buildArticleSchema({
          title: `${useCase.title} Software`,
          description: useCase.solution,
          slug: `features/${useCase.slug}`,
          datePublished:'2024-01-01',
          dateModified: PROGRAMMATIC_PAGES_LAST_UPDATED,
          keywords: useCase.keywords,
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Features', url:'/features' },
          { name: useCase.title, url: `/features/${useCase.slug}` },
        ])}
      />
      <JsonLd schema={buildFAQPageSchema(faqQuestions)} />

      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-6">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Features', href:'/features' },
              { name: useCase.title, href: `/features/${useCase.slug}` },
            ]} />
          </div>
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="rounded-3xl border border-primary/20 bg-card p-5 shadow-sm md:order-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Problem</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                {useCase.problem}
              </p>
              <div className="my-5 h-px bg-primary/15" />
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Solution</p>
              <p className="mt-2 text-sm leading-6 text-foreground" data-ai-answer="true">
                {useCase.solution}
              </p>
            </div>
            <div>
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                Feature guide
              </span>
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {useCase.title} software for clubs
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Last updated: {new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toLocaleDateString('en-US', { month:'long', year:'numeric' })}
              </p>
              <p className="max-w-2xl text-lg text-muted-foreground" data-ai-answer="true">
                {useCase.description}
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="overview-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="overview-heading" className="mb-4 text-2xl font-bold text-foreground">
            How {useCase.title.toLowerCase()} works in GatherGrove
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground" data-ai-answer="true">{useCase.longDescription}</p>
        </div>
      </section>

      <section className="bg-muted/40 py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-foreground">What you get</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCase.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-2xl bg-card p-5 shadow-sm"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="benefits-heading" className="mb-10 text-center text-3xl font-bold text-foreground">Why it matters</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {useCase.benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-5"
              >
                <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqQuestions.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="text-muted-foreground" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {relatedTypes.length > 0 && (
        <section className="py-16" aria-labelledby="popular-with-heading">
          <div className="mx-auto max-w-5xl px-4">
            <h2 id="popular-with-heading" className="mb-8 text-center text-2xl font-bold text-foreground">
              Popular with
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedTypes.map((ct) => ct && (
                <Link
                  key={ct.slug}
                  href={`/for/${ct.slug}`}
                  className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <h3 className="mb-2 font-semibold text-foreground">{ct.name}</h3>
                  <p className="text-sm text-muted-foreground">{ct.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PseoRelatedCards heading="Learn More" items={crossSiloLinks} />

      <FunnelNextSteps
        keywords={useCase.keywords}
        currentType="features"
        currentSlug={useCase.slug}
      />

      <section className="bg-primary py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready for better {useCase.title.toLowerCase()}?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/85">
            Built for clubs and nonprofits like yours. Start your 30-day free trial today.
          </p>
          <Link
            href="/register"
            className="inline-flex min-h-[48px] items-center rounded-full bg-background px-8 text-base font-semibold text-primary shadow-sm transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
