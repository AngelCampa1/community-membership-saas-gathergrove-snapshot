import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import memberService, { UpdateMemberRequest, RecordPaymentRequest, MemberResponse, PaginatedMembersResponse } from '@/services/memberService';
import membershipTypeService from '@/services/membershipTypeService';
import { logger } from '@/lib/logger';

export interface MemberFilters {
  membershipTypeId?: number;
  duesStatus?: 'Current' | 'Overdue' | 'Upcoming' | 'Unpaid' | 'Partial';
  joinDateFrom?: string;
  joinDateTo?: string;
  engagementLevel?: 'high' | 'medium' | 'low' | 'inactive';
}

interface OptimizedMembersParams {
  clubId?: number;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  filters?: MemberFilters;
  showArchived?: boolean;
}

// Custom debounce hook for search optimization
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized members hook with advanced caching and performance features
export function useOptimizedMembers({
  clubId,
  searchTerm = '',
  page = 1,
  pageSize = 25,
  filters = {},
  showArchived = false
}: OptimizedMembersParams) {
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  
  // Memoize filter key for cache efficiency
  const filterKey = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Enhanced query key with all parameters
  const queryKey = useMemo(() => [
    'optimized-members',
    clubId,
    debouncedSearchTerm,
    page,
    pageSize,
    filterKey,
    showArchived
  ], [clubId, debouncedSearchTerm, page, pageSize, filterKey, showArchived]);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<PaginatedMembersResponse> => {
      if (!clubId) throw new Error('Club ID is required');
      
      // Use optimized pagination for performance
      if (showArchived || Object.keys(filters).length > 0) {
        // For archived or filtered members, use optimized client-side processing
        const allMembers = await memberService.getMembers(clubId);
        
        let filteredMembers = Array.isArray(allMembers) ? allMembers : [];
        
        // Apply status filter
        if (showArchived) {
          filteredMembers = filteredMembers.filter(member => member.status === 'Archived');
        } else {
          filteredMembers = filteredMembers.filter(member => member.status !== 'Archived');
        }
        
        // Apply search filter
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          filteredMembers = filteredMembers.filter(member =>
            // SECURITY FIX: Add null checks before calling toLowerCase()
            (member.fullName?.toLowerCase().includes(searchLower) ?? false) ||
            (member.email?.toLowerCase().includes(searchLower) ?? false)
          );
        }
        
        // Apply other filters
        filteredMembers = applyAdvancedFilters(filteredMembers, filters);
        
        // Implement cursor-based pagination simulation for better performance
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredMembers.length / pageSize);
        
        return {
          members: paginatedMembers,
          totalCount: filteredMembers.length,
          currentPage: page,
          totalPages,
          pageSize,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
          search: debouncedSearchTerm || undefined
        };
      }
      
      // For active members without complex filters, use server-side pagination
      return memberService.getPaginatedMembers(
        clubId, 
        debouncedSearchTerm || undefined, 
        page, 
        pageSize
      );
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    placeholderData: keepPreviousData, // Keep previous data while loading new page
    refetchOnWindowFocus: false,
    // Enable background refetching for data freshness
    refetchOnMount: 'always',
    // Retry configuration for network resilience
    retry: (failureCount: number, error: Error) => {
      if ('status' in error && (error.status === 404 || error.status === 403)) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Advanced filter application function
const applyAdvancedFilters = (members: MemberResponse[], filters: MemberFilters): MemberResponse[] => {
  return members.filter(member => {
    // Membership Type filter
    if (filters.membershipTypeId && member.membershipTypeId !== filters.membershipTypeId) {
      return false;
    }

    // Dues Status filter
    if (filters.duesStatus) {
      const memberDuesStatus = calculateDuesStatus(member).status;
      
      if (filters.duesStatus === 'Partial') {
        if (!memberDuesStatus.startsWith('Partial:')) {
          return false;
        }
      } else if (memberDuesStatus !== filters.duesStatus) {
        return false;
      }
    }

    // Join Date range filter
    if (filters.joinDateFrom || filters.joinDateTo) {
      const joinDate = new Date(member.joinDate);
      
      if (filters.joinDateFrom) {
        const fromDate = new Date(filters.joinDateFrom);
        if (joinDate < fromDate) return false;
      }
      
      if (filters.joinDateTo) {
        const toDate = new Date(filters.joinDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (joinDate > toDate) return false;
      }
    }

    // Engagement Level filter (placeholder - would need actual engagement data)
    if (filters.engagementLevel) {
      // This would need to be implemented based on actual engagement scoring
      // For now, we'll use a simple heuristic based on member activity
      const engagementScore = calculateEngagementScore(member);
      const level = getEngagementLevel(engagementScore);
      if (level !== filters.engagementLevel) return false;
    }

    return true;
  });
};

// Helper function to calculate dues status
const calculateDuesStatus = (member: MemberResponse) => {
  if (!member.duesPaidUntil) {
    if (member.hasPartialPayments && member.outstandingBalance) {
      return { 
        status: `Partial: $${member.outstandingBalance.toFixed(2)} remaining`, 
        color: 'secondary' 
      };
    }
    return { status: 'Unpaid', color: 'destructive' };
  }

  const today = new Date();
  const duesDate = new Date(member.duesPaidUntil);
  const diffTime = duesDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'Overdue', color: 'destructive' };
  } else if (diffDays <= 30) {
    return { status: 'Expiring Soon', color: 'secondary' };
  } else {
    return { status: 'Current', color: 'default' };
  }
};

