'use client';

import { useState, useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiTierCTA } from '@/components/shared/MultiTierCTA';
import { CTA_CONFIGS } from '@/lib/ctaConfig';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  showAfterScroll?: number; // Percentage of page scrolled (0-100)
  showAfterTime?: number; // Time in milliseconds
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingActionButton({
  showAfterScroll = 25,
  showAfterTime = 30000, // 30 seconds
  className,
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile, isTouchDevice } = useDeviceDetection();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;

      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isExpanded]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, showAfterTime);
    let scrollCheckActive = true;

    // Show after scroll threshold
    const handleScroll = () => {
      if (!scrollCheckActive) return;

      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      if (scrollPercent >= showAfterScroll) {
        setIsVisible(true);
        scrollCheckActive = false; // Stop checking scroll once triggered
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAfterScroll, showAfterTime]);

  // Basic swipe gestures for interactive elements (mobile)
  useEffect(() => {
    if (!isTouchDevice) return;
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX.current;
      const dy = touch.clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        // Horizontal swipe: right expands, left collapses
        if (dx > 0) setIsExpanded(true);
        else setIsExpanded(false);
      }
      touchStartX.current = null;
      touchStartY.current = null;
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart as EventListener);
      document.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [isTouchDevice]);

  // Mobile-optimized positioning - consider safe areas
  const positionClasses = {
    'bottom-right': isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6',
    'bottom-left': isMobile ? 'bottom-4 left-4' : 'bottom-6 left-6',
    'bottom-center': isMobile ? 'bottom-4 left-1/2 transform -translate-x-1/2' : 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  const primaryCTA = CTA_CONFIGS['primary-start-free'];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed z-50',
            positionClasses[position],
            className
          )}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Mobile-optimized floating button */}
          <div className="relative">
            {/* Expanded state - shows multiple CTAs */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  id="floating-action-menu"
                  role="dialog"
                  aria-label="Conversion options"
                  className={cn(
  "absolute bg-card rounded-lg shadow-2xl border border-border p-4",
                    isMobile 
                      ? "bottom-16 right-0 left-0 mx-4 max-w-[calc(100vw-2rem)]" 
                      : "bottom-16 right-0 min-w-[280px]"
                  )}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-center">Choose your next step</h3>
                    
                    {/* Primary CTA */}
                    <MultiTierCTA
                      config={primaryCTA}
                      className="w-full"
                      showDescription={false}
                    />
                    
                    {/* Secondary options */}
                    <div className={cn(
                      "gap-2",
                      isMobile ? "flex flex-col" : "grid grid-cols-2"
                    )}>
                      <MultiTierCTA
                        config={CTA_CONFIGS['secondary-watch-demo']}
                        className={isMobile ? "w-full" : "text-xs"}
                        showDescription={false}
                        showIcon={!isMobile}
                      />
                      <MultiTierCTA
                        config={CTA_CONFIGS['tertiary-download-guide']}
                        className={isMobile ? "w-full" : "text-xs"}
                        showDescription={false}
                        showIcon={!isMobile}
                      />
                    </div>
                    
                    {/* Close button */}
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main floating button */}
            <motion.button
              className={cn(
                'bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg cursor-pointer transition-all duration-200 select-none',
                'flex items-center justify-center',
                'hover:shadow-xl active:scale-95',
                'border-2 border-background',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                // Mobile optimized sizing - 56px is Material Design standard for touch
                isMobile ? 'w-14 h-14 min-w-[56px] min-h-[56px]' : 'w-14 h-14'
              )}
              onClick={() => {
                if (isExpanded) {
                  setIsExpanded(false);
                } else {
                  // On mobile, expand to show options
                  // On desktop, go directly to signup
                  if (isMobile) {
                    setIsExpanded(true);
                  } else {
                    if (typeof window !== 'undefined') {
                      posthog.capture('fab_clicked', { option: primaryCTA.text || primaryCTA.href || '/register' });
                    }
                    window.location.href = primaryCTA.href || '/register';
                  }
                }
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isExpanded ? "Close options menu" : "Open conversion options"}
              aria-expanded={isExpanded}
              aria-haspopup="dialog"
              aria-controls="floating-action-menu"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded ? (
                  <span className="text-xl">✕</span>
                ) : (
                  <span className="text-xl">🚀</span>
                )}
              </motion.div>
            </motion.button>

            {/* Pulse animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary opacity-75"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.75, 0, 0.75]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}