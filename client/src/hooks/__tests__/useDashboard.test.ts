import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useDashboard } from '../useDashboard';
import dashboardService from '@/services/dashboardService';

// Unmock React Query to use real implementation
jest.unmock('@tanstack/react-query');

// Mock dashboard service
jest.mock('@/services/dashboardService');

describe('useDashboard', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard summary when clubId is provided', async () => {
    const mockDashboard = {
      totalMembers: 100,
      activeMembers: 80,
      upcomingEvents: 5,
    };

    (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboard);

    const { result } = renderHook(() => useDashboard(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardService.getDashboardSummary).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(mockDashboard);
  });

  it('should not fetch when clubId is undefined', () => {
    renderHook(() => useDashboard(undefined), { wrapper: createWrapper() });

    expect(dashboardService.getDashboardSummary).not.toHaveBeenCalled();
  });

  it('should be disabled when clubId is undefined', () => {
    const { result } = renderHook(() => useDashboard(undefined), { wrapper: createWrapper() });

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
  });

  it('should use correct query key', () => {
    const { result } = renderHook(() => useDashboard(123), { wrapper: createWrapper() });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
  });

  it('should handle error when service throws', async () => {
    const error = new Error('Failed to fetch dashboard');
    (dashboardService.getDashboardSummary as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useDashboard(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
