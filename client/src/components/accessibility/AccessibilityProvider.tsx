"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  focusVisible: boolean;
  announcements: string[];
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'x-large'>('medium');
  const [focusVisible, setFocusVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Track announcement timeouts for cleanup (BUG FIX: F-02)
  const announcementTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    // BUG FIX: Add SSR check before window/localStorage/document access
    if (typeof window === 'undefined') return;

    // Check for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setReducedMotion(prefersReducedMotion);
    setHighContrast(prefersHighContrast);

    // Load saved preferences - wrapped in try-catch for localStorage quota errors
    try {
      const savedFontSize = localStorage.getItem('accessibility-font-size') as typeof fontSize;
      if (savedFontSize) {
        setFontSize(savedFontSize);
      }
    } catch {
      // localStorage may be blocked or unavailable
    }

    // Apply CSS classes based on preferences
    document.documentElement.classList.toggle('reduce-motion', prefersReducedMotion);
    document.documentElement.classList.toggle('high-contrast', prefersHighContrast);
    document.documentElement.setAttribute('data-font-size', fontSize);

    // Focus management
    const handleFocusIn = () => setFocusVisible(true);
    const handleFocusOut = () => setFocusVisible(false);

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [fontSize]);

  // Clean up all announcement timeouts on unmount (BUG FIX: F-02)
  useEffect(() => {
    return () => {
      announcementTimeouts.current.forEach(timeout => clearTimeout(timeout));
      announcementTimeouts.current.clear();
    };
  }, []);

  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Remove announcement after it's been read
    const timeout = setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement !== message));
      announcementTimeouts.current.delete(timeout);
    }, 1000);

    announcementTimeouts.current.add(timeout);
  }, []);

  const value = {
    reducedMotion,
    highContrast,
    fontSize,
    focusVisible,
    announcements,
    announce,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.map((announcement, index) => (
          <div key={`announcement-${index}-${announcement.substring(0, 30)}`}>{announcement}</div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
}