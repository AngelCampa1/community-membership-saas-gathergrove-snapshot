import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Clock, FileText, Users, Bell } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildServiceSchema, buildBreadcrumbSchema, buildHowToSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { HubCrossLinks } from'@/components/pseo/HubCrossLinks'
import { CURRENT_YEAR } from'@/lib/site-config'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Management Software for Clubs & Nonprofits ${CURRENT_YEAR}`,
    description:`Manage volunteers with sign-up forms, scheduling, hour tracking, and email reminders. From ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members.`,
    slug:'volunteer-management',
    keywords:'volunteer management software, volunteer management program, volunteer management system, nonprofit volunteer management, volunteer scheduling software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:"How much does GatherGrove's volunteer management cost?",
    answer:`GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} on the Seed plan, which supports up to 100 members. Larger groups use Grow at ${GROW_MONTHLY_PRICE_COPY} for up to 200 members or Expand at ${UNLIMITED_MONTHLY_PRICE_COPY} for up to 2,000 members.`,
  },
  {
    question:'Does GatherGrove track volunteer hours?',
    answer:'Yes. You can log and report volunteer hours directly from the member dashboard. Hour logs can be exported for grant reporting, annual reports, and volunteer recognition.',
  },
  {
    question:'Can volunteers sign up themselves?',
    answer:'Yes. You can share a public sign-up link so volunteers register themselves for specific roles or shifts. No account required for volunteers to sign up.',
  },
  {
    question:'Does it work for nonprofits?',
    answer:`Yes. GatherGrove is designed for nonprofits, clubs, and community organizations of all sizes. The Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} for organizations with up to 100 members.`,
  },
  {
    question:'Can I send reminder emails to volunteers?',
    answer:'Yes. Automated email reminders are included on all plans. Set reminders to go out 24 hours and 1 hour before a shift, or customize the timing to fit your workflow.',
  },
  {
    question:"What's the difference between a volunteer management system and a member management system?",
    answer:'Member management covers dues, profiles, and communication for your core membership. Volunteer management adds sign-up forms, shift scheduling, and hour tracking for people who give their time. GatherGrove combines both in one platform - so your volunteer records connect directly to your member directory.',
  },
]

const HOW_TO_STEPS = [
  {
    title:'Create your GatherGrove account',
    description:'Sign up at gathergrove.club/register. Start with a 30-day free trial - credit card required to activate.',
  },
  {
    title:'Add your volunteer roles or event positions',
    description:'Define the roles you need volunteers to fill - e.g.,"Event Setup Crew","Registration Table","Clean-up Team". Assign slot counts and time windows to each role.',
  },
  {
    title:'Share your volunteer sign-up link with your community',
    description:'GatherGrove generates a public sign-up link you can post on social media, email to your list, or embed on your website. Volunteers can register themselves without needing a GatherGrove account.',
  },
  {
    title:'Assign volunteers to shifts and send confirmation emails',
    description:'Review sign-ups in your dashboard, assign volunteers to specific shifts, and send automated confirmation emails with shift details and location information.',
  },
  {
    title:'Track hours and generate reports for grant applications',
    description:'Log completed volunteer hours against each shift. Export hour reports by volunteer, event, or date range - formatted for grant applications, annual reports, and board presentations.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Spreadsheets']
const COMPARISON_ROWS = [
  { Feature:'Volunteer sign-up forms', GatherGrove:'Built-in, shareable link', Spreadsheets:'Manual entry only' },
  { Feature:'Shift scheduling', GatherGrove:'Visual shift builder', Spreadsheets:'Manual table formatting' },
  { Feature:'Automated reminders', GatherGrove:'Email included', Spreadsheets:'No reminders' },
  { Feature:'Hour tracking', GatherGrove:'Per-volunteer logs + export', Spreadsheets:'Manual calculation' },
  { Feature:'Member directory connection', GatherGrove:'Unified with member profiles', Spreadsheets:'Separate from member list' },
  { Feature:'Grant-ready reports', GatherGrove:'One-click export', Spreadsheets:'Manual formatting required' },
]

const WHO_USES = [
  { label:'Sports clubs', description:'Game-day volunteers, concession staff, scoreboard operators' },
  { label:'Nonprofits', description:'Event volunteers, committee members, outreach teams' },
  { label:'Community organizations', description:'Neighborhood event crews, cleanup day coordinators' },
  { label:'Alumni groups', description:'Reunion planning committees, mentorship program volunteers' },
  { label:'School PTAs', description:'Classroom helpers, fundraiser volunteers, field trip chaperones' },
  { label:'Religious organizations', description:'Service project crews, hospitality teams, youth program helpers' },
]

const FEATURE_CARDS = [
  {
    icon: FileText,
    title:'Sign-Up Forms',
    description:'Create custom volunteer registration forms for any event or role. Share a public link - no GatherGrove account required for volunteers.',
  },
  {
    icon: Clock,
    title:'Shift Scheduling',
    description:'Build shifts with slot limits, assign volunteers, and send automated reminders so the right people show up at the right time.',
  },
  {
    icon: Users,
    title:'Hour Tracking',
    description:'Log volunteer hours per person and per event. Export reports by date range for grant applications, annual reports, and recognition programs.',
  },
  {
    icon: Bell,
    title:'Automated Communications',
    description:'Email reminders fire automatically before shifts. Reduce no-shows without manual follow-up.',
  },
]

export default function VolunteerManagementPage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const serviceSchema = buildServiceSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
  ])
  const howToSchema = buildHowToSchema({
    name:'How to Set Up Volunteer Management in GatherGrove',
    description:'Step-by-step guide to setting up volunteer sign-up forms, shift scheduling, and hour tracking in GatherGrove.',
    slug:'volunteer-management',
    steps: HOW_TO_STEPS,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={howToSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Volunteer Management
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management Software for Clubs &amp; Nonprofits
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What does GatherGrove's volunteer management include?"
              answer={`GatherGrove's volunteer management tools let you create sign-up forms, schedule shifts, track volunteer hours, and send automated reminders - all from one dashboard. Plans start at ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
            data-testid="hero-cta"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Everything You Need to Manage Volunteers
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
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

      {/* How-To Steps */}
      <section className="bg-gray-50  py-16" aria-labelledby="howto-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="howto-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            How to Set Up Volunteer Management in GatherGrove
          </h2>
          <ol className="space-y-6">
            {HOW_TO_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600" data-ai-answer="true">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            Volunteer Management: GatherGrove vs. Spreadsheets
          </h2>
          <p className="mb-8 text-center text-gray-600">
            Spreadsheets work for your first 10 volunteers. After that, you need purpose-built tools.
          </p>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove vs. Spreadsheets for volunteer management"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Who Uses It */}
      <section className="bg-gray-50  py-16" aria-labelledby="who-uses-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="who-uses-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Who Uses GatherGrove for Volunteer Management?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHO_USES.map(({ label, description }) => (
              <div key={label} className="flex items-start gap-3 rounded-lg bg-white  p-5 shadow-sm">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
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
              <div key={faq.question} className="rounded-lg border border-gray-200   p-6">
                <h3 className="mb-2 text-base font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cluster links */}
      <section className="py-12" aria-labelledby="guides-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="guides-heading" className="mb-6 text-xl font-bold text-gray-900">Explore Volunteer Management Guides</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { href:'/volunteer-management/for-nonprofits', title:'For Nonprofits', description:'Grant-ready hour tracking and compliance tools for nonprofit orgs' },
              { href:'/volunteer-management/for-schools', title:'For Schools & PTAs', description:'Parent volunteer sign-ups, hour tracking, and school event coordination' },
              { href:'/volunteer-management/for-churches', title:'For Churches', description:'Recurring service schedules and multi-ministry volunteer coordination' },
              { href:'/volunteer-management/app', title:'Mobile App', description:'iOS and Android app with QR check-in and push notification reminders' },
              { href:'/volunteer-management/free', title:'Free Software', description:'Full-featured volunteer management with a 30-day free trial for any organization' },
              { href:'/volunteer-management/scheduling', title:'Scheduling Software', description:'Shift builder, slot limits, and automated reminders for any event' },
              { href:'/volunteer-management/hour-tracking', title:'Hour Tracking', description:'Log volunteer hours automatically from shifts and export reports for grants' },
              { href:'/volunteer-management/best-software', title:'Best Software Compared', description:'Top volunteer management tools ranked by features, pricing, and use case' },
            ].map(({ href, title, description }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col rounded-lg border border-gray-200   p-5 hover:border-emerald-300 hover:shadow-sm transition-shadow"
              >
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-emerald-600">
                  Read guide <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HubCrossLinks currentHub="volunteer-management" />

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Built for clubs like yours
          </h2>
          <p className="mb-8 text-lg text-emerald-100">
            Plans from {SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members. Start with a 30-day free trial.
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
