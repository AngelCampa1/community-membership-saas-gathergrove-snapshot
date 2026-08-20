import { Metadata } from'next';
import Link from'next/link';
import { Header } from'@/components/shared/Header';
import { Footer } from'@/components/shared/Footer';

export const metadata: Metadata = {
  title:'Terms of Service',
  description:'Terms of Service for GatherGrove club management platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray  max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing and using GatherGrove (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              GatherGrove is a club management platform designed to help hobby clubs manage members, collect dues, 
              organize events, and facilitate communication among club members.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="mb-4">
              To use GatherGrove, you must create an account and provide accurate, current, and complete information. 
              You are responsible for maintaining the security of your account and password.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Upload or transmit any content that is illegal, harmful, or violates any third party rights</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payment and Subscriptions</h2>
            <p className="mb-4">
              GatherGrove offers both free and paid subscription tiers. Payment terms, refund policies, 
              and subscription details are available on our pricing page and billing portal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by GatherGrove and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, 
              for any reason, including violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              GatherGrove shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes 
              via email or through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us through our support page.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="text-sm text-muted-foreground">
              Questions about these terms? <Link href="/support" className="text-primary hover:underline">Contact our support team</Link>
            </div>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}