import { HeroSection } from "@/components/shared/HeroSection";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { FeaturesSection } from "@/components/shared/FeaturesSection";
import { PricingSection } from "@/components/shared/PricingSection";
import { FAQSection } from "@/components/shared/FAQSection";
import LazySection from "@/components/performance/LazySection";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildSoftwareApplicationSchema,
  buildFAQPageSchema,
  buildServiceSchema,
  DEFAULT_FAQ_QUESTIONS,
} from "@/lib/schema";

// Defined before dynamic() imports so the reference is unambiguous at module load time
function SectionSkeleton() {
  return (
    <div className="animate-pulse py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded-md w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-5/6 mx-auto mb-8"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

// Lazy-load non-SEO-critical sections (decorative/interactive, not crawled content)
const MobileShowcase = dynamic(() => import("@/components/features/MobileShowcase").then(module => ({ default: module.MobileShowcase })), { loading: () => <SectionSkeleton /> });
const ROICalculator = dynamic(() => import("@/components/shared/ROICalculator").then(module => ({ default: module.ROICalculator })), { loading: () => <SectionSkeleton /> });
const TrialBenefitsSection = dynamic(() => import("@/components/shared/TrialBenefitsSection").then(module => ({ default: module.TrialBenefitsSection })), { loading: () => <SectionSkeleton /> });

export default function Home() {
  return (
    <>
      <JsonLd schema={buildSoftwareApplicationSchema()} />
      <JsonLd schema={buildFAQPageSchema(DEFAULT_FAQ_QUESTIONS)} />
      <JsonLd schema={buildServiceSchema()} />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="w-full overflow-x-hidden">
          {/* Above-the-fold content loads immediately */}
          <HeroSection />

          {/* FeaturesSection loads eagerly for immediate availability */}
          <FeaturesSection />

          <LazySection fallback={<SectionSkeleton />} rootMargin="100px">
            <Suspense fallback={<SectionSkeleton />}>
              <MobileShowcase />
            </Suspense>
          </LazySection>

          <LazySection fallback={<SectionSkeleton />} rootMargin="100px">
            <Suspense fallback={<SectionSkeleton />}>
              <ROICalculator />
            </Suspense>
          </LazySection>

          <LazySection fallback={<SectionSkeleton />} rootMargin="100px">
            <Suspense fallback={<SectionSkeleton />}>
              <TrialBenefitsSection />
            </Suspense>
          </LazySection>

          {/* SEO-critical sections: rendered eagerly so crawlers see pricing and FAQ content */}
          <PricingSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </>
  );
} 