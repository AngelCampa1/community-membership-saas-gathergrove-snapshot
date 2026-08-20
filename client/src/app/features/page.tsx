import { Metadata } from'next'
import Link from'next/link'
import { Users, Calendar, DollarSign, Heart, MessageSquare, BarChart3, Folder, Shield, ArrowRight, type LucideIcon } from'lucide-react'
import { USE_CASES } from'@/lib/data/use-cases'
import { FEATURE_PAGES, SPECIALIZED_FEATURE_PAGES } from'@/lib/data/feature-pages'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildItemListSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { CURRENT_YEAR } from'@/lib/site-config'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { FunnelCta } from'@/components/pseo/FunnelCta'

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Club Management Features ${CURRENT_YEAR}`,
    description:'Explore GatherGrove features for membership management, events, dues, volunteers, communication, attendance, analytics, and member directories.',
    slug:'features',
    keywords:'club management features, membership management software, event planning tool, dues collection, volunteer coordination',
  })
}

const featureIcons: Record<string, LucideIcon> = {
  'membership-management': Users,
  'event-planning': Calendar,
  'dues-collection': DollarSign,
  'volunteer-coordination': Heart,
  'member-communication': MessageSquare,
  'attendance-tracking': BarChart3,
  'club-analytics': BarChart3,
  'member-directory': Folder,
}

export default function FeaturesHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd
        schema={buildItemListSchema({
          name:'GatherGrove Features',
          description:'Complete set of club management features including membership, events, dues, communications, and analytics.',
          items: FEATURE_PAGES.map((page) => ({
            name: page.title,
            url: page.url,
            description: page.description,
          })),
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Features', url:'/features' },
        ])}
      />

      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Features
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Club management features built for the work volunteers actually do
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground" data-ai-answer="true">
              Most clubs run on a patchwork of spreadsheets, payment links, inboxes, and group chats. GatherGrove connects member data, dues, events, communications, volunteers, directories, and reporting in one mobile-friendly platform.
            </p>
          </div>
          <div className="rounded-3xl border border-primary/20 bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Problem</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admins lose hours because every core job lives in a separate tool.
            </p>
            <div className="my-5 h-px bg-primary/15" />
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Solution</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Each feature page below explains the workflow, the problem it removes, and the next related resources to compare.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="core-features-heading">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="core-features-heading" className="mb-6 text-2xl font-bold text-foreground">Core features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {USE_CASES.map((uc) => (
              <Link
                key={uc.slug}
                href={`/features/${uc.slug}`}
                className="group flex min-h-[240px] flex-col rounded-3xl border border-border bg-card p-6 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {(() => {
                  const Icon = featureIcons[uc.slug] || Shield
                  return <Icon className="mb-3 h-8 w-8 text-primary" aria-hidden="true" />
                })()}
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary">
                  {uc.title}
                </h3>
                <p className="text-sm text-muted-foreground">{uc.problem}</p>
                <p className="mt-3 flex-1 text-sm text-foreground">{uc.solution}</p>
                <span className="mt-5 inline-flex min-h-[44px] items-center self-start rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                  Explore feature <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8" aria-labelledby="specialized-solutions-heading">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="specialized-solutions-heading" className="mb-6 text-2xl font-bold text-foreground">Specialized Solutions</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {SPECIALIZED_FEATURE_PAGES.map((page) => (
              <Link
                key={page.url}
                href={page.url}
                className="group flex min-h-[190px] flex-col rounded-3xl border border-border bg-card p-6 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary">{page.title}</h3>
                <p className="flex-1 text-sm text-muted-foreground">{page.description}</p>
                <span className="mt-5 inline-flex min-h-[44px] items-center self-start rounded-full border border-primary/20 px-5 text-sm font-semibold text-primary">
                  Read guide <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HubCrossLinks currentHub="features" />
      <FunnelCta currentStage="mofu" />
    </main>
  )
}
