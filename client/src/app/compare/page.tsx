import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMPARISONS } from '@/lib/data/comparisons'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildItemListSchema, buildBreadcrumbSchema } from '@/lib/schema'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { HubCrossLinks } from '@/components/pseo/HubCrossLinks'
import { FunnelCta } from '@/components/pseo/FunnelCta'
import { isRetainedComparisonSlug } from '@/lib/seo-content-config'

export const metadata: Metadata = {
  title: { absolute: 'Compare Club Management Software - GatherGrove vs. Alternatives' },
  description:
    'Feature-by-feature comparisons of GatherGrove with Wild Apricot, TeamSnap, Eventbrite, and other club management platforms. See pricing and feature differences.',
  alternates: { canonical: '/compare' },
  openGraph: {
    title: 'Compare Club Management Software - GatherGrove vs. Alternatives',
    description:
      'Feature-by-feature comparisons of GatherGrove with Wild Apricot, TeamSnap, Eventbrite, and other club management platforms.',
    url: 'https://www.gathergrove.club/compare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Club Management Software - GatherGrove vs. Alternatives',
    description:
      'Feature-by-feature comparisons of GatherGrove with Wild Apricot, TeamSnap, Eventbrite, and other club management platforms.',
  },
}

const breadcrumbItems = [
  { name: 'Home', href: '/' },
  { name: 'Compare', href: '/compare' },
]

export default function ComparePage() {
  const retainedComparisons = COMPARISONS.filter((comparison) => isRetainedComparisonSlug(comparison.slug))
  const itemListSchema = buildItemListSchema({
    name: 'Club Management Software Comparisons',
    description: 'Feature-by-feature comparisons of GatherGrove with other club management platforms.',
    items: retainedComparisons.map((c) => ({
      name: c.title,
      url: `/compare/${c.slug}`,
      description: c.description,
    })),
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Compare', url: '/compare' },
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
            Compare Club Management Software
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how GatherGrove compares to other platforms, feature by feature.
            No fabricated stats - just honest comparisons based on publicly available information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {retainedComparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="group block bg-card rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {comparison.title}
                </h2>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                {comparison.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.keywords.slice(0, 2).map((kw) => (
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

        {/* Best-Of Rankings */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Best-Of Rankings</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { href: '/compare/best-membership-management-software', title: 'Best Membership Management Software', description: 'Ranked review of the best membership management software for clubs and associations.' },
              { href: '/compare/best-club-management-software', title: 'Best Club Management Software', description: 'Ranked review of the best club management software for hobby clubs and organizations.' },
              { href: '/compare/best-event-registration-software', title: 'Best Event Registration Software', description: 'Ranked review of the best event registration software for clubs and nonprofits.' },
            ].map((page) => (
              <Link key={page.href} href={page.href} className="group block bg-card rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{page.title}</h3>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-muted-foreground text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

      </main>
      <HubCrossLinks currentHub="compare" />
      <FunnelCta currentStage="bofu" />
      <Footer />
    </div>
  )
}
