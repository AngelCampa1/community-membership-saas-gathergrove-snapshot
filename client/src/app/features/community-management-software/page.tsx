import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Users, MessageSquare, Calendar, BarChart3, Mail, Shield } from'lucide-react'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildFAQPageSchema, buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { QuickAnswer } from'@/components/seo/QuickAnswer'
import { ComparisonTable } from'@/components/seo/ComparisonTable'
import { CURRENT_YEAR } from'@/lib/site-config'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { PseoRelatedCards } from'@/components/pseo/PseoRelatedCards'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { getRelatedContent } from'@/lib/data/content-links'

import { GROW_ANNUAL_PRICE_COPY, GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_ANNUAL_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Community Management Software ${CURRENT_YEAR} - Members, Events & Chat`,
    description:`Community management software with member directory, event coordination, real-time chat, dues collection, and analytics. Built for clubs and nonprofits. From ${SEED_MONTHLY_PRICE_COPY} for up to 100 members.`,
    slug:'features/community-management-software',
    keywords:'community management software, community management platform, community management tools, online community management, community engagement software, community organization software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is community management software?',
    answer:'Community management software is a platform that helps organizations coordinate their members, events, communications, and finances in one system. It replaces the patchwork of spreadsheets, email tools, payment processors, and messaging apps that most clubs and nonprofits cobble together. GatherGrove combines a member directory, event management, dues collection, real-time chat, and analytics in a single dashboard.',
  },
  {
    question:'How is community management software different from social media groups?',
    answer:'Social media groups (Facebook Groups, Discord servers) handle discussion but lack structured member data, payment processing, event registration with RSVP tracking, and administrative tools like role management and reporting. Community management software like GatherGrove provides a member database with custom fields, automated dues collection, event coordination with QR check-in, and engagement analytics - features that social platforms do not offer.',
  },
  {
    question:'What types of communities use community management software?',
    answer:'Hobby clubs (running clubs, book clubs, garden clubs), youth sports leagues, nonprofits, professional associations, alumni groups, parent-teacher organizations, and houses of worship. Any group with recurring members, regular events, and financial transactions benefits from dedicated community management software over ad hoc tools.',
  },
  {
    question:'Does GatherGrove work for online communities?',
    answer:'GatherGrove supports both in-person and hybrid communities. The platform includes real-time chat, email, push alerts, a member portal, and a mobile app for iOS and Android. Members can register for events, pay dues, and talk with other members whether they are local or remote.',
  },
  {
    question:'How much does community management software cost?',
    answer:`GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan) for communities up to 100 members. The Grow plan (${GROW_MONTHLY_PRICE_COPY} or ${GROW_ANNUAL_PRICE_COPY}) supports up to 200 members. The Expand plan (${UNLIMITED_MONTHLY_PRICE_COPY} or ${UNLIMITED_ANNUAL_PRICE_COPY}) supports up to 2,000 members, 50,000 emails each month, unlimited events, and unlimited custom fields. No platform fees on payment processing for any plan.`,
  },
  {
    question:'Can I migrate from spreadsheets to community management software?',
    answer:'Yes. GatherGrove supports CSV import for member data - names, emails, phone numbers, roles, and custom fields. Most organizations migrate their existing spreadsheet in under 10 minutes. Historical dues and event data can be imported as well.',
  },
]

const COMPARISON_HEADERS = ['Capability','GatherGrove','Facebook Groups','Discord','Spreadsheets + Email']
const COMPARISON_ROWS = [
  { Capability:'Member directory with custom fields', GatherGrove:'Built-in','Facebook Groups':'No', Discord:'No','Spreadsheets + Email':'Manual' },
  { Capability:'Dues and payment collection', GatherGrove:'Stripe integration','Facebook Groups':'No', Discord:'No','Spreadsheets + Email':'Separate tool' },
  { Capability:'Event registration with RSVP', GatherGrove:'Built-in','Facebook Groups':'Basic polls', Discord:'Bot-dependent','Spreadsheets + Email':'Google Forms' },
  { Capability:'Real-time chat', GatherGrove:'Built-in','Facebook Groups':'Comments', Discord:'Full chat','Spreadsheets + Email':'No' },
  { Capability:'Email and push alerts', GatherGrove:'Built-in','Facebook Groups':'No', Discord:'No','Spreadsheets + Email':'Separate tool' },
  { Capability:'Engagement analytics', GatherGrove:'Per-member dashboard','Facebook Groups':'Group insights', Discord:'Limited','Spreadsheets + Email':'No' },
  { Capability:'Mobile app for members', GatherGrove:'iOS + Android','Facebook Groups':'Facebook app', Discord:'Discord app','Spreadsheets + Email':'No' },
]

const COMMUNITY_FEATURES = [
  {
    icon: Users,
    title:'Member Directory',
    description:'Searchable member database with custom fields, roles (admin, treasurer, member), profile photos, and privacy controls. Import existing members via CSV in minutes.',
  },
  {
    icon: Calendar,
    title:'Event Coordination',
    description:'Create events with online registration, capacity limits, waitlists, payment collection, and QR check-in. Track attendance per member across all events.',
  },
  {
    icon: MessageSquare,
    title:'Real-Time Chat',
    description:'Built-in group chat and direct messaging for your community. No need for a separate chat server. Conversations stay within your organization.',
  },
  {
    icon: Mail,
    title:'Mass Communications',
    description:'Send email and push alerts to member groups. Schedule messages and automate reminders for events and dues.',
  },
  {
    icon: Shield,
    title:'Automated Dues Collection',
    description:'Set up recurring dues with Stripe. Members pay online via credit card. Automated reminders go out before and after due dates. Track payment status in your dashboard.',
  },
  {
    icon: BarChart3,
    title:'Engagement Analytics',
    description:'Per-member engagement scores based on event attendance, dues payments, communication opens, and chat activity. Identify at-risk members before they leave.',
  },
]

const PAGE_KEYWORDS = ['community management software','community platform','community engagement software','online community management']

export default function CommunityManagementSoftwarePage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Features', url:'/features' },
    { name:'Community Management Software', url:'/features/community-management-software' },
  ])
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'features',
    currentSlug:'community-management-software',
    maxResults: 6,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Features', href:'/features' },
              { name:'Community Management Software', href:'/features/community-management-software' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-primary/10  px-4 py-1 text-sm font-medium text-primary">
            Community Management
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground  md:text-5xl">
            Community Management Software
          </h1>
          <div className="mx-auto mb-8 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Problem</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                Community leaders lose context when member records, event signups, dues, and discussions live in different tools.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Solution</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                GatherGrove keeps the directory, events, payments, chat, and analytics connected to the same member profiles.
              </p>
            </div>
          </div>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is community management software?"
              answer={`Community management software is a platform that combines member directory, event coordination, dues collection, communications, and analytics in one system. GatherGrove replaces the patchwork of spreadsheets, Facebook Groups, Venmo, and Mailchimp that most clubs and nonprofits use. Plans start at ${SEED_MONTHLY_PRICE_COPY} for communities up to 100 members.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Build Your Community Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Core community management tools
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {COMMUNITY_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 rounded-lg border border-border  bg-card  p-6 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground" data-ai-answer="true">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-muted/40  py-16" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="comparison-heading" className="mb-6 text-center text-3xl font-bold text-foreground">
            Community Management Software vs. DIY Tools
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove community management vs. social platforms and manual tools"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16" aria-labelledby="audience-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="audience-heading" className="mb-6 text-3xl font-bold text-foreground">
            Who Uses Community Management Software?
          </h2>
          <div className="space-y-4">
            {[
              { org:'Hobby and recreational clubs', detail:'Running clubs, book clubs, garden clubs, and chess clubs managing 20-500 members with regular meetups and events.' },
              { org:'Nonprofits and charitable organizations', detail:'Volunteer coordination, donor engagement tracking, fundraising events, and board communications in one system.' },
              { org:'Youth sports leagues', detail:'Team rosters, game scheduling, seasonal dues collection, and parent communications across multiple age groups.' },
              { org:'Professional associations', detail:'Certification tracking, continuing education events, member directories, and annual conference registration.' },
              { org:'Alumni and affinity groups', detail:'Chapter management across multiple locations, reunion planning, and keeping members connected after graduation.' },
              { org:'Parent-teacher organizations', detail:'Fundraiser coordination, volunteer scheduling, membership drives, and school event management.' },
            ].map(({ org, detail }) => (
              <div key={org} className="flex items-start gap-3 rounded-lg border border-border  bg-card  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">{org}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40  py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_QUESTIONS.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border  bg-card  p-6">
                <h3 className="mb-2 text-base font-semibold text-foreground">{faq.question}</h3>
                <p className="text-muted-foreground" data-ai-answer="true">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-xl font-bold text-foreground">Related Resources</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features" className="text-primary  hover:underline">All GatherGrove Features</Link></li>
            <li><Link href="/compare/best-club-management-software" className="text-primary  hover:underline">Best Club Management Software</Link></li>
            <li><Link href="/compare/best-membership-management-software" className="text-primary  hover:underline">Best Membership Management Software</Link></li>
            <li><Link href="/resources/community-building-strategies" className="text-primary  hover:underline">Community Building Strategies Guide</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="features" currentSlug="community-management-software" />

      <FunnelCta
        currentStage="mofu"
        heading="Manage your community in one platform"
        description={`From ${SEED_MONTHLY_PRICE_COPY} for communities up to 100 members. 30-day trial included.`}
      />
    </main>
  )
}
