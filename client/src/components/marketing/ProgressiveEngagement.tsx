'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CTAConfig } from '@/types/cta';
import { CTA_CONFIGS } from '@/lib/ctaConfig';
import { marketingService } from '@/services/marketingService';
import { SESSION_STORAGE_KEYS } from '@/config/engagement-timing';

// Engagement stages based on user behavior
export type EngagementStage = 'awareness' | 'interest' | 'consideration' | 'decision' | 'action';

interface UserEngagementData {
  stage: EngagementStage;
  timeOnSite: number;
  pagesViewed: number;
  scrollDepth: number;
  interactions: number;
  ctaClicks: number;
  returningVisitor: boolean;
  lastVisit?: string;
}

interface EngagementContextType {
  engagementData: UserEngagementData;
  updateEngagement: (update: Partial<UserEngagementData>) => void;
  getRecommendedCTA: (location: string) => CTAConfig;
  recordInteraction: (type: string, data?: Record<string, unknown>) => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

interface ProgressiveEngagementProviderProps {
  children: ReactNode;
}

export function ProgressiveEngagementProvider({ children }: ProgressiveEngagementProviderProps) {
  const [engagementData, setEngagementData] = useState<UserEngagementData>({
    stage: 'awareness',
    timeOnSite: 0,
    pagesViewed: 1,
    scrollDepth: 0,
    interactions: 0,
    ctaClicks: 0,
    returningVisitor: false
  });

  // Initialize engagement tracking
  useEffect(() => {
    const startTime = Date.now();
    
    // Check if returning visitor
    const lastVisit = localStorage.getItem(SESSION_STORAGE_KEYS.lastVisit);
    const isReturning = !!lastVisit;
    
    setEngagementData(prev => ({
      ...prev,
      returningVisitor: isReturning,
      lastVisit: lastVisit || undefined
    }));

    // Update last visit
    localStorage.setItem(SESSION_STORAGE_KEYS.lastVisit, new Date().toISOString());

    // Track time on site
    const timeInterval = setInterval(() => {
      setEngagementData(prev => ({
        ...prev,
        timeOnSite: Date.now() - startTime
      }));
    }, 5000); // Update every 5 seconds

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      setEngagementData(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollPercent),
        interactions: prev.interactions + 1
      }));
    };

    // Track general interactions
    const trackInteraction = () => {
      setEngagementData(prev => ({
        ...prev,
        interactions: prev.interactions + 1
      }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', trackInteraction, { passive: true });
    document.addEventListener('keydown', trackInteraction, { passive: true });

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
    };
  }, []);

  // Calculate engagement stage based on behavior
  useEffect(() => {
    const { timeOnSite, scrollDepth, interactions, ctaClicks, returningVisitor, stage } = engagementData;
    
    let newStage: EngagementStage = 'awareness';

    if (returningVisitor || ctaClicks > 0) {
      newStage = 'decision';
    } else if (timeOnSite > 180000 && scrollDepth > 75) { // 3+ minutes, 75%+ scroll
      newStage = 'consideration';
    } else if (timeOnSite > 60000 && scrollDepth > 50 && interactions > 15) { // 1+ minute, 50%+ scroll, 15+ interactions
      newStage = 'interest';
    } else if (timeOnSite > 30000 && scrollDepth > 25) { // 30+ seconds, 25%+ scroll
      newStage = 'awareness';
    }

    if (newStage !== stage) {
      setEngagementData(prev => ({ ...prev, stage: newStage }));
      
      // Track stage progression
      marketingService.trackEvent('engagement_stage_progression', {
        from_stage: stage,
        to_stage: newStage,
        time_on_site: timeOnSite,
        scroll_depth: scrollDepth,
        interactions,
        returning_visitor: returningVisitor
      });
    }
  }, [engagementData]);

  const updateEngagement = (update: Partial<UserEngagementData>) => {
    setEngagementData(prev => ({ ...prev, ...update }));
  };

  const getRecommendedCTA = (location: string): CTAConfig => {
    const { stage, returningVisitor, ctaClicks } = engagementData;

    // Returning visitors get high-intent CTAs
    if (returningVisitor) {
      return CTA_CONFIGS['primary-start-free'];
    }

    // Users who have clicked CTAs but not converted get different messaging
    if (ctaClicks > 0) {
      return CTA_CONFIGS['primary-create-club'];
    }

    // Stage-based CTA selection
    switch (stage) {
      case 'awareness':
        // Low commitment options for new visitors
        return location === 'hero' 
          ? CTA_CONFIGS['tertiary-download-guide']
          : CTA_CONFIGS['secondary-watch-demo'];

      case 'interest':
        // Medium commitment - show product value
        return CTA_CONFIGS['secondary-watch-demo'];

      case 'consideration':
        // Show direct trial with low friction messaging
        return CTA_CONFIGS['primary-get-started'];

      case 'decision':
      case 'action':
        // High intent CTAs
        return CTA_CONFIGS['primary-start-free'];

      default:
        return CTA_CONFIGS['primary-start-free'];
    }
  };

  const recordInteraction = (type: string, data?: Record<string, unknown>) => {
    if (type === 'cta_click') {
      setEngagementData(prev => ({
        ...prev,
        ctaClicks: prev.ctaClicks + 1
      }));
    }

    marketingService.trackEvent(`engagement_${type}`, {
      ...data,
      stage: engagementData.stage,
      time_on_site: engagementData.timeOnSite,
      scroll_depth: engagementData.scrollDepth,
      interactions: engagementData.interactions
    });
  };

  return (
    <EngagementContext.Provider value={{
      engagementData,
      updateEngagement,
      getRecommendedCTA,
      recordInteraction
    }}>
      {children}
    </EngagementContext.Provider>
  );
}

export function useProgressiveEngagement() {
  const context = useContext(EngagementContext);
  if (context === undefined) {
    throw new Error('useProgressiveEngagement must be used within a ProgressiveEngagementProvider');
  }
  return context;
}

// Component that renders CTAs based on engagement stage
interface AdaptiveCTAProps {
  location: string;
  fallbackConfig?: CTAConfig;
  className?: string;
  showStageIndicator?: boolean;
}

export function AdaptiveCTA({ 
  location, 
  fallbackConfig,
  className,
  showStageIndicator = false 
}: AdaptiveCTAProps) {
  const { engagementData, getRecommendedCTA, recordInteraction } = useProgressiveEngagement();
  
  const recommendedCTA = getRecommendedCTA(location);
  const ctaConfig = recommendedCTA || fallbackConfig || CTA_CONFIGS['primary-start-free'];

  const handleClick = () => {
    recordInteraction('cta_click', {
      cta_id: ctaConfig.id,
      location,
      recommended: true
    });
  };

  return (
    <div className={className}>
      {showStageIndicator && (
        <div className="mb-2 text-xs text-muted-foreground">
          Engagement Stage: {engagementData.stage} | Time: {Math.round(engagementData.timeOnSite / 1000)}s
        </div>
      )}
      
      <button
        onClick={handleClick}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-full text-sm font-medium"
      >
        {ctaConfig.text}
      </button>
      
      {ctaConfig.description && (
        <p className="mt-1 text-xs text-muted-foreground text-center">
          {ctaConfig.description}
        </p>
      )}
    </div>
  );
}