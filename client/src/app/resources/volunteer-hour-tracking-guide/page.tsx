import { Clock, Users, CheckCircle, FileText, Download } from"lucide-react";
import { KeyTakeaways } from"@/components/seo/KeyTakeaways";
import { ArticleHeader } from"@/components/seo/ArticleHeader";
import { ResourceArticleJsonLd } from"@/components/seo/ResourceArticleJsonLd";
import { QuickAnswer } from"@/components/seo/QuickAnswer";
import { DefinitionBox } from"@/components/seo/DefinitionBox";
import { getResourceBySlug } from"@/lib/data/resources";
import { ResourceArticleFooter } from"@/components/seo/ResourceArticleFooter";
import { Breadcrumbs } from"@/components/seo/Breadcrumbs";

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export default function VolunteerHourTrackingGuidePage() {
  const resource = getResourceBySlug('volunteer-hour-tracking-guide')!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ResourceArticleJsonLd resource={resource} />

      {/* Navigation */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={[
              { name:'Home', href:'/' },
              { name:'Resources', href:'/resources' },
              { name: resource.title, href: `/resources/${resource.slug}` },
            ]} />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                12 min read
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Volunteer Management
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="space-y-8 mb-16">
          <ArticleHeader
            category="Volunteer Management"
            dateModified={resource.dateModified}
            title="How to Track Volunteer Hours (And Why It Matters)"
            description="Accurate volunteer hour tracking is essential for grant reporting, IRS compliance, and recognizing your most active volunteers. This guide covers every method - from paper logs to automated software - so you can choose the right approach for your organization."
            readTime={resource.readTime}
          />

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">What You&apos;ll Learn</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Why volunteer hours matter for grants and compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Manual tracking methods and their tradeoffs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>How to set up automated hour logging</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Grant reporting formats funders actually require</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>IRS in-kind contribution documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Volunteer recognition programs using hour data</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <KeyTakeaways takeaways={["Volunteer hours count as in-kind contributions for IRS Form 990 and many federal grant applications","Manual tracking (paper sign-in sheets) fails at scale - errors compound and data is hard to export","Funders typically require hours reported by volunteer name, date, activity, and hourly rate equivalent","Automated software like GatherGrove logs hours at check-in and exports grant-ready reports in one click",
        ]} />

        <QuickAnswer
          question="How do I track volunteer hours for my nonprofit?"
          answer="Track volunteer hours by logging each volunteer's name, the date, activity, and hours served at every event or shift. For grant reporting, you also need to document the estimated dollar value of each volunteer hour (use the Independent Sector's annual estimate as a benchmark). Software tools like GatherGrove automate this by logging hours at check-in and exporting reports by volunteer, event, or date range."
        />

        <QuickAnswer
          question="Do volunteer hours count as in-kind donations?"
          answer="Generally no - the IRS does not allow nonprofits to count the value of donated services as in-kind contributions on Form 990. However, many federal and foundation grants allow volunteer hours as matching funds or cost-share contributions. Always confirm with your specific funder's guidelines."
        />

        <DefinitionBox
          term="Volunteer Hour Equivalent Value"
          definition="The estimated dollar value of one volunteer hour, used to calculate the economic impact of volunteer contributions. The Independent Sector publishes an annual national estimate (approximately $31.80 per hour as of their most recent report). Many grant applications require this rate for calculating volunteer labor as matching funds."
        />

        <div className="prose prose-lg  max-w-none">

          {/* Section 1: Why Track Hours */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Why Volunteer Hour Tracking Matters</h2>

            <p className="text-lg leading-relaxed mb-6">
              For many small organizations, volunteer hour tracking feels like administrative overhead with no
              clear payoff. That perception changes the first time a grant application asks for total volunteer
              hours contributed over the past year - and you have nothing to show.
            </p>

            <h3 className="text-2xl font-semibold mb-4">Four Reasons Organizations Track Volunteer Hours</h3>

            <div className="space-y-6 mb-8">
              <div className="bg-primary/10 border-l-4 border-primary p-6">
                <h4 className="font-semibold text-primary mb-2">1. Grant Applications and Matching Funds</h4>
                <p className="text-primary/90 text-sm mb-3">
                  Many federal grants (AmeriCorps, CDBG, USDA Rural Development) require grantees to document
                  volunteer contributions as matching funds or in-kind cost-share. Without hour logs, your
                  organization cannot claim this match - effectively reducing your grant eligibility.
                </p>
                <p className="text-primary/90 text-sm font-medium">
                  Typical requirement: hours by volunteer name, date, activity description, and hourly rate equivalent.
                </p>
              </div>

              <div className="bg-success/10 border-l-4 border-success p-6">
                <h4 className="font-semibold text-success mb-2">2. Annual Reports and Board Presentations</h4>
                <p className="text-success/90 text-sm mb-3">
                  Volunteer hours translated into dollar equivalents make for compelling annual report data.
                  Telling your board that 120 volunteers contributed 2,400 hours - worth approximately $76,000
                  at the Independent Sector rate - demonstrates community investment in a way headcounts alone
                  cannot.
                </p>
              </div>

              <div className="bg-warning/10 border-l-4 border-warning p-6">
                <h4 className="font-semibold text-warning mb-2">3. Volunteer Recognition Programs</h4>
                <p className="text-warning/90 text-sm mb-3">
                  Hour logs let you identify your top contributors for year-end recognition ceremonies,
                  certificates, and appreciation events. Without accurate tracking, recognition is based on
                  subjective impressions rather than actual contribution - which can create tension among
                  your volunteer base.
                </p>
              </div>

              <div className="bg-muted/50 border-l-4 border-muted-foreground p-6">
                <h4 className="font-semibold mb-2">4. Program Evaluation and Staffing Decisions</h4>
                <p className="text-sm mb-3">
                  Comparing volunteer hours across programs helps administrators allocate resources effectively.
                  If your food pantry program draws 800 hours per quarter and your youth tutoring program draws
                  80, that data informs both scheduling and fundraising priorities.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Manual Methods */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Manual Volunteer Hour Tracking Methods</h2>

            <p className="text-lg leading-relaxed mb-6">
              Every organization starts with manual tracking. These methods work for small teams but break down
              as volunteer counts grow and grant reporting demands increase.
            </p>

            <h3 className="text-2xl font-semibold mb-4">Paper Sign-In Sheets</h3>

            <p className="mb-4">
              The most common starting point. Volunteers sign in at the start of each shift and sign out at the
              end. Staff manually calculate hours and transcribe them to a spreadsheet.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-success/10 p-5 rounded-lg">
                <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Advantages
                </h4>
                <ul className="text-sm space-y-1 text-success/90">
                  <li>• No technology required at the event</li>
                  <li>• Works even without internet access</li>
                  <li>• Familiar to volunteers of all ages</li>
                  <li>• Physical paper trail</li>
                </ul>
              </div>
              <div className="bg-destructive/10 p-5 rounded-lg">
                <h4 className="font-semibold text-destructive mb-3">Disadvantages</h4>
                <ul className="text-sm space-y-1 text-destructive/90">
                  <li>• Manual transcription errors accumulate</li>
                  <li>• Hard to aggregate across multiple events</li>
                  <li>• No automatic export for grant reports</li>
                  <li>• Paper can be lost or damaged</li>
                  <li>• Staff time to process every sheet</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Spreadsheet Tracking</h3>

            <p className="mb-4">
              A shared Google Sheet or Excel file where staff or volunteers manually log hours after each event.
              This is an improvement over paper but introduces its own challenges.
            </p>

            <div className="bg-warning/10 border border-warning rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-warning mb-2">The Spreadsheet Problem at Scale</h4>
              <p className="text-warning/90 text-sm mb-3">
                Spreadsheets work well for 10-20 volunteers tracked by one person. When volunteer counts
                grow past 50, and when multiple programs run simultaneously, spreadsheets create real problems:
              </p>
              <ul className="text-warning/90 text-sm space-y-1">
                <li>• Multiple people editing the same file causes conflicts and version errors</li>
                <li>• Generating grant reports requires manual filtering, pivot tables, and reformatting</li>
                <li>• No automatic reminders mean volunteers frequently forget to log their own hours</li>
                <li>• Volunteers cannot see their own hour totals without staff involvement</li>
              </ul>
            </div>

            <h3 className="text-2xl font-semibold mb-4">The Volunteer Self-Reporting Problem</h3>

            <p className="mb-6">
              Any system that relies on volunteers to log their own hours after the fact will undercount.
              Research on volunteer management consistently shows that self-reported hours decline significantly
              when more than 48 hours pass between the volunteer activity and the logging step. The most
              accurate hour tracking happens at the point of activity - ideally through check-in.
            </p>
          </section>

          {/* Section 3: Software Methods */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Automated Volunteer Hour Tracking with Software</h2>

            <p className="text-lg leading-relaxed mb-6">
              Volunteer management software solves the accuracy and reporting problems inherent in manual
              methods by logging hours at the moment of check-in and generating exportable reports on demand.
            </p>

            <h3 className="text-2xl font-semibold mb-4">How Check-In Based Hour Logging Works</h3>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Create the volunteer shift in your software</h4>
                  <p className="text-sm text-muted-foreground">Define the event, role, start time, and end time. The system knows the expected duration.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">2</div>
                <div>
                  <h4 className="font-semibold mb-1">Volunteer checks in at the event</h4>
                  <p className="text-sm text-muted-foreground">Via QR code scan, kiosk, or admin check-in from the dashboard. Timestamp is recorded automatically.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">3</div>
                <div>
                  <h4 className="font-semibold mb-1">Hours are logged to the volunteer&apos;s profile</h4>
                  <p className="text-sm text-muted-foreground">Check-out or shift-end time completes the hour log. No manual entry required from staff or volunteer.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">4</div>
                <div>
                  <h4 className="font-semibold mb-1">Export grant-ready reports</h4>
                  <p className="text-sm text-muted-foreground">Filter by date range, program, or volunteer. Export to CSV or PDF in the format your funder requires.</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary rounded-lg p-6 my-8">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> GatherGrove Volunteer Hour Tracking
              </h4>
              <p className="text-primary/90 text-sm mb-3">
                GatherGrove tracks volunteer hours through QR code check-in. When a volunteer scans the
                event QR code, their arrival is logged with a timestamp. Hours are automatically calculated
                and added to their profile. Administrators can export hour reports by:
              </p>
              <ul className="text-primary/90 text-sm space-y-1">
                <li>• Individual volunteer (for recognition certificates)</li>
                <li>• Date range (for quarterly or annual reports)</li>
                <li>• Program or event type (for grant applications)</li>
                <li>• All volunteers combined (for board presentations)</li>
              </ul>
              <p className="text-primary/90 text-sm mt-3">
                Plans from {SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.
              </p>
            </div>
          </section>

          {/* Section 4: Grant Reporting */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Volunteer Hour Reporting for Grants</h2>

            <p className="text-lg leading-relaxed mb-6">
              Grant applications that accept volunteer contributions as matching funds have specific documentation
              requirements. Meeting these requirements is the difference between your match being accepted or
              disqualified during the review process.
            </p>

            <h3 className="text-2xl font-semibold mb-4">What Grant Funders Typically Require</h3>

            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Required Data Points</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Volunteer full name</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Date of service</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Activity or program description</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Hours worked per session</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Hourly rate used for valuation</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Total dollar value of hours</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Documentation Best Practices</h4>
                  <ul className="text-sm space-y-2">
                    <li>• Use the Independent Sector&apos;s annual rate as your hourly benchmark</li>
                    <li>• Keep original sign-in sheets or check-in records for 5+ years</li>
                    <li>• Document specialized skills separately (medical, legal, IT)</li>
                    <li>• Have your ED or board chair sign the volunteer hour summary</li>
                    <li>• Align your reporting period with the grant period</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Volunteer Hour Tracking Template</h3>

            <p className="mb-4">
              If you&apos;re starting with a manual system, use this column structure for your volunteer log spreadsheet:
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-3 text-left">Volunteer Name</th>
                    <th className="border p-3 text-left">Date</th>
                    <th className="border p-3 text-left">Activity</th>
                    <th className="border p-3 text-left">Hours</th>
                    <th className="border p-3 text-left">Hourly Rate</th>
                    <th className="border p-3 text-left">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 text-muted-foreground">Jane Smith</td>
                    <td className="border p-3 text-muted-foreground">2026-03-15</td>
                    <td className="border p-3 text-muted-foreground">Food pantry distribution</td>
                    <td className="border p-3 text-muted-foreground">4.0</td>
                    <td className="border p-3 text-muted-foreground">$31.80</td>
                    <td className="border p-3 text-muted-foreground">$127.20</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-3 text-muted-foreground" colSpan={3}><em>... additional rows ...</em></td>
                    <td className="border p-3 font-semibold">Total</td>
                    <td className="border p-3"></td>
                    <td className="border p-3 font-semibold">$XXXX</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: IRS and Compliance */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Volunteer Hours and IRS Compliance</h2>

            <p className="text-lg leading-relaxed mb-6">
              The IRS treats volunteer time differently from monetary donations. Understanding the distinction
              protects your organization from compliance errors on Form 990 and donor acknowledgment letters.
            </p>

            <div className="bg-warning/10 border border-warning rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-warning mb-2">IRS Position on Donated Services</h4>
              <p className="text-warning/90 text-sm">
                Per IRS Publication 526 and accounting standards (FASB ASC 958-605), nonprofits generally
                cannot recognize the value of donated volunteer services as revenue or expense on financial
                statements, with a narrow exception for specialized skills (licensed professions like legal,
                medical, accounting). However, you can and should document hours for grant matching purposes -
                just don&apos;t book the value on your Form 990 financials without consulting your accountant.
              </p>
            </div>

            <p className="mb-6">
              Always consult your organization&apos;s accountant or auditor before deciding how to reflect
              volunteer contributions in your financial statements. The guidance here is informational and
              not a substitute for professional advice.
            </p>
          </section>

          {/* Summary */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Getting Started: Your Volunteer Hour Tracking Checklist</h2>

            <div className="bg-muted/30 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" /> If Starting with Manual Tracking
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Create a spreadsheet with the 6 required columns</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Use paper sign-in sheets at every event</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Transcribe to spreadsheet within 48 hours</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Retain originals for 5 years</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> If Moving to Software
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Set up QR code check-in for all events</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Import historical volunteer records</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Test export formats before grant deadlines</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>Set up quarterly hour summary emails to coordinators</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <ResourceArticleFooter resource={resource} />
      </article>
    </div>
  );
}
