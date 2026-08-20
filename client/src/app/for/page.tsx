import { Metadata } from'next'
import Link from'next/link'
import { CLUB_TYPES } from'@/lib/data/club-types'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildItemListSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { CURRENT_YEAR } from'@/lib/site-config'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { isRetainedClubTypeSlug } from'@/lib/seo-content-config'

const RETAINED_CLUB_TYPES = CLUB_TYPES.filter((entry) => isRetainedClubTypeSlug(entry.slug))

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Club Management Software by Organization Type ${CURRENT_YEAR}`,
    description:'Find the right GatherGrove fit for clubs, leagues, nonprofits, and member organizations that need dues, events, communications, and volunteer operations in one system.',
    slug:'for',
    keywords:'club management software, organization management, hobby club app, community group software',
  })
}

export default function ClubTypesHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd
        schema={buildItemListSchema({
          name:'GatherGrove Club Type Solutions',
          description:'Management software solutions for every type of club and community organization.',
          items: RETAINED_CLUB_TYPES.map((ct) => ({
            name: ct.name,
            url: `/for/${ct.slug}`,
            description: ct.description,
          })),
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Club Types', url:'/for' },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            By Club Type
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Management Software for Every Club Type
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            GatherGrove focuses on the club and community segments where member records, recurring
            dues, events, and volunteer coordination need to work together in one operating system.
          </p>
        </div>
      </section>

      {/* Club Types Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {RETAINED_CLUB_TYPES.map((ct) => (
              <Link
                key={ct.slug}
                href={`/for/${ct.slug}`}
                className="group rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
              >
                <h2 className="mb-2 text-lg font-semibold text-gray-900  group-hover:text-emerald-600">
                  {ct.name}
                </h2>
                <p className="text-sm text-gray-600">{ct.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Hub Navigation */}
      <HubCrossLinks currentHub="for" />

      {/* CTA */}
      <FunnelCta currentStage="mofu" />
    </main>
  )
}
