import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Clock, Calendar, Bell, Users } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildHowToSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { getRelatedContent } from'@/lib/data/content-links'
import { VOLUNTEER_MANAGEMENT_LINKS } from'@/lib/data/volunteer-management-links'

import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
const PAGE_KEYWORDS = ['volunteer','scheduling','volunteer scheduling','schedule volunteers','shift management']

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Scheduling Software ${CURRENT_YEAR} - Shift Management for Clubs`,
    description:`Volunteer scheduling software with shift builder, automated reminders, and slot capacity management. From ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members. Replace your scheduling spreadsheets.`,
    slug:'volunteer-management/scheduling',
    keywords:'volunteer scheduling software, volunteer scheduling app, volunteer shift scheduling, volunteer coordinator software, volunteer schedule management, free volunteer scheduling software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is volunteer scheduling software?',
    answer:'Volunteer scheduling software lets organizations create shifts, assign volunteers to time slots, set capacity limits, and send automated reminders. It replaces manual scheduling via email, phone calls, or spreadsheets. GatherGrove\'s scheduling tools include a visual shift builder, public sign-up links, slot limits, and automated email reminders before each shift.',
  },
  {
    question:'How does GatherGrove handle volunteer shift scheduling?',
    answer:'GatherGrove\'s shift builder lets you create shifts with a name, date, start/end time, and slot capacity (e.g.,"Event Setup - 5 slots, 9am-12pm"). Volunteers sign up via a public link - no GatherGrove account required. You can also manually assign volunteers to shifts from your admin dashboard. Automated reminders fire 24 hours and 1 hour before each shift.',
  },
  {
    question:'Can volunteers sign themselves up for shifts?',
    answer:'Yes. GatherGrove generates a public sign-up page for each event or volunteer opportunity. You share the link via email, social media, or your website. Volunteers see open slots, select their preferred shift, and are confirmed automatically. When a shift hits its capacity, it shows as full to other visitors.',
  },
  {
    question:'Does volunteer scheduling software send automatic reminders?',
    answer:'Yes. GatherGrove sends automated email reminders to scheduled volunteers at intervals you configure - typically 24 hours and 1 hour before the shift. This reduces no-shows without requiring manual follow-up from coordinators.',
  },
  {
    question:'How is volunteer scheduling software different from a sign-up sheet?',
    answer:'A sign-up sheet (paper or Google Form) only collects names. Volunteer scheduling software adds slot capacity management (so you never overbook a shift), automated reminder delivery, hour logging after the shift, and historical records for each volunteer. GatherGrove connects scheduling to your full member directory, so scheduling and member management are one system, not two.',
  },
  {
    question:'How much does volunteer scheduling software cost?',
    answer:`GatherGrove\'s Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} for organizations with up to 100 members and includes full scheduling features - shift builder, slot limits, automated reminders, and hour tracking. Organizations over 100 members upgrade to ${GROW_MONTHLY_PRICE_COPY} on the Grow plan.`,
  },
]

