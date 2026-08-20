import type { Metadata } from'next'
import Link from'next/link'
import { ArrowRight, CheckCircle, Database, Search, Upload, Tag, Lock, BarChart3 } from'lucide-react'
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

import { SEED_MONTHLY_PRICE_COPY, SEED_MONTHLY_SHORT_COPY } from '@/lib/pricing';
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: `Member Database Software ${CURRENT_YEAR} - Directory & Management`,
    description:`Member database software with custom fields, roles, search, import/export, and engagement tracking. Built for clubs and nonprofits. From ${SEED_MONTHLY_PRICE_COPY} for up to 100 members.`,
    slug:'features/member-database',
    keywords:'member database software, member management system, membership database, member directory software, member engagement software, membership database software, member tracking software',
  })
}

const FAQ_QUESTIONS = [
  {
    question:'What is member database software?',
    answer:'Member database software stores and organizes information about the people in your organization - names, contact details, roles, dues status, event attendance, and custom fields specific to your group. It replaces spreadsheets with a searchable, role-based system where administrators manage members and members access their own profiles through a portal or mobile app.',
  },
  {
    question:'How is a member database different from a CRM?',
    answer:'A CRM (Customer Relationship Management) system like Salesforce or HubSpot is designed for sales pipelines and lead tracking. Member database software like GatherGrove is designed for membership organizations - it handles dues collection, event attendance tracking, member directories, and role-based access that CRMs do not support without extensive customization. For clubs and nonprofits under 500 members, a purpose-built member database is simpler and more affordable than adapting a CRM.',
  },
  {
    question:'Can I add custom fields to member profiles?',
    answer:'Yes. GatherGrove supports unlimited custom fields - text, dropdown, date, checkbox, and number types. Examples: jersey size for a sports club, instrument for a music group, dietary restrictions for event planning, or committee assignments for a nonprofit board. Custom fields are searchable and exportable.',
  },
  {
    question:'Does GatherGrove have a member directory?',
    answer:'Yes. GatherGrove includes a searchable member directory with privacy controls. Members choose which profile fields are visible to other members (e.g., name and photo visible, phone number hidden). Administrators see all fields. The directory is accessible from the web portal and mobile app.',
  },
  {
    question:'Can I import members from a spreadsheet?',
    answer:'Yes. GatherGrove accepts CSV imports with column mapping. Upload your existing spreadsheet and map columns to GatherGrove fields (name, email, phone, role, custom fields). Most organizations complete their import in under 10 minutes. You can also export your full member database as CSV at any time.',
  },
  {
    question:'How does member engagement tracking work?',
    answer:'GatherGrove calculates an engagement score for each member based on event attendance, dues payment history, communication opens, and chat activity. The admin dashboard highlights your most active members and flags at-risk members who have not attended events or opened emails recently - so you can intervene before they leave.',
  },
]

const COMPARISON_HEADERS = ['Feature','GatherGrove','Google Sheets','Salesforce CRM']
const COMPARISON_ROWS = [
  { Feature:'Custom member fields', GatherGrove:'Unlimited, typed fields','Google Sheets':'Any column','Salesforce CRM':'Requires admin setup' },
  { Feature:'Member self-service portal', GatherGrove:'Web + mobile app','Google Sheets':'Not available','Salesforce CRM':'Community Cloud (extra cost)' },
  { Feature:'Dues payment tracking', GatherGrove:'Integrated Stripe','Google Sheets':'Manual entry','Salesforce CRM':'Requires integration' },
  { Feature:'Event attendance linking', GatherGrove:'Automatic per-member','Google Sheets':'Manual cross-reference','Salesforce CRM':'Requires customization' },
  { Feature:'Engagement scoring', GatherGrove:'Built-in','Google Sheets':'Not available','Salesforce CRM':'Einstein (premium add-on)' },
  { Feature:'Privacy controls', GatherGrove:'Per-field member control','Google Sheets':'Sheet-level sharing','Salesforce CRM':'Profile-based' },
  { Feature:'Price for small orgs', GatherGrove:`From ${SEED_MONTHLY_SHORT_COPY} (up to 100 members)`,'Google Sheets':'Free','Salesforce CRM':'$25+/user/month' },
]

const DATABASE_FEATURES = [
  {
    icon: Database,
    title:'Structured Member Profiles',
    description:'Each member has a profile with standard fields (name, email, phone, address) and unlimited custom fields you define. Profiles store dues history, event attendance, communication log, and role assignments.',
  },
  {
    icon: Search,
    title:'Search and Filter',
    description:'Find members by any field - name, role, dues status, custom field value, or engagement level. Save filters as segments for targeted communications or exports.',
  },
  {
    icon: Upload,
    title:'CSV Import and Export',
    description:'Import your existing member spreadsheet with column mapping. Export your full database or filtered segments as CSV for external reporting, mail merges, or backups.',
  },
  {
    icon: Tag,
    title:'Roles and Membership Types',
    description:'Assign roles (admin, treasurer, board member, member) and membership types (active, honorary, youth, family). Roles control dashboard permissions. Types drive dues rates and communication segments.',
  },
  {
    icon: Lock,
    title:'Privacy Controls',
    description:'Members control which profile fields are visible to other members in the directory. Administrators always have full access. GDPR-ready with data export and deletion request support.',
  },
  {
    icon: BarChart3,
    title:'Engagement Tracking',
    description:'Per-member engagement scores combine event attendance, dues payments, email opens, and chat activity. Dashboard highlights active members and flags disengaged members for outreach.',
  },
]

