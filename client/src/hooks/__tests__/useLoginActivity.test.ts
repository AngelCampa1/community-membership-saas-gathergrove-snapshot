import { renderHook, waitFor } from '@testing-library/react';
import { useLoginActivity } from '../useLoginActivity';
import { LoginActivityService } from '@/services/loginActivityService';
import { LoginActivityStats } from '@/types/loginActivity';

// Mock the service at the boundary (it wraps the apiClient HTTP layer)
jest.mock('@/services/loginActivityService', () => ({
  LoginActivityService: {
    getLoginStats: jest.fn(),
  },
}));

const mockLoginActivityService = LoginActivityService as jest.Mocked<typeof LoginActivityService>;

describe('useLoginActivity', () => {
  const clubId = 123;

  const mockStats: LoginActivityStats = {
    clubId,
    periodDays: 30,
    totalMembers: 100,
    membersWithLogins: 82,
    totalLogins: 450,
    averageLoginsPerMember: 4.5,
    dailyActiveUsers: 20,
    weeklyActiveUsers: 55,
    monthlyActiveUsers: 82,
    inactiveMembers: 18,
    loginTrends: [
      { date: '2024-01-15', totalLogins: 25, uniqueUsers: 18, webLogins: 15, mobileLogins: 10 },
      { date: '2024-01-14', totalLogins: 30, uniqueUsers: 22, webLogins: 20, mobileLogins: 10 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoginActivityService.getLoginStats.mockResolvedValue(mockStats);
  });

  describe('Initial State', () => {
    it('should return initial loading state', () => {
      mockLoginActivityService.getLoginStats.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useLoginActivity(clubId));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Successful Data Loading', () => {
    it('should load stats successfully', async () => {
      const { result } = renderHook(() => useLoginActivity(clubId));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toEqual(mockStats);
    });

    it('should call getLoginStats with clubId and default days', async () => {
      renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledWith(clubId, 30);
      });
    });

    it('should call getLoginStats with custom days', async () => {
      renderHook(() => useLoginActivity(clubId, 7));

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledWith(clubId, 7);
      });
    });

    it('should call getLoginStats exactly once on initial load', async () => {
      renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service failure gracefully', async () => {
      mockLoginActivityService.getLoginStats.mockRejectedValue(new Error('Stats API failed'));

      const { result } = renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load login activity data');
      expect(result.current.data).toBe(null);
    });

    it('should handle network timeout errors', async () => {
      mockLoginActivityService.getLoginStats.mockRejectedValue(new Error('Request timeout'));

      const { result } = renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Request timed out');
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      jest.clearAllMocks();
      mockLoginActivityService.getLoginStats.mockResolvedValue(mockStats);

      result.current.refetch();

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledWith(clubId, 30);
      });
    });

    it('should clear error and load data on refetch after error', async () => {
      mockLoginActivityService.getLoginStats.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useLoginActivity(clubId));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load login activity data');
      });

      mockLoginActivityService.getLoginStats.mockResolvedValue(mockStats);
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.data).not.toBe(null);
      });
    });
  });

  describe('ClubId Changes', () => {
    it('should refetch data when clubId changes', async () => {
      const { result, rerender } = renderHook(
        ({ clubId }) => useLoginActivity(clubId),
        { initialProps: { clubId: 123 } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      jest.clearAllMocks();
      mockLoginActivityService.getLoginStats.mockResolvedValue(mockStats);

      rerender({ clubId: 456 });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledWith(456, 30);
      });
    });

    it('should refetch when days changes', async () => {
      const { result, rerender } = renderHook(
        ({ days }) => useLoginActivity(clubId, days),
        { initialProps: { days: 30 } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      jest.clearAllMocks();
      mockLoginActivityService.getLoginStats.mockResolvedValue(mockStats);

      rerender({ days: 90 });

      await waitFor(() => {
        expect(mockLoginActivityService.getLoginStats).toHaveBeenCalledWith(clubId, 90);
      });
    });
  });

  describe('Memory Management', () => {
    it('should cleanup properly on unmount without throwing', async () => {
      const { unmount } = renderHook(() => useLoginActivity(clubId));

      expect(() => unmount()).not.toThrow();
    });
  });
});
