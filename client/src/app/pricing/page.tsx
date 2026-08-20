import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { PricingSection } from "@/components/shared/PricingSection";
import { FAQSection } from "@/components/shared/FAQSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildSoftwareApplicationSchema,
  buildFAQPageSchema,
  buildBreadcrumbSchema,
  DEFAULT_FAQ_QUESTIONS,
} from "@/lib/schema";
import { formatPricingSummary, SEED_MONTHLY_SHORT_COPY } from "@/lib/pricing";

export const revalidate = 3600; // re-generate at most once per hour

const pricingSummary = formatPricingSummary();

export const metadata: Metadata = {
  title: { absolute: `Club Management Software Pricing | Plans from ${SEED_MONTHLY_SHORT_COPY} | GatherGrove` },
  description:
    `Simple, transparent pricing for clubs of all sizes. ${pricingSummary}. Start with a 30-day free trial. Credit card required.`,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `Club Management Software Pricing | Plans from ${SEED_MONTHLY_SHORT_COPY} | GatherGrove`,
    description: `${pricingSummary}. Start with a 30-day free trial. Credit card required.`,
    url: "https://www.gathergrove.club/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: `Club Management Software Pricing | Plans from ${SEED_MONTHLY_SHORT_COPY} | GatherGrove`,
    description: `${pricingSummary}. Start with a 30-day free trial. Credit card required.`,
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd schema={buildSoftwareApplicationSchema()} />
      <JsonLd schema={buildFAQPageSchema(DEFAULT_FAQ_QUESTIONS)} />
      <JsonLd schema={buildBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Pricing", url: "/pricing" }])} />
      <Header />
      <main className="w-full pt-16">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Club Management Software Pricing
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Simple, transparent plans for clubs of all sizes. Start with a 30-day free trial.
          </p>
        </div>
        <PricingSection />
        <FAQSection />
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-semibold mb-6">Learn More</h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
              Compare Alternatives
            </Link>
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              All Features
            </Link>
            <Link href="/resources" className="text-muted-foreground hover:text-foreground transition-colors">
              Resource Library
            </Link>
            <Link href="/for" className="text-muted-foreground hover:text-foreground transition-colors">
              Solutions by Club Type
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
