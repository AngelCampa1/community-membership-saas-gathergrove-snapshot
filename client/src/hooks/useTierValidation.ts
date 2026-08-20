import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import apiClient from '@/services/apiClient';

interface TierValidationState {
  currentTier: string | null;
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

interface TierValidationHook extends TierValidationState {
  validateFeatureAccess: (feature: string) => Promise<boolean>;
  validateUnlimitedAccess: () => Promise<boolean>;
  trackBlockedFeature: (feature: string, requiredTier: string) => void;
  refreshTierStatus: () => Promise<void>;
}

/**
 * Custom hook for tier validation and access control
 * Part of resource optimization strategy - prevents loading features
 * for unauthorized tiers, saving CPU and memory resources
 */
export function useTierValidation(): TierValidationHook {
  const { user } = useAuth();
  const clubId = user?.clubId;
  const [state, setState] = useState<TierValidationState>({
    currentTier: null,
    hasAccess: false,
    isLoading: true,
    error: null,
  });

  // Cache for feature access results to prevent repeated API calls
  const [featureCache, setFeatureCache] = useState<Map<string, { result: boolean; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetches current tier information
   */
  const fetchTierInfo = useCallback(async () => {
    if (!clubId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await apiClient.get(`/clubs/${clubId}/tier-info`);

      setState(prev => ({
        ...prev,
        currentTier: response.data.tier,
        hasAccess: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      logger.error('billing', 'Error fetching tier info', { error, clubId });
      setState(prev => ({
        ...prev,
        currentTier: 'Grow', // Default to Grow tier on error
        hasAccess: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- user is stable and doesn't need to trigger refetch
  }, [clubId]);

  /**
   * Validates access to a specific feature
   * Uses caching to prevent repeated API calls and improve performance
   */
  const validateFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    if (!clubId) {
      return false;
    }

    // Check cache first
    const cacheKey = `${clubId}-${feature}`;
    const cached = featureCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.result;
    }

    try {
      const response = await apiClient.get(`/clubs/${clubId}/validate-feature/${encodeURIComponent(feature)}`);

      const hasAccess = response.data.hasAccess === true;

      // Cache the result
      setFeatureCache(prev => new Map(prev).set(cacheKey, {
        result: hasAccess,
        timestamp: now
      }));

      return hasAccess;
    } catch (error) {
      logger.error('billing', 'Error validating feature access', { error, feature, clubId });
      return false; // Fail closed for security
    }
  }, [clubId, featureCache, CACHE_DURATION]);

  /**
   * Validates unlimited tier access
   */
  const validateUnlimitedAccess = useCallback(async (): Promise<boolean> => {
    if (!clubId) {
      return false;
    }

    try {
      const response = await apiClient.get(`/clubs/${clubId}/validate-unlimited`);
      return response.data.hasUnlimitedAccess === true;
    } catch (error) {
      logger.error('billing', 'Error validating unlimited tier access', { error, clubId });
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- user is stable and doesn't need to trigger validation
  }, [clubId]);

  /**
   * Tracks blocked feature attempts for analytics
   * Helps understand which features users want but can't access
   */
  const trackBlockedFeature = useCallback((feature: string, requiredTier: string) => {
    if (!clubId) return;

    // Send tracking data (fire and forget)
    apiClient.post('/analytics/blocked-feature', {
      clubId,
      feature,
      requiredTier,
      currentTier: state.currentTier,
      timestamp: new Date().toISOString(),
    }).catch(error => {
      // Silently fail - this is just for analytics
      logger.debug('analytics', 'Failed to track blocked feature', { error, feature, requiredTier, clubId });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- user is stable and doesn't need to trigger tracking
  }, [clubId, state.currentTier]);

  /**
   * Refreshes tier status and clears feature cache
   */
  const refreshTierStatus = useCallback(async () => {
    setFeatureCache(new Map()); // Clear cache
    await fetchTierInfo();
  }, [fetchTierInfo]);

  // Fetch tier info on mount and when dependencies change
  useEffect(() => {
    fetchTierInfo();
  }, [fetchTierInfo]);

  // Clear cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFeatureCache(prev => {
        const newCache = new Map();
        prev.forEach((value, key) => {
          if (now - value.timestamp < CACHE_DURATION) {
            newCache.set(key, value);
          }
        });
        return newCache;
      });
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [CACHE_DURATION]);

  return {
    ...state,
    validateFeatureAccess,
    validateUnlimitedAccess,
    trackBlockedFeature,
    refreshTierStatus,
  };
}

/**
 * Tier hierarchy helper
 */
export const TierHierarchy = {
  Seed: 1,
  Grow: 2,
  Unlimited: 3,
} as const;

/**
 * Helper function to check if current tier meets required tier
 */
export function checkTierAccess(currentTier: string | null, requiredTier: keyof typeof TierHierarchy): boolean {
  if (!currentTier || !(currentTier in TierHierarchy)) {
    return false;
  }

  const currentLevel = TierHierarchy[currentTier as keyof typeof TierHierarchy];
  const requiredLevel = TierHierarchy[requiredTier];

  return currentLevel >= requiredLevel;
}

/**
 * Feature categorization for tier access
 */
export const FeatureTiers = {
  // Seed tier features (entry-level)
  Seed: [
    'member-directory',
    'basic-events',
    'basic-reporting',
    'event-rsvp',
    'member-profiles',
    'email-integration'
  ],

  // Grow tier features (includes all base features)
  Grow: [
    'member-directory',
    'basic-events',
    'basic-reporting',
    'event-rsvp',
    'member-profiles',
    'enhanced-reporting',
    'custom-fields',
    'event-categories',
    'member-import',
    'email-integration'
  ],

  // Expand tier features
  Unlimited: [
    'advanced-analytics',
    'data-export',
    'white-labeling',
    'api-access',
    'member-segmentation',
    'advanced-event-management',
    'bulk-operations',
    'custom-branding',
    'unlimited-members'
  ]
} as const;

export default useTierValidation;
