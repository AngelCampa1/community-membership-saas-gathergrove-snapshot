import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, GraduationCap, Calendar, Users, Clock } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildServiceSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Management Software for Schools ${CURRENT_YEAR} | GatherGrove`,
    description:`Volunteer management software for schools, PTAs, and PTOs. Coordinate parent volunteers for events, classroom help, and fundraisers - with automated reminders and hour tracking. Plans from ${SEED_MONTHLY_PRICE_COPY}.`,
    slug:'volunteer-management/for-schools',
    keywords:'volunteer management software for schools, school volunteer management, PTA volunteer management, PTO volunteer coordinator, parent volunteer software, school volunteer scheduling',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best volunteer management software for schools?',
    answer:`GatherGrove is volunteer management software that works well for schools, PTAs, and PTOs. It includes parent volunteer sign-up forms, event scheduling, automated reminders, and volunteer hour tracking - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. For large school districts coordinating hundreds of volunteers across multiple schools, dedicated tools like VolunteerHub may offer deeper enterprise features.`,
  },
  {
    question:'How do PTAs and PTOs manage parent volunteers?',
    answer:'Effective PTA and PTO volunteer management involves three steps: creating sign-up forms for each event or need (field trip chaperones, bake sale volunteers, book fair helpers), sending automated reminders before each commitment, and tracking participation to recognize your most active volunteers. GatherGrove automates each step and replaces manual sign-up sheets with a shareable link.',
  },
  {
    question:'Is there free volunteer management software for PTAs?',
    answer:`GatherGrove is built for PTAs and PTOs. You get event-based sign-up forms, automated email reminders, volunteer hour tracking, and a parent directory - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
  },
  {
    question:'Can parents sign up for school volunteer opportunities without an account?',
    answer:'Yes. GatherGrove generates a public sign-up link for each volunteer opportunity. Parents click the link, enter their name and email, and select their preferred slot - no app download or account required for sign-up. Push notifications through the app are available for parents who want reminders on their phone.',
  },
  {
    question:'How does volunteer hour tracking help school organizations?',
    answer:'Many schools and PTAs track volunteer hours for annual reports, grant applications, or recognition programs. GatherGrove logs hours per volunteer and per event. You can export hour reports by parent name, date range, or event type - useful for end-of-year recognition ceremonies, school board reports, and grant documentation.',
  },
]

const SCHOOL_FEATURES = [
  {
    icon: Calendar,
    title:'Event-Based Sign-Up Forms',
    description:'Create a sign-up form for each school event or volunteer need. Share the link in your school email, app, or website. Parents pick their slot without calling the front office.',
  },
  {
    icon: Users,
    title:'Parent Directory',
    description:'Maintain a searchable parent volunteer directory with contact information, availability notes, and participation history - accessible to PTA/PTO board members.',
  },
  {
    icon: Clock,
    title:'Volunteer Hour Tracking',
    description:'Log hours per parent and per event. Export hour reports for end-of-year recognition programs, grant applications, and school board annual reports.',
  },
  {
    icon: GraduationCap,
    title:'School Event Coordination',
    description:'Coordinate volunteers for book fairs, field trips, fundraisers, school carnivals, and classroom help - all in one calendar with capacity limits per role.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','SignUpGenius']
const COMPARISON_ROWS = [
  { Feature:'Event sign-up forms', GatherGrove:'Yes - unlimited events', SignUpGenius:'Yes (limited on free plan)' },
  { Feature:'Automated reminders', GatherGrove:'Email included', SignUpGenius:'Paid plan required' },
  { Feature:'Volunteer hour tracking', GatherGrove:'Per-volunteer logs + export', SignUpGenius:'No' },
  { Feature:'Parent directory', GatherGrove:'Searchable with privacy controls', SignUpGenius:'No' },
  { Feature:'Mobile app for parents', GatherGrove:'Yes - iOS & Android', SignUpGenius:'Mobile website only' },
  { Feature:'Free trial', GatherGrove:'30-day free trial', SignUpGenius:'Limited free version' },
]

const USE_CASES = [
  { org:'PTA / PTO events', use:'Book fairs, school carnivals, fundraising events, and end-of-year celebrations with parent volunteer sign-ups' },
  { org:'Field trip chaperones', use:'Per-grade chaperone sign-up with capacity limits, automated reminder before each trip' },
  { org:'Classroom help', use:'Weekly classroom volunteer schedule for teacher aides, reading helpers, and project support' },
  { org:'School cafeteria', use:'Lunch monitor volunteer coordination with recurring weekly schedule' },
  { org:'Fundraiser coordination', use:'Walk-a-thon, bake sale, and auction volunteer shifts managed in one platform' },
  { org:'After-school programs', use:'Club chaperones, homework help volunteers, and enrichment program coordinators' },
]

export default function VolunteerManagementForSchoolsPage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const serviceSchema = buildServiceSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'For Schools', url:'/volunteer-management/for-schools' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            School Volunteer Management {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management Software for Schools and PTAs
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best volunteer management software for schools?"
              answer={`GatherGrove is volunteer management software for schools, PTAs, and PTOs. It includes parent sign-up forms, automated reminders, volunteer hour tracking, and a parent directory - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. Parents can sign up for shifts without creating an account.`}
            />
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/volunteer-management"
              className="inline-flex items-center rounded-lg border border-gray-300  bg-white  px-6 py-3 text-base font-semibold text-gray-700  hover:bg-gray-50"
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>

      {/* Why schools need dedicated software */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Why Schools and PTAs Need Better Than a Sign-Up Sheet
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              School volunteer coordination runs on parent goodwill - and parent time is limited. Every friction point (printed sign-up sheets, reply-all email chains, individual text confirmations) reduces the number of parents who volunteer and increases the time your PTA board spends chasing confirmations.
            </p>
            <p>
              GatherGrove replaces sign-up sheets and email chains with a single shareable link. Parents see available slots, sign up in two clicks, and receive an automatic reminder before each commitment. Your PTA board spends less time coordinating and more time on events.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50  py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Built for School and PTA Volunteer Coordination
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SCHOOL_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 rounded-lg border border-gray-200  bg-white  p-6 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600" data-ai-answer="true">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16" aria-labelledby="use-cases-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="use-cases-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            School Volunteer Coordination for Every Program
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map(({ org, use }) => (
              <div key={org} className="flex items-start gap-3 rounded-lg border border-gray-200  bg-white  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">{org}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-50  py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            GatherGrove vs. SignUpGenius for Schools
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove vs. SignUpGenius for school volunteer management"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_QUESTIONS.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-gray-200  bg-white  p-6">
                <h3 className="mb-2 text-base font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Related Resources</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/scheduling" className="text-emerald-600 hover:underline">Volunteer Scheduling Software</Link></li>
            <li><Link href="/alternatives/signupgenius" className="text-emerald-600 hover:underline">Best SignUpGenius Alternatives</Link></li>
            <li><Link href="/for/pta-pto-organizations" className="text-emerald-600 hover:underline">GatherGrove for PTA / PTO Organizations</Link></li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Built for schools, PTAs, and PTOs
          </h2>
          <p className="mb-8 text-lg text-emerald-100">
            Sign-up forms, automated reminders, and hour tracking - all included. Start with a 30-day free trial.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-white  px-8 py-3 text-base font-semibold text-emerald-700  shadow-sm hover:bg-emerald-50"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
