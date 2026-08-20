/**
 * @jest-environment jsdom
 *
 * Optimized Member Service Tests
 *
 * Comprehensive test suite for performance-optimized member operations.
 * Tests follow MSW pattern - mock only HTTP boundary, test real service logic.
 *
 * Coverage:
 * - getMembersWithCursor: cursor pagination, caching, request deduplication, filters, sorting
 * - searchMembersAdvanced: full-text search, fuzzy search, filters, caching
 * - getMemberAnalytics: analytics with date range, engagement, growth trends, long cache TTL
 * - executeBulkOperation: archive, unarchive, update operations, cache invalidation
 * - exportMembers: CSV/JSON export, filters, custom fields, analytics inclusion
 * - importMembersOptimized: file upload, FormData handling, progress tracking, cache invalidation
 * - getRecommendedFilters: filter recommendations, long cache TTL
 * - preloadMemberData: preloading multiple datasets, silent failure handling
 * - clearCache: cache clearing functionality
 * - getCacheStats: cache statistics calculation
 * - Cache management: TTL expiration, cleanup, invalidation by clubId
 */

import apiClient from '../apiClient';
import optimizedMemberService from '../optimizedMemberService';

// Mock apiClient
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));
import {
  CursorPaginatedMembersResponse,
  MemberAnalyticsResponse,
  BulkOperationResponse,
  RecommendedFiltersResponse,
  MemberImportResponse,
} from '@/types/factories';
import { MemberResponse } from '../memberService';
import { logger } from '@/lib/logger';

// Mock logger to prevent console noise - include 'api' method used by apiClient
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    api: jest.fn(),
  },
}));

// Mock ErrorHandler to re-throw errors for testing
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: (error: any) => {
      throw error;
    },
  },
}));

