import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, BookOpen, Clock } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Help & Support',
  description: 'Get help with GatherGrove club management platform - FAQs, documentation, and contact support',
  alternates: {
    canonical: '/support',
  },
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Help & Support</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help you get the most out of GatherGrove. Find answers, resources, and ways to get in touch.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Documentation
              </CardTitle>
              <CardDescription>
                Comprehensive guides and tutorials to help you set up and manage your club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/resources" className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                View Documentation
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                Email Support
              </CardTitle>
              <CardDescription>
                Send us an email and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:support@gathergrove.club" className="inline-flex items-center justify-center w-full px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Contact Support
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                Quick Setup
              </CardTitle>
              <CardDescription>
                Need help getting started? Our setup guide will have you running in 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/register" className="inline-flex items-center justify-center w-full px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Start Setup Guide
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>How do I get started with GatherGrove?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply sign up for an account, create your club, and start adding members. Our setup wizard
                  will guide you through the initial configuration process. All plans include a 30-day free trial
                  with full access to all features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Is my club data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we take security seriously. All data is encrypted in transit and at rest, we use secure 
                  authentication methods, and our platform is regularly audited for security vulnerabilities. 
                  You can learn more in our Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can I import my existing member data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! GatherGrove supports importing member data from CSV files. You can include member names, 
                  email addresses, phone numbers, and custom field data. Our import wizard will help validate and 
                  map your data correctly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How does billing and payment collection work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  GatherGrove integrates with Stripe to handle secure payment processing. You can set up membership 
                  dues, track payments, send payment reminders, and even enable online payment collection. 
                  All financial data is handled securely through Stripe's platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What if I need help migrating from another system?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're happy to help! Contact our support team and we can provide guidance on migrating from 
                  spreadsheets, other club management systems, or manual processes. We can also help with data 
                  formatting and import strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can I cancel my subscription anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time from your billing settings. If you cancel, 
                  you'll continue to have access to paid features until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Still need help?</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Our support team is ready to help you succeed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@gathergrove.club" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </a>
              <Link href="/register" className="inline-flex items-center px-6 py-3 border border-input bg-background rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Start Free Trial
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}