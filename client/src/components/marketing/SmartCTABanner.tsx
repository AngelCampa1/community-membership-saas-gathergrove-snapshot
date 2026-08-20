'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CTA_CONFIGS } from '@/lib/ctaConfig';
import { MultiTierCTA } from '@/components/shared/MultiTierCTA';
import { cn } from '@/lib/utils';
import { SESSION_STORAGE_KEYS } from '@/config/engagement-timing';

interface SmartCTABannerProps {
  scrollThreshold?: number; // Percentage of page scrolled
  timeThreshold?: number; // Time in milliseconds
  engagementThreshold?: number; // Number of interactions
  className?: string;
  variant?: 'top' | 'bottom' | 'inline';
}

export function SmartCTABanner({
  scrollThreshold = 50,
  timeThreshold = 120000, // 2 minutes
  engagementThreshold = 10,
  className,
  variant = 'bottom'
}: SmartCTABannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const [conditions, setConditions] = useState({
    scrollMet: false,
    timeMet: false,
    engagementMet: false
  });

  useEffect(() => {
    if (isDismissed) return;

    // Time-based trigger
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      setConditions(prev => ({ ...prev, timeMet: true }));
    }, timeThreshold);

    // Scroll-based trigger
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      if (scrollPercent >= scrollThreshold) {
        setConditions(prev => ({ ...prev, scrollMet: true }));
      }
    };

    // Engagement-based triggers
    let engagementScore = 0;
    const trackEngagement = () => {
      engagementScore++;
      if (engagementScore >= engagementThreshold) {
        setConditions(prev => ({ ...prev, engagementMet: true }));
      }
    };

    // Track various engagement events
    const engagementEvents = ['click', 'scroll', 'mousemove', 'keydown', 'touchstart'];
    engagementEvents.forEach(eventType => {
      document.addEventListener(eventType, trackEngagement, { passive: true });
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      engagementEvents.forEach(eventType => {
        document.removeEventListener(eventType, trackEngagement);
      });
    };
  }, [scrollThreshold, timeThreshold, engagementThreshold, isDismissed]);

  // Show banner when at least 2 conditions are met
  useEffect(() => {
    const conditionsMet = [conditions.scrollMet, conditions.timeMet, conditions.engagementMet].filter(Boolean).length;
    if (conditionsMet >= 2 && !isDismissed) {
      setIsVisible(true);
    }
  }, [conditions, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);

    // BUG FIX: Add SSR check before sessionStorage access
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.smartCtaDismissed, 'true');
    }
  };

  // Check if already dismissed this session
  useEffect(() => {
    // BUG FIX: Add SSR check before sessionStorage access
    if (typeof window === 'undefined') return;

    const wasDismissed = sessionStorage.getItem(SESSION_STORAGE_KEYS.smartCtaDismissed);
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, []);

  const variantStyles = {
    top: 'top-0',
    bottom: 'bottom-0',
    inline: 'relative'
  };

  const primaryCTA = CTA_CONFIGS['primary-start-free'];
  const secondaryCTA = CTA_CONFIGS['secondary-watch-demo'];

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          className={cn(
            variant === 'inline' ? 'relative' : 'fixed',
            'left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg',
            variantStyles[variant],
            className
          )}
          initial={{ 
            opacity: 0, 
            y: variant === 'top' ? -100 : variant === 'bottom' ? 100 : 0 
          }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ 
            opacity: 0, 
            y: variant === 'top' ? -100 : variant === 'bottom' ? 100 : 0 
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Content */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center mr-8">
                  <p className="font-semibold text-sm sm:text-base">
                    Ready to transform your club management?
                  </p>
                  <p className="text-sm opacity-90 hidden sm:block">
                    Simplify your club operations with one integrated platform
                  </p>
                </div>
                
                {/* CTAs */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <MultiTierCTA
                      config={primaryCTA}
                      showDescription={false}
                      showIcon={false}
                      className="[&>a>button]:min-h-[40px] [&>button]:min-h-[40px]"
                    />
                    <MultiTierCTA
                      config={secondaryCTA}
                      showDescription={false}
                      showIcon={false}
                      className="[&>a>button]:min-h-[40px] [&>button]:min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/10 flex-shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}