const HOW_TO_STEPS = [
  {
    title:'Create your volunteer opportunity or event in GatherGrove',
    description:'Set the event name, date, and description. This becomes the container for all shifts associated with this volunteer occasion.',
  },
  {
    title:'Add shifts with times and slot capacities',
    description:'Build individual shifts within the event - e.g.,"Setup Crew (9am-12pm, 5 slots)" and"Registration Table (11am-2pm, 3 slots)". Slot limits prevent overbooking automatically.',
  },
  {
    title:'Share your public sign-up link',
    description:'GatherGrove generates a unique sign-up page for the event. Share via email blast, social media post, or embed on your website. Volunteers see all open shifts and available slots in real time.',
  },
  {
    title:'Review sign-ups and manually assign if needed',
    description:'Monitor sign-ups in your admin dashboard. Manually assign volunteers to specific shifts, or move volunteers between shifts when plans change.',
  },
  {
    title:'Automated reminders go out before each shift',
    description:'GatherGrove sends email reminders to all scheduled volunteers 24 hours and 1 hour before their shift.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Google Forms','Paper Sign-Up Sheet']
const COMPARISON_ROWS = [
  { Feature:'Slot capacity limits', GatherGrove:'Automatic','Google Forms':'Not available','Paper Sign-Up Sheet':'Manual counting' },
  { Feature:'Automated reminders', GatherGrove:'Email','Google Forms':'No','Paper Sign-Up Sheet':'No' },
  { Feature:'Real-time slot availability', GatherGrove:'Live updates','Google Forms':'No','Paper Sign-Up Sheet':'No' },
  { Feature:'Hour tracking after shift', GatherGrove:'Built-in','Google Forms':'No','Paper Sign-Up Sheet':'No' },
  { Feature:'Volunteer history records', GatherGrove:'Per-member log','Google Forms':'Responses only','Paper Sign-Up Sheet':'None' },
  { Feature:'Volunteer account required', GatherGrove:'No - public link','Google Forms':'No','Paper Sign-Up Sheet':'No' },
]

const SCHEDULING_FEATURES = [
  {
    icon: Calendar,
    title:'Visual Shift Builder',
    description:'Create shifts with names, times, and slot limits. See all shifts for an event at a glance. Reassign volunteers between shifts from the admin dashboard.',
  },
  {
    icon: Users,
    title:'Slot Capacity Management',
    description:'Set slot limits per shift. GatherGrove automatically closes sign-ups when a shift is full, preventing overbooking without manual monitoring.',
  },
  {
    icon: Bell,
    title:'Automated Shift Reminders',
    description:'Configure email reminder timing. Volunteers receive confirmations at sign-up and automated reminders before their shift.',
  },
  {
    icon: Clock,
    title:'Hour Logging After Shifts',
    description:'Log completed hours against each shift. Build a running volunteer hour log exportable for grant applications, annual reports, and volunteer recognition.',
  },
]

export default function VolunteerSchedulingPage() {
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'volunteer-management',
    currentSlug:'scheduling',
    maxResults: 6,
  })

  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const howToSchema = buildHowToSchema({
    name:'How to Schedule Volunteers with GatherGrove',
    description:'Step-by-step guide to creating volunteer shifts, managing slot capacity, and automating reminders with GatherGrove.',
    slug:'volunteer-management/scheduling',
    steps: HOW_TO_STEPS,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'Scheduling', url:'/volunteer-management/scheduling' },
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={howToSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Volunteer Management', href:'/volunteer-management' },
              { name:'Scheduling', href:'/volunteer-management/scheduling' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
            Volunteer Scheduling
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Scheduling Software
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What does volunteer scheduling software do?"
              answer={`Volunteer scheduling software creates shifts with time slots and capacity limits, lets volunteers sign up via a public link, and sends automated reminders before each shift. GatherGrove's scheduling features start at ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members and replace spreadsheet-based scheduling with automated coordination.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            Scheduling Tools Built for Volunteer Coordinators
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SCHEDULING_FEATURES.map(({ icon: Icon, title, description }) => (
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

      {/* How to steps */}
      <section className="bg-gray-50  py-16" aria-labelledby="howto-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="howto-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            How to Schedule Volunteers in GatherGrove
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-gray-900">
            Volunteer Scheduling Software vs. Manual Methods
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove scheduling vs. manual volunteer coordination methods"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Problem it solves */}
      <section className="bg-gray-50  py-16" aria-labelledby="problems-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="problems-heading" className="mb-6 text-3xl font-bold text-gray-900">
            Common Volunteer Scheduling Problems - Solved
          </h2>
          <div className="space-y-4">
            {[
              { problem:'Overbooking shifts', solution:'Slot capacity limits automatically close sign-ups when a shift is full.' },
              { problem:'No-shows on event day', solution:'Automated email reminders before every shift.' },
              { problem:'Volunteers unsure where to go', solution:'Confirmation emails include shift time, location, and role details.' },
              { problem:'Manual hour reconciliation', solution:'Hours log automatically against each shift for grant and annual reporting.' },
              { problem:'Last-minute schedule changes', solution:'Update shifts in your dashboard; changes sync to all volunteer notifications.' },
            ].map(({ problem, solution }) => (
              <div key={problem} className="flex items-start gap-3 rounded-lg border border-gray-200  bg-white  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">{problem}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{solution}</p>
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

      {/* Related links */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Related Resources</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/volunteer-management" className="text-emerald-600 hover:underline">Volunteer Management Software Overview</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/free" className="text-emerald-600 hover:underline">Free Volunteer Management Software</Link></li>
            <li><Link href="/features/event-planning" className="text-emerald-600 hover:underline">Event Planning Features</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="volunteer-management" currentSlug="scheduling" />

      {/* More Volunteer Guides */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">More Volunteer Management Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER_MANAGEMENT_LINKS.filter((link) => link.href !=='/volunteer-management/scheduling').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group block bg-white  rounded-lg border border-gray-200  p-5 hover:border-emerald-400 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900  group-hover:text-emerald-700  mb-1">{link.title}</h3>
                <p className="text-sm text-gray-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FunnelCta currentStage="mofu" heading="Replace your scheduling spreadsheet today" description={`Automated sign-ups, shift reminders, and capacity management - built into one platform. From ${SEED_MONTHLY_PRICE_COPY}.`} />
      <Footer />
    </main>
  )
}