// Placeholder engagement calculation - would be replaced with actual logic
const calculateEngagementScore = (member: MemberResponse): number => {
  // Simple heuristic based on available data
  let score = 50; // Base score
  
  if (member.status === 'Active') score += 20;
  
  const joinDate = new Date(member.joinDate);
  const monthsActive = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsActive > 12) score += 15;
  
  return Math.min(Math.max(score, 0), 100);
};

const getEngagementLevel = (score: number): 'high' | 'medium' | 'low' | 'inactive' => {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 20) return 'low';
  return 'inactive';
};

// Membership types hook with enhanced caching
export function useOptimizedMembershipTypes(clubId?: number) {
  return useQuery({
    queryKey: ['optimized-membership-types', clubId],
    queryFn: () => {
      if (!clubId) throw new Error('Club ID is required');
      return membershipTypeService.getMembershipTypes(clubId);
    },
    enabled: !!clubId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
  });
}

// Enhanced member mutations with optimistic updates
export function useOptimizedMemberMutations() {
  const queryClient = useQueryClient();

  // Optimized cache invalidation
  const invalidateMembers = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['optimized-members'],
      exact: false 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['members'],
      exact: false 
    });
  }, [queryClient]);

  // Update member with optimistic updates
  const updateMemberMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number; updateData: UpdateMemberRequest }) => 
      memberService.updateMember(data.clubId, data.memberId, data.updateData),
    onMutate: async ({ clubId: _clubId, memberId, updateData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['optimized-members'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['optimized-members'] });

      // Optimistically update cache
      queryClient.setQueriesData(
        { queryKey: ['optimized-members'] },
        (oldData: PaginatedMembersResponse | undefined) => {
          if (!oldData?.members) return oldData;
          
          return {
            ...oldData,
            members: oldData.members.map((member: MemberResponse) =>
              member.id === memberId
                ? { ...member, ...updateData, updatedAt: new Date().toISOString() }
                : member
            )
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      invalidateMembers();
    },
  });

  const archiveMemberMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number }) => 
      memberService.archiveMember(data.clubId, data.memberId),
    onSuccess: () => {
      invalidateMembers();
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number; payment: RecordPaymentRequest }) => 
      memberService.recordPayment(data.clubId, data.memberId, data.payment),
    onSuccess: () => {
      invalidateMembers();
      // Also invalidate dashboard as payment affects stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    updateMember: updateMemberMutation,
    archiveMember: archiveMemberMutation,
    recordPayment: recordPaymentMutation,
    invalidateMembers,
  };
}

// Performance monitoring hook
export function useMemberListPerformance() {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: Date.now(),
    averageRenderTime: 0,
    memoryUsage: 0
  });

  const trackRender = useCallback(() => {
    const now = Date.now();
    const renderTime = now - performanceRef.current.lastRenderTime;
    
    performanceRef.current.renderCount++;
    performanceRef.current.averageRenderTime = 
      (performanceRef.current.averageRenderTime + renderTime) / 2;
    performanceRef.current.lastRenderTime = now;
    
    // Track memory usage if available
    if ((performance as any).memory) {
      performanceRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  }, []);

  const getPerformanceMetrics = useCallback(() => ({
    ...performanceRef.current
  }), []);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const metrics = getPerformanceMetrics();
        // Performance metrics logged for development debugging
        logger.debug('members', 'Member list performance metrics', { metrics });
      }, 10000); // Log every 10 seconds

      return () => clearInterval(interval);
    }
  }, [getPerformanceMetrics]);

  return {
    trackRender,
    getPerformanceMetrics
  };
}

// Cache management utilities
export const memberCacheUtils = {
  // Preload next page for better UX
  prefetchNextPage: (queryClient: ReturnType<typeof useQueryClient>, clubId: number, currentPage: number, pageSize: number) => {
    queryClient.prefetchQuery({
      queryKey: ['optimized-members', clubId, '', currentPage + 1, pageSize, '{}', false],
      queryFn: () => memberService.getPaginatedMembers(clubId, undefined, currentPage + 1, pageSize),
      staleTime: 2 * 60 * 1000,
    });
  },

  // Clear outdated cache entries
  clearStaleCache: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.removeQueries({
      queryKey: ['optimized-members'],
      predicate: (query: any) => {
        const staleTime = 10 * 60 * 1000; // 10 minutes
        return Date.now() - query.state.dataUpdatedAt > staleTime;
      }
    });
  },

  // Warm up cache with frequently accessed data
  warmUpCache: async (queryClient: any, clubId: number) => {
    // Preload first page
    queryClient.prefetchQuery({
      queryKey: ['optimized-members', clubId, '', 1, 25, '{}', false],
      queryFn: () => memberService.getPaginatedMembers(clubId, undefined, 1, 25),
      staleTime: 2 * 60 * 1000,
    });

    // Preload membership types
    queryClient.prefetchQuery({
      queryKey: ['optimized-membership-types', clubId],
      queryFn: () => membershipTypeService.getMembershipTypes(clubId),
      staleTime: 30 * 60 * 1000,
    });
  }
};
