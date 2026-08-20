import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for the GatherGrove club management platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Effective date: May 28, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are &amp; Our Role</h2>
            <p className="mb-4">
              GatherGrove (&quot;GatherGrove&quot;, &quot;we&quot;, &quot;us&quot;) is a club
              management platform. This policy
              explains how we handle personal information in connection with the GatherGrove
              website at gathergrove.club and the GatherGrove web and mobile applications
              (together, the &quot;Service&quot;).
            </p>
            <p className="mb-4">
              Our role depends on whose data is involved:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>We act as a service provider / processor</strong> for the personal
                information that a club and its administrators upload, enter, or generate about
                their members through the Service (for example, a club&apos;s member roster). For
                that data, the <strong>club is the controller / business</strong> and decides why
                and how the data is used; we process it on the club&apos;s behalf and under our
                agreement with the club. Members should direct requests about that data to their
                club in the first instance, though we will assist as required by law.
              </li>
              <li>
                <strong>We act as a controller / business</strong> for the data we collect
                directly to operate the Service - for example, account-registration details of
                club administrators, billing records, support communications, and website
                analytics.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Whose Data This Covers</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Club administrators and organizers</strong> who register accounts and run clubs on the Service.</li>
              <li><strong>Club members</strong> whose information is added to a club by that club or who join through an invite.</li>
              <li><strong>Website visitors and prospective customers</strong> who browse our site or submit interest/marketing forms.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-3">Administrator account information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Full name and email address.</li>
              <li>Password (stored only as a salted hash), or, if you sign in with Google or Apple, the identifier provided by that sign-in provider.</li>
              <li>Account status, onboarding progress, and account-activity timestamps.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Club and member information (processed on a club&apos;s behalf)</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Member name, email address, phone number, and postal address.</li>
              <li>Membership type, status, join date, dues-paid dates, club/location assignment, and tags or segments.</li>
              <li>Custom fields that a club chooses to define and collect about its members.</li>
              <li>Directory listing preferences and the fields a member chooses to make visible.</li>
              <li>Messaging preferences, where messaging features are used.</li>
              <li>Event RSVPs, attendance, check-ins, waitlists, feedback/survey responses, and engagement scores.</li>
              <li>Chat messages and communications sent through the platform.</li>
              <li>
                Where a club enables it, a member&apos;s Social Security Number (SSN) may be stored.
                Where stored, this field is encrypted at rest using AES-256.
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Payment information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Payments are processed by <strong>Stripe</strong> (including Stripe Connect for
                clubs that collect payments). Card details are entered with and handled by Stripe;
                we do not store full card numbers on our servers.
              </li>
              <li>
                We store payment records such as amount, date, payment method (e.g. cash, check,
                or Stripe), and related notes, plus subscription/billing status for paid plans.
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Information collected automatically</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Usage and analytics events, session activity, page views, login activity, and feature-usage data.</li>
              <li>Device and technical data such as platform, device type, operating system, and browser/user-agent string.</li>
              <li>
                A <strong>hashed</strong> form of your IP address and a derived country code for
                analytics and security; we retain the hash rather than the raw IP for analytics
                sessions. Raw IP addresses may be transiently processed by our infrastructure and
                security providers.
              </li>
              <li>Audit, security, and error logs used to operate and protect the Service.</li>
              <li>Cookies and similar technologies (see &quot;Cookies &amp; Analytics&quot; below).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How &amp; Why We Use Information (GDPR Legal Bases)</h2>
            <p className="mb-4">Where GDPR or UK GDPR applies, we rely on the following lawful bases:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Performance of a contract (Art. 6(1)(b)):</strong> to create and manage administrator accounts, provide the Service, process payments and subscriptions, and provide support.</li>
              <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> to secure the Service, prevent fraud and abuse, maintain audit and error logs, and understand and improve usage through analytics - balanced against your rights.</li>
              <li><strong>Consent (Art. 6(1)(a)):</strong> for non-essential cookies or analytics where required. You may withdraw consent at any time.</li>
              <li><strong>Legal obligation (Art. 6(1)(c)):</strong> to retain records (e.g. financial records) and respond to lawful requests.</li>
            </ul>
            <p className="mb-4">
              For member data we process on a club&apos;s behalf, the legal basis is determined by
              the club as controller; we process that data only to provide the Service to the club
              and per our agreement with it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Sub-Processors &amp; Service Providers</h2>
            <p className="mb-4">
              We share personal information with vendors who help us run the Service. Each is bound
              by contract to use the data only to provide their service to us. The vendors in use
              are:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Stripe</strong> - payment processing and payouts (Stripe Connect).</li>
              <li><strong>Resend</strong> - transactional and notification email delivery.</li>
              <li><strong>Microsoft Azure</strong> - application hosting and database hosting for the backend API.</li>
              <li><strong>Cloudflare</strong> - website/frontend hosting and delivery, and bot/abuse protection (Turnstile).</li>
              <li><strong>Google</strong> - Google sign-in (OAuth) and Google Analytics website measurement.</li>
              <li><strong>Apple</strong> - &quot;Sign in with Apple&quot; authentication.</li>
              <li><strong>Sentry</strong> - application error and performance monitoring.</li>
              <li><strong>PostHog</strong> - product analytics.</li>
            </ul>
            <p className="mb-4">
              We do not sell personal information, and we do not &quot;share&quot; it for
              cross-context behavioral advertising as those terms are defined under California law.
              We may also disclose information to comply with law, enforce our terms, or protect
              the rights and safety of users and the public.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
            <p className="mb-4">
              We and our vendors may process and store information in the United States and in
              other countries where those vendors operate. Where personal information protected by
              GDPR or UK GDPR is transferred outside the EEA or UK, we rely on appropriate
              safeguards such as the European Commission&apos;s Standard Contractual Clauses (and
              the UK Addendum) or other lawful transfer mechanisms. You may request more
              information using the contact details below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain personal information for as long as needed to provide the Service and for
              the purposes described in this policy. For member data we process on a club&apos;s
              behalf, retention is generally controlled by the club; we delete or return such data
              in accordance with our agreement with the club. We retain account and billing records
              only as long as needed and delete or anonymize them within a reasonable period when
              no longer required, unless a longer period is required by law. Logs (audit, security,
              error) and analytics data are similarly retained only as long as needed for the
              purposes for which they were collected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Security</h2>
            <p className="mb-4">
              We use technical and organizational measures intended to protect personal
              information. Measures actually implemented in the Service include: passwords stored
              as salted hashes; encryption of designated sensitive fields at rest using AES-256;
              JWT-based authentication with role-based authorization; rate limiting and bot
              protection; and audit, security, and error logging. No method of transmission or
              storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Your Privacy Rights</h2>

            <h3 className="text-xl font-medium mb-3">EU/UK (GDPR &amp; UK GDPR)</h3>
            <p className="mb-4">Subject to the law, you may have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Access a copy of your personal information.</li>
              <li>Correct inaccurate personal information.</li>
              <li>Request erasure of your personal information.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Lodge a complaint with your supervisory authority.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">California (CCPA/CPRA)</h3>
            <p className="mb-4">If you are a California resident, you may have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Know and access the personal information we have collected about you.</li>
              <li>Request deletion of your personal information.</li>
              <li>Request correction of inaccurate personal information.</li>
              <li>Opt out of any sale or sharing of personal information (note: we do not sell or share personal information as those terms are defined under California law).</li>
              <li>Limit use of sensitive personal information.</li>
              <li>Not receive discriminatory treatment for exercising your rights.</li>
            </ul>
            <p className="mb-4">
              For data we process on a club&apos;s behalf, please direct rights requests to your
              club; we will assist the club as required. For data we control, contact us using the
              details below. We will verify your request before acting on it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Hobby clubs may include minors. The Service is intended to be used by club
              administrators and organizers, not directly by children. A club may add information
              about members who are minors; where it does, the club is responsible for obtaining
              any parental or guardian consent required by applicable law, and for ensuring it has
              a lawful basis to provide that information to us.
            </p>
            <p className="mb-4">
              We do not knowingly collect personal information directly from children under 13
              (or the applicable age in your jurisdiction) for our own purposes. If you believe a
              child&apos;s information has been provided to us improperly, contact us and we will
              take appropriate action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Cookies &amp; Analytics</h2>
            <p className="mb-4">
              We use cookies and similar technologies for essential functionality (such as keeping
              you signed in) and for analytics. We use Google Analytics and PostHog to understand
              how the Service is used, and Sentry to detect and diagnose errors. You can control
              cookies through your browser settings; disabling some cookies may affect how the
              Service works.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this policy from time to time. We will post the updated version on this
              page and revise the effective date above. Material changes will be communicated as
              required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="mb-4">
              For privacy questions or to exercise your rights, contact us at{' '}
              <a href="mailto:support@gathergrove.club" className="text-primary hover:underline">
                support@gathergrove.club
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="text-sm text-muted-foreground">
              Questions about our privacy practices?{' '}
              <Link href="/support" className="text-primary hover:underline">
                Contact our support team
              </Link>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
