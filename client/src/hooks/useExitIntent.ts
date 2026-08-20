"use client";

import { useEffect, useCallback, useState, useRef } from 'react';
import { SESSION_STORAGE_KEYS } from '@/config/engagement-timing';
import { EXIT_INTENT, SCROLL } from '@/constants/timing'; // BUG FIX: F-07 - Added SCROLL import

interface UseExitIntentOptions {
  onExitIntent: () => void;
  sensitivity?: number; // How close to top edge triggers exit intent (default: 50px)
  delay?: number; // Minimum time on page before triggering (default: 30 seconds)
  enabled?: boolean; // Whether exit intent detection is active
}

interface ExitIntentState {
  hasTriggered: boolean;
  timeOnPage: number;
}

export function useExitIntent({
  onExitIntent,
  sensitivity = EXIT_INTENT.MOUSE_SENSITIVITY_PX,
  delay = EXIT_INTENT.MINIMUM_TIME_ON_PAGE_MS,
  enabled = true
}: UseExitIntentOptions) {
  const [state, setState] = useState<ExitIntentState>({
    hasTriggered: false,
    timeOnPage: 0
  });

  const [startTime] = useState(Date.now());

  // Use ref instead of global window mutation to track last scroll position
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  // Check if we should trigger based on session storage
  const checkSessionRestrictions = useCallback(() => {
    const shown = sessionStorage.getItem(SESSION_STORAGE_KEYS.exitIntentShown);
    return !shown;
  }, []);

  // Mark as shown in session storage
  const markAsShown = useCallback(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.exitIntentShown, 'true');
  }, []);

  // Desktop exit intent - mouse leaving viewport upward
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (!enabled || state.hasTriggered) return;

    const currentTime = Date.now();
    const timeOnPage = currentTime - startTime;

    // Check if mouse is leaving upward (toward browser controls)
    // and user has been on page long enough
    if (e.clientY <= sensitivity && timeOnPage >= delay) {
      if (checkSessionRestrictions()) {
        setState(prev => ({ ...prev, hasTriggered: true, timeOnPage }));
        markAsShown();
        onExitIntent();
      }
    }
  }, [enabled, state.hasTriggered, startTime, sensitivity, delay, onExitIntent, checkSessionRestrictions, markAsShown]);

  // Mobile exit intent - scroll and time based
  const handleMobileExitIntent = useCallback(() => {
    if (!enabled || state.hasTriggered) return;

    const currentTime = Date.now();
    const timeOnPage = currentTime - startTime;
    const scrollPercentage = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);

    // Trigger if user has been on page for minimum time and scrolled significantly
    if (timeOnPage >= delay && scrollPercentage > EXIT_INTENT.MOBILE_SCROLL_THRESHOLD) {
      if (checkSessionRestrictions()) {
        setState(prev => ({ ...prev, hasTriggered: true, timeOnPage }));
        markAsShown();
        onExitIntent();
      }
    }
  }, [enabled, state.hasTriggered, startTime, delay, onExitIntent, checkSessionRestrictions, markAsShown]);

  // Detect rapid upward scrolling (another exit indicator)
  const handleRapidScroll = useCallback(() => {
    if (!enabled || state.hasTriggered) return;

    const currentTime = Date.now();
    const timeOnPage = currentTime - startTime;

    // Only trigger if user has been on page long enough
    if (timeOnPage < delay) return;

    // Detect rapid scroll to top
    if (window.scrollY < EXIT_INTENT.MOUSE_SENSITIVITY_PX * 2) {
      const scrollSpeed = Math.abs(window.scrollY - lastScrollYRef.current);
      if (scrollSpeed > SCROLL.RAPID_SCROLL_THRESHOLD) {
        if (checkSessionRestrictions()) {
          setState(prev => ({ ...prev, hasTriggered: true, timeOnPage }));
          markAsShown();
          onExitIntent();
        }
      }
    }

    // Update ref instead of mutating global window
    lastScrollYRef.current = window.scrollY;
  }, [enabled, state.hasTriggered, startTime, delay, onExitIntent, checkSessionRestrictions, markAsShown]);

  // Detect mobile device
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const mobile = isMobile();

    if (mobile) {
      // Mobile: use time-based trigger with scroll check
      const mobileTimer = setTimeout(handleMobileExitIntent, delay);

      // Also check on scroll events for mobile
      const scrollTimer = setInterval(() => {
        handleMobileExitIntent();
      }, EXIT_INTENT.MOBILE_CHECK_INTERVAL_MS);

      return () => {
        clearTimeout(mobileTimer);
        clearInterval(scrollTimer);
      };
    } else {
      // Desktop: use mouse leave detection
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleRapidScroll, { passive: true });

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('scroll', handleRapidScroll);
      };
    }
  }, [enabled, handleMouseLeave, handleRapidScroll, handleMobileExitIntent, delay, isMobile]);

  // Update time on page periodically
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      const currentTime = Date.now();
      const timeOnPage = currentTime - startTime;
      setState(prev => ({ ...prev, timeOnPage }));
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, startTime]);

  return {
    hasTriggered: state.hasTriggered,
    timeOnPage: state.timeOnPage,
    // Reset function for testing or special cases
    reset: () => {
      setState({ hasTriggered: false, timeOnPage: 0 });
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.exitIntentShown); // BUG FIX: F-10 - Use constant instead of hardcoded string
    }
  };
}