import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ALTERNATIVES } from '@/lib/data/alternatives'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildItemListSchema, buildBreadcrumbSchema } from '@/lib/schema'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { FunnelCta } from '@/components/pseo/FunnelCta'
import { HubCrossLinks } from '@/components/pseo/HubCrossLinks'
import { CURRENT_YEAR } from '@/lib/site-config'
import { isRetainedAlternativeSlug } from '@/lib/seo-content-config'

export const metadata: Metadata = {
  title: `Best Club Management Software Alternatives [${CURRENT_YEAR}]`,
  description:
    'Switching from Wild Apricot, ClubExpress, MemberPlanet, or spreadsheets? Compare the top club management platforms with honest feature and pricing comparisons.',
  alternates: { canonical: '/alternatives' },
}

const breadcrumbItems = [
  { name: 'Home', href: '/' },
  { name: 'Alternatives', href: '/alternatives' },
]

export default function AlternativesPage() {
  const retainedAlternatives = ALTERNATIVES.filter((alt) => isRetainedAlternativeSlug(alt.slug))
  const itemListSchema = buildItemListSchema({
    name: 'Club Management Software Alternatives',
    description: 'Guides for clubs switching from Wild Apricot, ClubExpress, MemberPlanet, and spreadsheets to dedicated club management software.',
    items: retainedAlternatives.map((a) => ({
      name: a.title,
      url: `/alternatives/${a.slug}`,
      description: a.metaDescription,
    })),
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Alternatives', url: '/alternatives' },
  ])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={itemListSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Club Management Software Alternatives
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-ai-answer="true">
            Switching from another platform? See honest comparisons of the top alternatives - including
            pricing, mobile app support, and communication features - so you can make an informed decision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {retainedAlternatives.map((alt) => (
            <Link
              key={alt.slug}
              href={`/alternatives/${alt.slug}`}
              className="group block bg-card rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {alt.title}
                </h2>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-muted-foreground text-sm mb-4" data-ai-answer="true">
                {alt.bluf}
              </p>
              <div className="flex flex-wrap gap-2">
                {alt.keywords.slice(0, 2).map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <HubCrossLinks currentHub="alternatives" />
      <FunnelCta currentStage="bofu" />
      <Footer />
    </div>
  )
}