const PAGE_KEYWORDS = ['member database','member database software','membership database','member management system','member directory software']

export default function MemberDatabasePage() {
  const faqSchema = buildFAQPageSchema(FAQ_QUESTIONS)
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name:'Home', url:'/' },
    { name:'Features', url:'/features' },
    { name:'Member Database', url:'/features/member-database' },
  ])
  const relatedContent = getRelatedContent({
    keywords: PAGE_KEYWORDS,
    currentType:'features',
    currentSlug:'member-database',
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
              { name:'Member Database Software', href:'/features/member-database' },
            ]} />
          </div>
          <span className="mb-4 inline-block rounded-full bg-primary/10  px-4 py-1 text-sm font-medium text-primary">
            Member Database
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground  md:text-5xl">
            Member Database Software
          </h1>
          <div className="mx-auto mb-8 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Problem</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                Spreadsheets go stale fast, and every admin ends up working from a different version of the member list.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Solution</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" data-ai-answer="true">
                GatherGrove gives clubs one structured member database connected to dues, events, directories, and engagement reporting.
              </p>
            </div>
          </div>
          <div className="mx-auto mb-8 max-w-2xl">
            <QuickAnswer
              question="What is member database software?"
              answer={`Member database software stores and organizes your organization's member information - profiles, roles, dues status, event attendance, and custom fields - in a searchable system with a self-service portal. GatherGrove replaces spreadsheet-based member tracking with a structured database connected to dues, events, and communications. Plans start at ${SEED_MONTHLY_PRICE_COPY} for up to 100 members.`}
            />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold text-foreground">
            Member Database Features for Clubs and Nonprofits
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {DATABASE_FEATURES.map(({ icon: Icon, title, description }) => (
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
            Member Database Software vs. Spreadsheets vs. CRM
          </h2>
          <ComparisonTable
            headers={COMPARISON_HEADERS}
            rows={COMPARISON_ROWS}
            caption="GatherGrove member database vs. Google Sheets and Salesforce for membership organizations"
            highlightColumn={1}
          />
        </div>
      </section>

      {/* Problems solved */}
      <section className="py-16" aria-labelledby="problems-heading">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="problems-heading" className="mb-6 text-3xl font-bold text-foreground">
            Common member management problems
          </h2>
          <div className="space-y-4">
            {[
              { problem:'Outdated contact information', solution:'Members update their own profiles through the portal. Changes are reflected instantly across events, communications, and the directory.' },
              { problem:'No single source of truth', solution:'One database replaces scattered spreadsheets, email lists, and paper records. Every admin sees the same current data.' },
              { problem:'Manual dues tracking', solution:'Dues payment status updates automatically when members pay through Stripe. Overdue members are flagged for automated reminders.' },
              { problem:'Cannot segment for communications', solution:'Filter members by role, dues status, custom fields, or engagement level. Save segments and send targeted emails to specific groups.' },
              { problem:'No visibility into member engagement', solution:'Engagement scores highlight who is active and who has gone quiet. Take action before members disengage completely.' },
              { problem:'GDPR and data privacy concerns', solution:'Members control their own profile visibility. Built-in data export and deletion request workflows for compliance.' },
            ].map(({ problem, solution }) => (
              <div key={problem} className="flex items-start gap-3 rounded-lg border border-border  bg-card  p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">{problem}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{solution}</p>
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
            <li><Link href="/compare/best-membership-management-software" className="text-primary  hover:underline">Best Membership Management Software</Link></li>
            <li><Link href="/resources/member-retention-strategies" className="text-primary  hover:underline">Member Retention Strategies Guide</Link></li>
            <li><Link href="/resources/new-member-onboarding-best-practices" className="text-primary  hover:underline">New Member Onboarding Best Practices</Link></li>
          </ul>
        </div>
      </section>

      <PseoRelatedCards heading="Explore Related Resources" items={relatedContent} />

      <FunnelNextSteps keywords={PAGE_KEYWORDS} currentType="features" currentSlug="member-database" />

      <FunnelCta
        currentStage="mofu"
        heading="Replace your member spreadsheet today"
        description={`From ${SEED_MONTHLY_PRICE_COPY} for organizations up to 100 members. Import your existing data in minutes.`}
      />
    </main>
  )
}
