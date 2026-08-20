import { Clock, Users, CheckCircle, DollarSign, BarChart } from"lucide-react";
import { KeyTakeaways } from"@/components/seo/KeyTakeaways";
import { ArticleHeader } from"@/components/seo/ArticleHeader";
import { ResourceArticleJsonLd } from"@/components/seo/ResourceArticleJsonLd";
import { QuickAnswer } from"@/components/seo/QuickAnswer";
import { DefinitionBox } from"@/components/seo/DefinitionBox";
import { getResourceBySlug } from"@/lib/data/resources";
import { ResourceArticleFooter } from"@/components/seo/ResourceArticleFooter";
import { Breadcrumbs } from"@/components/seo/Breadcrumbs";

import { SEED_MONTHLY_PRICE_COPY } from '@/lib/pricing';
export default function NonprofitMembershipManagementGuidePage() {
  const resource = getResourceBySlug('nonprofit-membership-management-guide')!;

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
                14 min read
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Membership Management
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="space-y-8 mb-16">
          <ArticleHeader
            category="Membership Management"
            dateModified={resource.dateModified}
            title="Nonprofit Membership Management: A Complete Guide"
            description="Managing nonprofit members involves more than collecting dues. This guide covers member lifecycle management, dues collection, renewal automation, communication strategy, and how to choose the right membership software for your 501(c)(3)."
            readTime={resource.readTime}
          />

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">What You&apos;ll Learn</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Member vs. donor: key distinctions for nonprofits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Dues collection best practices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Renewal automation to reduce churn</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Member communication that drives engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>501(c)(3) compliance considerations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>How to choose membership software</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <KeyTakeaways takeaways={["Members and donors are different relationships that require different management workflows","Automated renewal reminders sent 60, 30, and 7 days before expiration reduce lapse rates significantly","Membership software that integrates dues collection with your member directory eliminates double-entry errors","501(c)(3) nonprofits must track whether dues payments are deductible and communicate this to members",
        ]} />

        <QuickAnswer
          question="What is nonprofit membership management?"
          answer="Nonprofit membership management covers collecting and tracking dues, onboarding new members, managing renewals, communicating with the membership, and using member data to improve engagement and retention. It differs from donor management in that members have an ongoing relationship with defined benefits and obligations, while donors give without expecting recurring reciprocation."
        />

        <QuickAnswer
          question="What is the best membership software for nonprofits?"
          answer={`The best membership software for nonprofits depends on size. Small nonprofits can start with GatherGrove (${SEED_MONTHLY_PRICE_COPY}, 30-day free trial), which combines member management, event coordination, and volunteer tracking in one platform. Mid-size nonprofits with 50-500 members often grow into Wild Apricot or Neon One. Large associations (500+ members) typically need purpose-built AMS platforms like Fonteva or iMIS.`}
        />

        <DefinitionBox
          term="Member Lifecycle"
          definition="The stages a nonprofit member moves through from first contact to long-term engagement: prospect → applicant → new member → active member → at-risk member → lapsed member (or renewed). Each stage requires different communications and management actions to maximize retention."
        />

        <div className="prose prose-lg  max-w-none">

          {/* Section 1: Member vs Donor */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Members vs. Donors: Why the Distinction Matters</h2>

            <p className="text-lg leading-relaxed mb-6">
              Many nonprofits blur the line between members and donors - sometimes intentionally, sometimes
              because they haven&apos;t thought through the difference. Managing them the same way creates
              confusion for constituents and compliance risk for the organization.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-primary/10 p-6 rounded-lg">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Members
                </h4>
                <ul className="text-sm space-y-2 text-primary/90">
                  <li>• Pay dues in exchange for specific benefits</li>
                  <li>• Have a defined membership period (annual, monthly)</li>
                  <li>• May have voting rights in organizational governance</li>
                  <li>• Receive membership-specific communications</li>
                  <li>• Dues may or may not be tax-deductible (see below)</li>
                  <li>• Relationship is transactional and ongoing</li>
                </ul>
              </div>
              <div className="bg-success/10 p-6 rounded-lg">
                <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Donors
                </h4>
                <ul className="text-sm space-y-2 text-success/90">
                  <li>• Give contributions without expectation of benefits</li>
                  <li>• No defined giving period (can give any time)</li>
                  <li>• No governance rights from gifts alone</li>
                  <li>• Receive acknowledgment letters and impact reports</li>
                  <li>• Gifts are typically fully tax-deductible</li>
                  <li>• Relationship is philanthropic and discretionary</li>
                </ul>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-warning mb-2">Tax Deductibility of Membership Dues</h4>
              <p className="text-warning/90 text-sm mb-3">
                Membership dues to a 501(c)(3) nonprofit are only deductible to the extent they exceed the
                fair market value of benefits received. If a $100 membership includes a $30 value of tangible
                benefits (newsletter, event discounts, merchandise), only $70 is deductible. Your organization
                is required to inform members of this split. Consult your accountant or the IRS Publication
                526 for specifics.
              </p>
            </div>
          </section>

          {/* Section 2: Dues Collection */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Nonprofit Dues Collection Best Practices</h2>

            <p className="text-lg leading-relaxed mb-6">
              Dues collection is the financial foundation of member-based nonprofits. The gap between an
              organization that collects most dues on time and one that collects 90% is often entirely
              attributable to the collection process - not member willingness to pay.
            </p>

            <h3 className="text-2xl font-semibold mb-4">Why Members Don&apos;t Renew (And How to Fix It)</h3>

            <div className="space-y-4 mb-8">
              <div className="bg-muted/50 p-5 rounded-lg">
                <h4 className="font-semibold mb-2">They forgot</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The most common reason for lapsed memberships. The renewal date came and went without a
                  clear reminder.
                </p>
                <p className="text-sm font-medium">Fix: Send automated renewal reminders at 60, 30, and 7 days before expiration.</p>
              </div>
              <div className="bg-muted/50 p-5 rounded-lg">
                <h4 className="font-semibold mb-2">The payment process was too complicated</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Requiring a mailed check, a specific bank transfer process, or navigating multiple steps
                  introduces enough friction to lose compliant-but-impatient members.
                </p>
                <p className="text-sm font-medium">Fix: Accept credit card and ACH payments through a single renewal link.</p>
              </div>
              <div className="bg-muted/50 p-5 rounded-lg">
                <h4 className="font-semibold mb-2">They didn&apos;t feel the value</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Members who rarely attended events or engaged with the organization throughout the year
                  have low motivation to renew.
                </p>
                <p className="text-sm font-medium">Fix: Engage members continuously - not just at renewal time. See retention section below.</p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Setting Up a Renewal Automation System</h3>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Record membership expiration dates accurately</h4>
                  <p className="text-sm text-muted-foreground">Every member record needs a clear expiration date tied to their dues payment. This is the trigger for all automated reminders.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">2</div>
                <div>
                  <h4 className="font-semibold mb-1">Set up 3-touch renewal email sequence</h4>
                  <p className="text-sm text-muted-foreground">60 days out: &quot;Your membership renews in 60 days - here&apos;s what you&apos;ve accomplished this year.&quot; 30 days: &quot;Renewal coming up - renew in one click.&quot; 7 days: &quot;Last chance before your membership expires.&quot;</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">3</div>
                <div>
                  <h4 className="font-semibold mb-1">Include a direct payment link in every email</h4>
                  <p className="text-sm text-muted-foreground">The member should be able to complete renewal in 2 clicks from any reminder email. No login wall, no multi-step form.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">4</div>
                <div>
                  <h4 className="font-semibold mb-1">Flag lapsed members for personal outreach</h4>
                  <p className="text-sm text-muted-foreground">30 days after expiration, have a board member or staff contact the lapsed member personally. Automated reminders have already failed - human connection is the next step.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Member Onboarding */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Onboarding New Nonprofit Members</h2>

            <p className="text-lg leading-relaxed mb-6">
              The first 90 days of a new membership determine whether that person becomes a long-term
              participant or a one-year lapse. Organizations that invest in structured onboarding report
              significantly higher first-year renewal rates than those that send a welcome email and wait.
            </p>

            <h3 className="text-2xl font-semibold mb-4">30-60-90 Day Onboarding Framework</h3>

            <div className="space-y-6 mb-8">
              <div className="bg-success/10 p-6 rounded-lg">
                <h4 className="font-semibold text-success mb-3">Day 1-7: Welcome and Orient</h4>
                <ul className="text-sm space-y-1 text-success/90">
                  <li>• Send personalized welcome email with membership card or certificate</li>
                  <li>• Provide access to member directory and benefits</li>
                  <li>• Introduce them to your communication channels (newsletter, group chat, app)</li>
                  <li>• Assign a buddy or point of contact for questions</li>
                </ul>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg">
                <h4 className="font-semibold text-primary mb-3">Day 8-60: Build Connection</h4>
                <ul className="text-sm space-y-1 text-primary/90">
                  <li>• Invite to first in-person event or meeting</li>
                  <li>• Introduce to 2-3 existing members with similar interests</li>
                  <li>• Share a low-stakes volunteer or participation opportunity</li>
                  <li>• 30-day check-in: &quot;How are things going? Any questions?&quot;</li>
                </ul>
              </div>
              <div className="bg-warning/10 p-6 rounded-lg">
                <h4 className="font-semibold text-warning mb-3">Day 61-90: Deepen Engagement</h4>
                <ul className="text-sm space-y-1 text-warning/90">
                  <li>• Offer committee or working group involvement</li>
                  <li>• Ask for feedback: what could we do better for you?</li>
                  <li>• Document their interests in your member database</li>
                  <li>• Set the foundation for year-two renewal messaging</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Choosing Software */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Choosing Membership Software for Your Nonprofit</h2>

            <p className="text-lg leading-relaxed mb-6">
              The right membership management software depends on your organization&apos;s size, budget, and
              whether you need standalone member management or an integrated platform that also handles
              events, volunteering, and communications.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-3 text-left">Org Size</th>
                    <th className="border p-3 text-left">Needs</th>
                    <th className="border p-3 text-left">Good Fit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 font-medium">Under 100 members</td>
                    <td className="border p-3">Dues collection, event sign-ups, volunteer coordination</td>
                    <td className="border p-3">GatherGrove ({SEED_MONTHLY_PRICE_COPY})</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-3 font-medium">50-500 members</td>
                    <td className="border p-3">Full AMS, email marketing, chapter management</td>
                    <td className="border p-3">Wild Apricot, Neon One</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">500+ members</td>
                    <td className="border p-3">Enterprise AMS, Salesforce integration, advanced reporting</td>
                    <td className="border p-3">Fonteva, iMIS, Salesforce NPSP</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-3 font-medium">Fundraising-heavy</td>
                    <td className="border p-3">Donor + member management combined</td>
                    <td className="border p-3">Bloomerang, Donorbox with integrations</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Key Questions When Evaluating Software</h3>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Functionality Questions</h4>
                <ul className="text-sm space-y-2">
                  <li>• Can it handle your dues structure (tiered, sliding scale, annual/monthly)?</li>
                  <li>• Does it automate renewal reminders?</li>
                  <li>• Can members update their own profiles?</li>
                  <li>• Does it integrate with your email marketing tool?</li>
                  <li>• Can you track volunteer hours alongside membership?</li>
                </ul>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Operational Questions</h4>
                <ul className="text-sm space-y-2">
                  <li>• What is the cost per member as you grow?</li>
                  <li>• What is the migration path from your current system?</li>
                  <li>• Does it offer a free trial so you can test before committing?</li>
                  <li>• How long does onboarding take?</li>
                  <li>• What support is available (live chat, email, documentation)?</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary rounded-lg p-6 my-8">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <BarChart className="w-4 h-4" /> GatherGrove for Nonprofit Membership Management
              </h4>
              <p className="text-primary/90 text-sm mb-3">
                GatherGrove combines nonprofit member management with event coordination, volunteer tracking,
                and automated communications in one platform. Plans start at {SEED_MONTHLY_PRICE_COPY} with a 30-day free trial,
                and include:
              </p>
              <ul className="text-primary/90 text-sm space-y-1">
                <li>• Member directory with custom fields and privacy controls</li>
                <li>• Dues collection with Stripe (credit card, ACH)</li>
                <li>• Automated renewal reminders by email</li>
                <li>• Volunteer sign-up forms and hour tracking</li>
                <li>• Event management with RSVP tracking</li>
                <li>• Mobile app for members (iOS and Android)</li>
              </ul>
            </div>
          </section>

          {/* Section 5: 501c3 Compliance */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">501(c)(3) Membership Compliance Checklist</h2>

            <p className="text-lg leading-relaxed mb-6">
              Membership programs at 501(c)(3) organizations carry specific compliance obligations.
              This checklist covers the most common areas - always verify with your legal and accounting
              advisors for your specific circumstances.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-muted/50 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Dues deductibility disclosure</h4>
                    <p className="text-sm text-muted-foreground">Inform members of the non-deductible portion of dues (the value of tangible benefits received). Required under IRS rules.</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Acknowledgment letters for dues payments over $250</h4>
                    <p className="text-sm text-muted-foreground">Members who pay more than $250 in dues need a written acknowledgment from your organization to claim any deduction. Your membership software should automate this.</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Member records retention</h4>
                    <p className="text-sm text-muted-foreground">Retain membership records (including payment records) for a minimum of 3-7 years depending on your state requirements and federal grant obligations.</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Privacy policy and data handling</h4>
                    <p className="text-sm text-muted-foreground">Have a clear privacy policy covering how you store, use, and share member data. Required if you collect payment information and recommended practice regardless.</p>
                  </div>
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
