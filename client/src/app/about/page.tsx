import { Metadata } from'next'
import Link from'next/link'
import { createPageMetadata } from'@/lib/marketing-metadata'
import {
  buildPersonSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { SITE_AUTHOR_LINKEDIN } from'@/lib/site-config'
import { Header } from'@/components/shared/Header'
import { Footer } from'@/components/shared/Footer'

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title:'About Angel Campa, Founder',
    description:'Meet Angel Campa, the founder of GatherGrove. Learn about the mission to help hobby clubs and community organizations modernize their operations with simple, affordable software.',
    slug:'about',
    keywords:'Angel Campa, GatherGrove founder, club management software, hobby club technology',
  })
}

const breadcrumbItems = [
  { name:'Home', href:'/' },
  { name:'About', href:'/about' },
]

export default function AboutPage() {
  const personSchema = buildPersonSchema()
  const organizationSchema = buildOrganizationSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'About', url:'/about' },
  ])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={personSchema} />
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />
      <main>
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Hero section */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-3xl font-bold">
            AC
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900  sm:text-5xl">
              About GatherGrove
            </h1>
            <p className="mt-4 text-lg text-emerald-700  font-medium">
              Built by Angel Campa, Founder
            </p>
          </div>
        </div>
      </section>

      {/* Bio section */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="space-y-5 text-lg leading-relaxed text-gray-700">
          <p>
            Hi, I&apos;m Angel Campa. I started GatherGrove because I saw how
            many hobby clubs and community organizations still rely on
            spreadsheets, group texts, and disconnected tools to manage their
            members and events. It felt like a problem worth solving.
          </p>
          <p>
            GatherGrove is membership and event management software designed
            specifically for small to medium-sized clubs. The goal is
            straightforward: give club leaders one place to handle member
            records, collect dues, coordinate events, and communicate with
            their community, without the complexity or cost of enterprise
            platforms built for much larger organizations.
          </p>
          <p>
            I&apos;m building GatherGrove with direct input from club
            leaders - every feature is shaped by real organizer feedback.
            If you run a hobby club, sports league, book club, or any kind of
            community group, I&apos;d genuinely like to hear what would make
            your life easier.
          </p>
        </div>

        {/* Links */}
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={SITE_AUTHOR_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            Connect on LinkedIn
            <span aria-hidden="true">&rarr;</span>
          </a>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300  bg-white  px-5 py-2.5 text-sm font-semibold text-gray-700  shadow-sm hover:bg-gray-50  transition-colors"
          >
            Browse Resources
          </Link>
          <Link
            href="/for"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300  bg-white  px-5 py-2.5 text-sm font-semibold text-gray-700  shadow-sm hover:bg-gray-50  transition-colors"
          >
            Solutions by Club Type
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300  bg-white  px-5 py-2.5 text-sm font-semibold text-gray-700  shadow-sm hover:bg-gray-50  transition-colors"
          >
            Platform Features
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300  bg-white  px-5 py-2.5 text-sm font-semibold text-gray-700  shadow-sm hover:bg-gray-50  transition-colors"
          >
            Compare Alternatives
          </Link>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  )
}
