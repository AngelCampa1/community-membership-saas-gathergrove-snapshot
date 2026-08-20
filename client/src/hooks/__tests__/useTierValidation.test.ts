/**
 * useTierValidation Tests - Full Coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTierValidation, checkTierAccess, TierHierarchy, FeatureTiers } from '../useTierValidation';
import { useAuth } from '../useAuth';
import apiClient from '@/services/apiClient';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('@/services/apiClient');
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useTierValidation', () => {
  const mockUser = {
    id: 1,
    clubId: 100,
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useTierValidation());

      expect(result.current.currentTier).toBe(null);
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should have all required methods', () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useTierValidation());

      expect(result.current.validateFeatureAccess).toBeDefined();
      expect(result.current.validateUnlimitedAccess).toBeDefined();
      expect(result.current.trackBlockedFeature).toBeDefined();
      expect(result.current.refreshTierStatus).toBeDefined();
    });
  });

  describe('Tier Info Fetching', () => {
    it('should fetch tier info on mount', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { tier: 'Unlimited' },
      });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/100/tier-info');
      expect(result.current.currentTier).toBe('Unlimited');
      expect(result.current.hasAccess).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should fetch Grow tier', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { tier: 'Grow' },
      });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.currentTier).toBe('Grow');
      });

      expect(result.current.hasAccess).toBe(true);
    });

    it('should fetch Basic tier', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { tier: 'Basic' },
      });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.currentTier).toBe('Basic');
      });
    });

    it('should handle error fetching tier info', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(logger.error).toHaveBeenCalledWith(
        'billing',
        'Error fetching tier info',
        expect.objectContaining({ error: mockError, clubId: 100 })
      );
      expect(result.current.currentTier).toBe('Grow');
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error object when fetching tier info', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue('String error');

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown error');
      });
    });

    it('should not fetch when clubId is missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should not fetch when user has no clubId', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { id: 1 } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('validateFeatureAccess', () => {
    it('should validate feature access successfully', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateFeatureAccess('advanced-analytics');
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/clubs/100/validate-feature/advanced-analytics'
      );
      expect(hasAccess).toBe(true);
    });

    it('should return false when feature access denied', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Basic' } })
        .mockResolvedValueOnce({ data: { hasAccess: false } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateFeatureAccess('advanced-analytics');
      });

      expect(hasAccess).toBe(false);
    });

    it('should use cache for repeated feature validation', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First call - should hit API
      await act(async () => {
        await result.current.validateFeatureAccess('advanced-analytics');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2); // tier-info + feature validation

      // Second call - should use cache
      let cachedResult;
      await act(async () => {
        cachedResult = await result.current.validateFeatureAccess('advanced-analytics');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2); // No additional call
      expect(cachedResult).toBe(true);
    });

    it('should bypass cache after expiration (5 minutes)', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } })
        .mockResolvedValueOnce({ data: { hasAccess: false } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First call
      await act(async () => {
        await result.current.validateFeatureAccess('test-feature');
      });

      // Advance time by 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Second call after cache expiration
      let newResult;
      await act(async () => {
        newResult = await result.current.validateFeatureAccess('test-feature');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(3); // tier-info + 2x feature validation
      expect(newResult).toBe(false);
    });

    it('should handle error during feature validation', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateFeatureAccess('advanced-analytics');
      });

      expect(logger.error).toHaveBeenCalledWith(
        'billing',
        'Error validating feature access',
        expect.objectContaining({ feature: 'advanced-analytics', clubId: 100 })
      );
      expect(hasAccess).toBe(false);
    });

    it('should return false when clubId is missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTierValidation());

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateFeatureAccess('test-feature');
      });

      expect(hasAccess).toBe(false);
    });

    it('should encode feature name in URL', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.validateFeatureAccess('feature/with/slashes');
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/clubs/100/validate-feature/feature%2Fwith%2Fslashes'
      );
    });
  });

  describe('validateUnlimitedAccess', () => {
    it('should validate unlimited access successfully', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasUnlimitedAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateUnlimitedAccess();
      });

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/100/validate-unlimited');
      expect(hasAccess).toBe(true);
    });

    it('should return false for non-unlimited tier', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Basic' } })
        .mockResolvedValueOnce({ data: { hasUnlimitedAccess: false } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateUnlimitedAccess();
      });

      expect(hasAccess).toBe(false);
    });

    it('should handle error during unlimited validation', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateUnlimitedAccess();
      });

      expect(logger.error).toHaveBeenCalledWith(
        'billing',
        'Error validating unlimited tier access',
        expect.any(Object)
      );
      expect(hasAccess).toBe(false);
    });

    it('should return false when clubId is missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTierValidation());

      let hasAccess;
      await act(async () => {
        hasAccess = await result.current.validateUnlimitedAccess();
      });

      expect(hasAccess).toBe(false);
    });
  });

  describe('trackBlockedFeature', () => {
    it('should track blocked feature attempt', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { tier: 'Basic' } });
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.currentTier).toBe('Basic');
      });

      act(() => {
        result.current.trackBlockedFeature('advanced-analytics', 'Unlimited');
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/analytics/blocked-feature', {
          clubId: 100,
          feature: 'advanced-analytics',
          requiredTier: 'Unlimited',
          currentTier: 'Basic',
          timestamp: expect.any(String),
        });
      });
    });

    it('should silently fail when tracking fails', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { tier: 'Basic' } });
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Tracking error'));

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.currentTier).toBe('Basic');
      });

      // Should not throw
      act(() => {
        result.current.trackBlockedFeature('test-feature', 'Grow');
      });

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith(
          'analytics',
          'Failed to track blocked feature',
          expect.any(Object)
        );
      });
    });

    it('should not track when clubId is missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTierValidation());

      act(() => {
        result.current.trackBlockedFeature('test-feature', 'Unlimited');
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('refreshTierStatus', () => {
    it('should refresh tier status and clear cache', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Basic' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } })
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.currentTier).toBe('Basic');
      });

      // Cache a feature
      await act(async () => {
        await result.current.validateFeatureAccess('test-feature');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);

      // Refresh
      await act(async () => {
        await result.current.refreshTierStatus();
      });

      expect(result.current.currentTier).toBe('Unlimited');
      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should allow new feature validations after refresh', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Basic' } })
        .mockResolvedValueOnce({ data: { hasAccess: false } })
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First validation
      await act(async () => {
        await result.current.validateFeatureAccess('test-feature');
      });

      // Refresh
      await act(async () => {
        await result.current.refreshTierStatus();
      });

      // Validation after refresh should hit API again (cache cleared)
      await act(async () => {
        const hasAccess = await result.current.validateFeatureAccess('test-feature');
        expect(hasAccess).toBe(true);
      });

      expect(apiClient.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clear expired cache entries periodically', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add to cache
      await act(async () => {
        await result.current.validateFeatureAccess('feature1');
      });

      // Advance time by 5 minutes (cache duration)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Cache cleanup should have run
      // Next call should hit API again
      await act(async () => {
        await result.current.validateFeatureAccess('feature1');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(3); // tier-info + 2x feature (cache expired)
    });

    it('should keep fresh cache entries during cleanup', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { tier: 'Unlimited' } })
        .mockResolvedValueOnce({ data: { hasAccess: true } });

      const { result } = renderHook(() => useTierValidation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add to cache
      await act(async () => {
        await result.current.validateFeatureAccess('feature1');
      });

      // Advance time by 2 minutes (less than cache duration)
      act(() => {
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      // Cache should still be valid
      await act(async () => {
        await result.current.validateFeatureAccess('feature1');
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2); // tier-info + feature (used cache)
    });
  });
});

describe('checkTierAccess', () => {
  it('should allow Basic tier to access Basic features', () => {
    expect(checkTierAccess('Grow', 'Grow')).toBe(true);
  });

  it('should deny Basic tier access to Grow features', () => {
    expect(checkTierAccess('Grow', 'Unlimited')).toBe(false);
  });

  it('should deny Basic tier access to Unlimited features', () => {
    expect(checkTierAccess('Grow', 'Unlimited')).toBe(false);
  });

  it('should allow Grow tier to access Basic features', () => {
    expect(checkTierAccess('Grow', 'Grow')).toBe(true);
  });

  it('should allow Grow tier to access Grow features', () => {
    expect(checkTierAccess('Grow', 'Grow')).toBe(true);
  });

  it('should deny Grow tier access to Unlimited features', () => {
    expect(checkTierAccess('Grow', 'Unlimited')).toBe(false);
  });

  it('should allow Unlimited tier to access all features', () => {
    expect(checkTierAccess('Unlimited', 'Grow')).toBe(true);
    expect(checkTierAccess('Unlimited', 'Grow')).toBe(true);
    expect(checkTierAccess('Unlimited', 'Unlimited')).toBe(true);
  });

  it('should return false for null currentTier', () => {
    expect(checkTierAccess(null, 'Grow')).toBe(false);
  });

  it('should return false for invalid currentTier', () => {
    expect(checkTierAccess('InvalidTier', 'Grow')).toBe(false);
  });

  it('should return false for undefined currentTier', () => {
    expect(checkTierAccess(undefined as any, 'Grow')).toBe(false);
  });

  it('should allow Seed tier to access Seed features', () => {
    expect(checkTierAccess('Seed', 'Seed')).toBe(true);
  });

  it('should deny Seed tier access to Grow features', () => {
    expect(checkTierAccess('Seed', 'Grow')).toBe(false);
  });

  it('should deny Seed tier access to Unlimited features', () => {
    expect(checkTierAccess('Seed', 'Unlimited')).toBe(false);
  });

  it('should allow Grow tier to access Seed features', () => {
    expect(checkTierAccess('Grow', 'Seed')).toBe(true);
  });

  it('should allow Unlimited tier to access Seed features', () => {
    expect(checkTierAccess('Unlimited', 'Seed')).toBe(true);
  });
});

describe('TierHierarchy', () => {
  it('should have correct tier levels with Seed at 1, Grow at 2, Unlimited at 3', () => {
    expect(TierHierarchy.Seed).toBe(1);
    expect(TierHierarchy.Grow).toBe(2);
    expect(TierHierarchy.Unlimited).toBe(3);
  });
});

describe('FeatureTiers', () => {
  it('should have Seed tier features', () => {
    expect(FeatureTiers.Seed).toContain('member-directory');
    expect(FeatureTiers.Seed).toContain('basic-events');
    expect(FeatureTiers.Seed).toContain('event-rsvp');
    expect(FeatureTiers.Seed).toContain('basic-reporting');
    expect(FeatureTiers.Seed).toContain('member-profiles');
    expect(FeatureTiers.Seed).toContain('email-integration');
  });

  it('should have Grow tier base features (includes former Basic features)', () => {
    expect(FeatureTiers.Grow).toContain('member-directory');
    expect(FeatureTiers.Grow).toContain('basic-events');
    expect(FeatureTiers.Grow).toContain('event-rsvp');
  });

  it('should have Grow tier features', () => {
    expect(FeatureTiers.Grow).toContain('enhanced-reporting');
    expect(FeatureTiers.Grow).toContain('custom-fields');
    expect(FeatureTiers.Grow).toContain('member-import');
  });

  it('should have Unlimited tier features', () => {
    expect(FeatureTiers.Unlimited).toContain('advanced-analytics');
    expect(FeatureTiers.Unlimited).toContain('data-export');
    expect(FeatureTiers.Unlimited).toContain('unlimited-members');
  });
});
