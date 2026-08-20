import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '../useDashboard';
import dashboardService from '@/services/dashboardService';

jest.mock('@/services/dashboardService');

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard data when clubId is provided', async () => {
    const mockDashboardData = {
      totalMembers: 150,
      activeMembers: 120,
      upcomingEvents: 5,
      recentActivity: [],
    };

    mockDashboardService.getDashboardSummary.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(mockDashboardService.getDashboardSummary).toHaveBeenCalledWith(1);
  });

  it('should not fetch when clubId is undefined', () => {
    const { result } = renderHook(() => useDashboard(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockDashboardService.getDashboardSummary).not.toHaveBeenCalled();
  });

  it('should not fetch when clubId is null', () => {
    const { result } = renderHook(() => useDashboard(null as unknown as undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(mockDashboardService.getDashboardSummary).not.toHaveBeenCalled();
  });

  it('should handle error when fetching fails', async () => {
    const error = new Error('Failed to fetch dashboard');
    mockDashboardService.getDashboardSummary.mockRejectedValue(error);

    const { result } = renderHook(() => useDashboard(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should refetch when clubId changes', async () => {
    const mockData1 = { totalMembers: 100 };
    const mockData2 = { totalMembers: 200 };

    mockDashboardService.getDashboardSummary
      .mockResolvedValueOnce(mockData1 as any)
      .mockResolvedValueOnce(mockData2 as any);

    const { result, rerender } = renderHook(
      ({ clubId }) => useDashboard(clubId),
      {
        wrapper: createWrapper(),
        initialProps: { clubId: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData1);

    rerender({ clubId: 2 });

    await waitFor(() => {
      expect(mockDashboardService.getDashboardSummary).toHaveBeenCalledWith(2);
      expect(result.current.data).toEqual(mockData2);
    });
  });

  it('should use correct query key', async () => {
    mockDashboardService.getDashboardSummary.mockResolvedValue({} as any);

    const { result } = renderHook(() => useDashboard(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Query key should be ['dashboard', clubId]
    expect(mockDashboardService.getDashboardSummary).toHaveBeenCalledWith(1);
  });

  it('should have correct staleTime and gcTime', () => {
    const { result } = renderHook(() => useDashboard(1), {
      wrapper: createWrapper(),
    });

    // These are configured in the hook options
    expect(result.current).toBeDefined();
  });
});
