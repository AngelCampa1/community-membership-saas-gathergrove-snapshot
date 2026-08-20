/**
 * Tests for useClubTier.tsx - Club tier and billing status hook
 * Following boundary mocking pattern: mock only billingService, useAuth
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClubTier } from '../useClubTier';
import { billingService } from '@/services/billingService';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

// Mock external dependencies (boundaries only)
jest.mock('@/services/billingService');
jest.mock('@/hooks/useAuth');

const mockBillingService = billingService as jest.Mocked<typeof billingService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useClubTier', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 0,
        },
      },
    });

    // Default mock: user with clubId
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', clubId: 'club-1', email: 'test@example.com' },
      isAuthenticated: true,
      loading: false,
    } as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Loading state', () => {
    it('shows loading state initially', () => {
      mockBillingService.getBillingStatus.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useClubTier(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.billingStatus).toBeUndefined();
    });
  });

  describe('No user or clubId', () => {
    it('does not fetch when user has no clubId', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      expect(mockBillingService.getBillingStatus).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Seed tier', () => {
    it('correctly identifies seed tier and restricts push notifications', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Seed',
        subscriptionStatus: 'active',
      } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isSeedTier).toBe(true);
      expect(result.current.isGrowTier).toBe(false);
      expect(result.current.isUnlimitedTier).toBe(false);

      // Seed tier: no push notifications
      expect(result.current.canSendPushNotifications).toBe(false);
    });

    it('exports isSeedTier flag', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Grow',
        subscriptionStatus: 'active',
      } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('isSeedTier');
      expect(result.current.isSeedTier).toBe(false);
    });
  });

  describe('Grow tier', () => {
    it('correctly identifies grow tier and permissions', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Grow',
        subscriptionStatus: 'active',
      } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.billingStatus?.currentTier).toBe('Grow');
      expect(result.current.isGrowTier).toBe(true);
      expect(result.current.isUnlimitedTier).toBe(false);

      // Grow tier permissions
      expect(result.current.canSendInvitations).toBe(true);
      expect(result.current.canSendPushNotifications).toBe(true);
      expect(result.current.canUseAdvancedTemplates).toBe(false);

      // Grow tier limits
      expect(result.current.templateLimits.grow).toEqual({
        email: 10,
      });
    });
  });

  describe('Expand tier', () => {
    it('correctly identifies Expand tier and permissions', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Expand',
        subscriptionStatus: 'active',
      } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.billingStatus?.currentTier).toBe('Expand');
      expect(result.current.isGrowTier).toBe(false);
      expect(result.current.isUnlimitedTier).toBe(true);

      // Expand tier permissions
      expect(result.current.canSendInvitations).toBe(true);
      expect(result.current.canSendPushNotifications).toBe(true);
      expect(result.current.canUseAdvancedTemplates).toBe(true);

      // Top tier template limits
      expect(result.current.templateLimits.unlimited).toEqual({
        email: 999,
      });
    });
  });

  describe('Unknown / inactive tier', () => {
    it('returns false for all premium features on unknown tier', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Inactive',
        subscriptionStatus: 'inactive',
      } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isGrowTier).toBe(false);
      expect(result.current.isUnlimitedTier).toBe(false);
      expect(result.current.canSendInvitations).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('handles query errors gracefully', async () => {
      mockBillingService.getBillingStatus.mockRejectedValue(
        new Error('Failed to fetch billing status')
      );

      const { result } = renderHook(() => useClubTier(), { wrapper });

      // Hook should not crash and should eventually stop loading
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 5000 }
      );

      // Billing status should be undefined on error
      expect(result.current.billingStatus).toBeUndefined();

      // All permission flags should default to false/safe values
      expect(result.current.isGrowTier).toBe(false);
      expect(result.current.isUnlimitedTier).toBe(false);
    });
  });

  describe('Refresh function', () => {
    it('provides refresh function to refetch billing status', async () => {
      mockBillingService.getBillingStatus
        .mockResolvedValueOnce({
          currentTier: 'Grow',
          subscriptionStatus: 'active',
        } as any)
        .mockResolvedValueOnce({
          currentTier: 'Expand',
          subscriptionStatus: 'active',
        } as any);

      const { result } = renderHook(() => useClubTier(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.billingStatus?.currentTier).toBe('Grow');
      expect(result.current.isGrowTier).toBe(true);
      expect(result.current.isUnlimitedTier).toBe(false);

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.billingStatus?.currentTier).toBe('Expand');
      });

      expect(result.current.isGrowTier).toBe(false);
      expect(result.current.isUnlimitedTier).toBe(true);
    });
  });
});
