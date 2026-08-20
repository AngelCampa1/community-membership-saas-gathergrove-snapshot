'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SCROLL, DEBOUNCE_MS } from '@/constants/timing';

interface ScrollMetrics {
  scrollPercentage: number;
  scrollDirection: 'up' | 'down' | null;
  isNearTop: boolean;
  isNearBottom: boolean;
  lastScrollY: number;
}

interface UseScrollTrackingOptions {
  threshold?: number; // Percentage threshold for callbacks
  debounceMs?: number; // Debounce scroll events
  onThresholdReached?: (percentage: number) => void;
  onScrollChange?: (metrics: ScrollMetrics) => void;
}

/**
 * Unified scroll tracking hook to prevent multiple scroll listeners
 * Consolidates scroll tracking across SmartCTABanner, ProgressiveEngagement, etc.
 */
export function useScrollTracking(options: UseScrollTrackingOptions = {}) {
  const {
    threshold = 75,
    debounceMs = DEBOUNCE_MS.SCROLL,
    onThresholdReached,
    onScrollChange
  } = options;

  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    scrollPercentage: 0,
    scrollDirection: null,
    isNearTop: true,
    isNearBottom: false,
    lastScrollY: 0
  });

  const [thresholdReached, setThresholdReached] = useState(false);

  // Use ref to track lastScrollY to avoid recreating handleScroll on every scroll
  const lastScrollYRef = useRef(0);

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0;

    const newMetrics: ScrollMetrics = {
      scrollPercentage: Math.min(100, Math.max(0, scrollPercentage)),
      scrollDirection: scrollY > lastScrollYRef.current ? 'down' : 'up',
      isNearTop: scrollY < SCROLL.NEAR_TOP_THRESHOLD,
      isNearBottom: scrollPercentage > SCROLL.NEAR_BOTTOM_PERCENTAGE,
      lastScrollY: scrollY
    };

    // Update ref
    lastScrollYRef.current = scrollY;

    setScrollMetrics(newMetrics);

    // Check threshold
    if (!thresholdReached && newMetrics.scrollPercentage >= threshold) {
      setThresholdReached(true);
      onThresholdReached?.(newMetrics.scrollPercentage);
    }

    // Call onChange callback
    onScrollChange?.(newMetrics);
  }, [threshold, thresholdReached, onThresholdReached, onScrollChange]);

  // Debounced scroll handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedScrollHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, debounceMs);
    };

    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, debounceMs]);

  return {
    scrollMetrics,
    thresholdReached,
    // Helper methods
    isScrolledPast: (percentage: number) => scrollMetrics.scrollPercentage >= percentage,
    isScrolling: scrollMetrics.scrollDirection !== null,
    isScrollingDown: scrollMetrics.scrollDirection === 'down',
    isScrollingUp: scrollMetrics.scrollDirection === 'up'
  };
}