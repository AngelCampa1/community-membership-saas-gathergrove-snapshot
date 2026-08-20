import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Smartphone, Bell, MapPin, Users } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema, buildServiceSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Volunteer Management App ${CURRENT_YEAR} - iOS & Android | GatherGrove`,
    description:`A volunteer management app that works on iOS and Android. Sign up for shifts, track hours, and receive reminders from your phone. Plans from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
    slug:'volunteer-management/app',
    keywords:'volunteer management app, volunteer management mobile app, volunteer app for nonprofits, volunteer scheduling app, volunteer hour tracking app',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is the best volunteer management app?',
    answer:`GatherGrove is the best volunteer management app for small to mid-sized nonprofits and community organizations. It is available on iOS and Android and includes volunteer sign-up forms, shift scheduling, hour tracking, and automated reminders - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial. For large enterprise volunteer programs (hospitals, universities), Better Impact and VolunteerHub also offer mobile access.`,
  },
  {
    question:'Is there a free volunteer management app?',
    answer:`Yes. GatherGrove includes full mobile app access on iOS and Android with plans starting at ${SEED_MONTHLY_PRICE_COPY} and a 30-day free trial. Volunteers can check in to shifts, view schedules, and receive push notifications.`,
  },
  {
    question:'Can volunteers check in from their phone?',
    answer:'Yes. GatherGrove includes QR code check-in for volunteer shifts. Volunteers scan a QR code at the event or shift location, and their hours are automatically logged. Alternatively, administrators can check volunteers in from the app dashboard.',
  },
  {
    question:'Do volunteers need to create an account to use the app?',
    answer:'Volunteers do not need to create an account to sign up for a shift using the public sign-up link. For push notifications and shift reminders through the mobile app, volunteers download the GatherGrove app and connect to your organization.',
  },
  {
    question:'Does the volunteer management app work offline?',
    answer:'Basic shift information is cached for offline access. QR code check-in requires a brief internet connection to sync hours. The app performs best with a cellular or WiFi connection for real-time updates and notifications.',
  },
]

const APP_FEATURES = [
  {
    icon: Smartphone,
    title:'Native iOS & Android App',
    description:'Volunteers and administrators get a native app experience - not a mobile website. Available free on the App Store and Google Play for all GatherGrove organizations.',
  },
  {
    icon: Bell,
    title:'Push Notifications for Shift Reminders',
    description:'Automated push notifications remind volunteers 24 hours before their shift, reducing no-shows. Volunteers can confirm or cancel directly from the notification.',
  },
  {
    icon: MapPin,
    title:'QR Code Check-In',
    description:'Volunteers scan a QR code when they arrive at a shift. Hours are logged automatically - no paper sign-in sheets or manual hour entry required.',
  },
  {
    icon: Users,
    title:'Shift Scheduling for Admins',
    description:'Administrators create volunteer shifts with capacity limits from the mobile app. View who has signed up, send targeted reminders, and track real-time attendance.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove App','SignUpGenius Mobile']
const COMPARISON_ROWS = [
  { Feature:'Native iOS & Android app','GatherGrove App':'Yes','SignUpGenius Mobile':'Mobile website only' },
  { Feature:'Push notifications','GatherGrove App':'Yes - shift reminders included','SignUpGenius Mobile':'Paid plan required' },
  { Feature:'QR code check-in','GatherGrove App':'Yes - automatic hour logging','SignUpGenius Mobile':'No' },
  { Feature:'Volunteer hour tracking','GatherGrove App':'Per-volunteer logs + export','SignUpGenius Mobile':'No' },
  { Feature:'Offline shift access','GatherGrove App':'Basic cache available','SignUpGenius Mobile':'No' },
  { Feature:'Free trial','GatherGrove App':'30-day free trial','SignUpGenius Mobile':'Limited free version' },
]

const USE_CASES = [
  { org:'Food banks', use:'Volunteers check in for distribution day shifts via QR code, hours logged for grant reports' },
  { org:'Community events', use:'Day-of crew schedules on phones, real-time check-in as volunteers arrive' },
  { org:'Youth sports leagues', use:'Coaches and refs confirm availability from their phones, receive game-day reminders' },
  { org:'Faith-based organizations', use:'Service project volunteers sign up and receive shift reminders on iOS and Android' },
  { org:'Animal shelters', use:'Dog walkers view available slots and sign up for shifts from the mobile app' },
  { org:'Environmental groups', use:'Cleanup day crews get push notifications and check in at the trailhead QR code' },
]

export default function VolunteerManagementAppPage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const serviceSchema = buildServiceSchema()
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Volunteer Management', url:'/volunteer-management' },
    { name:'Mobile App', url:'/volunteer-management/app' },
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
            Volunteer Management App {CURRENT_YEAR}
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Volunteer Management App for iOS and Android
          </h1>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is the best volunteer management app?"
              answer={`GatherGrove is a volunteer management app available on iOS and Android. It includes shift scheduling, QR code check-in for automatic hour logging, push notifications for shift reminders, and grant-ready hour export reports - plans from ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`}
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

      {/* Why a mobile app matters */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Why Volunteer Coordination Needs a Mobile App
          </h2>
          <div className="space-y-4 text-gray-700" data-ai-answer="true">
            <p>
              Volunteers do not manage their commitments from a desktop. They sign up on their phones, check schedules from their phones, and need reminders sent to their phones. A volunteer management platform without a native mobile app creates unnecessary friction at every step.
            </p>
            <p>
              GatherGrove&apos;s native iOS and Android app is the full volunteer management experience - not a stripped-down mobile website. Volunteers see their upcoming shifts, receive push notifications before each one, and check in via QR code when they arrive. Administrators manage schedules, view attendance, and send messages directly from the app.
            </p>
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="bg-gray-50  py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-gray-900">
            What the GatherGrove Volunteer App Includes
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {APP_FEATURES.map(({ icon: Icon, title, description }) => (
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
            How Organizations Use the Volunteer Management App
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
            GatherGrove vs. SignUpGenius Mobile
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove volunteer management app vs. SignUpGenius mobile experience"
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
            <li><Link href="/volunteer-management/best-software" className="text-emerald-600 hover:underline">Best Volunteer Management Software</Link></li>
            <li><Link href="/volunteer-management/for-nonprofits" className="text-emerald-600 hover:underline">Volunteer Management for Nonprofits</Link></li>
            <li><Link href="/volunteer-management/free" className="text-emerald-600 hover:underline">Free Volunteer Management Software</Link></li>
            <li><Link href="/alternatives/signupgenius" className="text-emerald-600 hover:underline">Best SignUpGenius Alternatives</Link></li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Volunteer management app for clubs &amp; nonprofits
          </h2>
          <p className="mb-8 text-lg text-emerald-100">
            iOS and Android included. Shift scheduling, QR check-in, push notifications - from {SEED_MONTHLY_PRICE_COPY}.
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
