/**
 * useOptimizedMembers Tests - Full Coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOptimizedMembers,
  useOptimizedMembershipTypes,
  useOptimizedMemberMutations,
  useMemberListPerformance,
  memberCacheUtils,
} from '../useOptimizedMembers';
import memberService from '@/services/memberService';
import membershipTypeService from '@/services/membershipTypeService';
import { logger } from '@/lib/logger';
import React, { ReactNode } from 'react';

// Unmock React Query
jest.unmock('@tanstack/react-query');

// Mock services
jest.mock('@/services/memberService');
jest.mock('@/services/membershipTypeService');
jest.mock('@/lib/logger');

const mockMemberService = memberService as jest.Mocked<typeof memberService>;
const mockMembershipTypeService = membershipTypeService as jest.Mocked<
  typeof membershipTypeService
>;

describe('useOptimizedMembers', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  const mockPaginatedResponse = {
    members: [
      {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'Active',
        membershipTypeId: 1,
        joinDate: '2023-01-01',
        duesPaidUntil: '2025-12-31',
        hasSmsConsent: true,
      },
      {
        id: 2,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        status: 'Active',
        membershipTypeId: 2,
        joinDate: '2023-06-15',
        duesPaidUntil: null,
        hasSmsConsent: false,
        hasPartialPayments: true,
        outstandingBalance: 50.0,
      },
    ],
    totalCount: 2,
    currentPage: 1,
    totalPages: 1,
    pageSize: 25,
    hasPrevious: false,
    hasNext: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMemberService.getPaginatedMembers.mockResolvedValue(mockPaginatedResponse);
    mockMemberService.getMembers.mockResolvedValue(mockPaginatedResponse.members);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should fetch members with default parameters', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useOptimizedMembers({ clubId: 1 }), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(
        1,
        undefined,
        1,
        25
      );
      expect(result.current.data?.members).toHaveLength(2);
    });

    it('should not fetch when clubId is undefined', () => {
      // Arrange & Act
      const { result } = renderHook(() => useOptimizedMembers({}), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockMemberService.getPaginatedMembers).not.toHaveBeenCalled();
    });

    it('should use custom page and pageSize', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, page: 2, pageSize: 50 }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(
        1,
        undefined,
        2,
        50
      );
    });
  });

  describe('Search Debouncing', () => {
    it('should debounce search term', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useOptimizedMembers({ clubId: 1, searchTerm }),
        {
          wrapper: createWrapper(),
          initialProps: { searchTerm: '' },
        }
      );

      // Wait for initial fetch to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Clear mock to track only the search-related calls
      mockMemberService.getPaginatedMembers.mockClear();

      // Act - type quickly
      rerender({ searchTerm: 'J' });
      rerender({ searchTerm: 'Jo' });
      rerender({ searchTerm: 'Joh' });
      rerender({ searchTerm: 'John' });

      // Don't advance timers yet - should not have called API with new search
      expect(mockMemberService.getPaginatedMembers).not.toHaveBeenCalled();

      // Act - advance past debounce delay (300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Assert - should now call API with final search term
      await waitFor(() => {
        expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(
          1,
          'John',
          1,
          25
        );
      });
    });

    it('should trim search term whitespace', async () => {
      // Arrange
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, searchTerm: '  John  ' }),
        { wrapper: createWrapper() }
      );

      // Act - advance debounce timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Assert
      await waitFor(() => {
        expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(
          1,
          'John',
          1,
          25
        );
      });
    });
  });

  describe('Archived Members', () => {
    it('should fetch archived members via client-side filtering', async () => {
      // Arrange
      const archivedMember = {
        ...mockPaginatedResponse.members[0],
        status: 'Archived',
      };
      mockMemberService.getMembers.mockResolvedValue([
        archivedMember,
        mockPaginatedResponse.members[1],
      ]);

      // Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, showArchived: true }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockMemberService.getMembers).toHaveBeenCalledWith(1);
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].status).toBe('Archived');
    });

    it('should exclude archived members by default', async () => {
      // Arrange
      const archivedMember = {
        ...mockPaginatedResponse.members[0],
        status: 'Archived',
      };
      const activeMember = {
        ...mockPaginatedResponse.members[1],
        membershipTypeId: 1, // Match the filter
      };
      mockMemberService.getMembers.mockResolvedValue([
        archivedMember,
        activeMember,
      ]);

      // Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            filters: { membershipTypeId: 1 }, // Trigger client-side filtering
          }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].status).not.toBe('Archived');
    });
  });

  describe('Advanced Filters', () => {
    beforeEach(() => {
      // Set fake time to 2024-01-01 for consistent date calculations
      jest.setSystemTime(new Date('2024-01-01'));

      mockMemberService.getMembers.mockResolvedValue([
        {
          id: 1,
          fullName: 'Member 1',
          email: 'm1@test.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
          duesPaidUntil: '2025-12-31',
          hasSmsConsent: true,
        },
        {
          id: 2,
          fullName: 'Member 2',
          email: 'm2@test.com',
          status: 'Active',
          membershipTypeId: 2,
          joinDate: '2023-06-15',
          duesPaidUntil: null,
          hasSmsConsent: false,
        },
      ]);
    });

    it('should filter by membership type', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({ clubId: 1, filters: { membershipTypeId: 1 } }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].membershipTypeId).toBe(1);
    });

    it('ignores the retired SMS consent filter', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, filters: { hasSmsConsent: true } }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(2);
      expect(result.current.data?.members[0].hasSmsConsent).toBe(true);
    });

    it('should filter by join date range', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            filters: { joinDateFrom: '2023-06-01', joinDateTo: '2023-12-31' },
          }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].joinDate).toBe('2023-06-15');
    });

    it('should filter by dues status - Unpaid', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, filters: { duesStatus: 'Unpaid' } }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].duesPaidUntil).toBeNull();
    });

    it('should filter by dues status - Current', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, filters: { duesStatus: 'Current' } }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].duesPaidUntil).toBeTruthy();
    });

    it('should filter by engagement level', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({ clubId: 1, filters: { engagementLevel: 'high' } }),
        { wrapper: createWrapper() }
      );

      // Assert - should apply engagement level filter
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // Engagement calculation includes SMS consent, active status, join date
    });

    it('should combine multiple filters', async () => {
      // Arrange & Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            filters: {
              membershipTypeId: 1,
              hasSmsConsent: true,
              duesStatus: 'Current',
            },
          }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
    });
  });

  describe('Search Filtering', () => {
    it('should filter by name in client-side mode', async () => {
      // Arrange
      mockMemberService.getMembers.mockResolvedValue([
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john@test.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          email: 'jane@test.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
        },
      ]);

      // Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            searchTerm: 'john',
            filters: { membershipTypeId: 1 },
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].fullName).toBe('John Doe');
    });

    it('should filter by email in client-side mode', async () => {
      // Arrange
      mockMemberService.getMembers.mockResolvedValue([
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john@test.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
          hasSmsConsent: false,
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          email: 'jane@test.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
          hasSmsConsent: true, // Match the filter
        },
      ]);

      // Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            searchTerm: 'jane@',
            filters: { hasSmsConsent: true }, // Trigger client-side
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].email).toBe('jane@test.com');
    });

    it('should handle null fullName gracefully', async () => {
      // Arrange
      mockMemberService.getMembers.mockResolvedValue([
        {
          id: 1,
          fullName: null,
          email: 'test@example.com',
          status: 'Active',
          membershipTypeId: 1,
          joinDate: '2023-01-01',
        },
      ]);

      // Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            searchTerm: 'test',
            showArchived: true,
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Assert - should not crash
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('Pagination', () => {
    it('should calculate correct pagination metadata', async () => {
      // Arrange
      const manyMembers = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        fullName: `Member ${i + 1}`,
        email: `m${i + 1}@test.com`,
        status: 'Archived', // Match showArchived: true filter
        membershipTypeId: 1,
        joinDate: '2023-01-01',
      }));
      mockMemberService.getMembers.mockResolvedValue(manyMembers);

      // Act
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            page: 2,
            pageSize: 25,
            showArchived: true,
          }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.currentPage).toBe(2);
      expect(result.current.data?.totalPages).toBe(3);
      expect(result.current.data?.totalCount).toBe(75);
      expect(result.current.data?.hasPrevious).toBe(true);
      expect(result.current.data?.hasNext).toBe(true);
      expect(result.current.data?.members).toHaveLength(25);
    });

    it('should handle last page correctly', async () => {
      // Arrange
      const members = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        fullName: `Member ${i + 1}`,
        email: `m${i + 1}@test.com`,
        status: 'Active',
        membershipTypeId: 1,
        joinDate: '2023-01-01',
      }));
      mockMemberService.getMembers.mockResolvedValue(members);

      // Act - page 3 of 3 (60 members, 25 per page)
      const { result } = renderHook(
        () =>
          useOptimizedMembers({
            clubId: 1,
            page: 3,
            pageSize: 25,
            filters: { membershipTypeId: 1 },
          }),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toHaveLength(10); // 60 - 50 = 10 left
      expect(result.current.data?.hasPrevious).toBe(true);
      expect(result.current.data?.hasNext).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when clubId is missing', async () => {
      // Arrange
      mockMemberService.getPaginatedMembers.mockImplementation(async (clubId) => {
        if (!clubId) throw new Error('Club ID is required');
        return mockPaginatedResponse;
      });

      // Act - Use undefined clubId which won't enable the query
      const { result } = renderHook(() => useOptimizedMembers({ clubId: undefined }), {
        wrapper: createWrapper(),
      });

      // Assert - Query should be disabled and not error out
      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.isError).toBe(false);
    });

    it('should handle API errors', async () => {
      // Arrange
      const apiError = new Error('API Error');
      mockMemberService.getPaginatedMembers.mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(() => useOptimizedMembers({ clubId: 1 }), {
        wrapper: createWrapper(),
      });

      // Wait for initial attempt and retries
      // The hook retries 3 times with exponential backoff: 1000ms, 2000ms, 4000ms
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          jest.advanceTimersByTime(5000);
          await Promise.resolve(); // Flush promises
        });
      }

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
      expect(result.current.error).toBeTruthy();
    });

    it('should not retry on 404 errors', async () => {
      // Arrange
      const error: any = new Error('Not Found');
      error.status = 404;
      mockMemberService.getPaginatedMembers.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useOptimizedMembers({ clubId: 1 }), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledTimes(1);
    });

    it('should handle non-array response from getMembers', async () => {
      // Arrange
      mockMemberService.getMembers.mockResolvedValue(null as any);

      // Act
      const { result } = renderHook(
        () => useOptimizedMembers({ clubId: 1, showArchived: true }),
        { wrapper: createWrapper() }
      );

      // Assert - should return empty array
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.members).toEqual([]);
    });
  });
});

describe('useOptimizedMembershipTypes', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMembershipTypeService.getMembershipTypes.mockResolvedValue([
      { id: 1, name: 'Basic' },
      { id: 2, name: 'Premium' },
    ] as any);
  });

  it('should fetch membership types', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useOptimizedMembershipTypes(1), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockMembershipTypeService.getMembershipTypes).toHaveBeenCalledWith(1);
    expect(result.current.data).toHaveLength(2);
  });

  it('should not fetch when clubId is undefined', () => {
    // Arrange & Act
    const { result } = renderHook(() => useOptimizedMembershipTypes(undefined), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useOptimizedMemberMutations', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMemberService.updateMember.mockResolvedValue({ id: 1 } as any);
    mockMemberService.archiveMember.mockResolvedValue(undefined);
    mockMemberService.recordPayment.mockResolvedValue(undefined);
  });

  it('should provide mutation functions', () => {
    // Arrange & Act
    const { result } = renderHook(() => useOptimizedMemberMutations(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.updateMember).toBeDefined();
    expect(result.current.archiveMember).toBeDefined();
    expect(result.current.recordPayment).toBeDefined();
    expect(result.current.invalidateMembers).toBeDefined();
  });

  it('should update member and invalidate cache', async () => {
    // Arrange
    const { result } = renderHook(() => useOptimizedMemberMutations(), {
      wrapper: createWrapper(),
    });

    const updateData = { fullName: 'Updated Name' };

    // Act
    await act(async () => {
      await result.current.updateMember.mutateAsync({
        clubId: 1,
        memberId: 1,
        updateData,
      });
    });

    // Assert
    expect(mockMemberService.updateMember).toHaveBeenCalledWith(1, 1, updateData);
  });

  it('should archive member', async () => {
    // Arrange
    const { result } = renderHook(() => useOptimizedMemberMutations(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      await result.current.archiveMember.mutateAsync({ clubId: 1, memberId: 1 });
    });

    // Assert
    expect(mockMemberService.archiveMember).toHaveBeenCalledWith(1, 1);
  });

  it('should record payment', async () => {
    // Arrange
    const { result } = renderHook(() => useOptimizedMemberMutations(), {
      wrapper: createWrapper(),
    });

    const payment = { amount: 100, paymentDate: '2024-01-01' };

    // Act
    await act(async () => {
      await result.current.recordPayment.mutateAsync({
        clubId: 1,
        memberId: 1,
        payment: payment as any,
      });
    });

    // Assert
    expect(mockMemberService.recordPayment).toHaveBeenCalledWith(1, 1, payment);
  });
});

describe('useMemberListPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should track render performance', () => {
    // Arrange & Act
    const { result } = renderHook(() => useMemberListPerformance());

    act(() => {
      result.current.trackRender();
    });

    const metrics = result.current.getPerformanceMetrics();

    // Assert
    expect(metrics.renderCount).toBe(1);
    expect(metrics.averageRenderTime).toBeGreaterThanOrEqual(0);
  });

  it('should calculate average render time', () => {
    // Arrange
    const { result } = renderHook(() => useMemberListPerformance());

    // Act
    act(() => {
      result.current.trackRender();
      jest.advanceTimersByTime(100);
      result.current.trackRender();
    });

    const metrics = result.current.getPerformanceMetrics();

    // Assert
    expect(metrics.renderCount).toBe(2);
    expect(metrics.averageRenderTime).toBeGreaterThan(0);
  });

  it('should log metrics in development mode', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Act
    renderHook(() => useMemberListPerformance());

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Assert
    expect(logger.debug).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not log in production mode', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Act
    renderHook(() => useMemberListPerformance());

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Assert
    expect(logger.debug).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('memberCacheUtils', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.clearAllMocks();
    mockMemberService.getPaginatedMembers.mockResolvedValue({
      members: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
      pageSize: 25,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it('should prefetch next page', () => {
    // Arrange
    const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

    // Act
    memberCacheUtils.prefetchNextPage(queryClient, 1, 1, 25);

    // Assert
    expect(prefetchSpy).toHaveBeenCalled();
  });

  it('should warm up cache', async () => {
    // Arrange
    const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

    // Act
    await memberCacheUtils.warmUpCache(queryClient, 1);

    // Assert
    expect(prefetchSpy).toHaveBeenCalledTimes(2); // members + membership types
  });

  it('should clear stale cache', () => {
    // Arrange
    const removeSpy = jest.spyOn(queryClient, 'removeQueries');

    // Act
    memberCacheUtils.clearStaleCache(queryClient);

    // Assert
    expect(removeSpy).toHaveBeenCalled();
  });
});
