"use client";

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useExitIntent } from '@/hooks/useExitIntent';
import { ExitIntentModal } from './ExitIntentModal';
import { marketingService, LeadCaptureData } from '@/services/marketingService';

const APP_ROUTE_PREFIXES = ['/admin', '/dashboard', '/login', '/register', '/api'];

interface ExitIntentProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  variant?: 'lead-magnet' | 'consultation' | 'newsletter';
  delay?: number; // Minimum time on page before exit intent is active (ms)
}

export function ExitIntentProvider({
  children,
  enabled = true,
  variant = 'lead-magnet',
  delay = 30000 // 30 seconds default
}: ExitIntentProviderProps) {
  const pathname = usePathname();
  const isAppRoute = APP_ROUTE_PREFIXES.some(prefix => pathname?.startsWith(prefix));
  const isActive = enabled && !isAppRoute;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle exit intent detection
  const handleExitIntent = useCallback(() => {
    if (!isModalOpen) {
      setIsModalOpen(true);
    }
  }, [isModalOpen]);

  // Initialize exit intent detection
  const { hasTriggered, timeOnPage } = useExitIntent({
    onExitIntent: handleExitIntent,
    enabled: isActive,
    delay
  });

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle download after successful email capture
  const handleDownload = useCallback((magnetType: string) => {
    window.open(`/api/v1/marketing/lead-magnets/${magnetType}/download`, '_blank', 'noopener,noreferrer');
  }, []);

  // Handle email capture
  const handleEmailCapture = useCallback(async (
    email: string,
    name: string,
    magnetType?: string,
    companyWebsite?: string,
    turnstileToken?: string,
  ) => {
    const leadData: LeadCaptureData = {
      email,
      name: name || undefined,
      source: 'exit-intent',
      variant,
      companyWebsite,
      turnstileToken,
      metadata: {
        timeOnPage,
        hasTriggered,
        magnetType: magnetType ?? null,
        timestamp: new Date().toISOString()
      }
    };

    const result = await marketingService.captureExitIntentLead(leadData);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to capture lead');
    }

    return result;
  }, [variant, timeOnPage, hasTriggered]);

  // Handle analytics tracking
  const handleAnalytics = useCallback(async (event: string, data?: Record<string, string | number | boolean>) => {
    await marketingService.trackEvent(`exit_intent_${event}`, {
      ...data,
      variant,
      timeOnPage,
      hasTriggered
    });
  }, [variant, timeOnPage, hasTriggered]);

  return (
    <>
      {children}

      {isActive && (
        <ExitIntentModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onEmailCapture={handleEmailCapture}
          onAnalytics={handleAnalytics}
          onDownload={handleDownload}
          variant={variant}
        />
      )}
    </>
  );
}

// Helper hook for testing and debugging
export function useExitIntentDebug() {
  const [debugInfo, setDebugInfo] = useState({
    sessionShown: false,
    timeOnPage: 0,
    hasTriggered: false
  });

  const checkSession = () => {
    const shown = sessionStorage.getItem('gathergrove-exit-intent-shown');
    setDebugInfo(prev => ({
      ...prev,
      sessionShown: !!shown
    }));
  };

  const resetSession = () => {
    sessionStorage.removeItem('gathergrove-exit-intent-shown');
    setDebugInfo(prev => ({
      ...prev,
      sessionShown: false
    }));
  };

  return {
    debugInfo,
    checkSession,
    resetSession
  };
}