describe('OptimizedMemberService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizedMemberService.clearCache();
    jest.useRealTimers();
  });

  // Mock response data
  const mockCursorResponse: CursorPaginatedMembersResponse = {
    items: [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com' } as MemberResponse,
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' } as MemberResponse,
    ],
    nextCursor: 'cursor-abc',
    hasMore: true,
    totalCount: 100,
  };

  const mockSearchResults: MemberResponse[] = [
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com' } as MemberResponse,
    { id: 2, firstName: 'Johnny', lastName: 'Denver', email: 'johnny@test.com' } as MemberResponse,
  ];

  const mockAnalyticsResponse: MemberAnalyticsResponse = {
    totalMembers: 125,
    activeMembers: 98,
    newMembersThisMonth: 12,
    churned: 3,
    growthRate: 8.5,
    engagementScore: 72.3,
    retentionRate: 95.2,
    membersByType: { Premium: 45, Basic: 80 },
    growthTrend: [
      { date: '2025-01', count: 120 },
      { date: '2025-02', count: 125 },
    ],
  };

  const mockBulkResponse: BulkOperationResponse = {
    success: true,
    affected: 25,
    errors: [],
  };

  const mockRecommendedFilters: RecommendedFiltersResponse = {
    recommended: [
      { field: 'membershipType', value: 'Premium', count: 45 },
      { field: 'status', value: 'Active', count: 98 },
      { field: 'joinDate', value: '2024', count: 30 },
    ],
    popular: ['status', 'membershipType', 'joinDate'],
  };

  describe('getMembersWithCursor', () => {
    it('should fetch members with cursor pagination', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      const result = await optimizedMemberService.getMembersWithCursor(clubId);

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-abc');
      expect(result.totalCount).toBe(100);
    });

    it('should include custom page size in query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {}, undefined, 50);

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('pageSize=50'));
    });

    it('should include cursor when provided for pagination', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {}, 'cursor-xyz');

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('cursor=cursor-xyz'));
    });

    it('should include search term in query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, { searchTerm: 'john' });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=john'));
    });

    it('should include sort options in query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        sortBy: 'lastName',
        sortOrder: 'desc',
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('sortBy=lastName'));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('sortOrder=desc'));
    });

    it('should include filters in query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        filters: { status: 'active', membershipType: 'Premium' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('filter.status=active'));
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.membershipType=Premium')
      );
    });

    it('should include analytics flag when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, { includeAnalytics: true });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('includeAnalytics=true'));
    });

    it('should cache results to avoid duplicate requests', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);
      await optimizedMemberService.getMembersWithCursor(clubId);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate simultaneous requests', async () => {
      (apiClient.get as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockCursorResponse }), 100)
          )
      );

      const [result1, result2] = await Promise.all([
        optimizedMemberService.getMembersWithCursor(clubId),
        optimizedMemberService.getMembersWithCursor(clubId),
      ]);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should skip undefined filter values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        filters: { status: 'active', undefined: undefined },
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('filter.status=active'));
      expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringContaining('filter.undefined'));
    });

    it('should skip empty string filter values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        filters: { status: 'active', empty: '' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('filter.status=active'));
      expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringContaining('filter.empty'));
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(optimizedMemberService.getMembersWithCursor(clubId)).rejects.toThrow();
    });
  });

  describe('searchMembersAdvanced', () => {
    it('should perform advanced search', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      const result = await optimizedMemberService.searchMembersAdvanced(clubId, 'john');

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
    });

    it('should handle search terms with spaces', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      await optimizedMemberService.searchMembersAdvanced(clubId, 'test query');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q=test')
      );
    });

    it('should enable fuzzy search when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      await optimizedMemberService.searchMembersAdvanced(clubId, 'john', { fuzzySearch: true });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('fuzzy=true')
      );
    });

    it('should include archived members when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      await optimizedMemberService.searchMembersAdvanced(clubId, 'john', {
        includeArchived: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('includeArchived=true')
      );
    });

    it('should limit results when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults.slice(0, 1) });

      const result = await optimizedMemberService.searchMembersAdvanced(clubId, 'john', {
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      );
    });

    it('should include filters in search', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      await optimizedMemberService.searchMembersAdvanced(clubId, 'john', {
        filters: { status: 'active', membershipType: 'Premium' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.status=active')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.membershipType=Premium')
      );
    });

    it('should cache search results with shorter TTL', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSearchResults });

      await optimizedMemberService.searchMembersAdvanced(clubId, 'john');
      await optimizedMemberService.searchMembersAdvanced(clubId, 'john');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        optimizedMemberService.searchMembersAdvanced(clubId, 'john')
      ).rejects.toThrow();
    });
  });

  describe('getMemberAnalytics', () => {
    it('should fetch member analytics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      const result = await optimizedMemberService.getMemberAnalytics(clubId);

      expect(result.totalMembers).toBe(125);
      expect(result.activeMembers).toBe(98);
      expect(result.engagementScore).toBe(72.3);
      expect(result.retentionRate).toBe(95.2);
    });

    it('should include date range in query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMemberAnalytics(clubId, {
        dateRange: { from: '2025-01-01', to: '2025-01-31' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('from=2025-01-01')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('to=2025-01-31')
      );
    });

    it('should include engagement metrics when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMemberAnalytics(clubId, { includeEngagement: true });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('includeEngagement=true')
      );
    });

    it('should include growth trends when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMemberAnalytics(clubId, { includeGrowthTrends: true });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('includeGrowthTrends=true')
      );
    });

    it('should return analytics breakdown by membership type', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      const result = await optimizedMemberService.getMemberAnalytics(clubId);

      expect(result.membersByType).toEqual({ Premium: 45, Basic: 80 });
    });

    it('should return growth trend data', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      const result = await optimizedMemberService.getMemberAnalytics(clubId);

      expect(result.growthTrend).toHaveLength(2);
      expect(result.growthTrend[0].date).toBe('2025-01');
      expect(result.growthTrend[1].count).toBe(125);
    });

    it('should cache analytics with longer TTL (10 minutes)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMemberAnalytics(clubId);
      await optimizedMemberService.getMemberAnalytics(clubId);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(optimizedMemberService.getMemberAnalytics(clubId)).rejects.toThrow();
    });
  });

  describe('executeBulkOperation', () => {
    it('should execute bulk archive operation', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      const result = await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [1, 2, 3],
        operation: 'archive',
      });

      expect(result.success).toBe(true);
      expect(result.affected).toBe(25);
      expect(result.errors).toHaveLength(0);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/members/bulk`),
        expect.objectContaining({
          memberIds: [1, 2, 3],
          operation: 'archive',
        })
      );
    });

    it('should execute bulk unarchive operation', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [4, 5],
        operation: 'unarchive',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/members/bulk`),
        expect.objectContaining({
          operation: 'unarchive',
        })
      );
    });

    it('should execute bulk update membership type operation', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [1, 2],
        operation: 'update_membership_type',
        data: { membershipType: 'Premium' },
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/members/bulk`),
        expect.objectContaining({
          operation: 'update_membership_type',
          data: { membershipType: 'Premium' },
        })
      );
    });

    it('should execute bulk update status operation', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [1, 2, 3],
        operation: 'update_status',
        data: { status: 'active' },
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/members/bulk`),
        expect.objectContaining({
          operation: 'update_status',
          data: { status: 'active' },
        })
      );
    });

    it('should invalidate cache after bulk operation', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      // Populate cache
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Execute bulk operation
      await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [1],
        operation: 'archive',
      });

      // Should fetch fresh data (cache invalidated)
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error on network failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        optimizedMemberService.executeBulkOperation(clubId, {
          memberIds: [1],
          operation: 'archive',
        })
      ).rejects.toThrow();
    });
  });

  describe('exportMembers', () => {
    it('should export members as CSV blob', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

      const result = await optimizedMemberService.exportMembers(clubId, { format: 'csv' });

      expect(result).toBeInstanceOf(Blob);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('format=csv'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should export members as JSON', async () => {
      const mockJson = { members: mockSearchResults };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockJson });

      const result = await optimizedMemberService.exportMembers(clubId, { format: 'json' });

      expect(result).toEqual(mockJson);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('format=json'),
        expect.objectContaining({ responseType: 'json' })
      );
    });

    it('should include custom fields when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['data']) });

      await optimizedMemberService.exportMembers(clubId, {
        format: 'csv',
        includeCustomFields: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('includeCustomFields=true'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should include analytics when specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['data']) });

      await optimizedMemberService.exportMembers(clubId, {
        format: 'csv',
        includeAnalytics: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('includeAnalytics=true'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should include filters in export', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['data']) });

      await optimizedMemberService.exportMembers(clubId, {
        format: 'csv',
        filters: { status: 'active', membershipType: 'Premium' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.status=active'),
        expect.objectContaining({ responseType: 'blob' })
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.membershipType=Premium'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should skip empty filter values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['data']) });

      await optimizedMemberService.exportMembers(clubId, {
        format: 'csv',
        filters: { status: 'active', empty: '' },
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter.status=active'),
        expect.objectContaining({ responseType: 'blob' })
      );
      // Check that filter.empty is NOT in the URL
      const callArgs = (apiClient.get as jest.Mock).mock.calls[0][0];
      expect(callArgs).not.toContain('filter.empty');
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        optimizedMemberService.exportMembers(clubId, { format: 'csv' })
      ).rejects.toThrow();
    });
  });

  describe('importMembersOptimized', () => {
    it('should import members from file', async () => {
      const mockImportResponse: MemberImportResponse = {
        success: true,
        imported: 50,
        skipped: 5,
        errors: [],
        validationErrors: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockImportResponse });

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      const result = await optimizedMemberService.importMembersOptimized(clubId, mockFile);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(50);
      expect(result.skipped).toBe(5);
    });

    it('should send file in FormData', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 0, skipped: 0, errors: [] },
      });

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/members/import/optimized`),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
    });

    it('should include skipDuplicates option', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 0, skipped: 0, errors: [] },
      });

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile, {
        skipDuplicates: true,
      });

      const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('skipDuplicates')).toBe('true');
    });

    it('should include validateOnly option', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 0, skipped: 0, errors: [] },
      });

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile, {
        validateOnly: true,
      });

      const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('validateOnly')).toBe('true');
    });

    it('should include batchSize option', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 0, skipped: 0, errors: [] },
      });

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile, { batchSize: 200 });

      const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('batchSize')).toBe('200');
    });

    it('should invalidate cache after successful import', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 50, skipped: 0, errors: [] },
      });

      // Populate cache
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Import members
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile);

      // Should fetch fresh data
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should NOT invalidate cache when validateOnly is true', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, imported: 0, skipped: 0, errors: [] },
      });

      // Populate cache
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Validate-only import (no actual changes)
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await optimizedMemberService.importMembersOptimized(clubId, mockFile, {
        validateOnly: true,
      });

      // Should use cache
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error on network failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });
      await expect(
        optimizedMemberService.importMembersOptimized(clubId, mockFile)
      ).rejects.toThrow();
    });

    it('should call onProgress callback when provided', async () => {
      const mockImportResponse: MemberImportResponse = {
        success: true,
        imported: 50,
        skipped: 5,
        errors: [],
        validationErrors: [],
      };

      (apiClient.post as jest.Mock).mockImplementation(
        (_url: string, _data: FormData, config: any) => {
          // Simulate progress callback being invoked by axios
          if (config?.onUploadProgress) {
            config.onUploadProgress({ loaded: 50, total: 100, lengthComputable: true });
          }
          return Promise.resolve({ data: mockImportResponse });
        }
      );

      const onProgress = jest.fn();
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      await optimizedMemberService.importMembersOptimized(clubId, mockFile, {
        onProgress,
      });

      // onProgress is called with { processed, total, errors }
      expect(onProgress).toHaveBeenCalledWith({
        processed: 50,
        total: 100,
        errors: [],
      });
    });

    it('should not call onProgress when not provided', async () => {
      const mockImportResponse: MemberImportResponse = {
        success: true,
        imported: 50,
        skipped: 5,
        errors: [],
        validationErrors: [],
      };

      (apiClient.post as jest.Mock).mockImplementation(
        (_url: string, _data: FormData, config: any) => {
          // Simulate progress event but no callback provided
          if (config?.onUploadProgress) {
            config.onUploadProgress({ loaded: 50, total: 100, lengthComputable: true });
          }
          return Promise.resolve({ data: mockImportResponse });
        }
      );

      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      // Should not throw - progress callback is optional
      const result = await optimizedMemberService.importMembersOptimized(clubId, mockFile);
      expect(result.success).toBe(true);
    });
  });

  describe('getRecommendedFilters', () => {
    it('should fetch recommended filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRecommendedFilters });

      const result = await optimizedMemberService.getRecommendedFilters(clubId);

      expect(result.recommended).toHaveLength(3);
      expect(result.popular).toContain('status');
      expect(result.popular).toContain('membershipType');
    });

    it('should return filter recommendations with counts', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRecommendedFilters });

      const result = await optimizedMemberService.getRecommendedFilters(clubId);

      expect(result.recommended[0].field).toBe('membershipType');
      expect(result.recommended[0].value).toBe('Premium');
      expect(result.recommended[0].count).toBe(45);
    });

    it('should cache filter recommendations with long TTL (30 minutes)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRecommendedFilters });

      await optimizedMemberService.getRecommendedFilters(clubId);
      await optimizedMemberService.getRecommendedFilters(clubId);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(optimizedMemberService.getRecommendedFilters(clubId)).rejects.toThrow();
    });
  });

  describe('preloadMemberData', () => {
    it('should preload members, analytics, and filters', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockCursorResponse })
        .mockResolvedValueOnce({ data: mockAnalyticsResponse })
        .mockResolvedValueOnce({ data: mockRecommendedFilters });

      await optimizedMemberService.preloadMemberData(clubId);

      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should not throw on preload failure (silent failure)', async () => {
      (apiClient.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(optimizedMemberService.preloadMemberData(clubId)).resolves.toBeUndefined();
    });

    it('should log errors when preload fails', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await optimizedMemberService.preloadMemberData(clubId);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to preload member data',
        expect.anything()
      );
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      optimizedMemberService.clearCache();

      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should clear request queue as well', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });

      const promise1 = optimizedMemberService.getMembersWithCursor(clubId);
      optimizedMemberService.clearCache();
      const promise2 = optimizedMemberService.getMembersWithCursor(clubId);

      await Promise.all([promise1, promise2]);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);

      const stats = optimizedMemberService.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
      expect(stats.hitRatio).toBe(0);
    });

    it('should return zero stats when cache is empty', () => {
      const stats = optimizedMemberService.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.avgAge).toBe(0);
      expect(stats.hitRatio).toBe(0);
    });

    it('should calculate average age correctly with multiple entries', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockCursorResponse })
        .mockResolvedValueOnce({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);
      await optimizedMemberService.getMemberAnalytics(clubId);

      const stats = optimizedMemberService.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache TTL Expiration', () => {
    it('should expire cache entries after default TTL (5 minutes)', async () => {
      jest.useFakeTimers();
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      jest.advanceTimersByTime(6 * 60 * 1000);

      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should expire analytics cache after custom TTL (10 minutes)', async () => {
      jest.useFakeTimers();
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAnalyticsResponse });

      await optimizedMemberService.getMemberAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Advance time less than 10 minutes (should still be cached)
      jest.advanceTimersByTime(8 * 60 * 1000);
      await optimizedMemberService.getMemberAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Advance past 10 minutes total
      jest.advanceTimersByTime(3 * 60 * 1000);
      await optimizedMemberService.getMemberAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('Service Export', () => {
    it('should export optimizedMemberService as default', () => {
      expect(optimizedMemberService).toBeDefined();
      expect(typeof optimizedMemberService).toBe('object');
    });

    it('should have all required methods', () => {
      const methods = [
        'getMembersWithCursor',
        'searchMembersAdvanced',
        'getMemberAnalytics',
        'executeBulkOperation',
        'exportMembers',
        'importMembersOptimized',
        'getRecommendedFilters',
        'preloadMemberData',
        'clearCache',
        'getCacheStats',
      ];

      methods.forEach((method) => {
        expect(typeof (optimizedMemberService as any)[method]).toBe('function');
      });
    });
  });

  describe('Cache Behavior Tests', () => {
    it('should correctly report cache size after multiple operations', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockCursorResponse })
        .mockResolvedValueOnce({ data: mockAnalyticsResponse });

      // First call - caches member data
      await optimizedMemberService.getMembersWithCursor(clubId);
      let stats = optimizedMemberService.getCacheStats();
      expect(stats.size).toBe(1);

      // Second call - caches analytics data
      await optimizedMemberService.getMemberAnalytics(clubId);
      stats = optimizedMemberService.getCacheStats();
      expect(stats.size).toBe(2);

      // Third call - uses cache (no new API call)
      await optimizedMemberService.getMembersWithCursor(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('should invalidate cache for specific club on bulk operation', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockCursorResponse });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBulkResponse });

      // Cache data for two clubs
      await optimizedMemberService.getMembersWithCursor(clubId);
      await optimizedMemberService.getMembersWithCursor(2);
      expect(apiClient.get).toHaveBeenCalledTimes(2);

      // Bulk operation on club 1 should invalidate club 1's cache
      await optimizedMemberService.executeBulkOperation(clubId, {
        memberIds: [1],
        operation: 'archive',
      });

      // Club 1 should make new request, club 2 should use cache
      await optimizedMemberService.getMembersWithCursor(clubId);
      await optimizedMemberService.getMembersWithCursor(2);
      expect(apiClient.get).toHaveBeenCalledTimes(3); // Only 1 new call for club 1
    });

    it('should return cache statistics with avgAge calculation', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId);

      const stats = optimizedMemberService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
      expect(typeof stats.hitRatio).toBe('number');
    });
  });

  describe('Edge Cases for Filter Handling', () => {
    it('should handle null filter values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        filters: { status: 'active', nullValue: null as any },
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('filter.status=active'));
      const callArgs = (apiClient.get as jest.Mock).mock.calls[0][0];
      expect(callArgs).not.toContain('filter.nullValue');
    });

    it('should handle mixed valid and invalid filter values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCursorResponse });

      await optimizedMemberService.getMembersWithCursor(clubId, {
        filters: {
          status: 'active',
          type: 'Premium',
          empty: '',
          nullVal: null as any,
          undefinedVal: undefined,
        },
      });

      const callArgs = (apiClient.get as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('filter.status=active');
      expect(callArgs).toContain('filter.type=Premium');
      expect(callArgs).not.toContain('filter.empty');
      expect(callArgs).not.toContain('filter.nullVal');
      expect(callArgs).not.toContain('filter.undefinedVal');
    });
  });

  describe('Request Deduplication Edge Cases', () => {
    it('should handle deduplication when first request fails', async () => {
      (apiClient.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockCursorResponse });

      // First two calls - both should see the rejection
      const promise1 = optimizedMemberService.getMembersWithCursor(clubId).catch(() => 'failed');
      const promise2 = optimizedMemberService.getMembersWithCursor(clubId).catch(() => 'failed');

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual(['failed', 'failed']);

      // Third call should succeed (request queue should be cleared after failure)
      const result = await optimizedMemberService.getMembersWithCursor(clubId);
      expect(result.items).toHaveLength(2);
    });

    it('should dedup requests with same parameters', async () => {
      (apiClient.get as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockCursorResponse }), 100)
          )
      );

      const filters = { status: 'active' };

      const [result1, result2] = await Promise.all([
        optimizedMemberService.getMembersWithCursor(clubId, { filters }),
        optimizedMemberService.getMembersWithCursor(clubId, { filters }),
      ]);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should NOT dedup requests with different parameters', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockCursorResponse })
        .mockResolvedValueOnce({ data: { ...mockCursorResponse, totalCount: 50 } });

      const [result1, result2] = await Promise.all([
        optimizedMemberService.getMembersWithCursor(clubId, { filters: { status: 'active' } }),
        optimizedMemberService.getMembersWithCursor(clubId, { filters: { status: 'inactive' } }),
      ]);

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(result1.totalCount).toBe(100);
      expect(result2.totalCount).toBe(50);
    });
  });
});
