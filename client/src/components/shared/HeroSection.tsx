'use client';

import Link from"next/link";
import { motion } from"framer-motion";
import { useEffect } from"react";
// Import the AnimatedPlatformPreview normally for now
import { AnimatedPlatformPreview } from"@/components/features/AnimatedPlatformPreview";
import { FreeTrialBadge } from"@/components/ui/free-trial-badge";
import { CTA_MESSAGES, CTA_DESCRIPTIONS as _CTA_DESCRIPTIONS } from'@/config/cta-messaging';
import { TrustSymbols } from"@/components/ui/trust-symbols";
import { useGoogleAnalytics } from"@/hooks/useGoogleAnalytics";
import { staggerContainer, fadeInUp, motionConfig } from"@/lib/animations";
import { formatStartingPriceLong } from"@/lib/pricing";

export function HeroSection() {
  const { trackHeroInteraction, trackFunnel } = useGoogleAnalytics();

  // Track hero section view
  useEffect(() => {
    trackFunnel('LANDING_PAGE_VIEW', {
      section:'hero',
      page:'/',
    });
  }, [trackFunnel]);

  const handleCTAClick = () => {
    trackHeroInteraction('cta_click', {
      cta_text:'Start Free Trial',
      destination:'/register',
    });
  };

  // Use optimized animations with minimal delay for LCP
  const containerVariants = {
    ...staggerContainer,
    visible: {
      ...staggerContainer.visible,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0,
      },
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  const itemVariants = {
    ...fadeInUp,
    hidden: {
      ...fadeInUp.hidden,
      y: 12,
    },
    visible: {
      ...fadeInUp.visible,
      transition: {
        duration: 0.3,
        ease:"easeOut",
      },
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return (
    <section className="pt-16 pb-20 lg:pt-20 lg:pb-32 relative overflow-hidden min-h-screen flex items-center">
      {/* Enhanced background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/3"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20  rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="glass-soft rounded-3xl border border-border/20 p-8 lg:p-12 backdrop-blur-xl shadow-2xl">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          {...motionConfig}
        >
          {/* Content */}
          <div className="space-y-8 lg:order-1">
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex flex-wrap gap-3 items-center justify-center lg:justify-start">
                <FreeTrialBadge size="lg" />
                <motion.div
                  className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  variants={itemVariants}
                >
                  Replace 5+ tools with one dashboard
                </motion.div>
              </div>

              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight"
              >
                <span className="text-foreground">Stop Juggling Spreadsheets. </span>
                <span className="bg-gradient-to-r from-primary to-primary/80   bg-clip-text text-transparent">Run Your Club From One Dashboard.</span>
              </h1>

              <motion.p
                className="text-xl text-muted-foreground max-w-2xl"
                variants={itemVariants}
                data-ai-answer="true"
              >
                Members, events, dues collection, and communications - replace 5+ separate tools in under 5 minutes.
              </motion.p>
            </motion.div>

            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 focus-ring font-semibold"
                  data-testid="button-hero-signup"
                  onClick={handleCTAClick}
                >
                  {CTA_MESSAGES.primary}
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 border-2 border-primary/30 hover:border-primary/60 text-primary text-lg px-8 py-5 rounded-full transition-all duration-300 hover:bg-primary/5 font-medium"
                  data-testid="button-hero-secondary"
                  onClick={() => trackHeroInteraction('secondary_cta_click', { cta_text:'See How It Works', destination:'#features' })}
                >
                  See How It Works
                </Link>
              </div>
              <motion.div
                className="space-y-1"
                variants={itemVariants}
              >
                <p className="text-sm font-medium text-primary">
                  30-day free trial | Plans from {formatStartingPriceLong()} | Cancel anytime
                </p>
                <p className="text-xs text-muted-foreground">
                  Credit card required to start your trial
                </p>
              </motion.div>
            </motion.div>

            {/* Trust indicators - static values, not animated counters */}
            <motion.div
              className="grid grid-cols-3 gap-4 sm:gap-6 pt-8"
              variants={itemVariants}
            >
              <div className="text-center">
                <div className="bg-card/80 backdrop-blur-lg border border-border/30 rounded-xl p-4 shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-primary">30 days</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Free Trial</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-card/80 backdrop-blur-lg border border-border/30 rounded-xl p-4 shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-primary">5 min</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Setup Time</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-card/80 backdrop-blur-lg border border-border/30 rounded-xl p-4 shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-primary">5+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Tools Replaced</div>
                </div>
              </div>
            </motion.div>

            {/* Trust symbols */}
            <motion.div
              className="pt-8"
              variants={itemVariants}
            >
              <TrustSymbols />
            </motion.div>
          </div>

          {/* Animated Platform Preview */}
          <motion.div
            className="relative lg:order-2"
            variants={itemVariants}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <AnimatedPlatformPreview />
            </motion.div>

            {/* Enhanced floating elements with glassmorphism */}
            <motion.div
              className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 bg-card/80 backdrop-blur-md border border-border/20 rounded-full p-3 sm:p-4 shadow-lg"
              animate={{
                y: [0, -12, 0],
                rotate: [0, 8, 0]
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease:"easeInOut"
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-primary text-xl sm:text-2xl"
              >
                💰
              </motion.div>
            </motion.div>

          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
