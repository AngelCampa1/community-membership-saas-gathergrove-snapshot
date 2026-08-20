import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { Metadata } from'next'
import Link from'next/link'
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  type TemplateCategory,
} from'@/lib/data/templates'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildItemListSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { CURRENT_YEAR } from'@/lib/site-config'

export const metadata: Metadata = createPageMetadata({
  title: `Free Club Templates - Meeting Minutes, Event Planning & More [${CURRENT_YEAR}]`,
  description: `Free, ready-to-use templates for clubs and organizations. Download our meeting minutes template, event planning template, club budget template, and more - ${TEMPLATES.length} templates available.`,
  slug:'templates',
  keywords:'meeting minutes template, event planning template, club budget template, member roster template, volunteer sign up sheet template',
})

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  meetings:'Meeting Templates',
  events:'Event Templates',
  finance:'Finance Templates',
  members:'Member Management Templates',
  volunteers:'Volunteer Templates',
  governance:'Governance Templates',
}

const CATEGORY_DESCRIPTIONS: Record<TemplateCategory, string> = {
  meetings:'Templates for capturing decisions, agendas, and action items at every club meeting.',
  events:'Plan and execute club events with comprehensive checklists and budgets.',
  finance:'Budget templates and financial tracking tools for club treasurers.',
  members:'Roster and directory templates for managing your club membership.',
  volunteers:'Recruit, organize, and thank volunteers with ready-to-use sign-up sheets.',
  governance:'Foundational documents like bylaws, constitutions, and conflict-of-interest policies for clubs and nonprofits.',
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  meetings:'📋',
  events:'🎉',
  finance:'💰',
  members:'👥',
  volunteers:'🙋',
  governance:'📜',
}

export default function TemplatesHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd
        schema={buildItemListSchema({
          name:'Free Club & Organization Templates',
          description: `${TEMPLATES.length} free templates for clubs - meeting minutes, event planning, budgets, rosters, and more`,
          items: TEMPLATES.map((t) => ({
            name: t.title,
            url: `/templates/${t.slug}`,
            description: t.description.slice(0, 160),
          })),
        })}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Templates', url:'/templates' },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Free Templates
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Free Club &amp; Organization Templates
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-xl text-gray-600">
            {TEMPLATES.length} ready-to-use templates for clubs and nonprofits - meeting minutes,
            event planning, budgets, rosters, and more. Copy, customize, and use immediately.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Quick Answer - targets"what is a meeting minutes template" voice/AI queries */}
      <section className="py-10">
        <div className="mx-auto max-w-3xl px-4">
          <QuickAnswer
            question="What templates do clubs need?"
            answer="Every club needs at minimum: a meeting minutes template to record decisions and action items, an event planning template to coordinate activities, a budget template for financial transparency, and a member roster to manage contacts. These four documents form the administrative backbone of any well-run club or organization."
          />
        </div>
      </section>

      {/* Category Sections */}
      {TEMPLATE_CATEGORIES.map((category) => {
        const entries = getTemplatesByCategory(category)
        if (entries.length === 0) return null
        return (
          <section key={category} className="py-14 odd:bg-gray-50">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-8 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {CATEGORY_ICONS[category]}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <p className="text-gray-600">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/templates/${entry.slug}`}
                    className="group rounded-lg border border-gray-200  bg-white  p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50  px-2 py-0.5 text-xs font-medium capitalize text-emerald-700">
                        {entry.category}
                      </span>
                      <span className="text-xs text-gray-500">Free</span>
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900  group-hover:text-emerald-700">
                      {entry.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {entry.description.length > 120 ? entry.description.slice(0, 120) +'...' : entry.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-600  group-hover:text-emerald-700">
                      View template
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Why use templates section */}
      <section className="bg-emerald-50  py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Why every club needs written templates
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Clubs that use standardized templates spend less time recreating documents from
              scratch, make fewer administrative errors, and hand off leadership more smoothly when
              officers change. A new treasurer who inherits a well-formatted budget template can
              get up to speed in hours instead of weeks.
            </p>
            <p>
              Meeting minutes templates are particularly important: without a written record,
              clubs frequently experience disputes about what was decided. A consistent minutes
              format also makes it far easier to search your archive for past decisions.
            </p>
            <p>
              These templates are designed for real clubs. They include every field you actually
              need - and none of the bureaucratic overhead that makes templates feel like homework.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-Hub Navigation */}
      <HubCrossLinks currentHub="templates" />

      {/* CTA */}
      <FunnelCta
        currentStage="tofu"
        heading="Let GatherGrove handle this automatically"
        description="Meeting minutes, member rosters, event RSVPs, and dues collection - all managed in one place. Start with a 30-day free trial."
      />
      <Footer />
    </main>
  )
}
