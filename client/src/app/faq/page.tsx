import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { FAQ_DATA, FAQ_CATEGORIES, type FAQItem } from '@/lib/data/faq';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SITE_URL, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about GatherGrove club management software - pricing, features, setup, security, mobile app, and more.',
  keywords: [
    'GatherGrove FAQ',
    'club management questions',
    'membership software FAQ',
    'GatherGrove pricing',
    'GatherGrove features',
    'club management help',
  ],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: `Frequently Asked Questions | ${SITE_NAME}`,

    description:
      'Find answers to common questions about GatherGrove - pricing, features, setup, security, and more.',
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
};

function FAQCategorySection({ category, items }: { category: string; items: FAQItem[] }) {
  const label = FAQ_CATEGORIES[category as keyof typeof FAQ_CATEGORIES] ?? category;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{label}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group bg-card rounded-lg border border-border shadow-sm"
          >
            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 hover:bg-muted/50 transition-colors rounded-lg list-none [&::-webkit-details-marker]:hidden">
              <h3 className="text-lg font-semibold pr-8">{item.question}</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <div className="px-6 pb-4">
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  const categories = Object.keys(FAQ_CATEGORIES) as Array<keyof typeof FAQ_CATEGORIES>;
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: FAQ_DATA.filter((faq) => faq.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const faqSchema = buildFAQPageSchema(
    FAQ_DATA.map((f) => ({ question: f.question, answer: f.answer })),
  );
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'FAQ', url: `${SITE_URL}/faq` },
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={faqSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'FAQ', href: '/faq' }]} />
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about GatherGrove. Can&apos;t find what you&apos;re looking
            for?{' '}
            <a
              href="/support"
              className="text-primary hover:underline"
            >
              Contact our support team
            </a>
            .
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {grouped.map(({ category, items }) => (
            <FAQCategorySection key={category} category={category} items={items} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-card rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Try GatherGrove free for 30 days. Credit card required - cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Start Free Trial
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
            >
              Browse Resources
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/glossary"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Glossary
            </Link>
            <Link
              href="/how-to-start"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Formation Guides
            </Link>
            <Link
              href="/for"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Solutions by Club Type
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
