import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import { notFound } from'next/navigation'
import Link from'next/link'
import {
  TEMPLATES,
  getTemplateBySlug,
} from'@/lib/data/templates'
import { createPageMetadata } from'@/lib/marketing-metadata'
import {
  buildHowToSchema,
  buildBreadcrumbSchema,
  buildFAQPageSchema,
  buildArticleSchema,
} from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { KeyTakeaways } from'@/components/seo/KeyTakeaways'
import { PseoFaq, FunnelCta, PseoRelatedCards, FunnelNextSteps } from'@/components/pseo'
import { getRelatedContent } from'@/lib/data/content-links'
import { CopyButton } from'./CopyButton'
import { TEMPLATES_LAST_UPDATED, CURRENT_YEAR } from'@/lib/site-config'

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getTemplateBySlug(slug)
  if (!entry) return {}

  const desc = entry.description.length > 155
    ? entry.description.slice(0, 152) +'…'
    : entry.description

  return createPageMetadata({
    title: `${entry.title} - Free Download ${CURRENT_YEAR}`,
    description: desc,
    slug: `templates/${entry.slug}`,
    keywords: entry.keywords.join(','),
  })
}

export default async function TemplateSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getTemplateBySlug(slug)
  if (!entry) {
    notFound()
    return null
  }

  const relatedTemplateEntries = entry.relatedTemplates
    .map((s) => getTemplateBySlug(s))
    .filter(Boolean)

  const relatedContent = getRelatedContent({
    keywords: entry.keywords,
    currentType:'templates',
    currentSlug: slug,
    maxResults: 6,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      {/* Structured data */}
      <JsonLd
        schema={buildHowToSchema({
          name: `How to use: ${entry.title}`,
          description: entry.description,
          slug: `templates/${entry.slug}`,
          steps: entry.steps,
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Templates', url:'/templates' },
          { name: entry.title, url: `/templates/${entry.slug}` },
        ])}
      />
      <JsonLd schema={buildFAQPageSchema(entry.faqQuestions)} />
      <JsonLd
        schema={buildArticleSchema({
          title: entry.title,
          description: entry.description,
          slug: `templates/${entry.slug}`,
          datePublished: TEMPLATES_LAST_UPDATED,
          dateModified: TEMPLATES_LAST_UPDATED,
          keywords: entry.keywords,
        })}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name:'Home', href:'/' },
                { name:'Templates', href:'/templates' },
                { name: entry.title, href: `/templates/${entry.slug}` },
              ]}
            />
          </div>
          <div className="mb-3">
            <span className="rounded-full bg-emerald-100  px-3 py-1 text-sm font-medium capitalize text-emerald-700">
              {entry.category}
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            {entry.title}
          </h1>
          <p className="text-xl leading-relaxed text-gray-700" data-ai-answer="true">
            {entry.description}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Last updated:{''}
            {new Date(TEMPLATES_LAST_UPDATED).toLocaleDateString('en-US', {
              month:'long',
              year:'numeric',
            })}
          </p>
        </div>
      </section>

      {/* Quick Answer - optimized for AI/voice snippet */}
      <section className="py-8">
        <div className="mx-auto max-w-3xl px-4">
          <QuickAnswer
            question={`What is a ${entry.title.toLowerCase()}?`}
            answer={entry.bluf}
          />
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="py-4">
        <div className="mx-auto max-w-3xl px-4">
          <KeyTakeaways takeaways={entry.keyTakeaways} />
        </div>
      </section>

      {/* The Template - copyable */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{entry.title}</h2>
            <CopyButton text={entry.templateBody} />
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200  bg-gray-50">
            <div className="flex items-center justify-between border-b border-gray-200  bg-gray-100  px-4 py-2">
              <span className="text-xs font-medium text-gray-500">Plain text - copy and paste into Word, Google Docs, or any text editor</span>
              <CopyButton text={entry.templateBody} label="Copy template (toolbar)" />
            </div>
            <pre className="overflow-x-auto p-6 text-sm leading-relaxed text-gray-800  whitespace-pre-wrap font-mono">
              {entry.templateBody}
            </pre>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            This template is free to use and adapt for your organization. No attribution required.
          </p>
        </div>
      </section>

      {/* How to use this template */}
      <section className="bg-gray-50  py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            How to use this template
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
                  <p className="leading-relaxed text-gray-700" data-ai-answer="true">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Related Templates */}
      {relatedTemplateEntries.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Related Templates
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedTemplateEntries.map((t) =>
                t ? (
                  <Link
                    key={t.slug}
                    href={`/templates/${t.slug}`}
                    className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
                  >
                    <span className="mb-2 inline-block rounded-full bg-emerald-50  px-2 py-0.5 text-xs font-medium capitalize text-emerald-700">
                      {t.category}
                    </span>
                    <h3 className="mb-2 font-semibold text-gray-900">{t.title}</h3>
                    <p className="line-clamp-2 text-sm text-gray-600">{t.description}</p>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related Resources - cross-silo links */}
      {relatedContent.length > 0 && (
        <PseoRelatedCards
          heading="Explore Related Resources"
          items={relatedContent}
        />
      )}

      {/* FAQ */}
      <PseoFaq questions={entry.faqQuestions} />

      {/* Funnel next steps - tofu → mofu */}
      <FunnelNextSteps
        keywords={entry.keywords}
        currentType="templates"
        currentSlug={slug}
        maxResults={3}
      />

      {/* CTA */}
      <FunnelCta
        currentStage="tofu"
        heading="Let GatherGrove handle this automatically"
        description="GatherGrove automates meeting minutes distribution, member rosters, event RSVPs, and dues collection - so your officers spend time on the club, not on admin. Start with a 30-day free trial."
      />
      <Footer />
    </main>
  )
}
