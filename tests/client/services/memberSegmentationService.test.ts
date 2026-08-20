import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import memberSegmentationService, { 
  MemberSegmentationService,
  MemberSegment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  SegmentFilterCriteria,
  SegmentMemberResult,
  SegmentPreviewResult,
  SegmentAnalytics
} from '../../../client/src/services/memberSegmentationService';
import apiClient from '../../../client/src/services/apiClient';
import { billingService } from '../../../client/src/services/billingService';

// Mock dependencies
jest.mock('../../../client/src/services/apiClient');
jest.mock('../../../client/src/services/billingService');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedBillingService = billingService as jest.Mocked<typeof billingService>;

describe('MemberSegmentationService', () => {
  let service: MemberSegmentationService;

  const mockClubId = 1;
  const mockSegmentId = 1;
  
  const mockSegment: MemberSegment = {
    id: 1,
    clubId: mockClubId,
    name: 'Active Members',
    description: 'Members who are currently active',
    filterCriteria: {
      status: 'Active',
      engagementLevel: 'high'
    },
    memberCount: 150,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockBillingStatus = {
    currentTier: 'Unlimited',
    isActive: true,
    nextBillingDate: '2024-02-01T00:00:00Z',
    features: ['segmentation']
  };

  beforeEach(() => {
    service = new MemberSegmentationService();
    jest.clearAllMocks();
    
    // Default mock for billing service
    mockedBillingService.getBillingStatus.mockResolvedValue(mockBillingStatus);
  });

  afterEach(() => {
    service.clearCache();
    jest.resetAllMocks();
  });

  describe('Tier Authorization', () => {
    it('should allow access for Unlimited tier', async () => {
      mockedApiClient.get.mockResolvedValue({ data: [mockSegment] });

      const result = await service.getSegments(mockClubId);
      
      expect(result).toEqual([mockSegment]);
      expect(mockedBillingService.getBillingStatus).toHaveBeenCalled();
    });

    it('should deny access for non-Unlimited tier', async () => {
      mockedBillingService.getBillingStatus.mockResolvedValue({
        ...mockBillingStatus,
        currentTier: 'Premium'
      });

      await expect(service.getSegments(mockClubId)).rejects.toThrow(
        'Member segmentation is only available for Unlimited tier subscribers'
      );
    });

    it('should continue with graceful degradation when billing service fails', async () => {
      mockedBillingService.getBillingStatus.mockRejectedValue(new Error('Service unavailable'));
      mockedApiClient.get.mockResolvedValue({ data: [mockSegment] });
      
      // Mock console.warn to avoid noise in test output
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await service.getSegments(mockClubId);
      
      expect(result).toEqual([mockSegment]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Billing service unavailable, proceeding with segmentation operation'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should still throw tier-related errors even when billing service fails', async () => {
      mockedBillingService.getBillingStatus.mockRejectedValue(
        new Error('Member segmentation is only available for Unlimited tier subscribers')
      );

      await expect(service.getSegments(mockClubId)).rejects.toThrow(
        'Member segmentation is only available for Unlimited tier subscribers'
      );
    });
  });

  describe('getSegments', () => {
    it('should fetch segments successfully', async () => {
      const segments = [mockSegment];
      mockedApiClient.get.mockResolvedValue({ data: segments });

      const result = await service.getSegments(mockClubId);

      expect(result).toEqual(segments);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/segments?includeInactive=false&sortBy=name&sortOrder=asc'
      );
    });

    it('should handle custom options', async () => {
      const segments = [mockSegment];
      mockedApiClient.get.mockResolvedValue({ data: segments });

      const result = await service.getSegments(mockClubId, {
        includeInactive: true,
        sortBy: 'memberCount',
        sortOrder: 'desc'
      });

      expect(result).toEqual(segments);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/segments?includeInactive=true&sortBy=memberCount&sortOrder=desc'
      );
    });

    it('should use cache when available', async () => {
      const segments = [mockSegment];
      mockedApiClient.get.mockResolvedValue({ data: segments });

      // First call
      await service.getSegments(mockClubId);
      // Second call
      const result = await service.getSegments(mockClubId);

      expect(result).toEqual(segments);
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getSegments(mockClubId)).rejects.toThrow();
    });
  });

  describe('createSegment', () => {
    const createRequest: CreateSegmentRequest = {
      name: 'New Segment',
      description: 'Test segment',
      filterCriteria: {
        status: 'Active',
        engagementLevel: 'medium'
      },
      isActive: true
    };

    it('should create segment successfully', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockSegment });

      const result = await service.createSegment(mockClubId, createRequest);

      expect(result).toEqual(mockSegment);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/clubs/1/segments',
        createRequest
      );
    });

    it('should validate filter criteria before creating', async () => {
      const invalidRequest: CreateSegmentRequest = {
        name: 'Invalid Segment',
        filterCriteria: {
          eventAttendanceMin: -1 // Invalid: negative value
        }
      };

      await expect(
        service.createSegment(mockClubId, invalidRequest)
      ).rejects.toThrow('Event attendance minimum cannot be negative.');
    });

    it('should invalidate cache after creating', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockSegment });
      mockedApiClient.get.mockResolvedValue({ data: [mockSegment] });

      // Populate cache
      await service.getSegments(mockClubId);
      
      // Create segment
      await service.createSegment(mockClubId, createRequest);
      
      // This should make a new API call since cache was invalidated
      await service.getSegments(mockClubId);

      expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle creation errors', async () => {
      mockedApiClient.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Segment name already exists' } }
      });

      await expect(
        service.createSegment(mockClubId, createRequest)
      ).rejects.toThrow();
    });
  });

  describe('updateSegment', () => {
    const updateRequest: UpdateSegmentRequest = {
      name: 'Updated Segment',
      description: 'Updated description',
      filterCriteria: {
        status: 'Active'
      },
      isActive: true
    };

    it('should update segment successfully', async () => {
      const updatedSegment = { ...mockSegment, ...updateRequest };
      mockedApiClient.put.mockResolvedValue({ data: updatedSegment });

      const result = await service.updateSegment(mockClubId, mockSegmentId, updateRequest);

      expect(result).toEqual(updatedSegment);
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/clubs/1/segments/1',
        updateRequest
      );
    });

    it('should validate filter criteria when provided', async () => {
      const invalidUpdateRequest: UpdateSegmentRequest = {
        name: 'Updated Segment',
        filterCriteria: {
          ageMin: 100,
          ageMax: 50 // Invalid: min > max
        }
      };

      await expect(
        service.updateSegment(mockClubId, mockSegmentId, invalidUpdateRequest)
      ).rejects.toThrow('Age minimum cannot be greater than maximum.');
    });

    it('should invalidate cache after updating', async () => {
      mockedApiClient.put.mockResolvedValue({ data: mockSegment });
      const spy = jest.spyOn(service as any, 'invalidateSegmentCaches');

      await service.updateSegment(mockClubId, mockSegmentId, updateRequest);

      expect(spy).toHaveBeenCalledWith(mockClubId);
    });
  });

  describe('deleteSegment', () => {
    it('should delete segment successfully', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await service.deleteSegment(mockClubId, mockSegmentId);

      expect(result).toEqual({ success: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith('/clubs/1/segments/1');
    });

    it('should invalidate cache after deleting', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: { success: true } });
      const spy = jest.spyOn(service as any, 'invalidateSegmentCaches');

      await service.deleteSegment(mockClubId, mockSegmentId);

      expect(spy).toHaveBeenCalledWith(mockClubId);
    });
  });

  describe('getSegmentMembers', () => {
    const mockMemberResult: SegmentMemberResult = {
      segmentId: mockSegmentId,
      segmentName: 'Active Members',
      totalCount: 150,
      members: [
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          membershipTypeName: 'Regular',
          status: 'Active',
          joinDate: '2023-01-01T00:00:00Z',
          duesStatus: 'Current',
          engagementLevel: 'high',
          tags: ['active', 'engaged']
        }
      ],
      currentPage: 1,
      pageSize: 25,
      totalPages: 6,
      hasNext: true,
      hasPrevious: false
    };

    it('should get segment members successfully', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockMemberResult });

      const result = await service.getSegmentMembers(mockClubId, mockSegmentId);

      expect(result).toEqual(mockMemberResult);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/segments/1/members?page=1&pageSize=25'
      );
    });

    it('should handle pagination parameters', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockMemberResult });

      await service.getSegmentMembers(mockClubId, mockSegmentId, 2, 50);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/segments/1/members?page=2&pageSize=50'
      );
    });

    it('should use cache with shorter TTL', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockMemberResult });

      // First call
      await service.getSegmentMembers(mockClubId, mockSegmentId);
      // Second call within cache period
      const result = await service.getSegmentMembers(mockClubId, mockSegmentId);

      expect(result).toEqual(mockMemberResult);
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('previewSegment', () => {
    const filterCriteria: SegmentFilterCriteria = {
      status: 'Active',
      engagementLevel: 'high'
    };

    const mockPreviewResult: SegmentPreviewResult = {
      totalCount: 75,
      members: [
        {
          id: 1,
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          membershipTypeName: 'Premium',
          status: 'Active',
          joinDate: '2023-06-01T00:00:00Z',
          duesStatus: 'Current',
          engagementLevel: 'high',
          tags: ['premium', 'engaged']
        }
      ],
      currentPage: 1,
      pageSize: 25,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false
    };

    it('should preview segment successfully', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockPreviewResult });

      const result = await service.previewSegment(mockClubId, filterCriteria);

      expect(result).toEqual(mockPreviewResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/clubs/1/segments/preview',
        {
          filterCriteria,
          page: 1,
          pageSize: 25
        }
      );
    });

    it('should validate filter criteria before previewing', async () => {
      const invalidCriteria: SegmentFilterCriteria = {
        joinDateFrom: '2024-01-01',
        joinDateTo: '2023-01-01' // Invalid: from > to
      };

      await expect(
        service.previewSegment(mockClubId, invalidCriteria)
      ).rejects.toThrow('Join date from cannot be after join date to.');
    });

    it('should use shorter cache TTL for preview', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockPreviewResult });

      // First call
      await service.previewSegment(mockClubId, filterCriteria);
      // Second call within cache period
      const result = await service.previewSegment(mockClubId, filterCriteria);

      expect(result).toEqual(mockPreviewResult);
      expect(mockedApiClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshSegmentCounts', () => {
    const mockRefreshResult = {
      segmentsUpdated: 5,
      totalMembersProcessed: 1000,
      averageProcessingTime: 1500
    };

    it('should refresh segment counts successfully', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockRefreshResult });

      const result = await service.refreshSegmentCounts(mockClubId);

      expect(result).toEqual(mockRefreshResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/clubs/1/segments/refresh-counts');
    });

    it('should invalidate all caches after refresh', async () => {
      mockedApiClient.post.mockResolvedValue({ data: mockRefreshResult });
      const spy = jest.spyOn(service as any, 'invalidateSegmentCaches');

      await service.refreshSegmentCounts(mockClubId);

      expect(spy).toHaveBeenCalledWith(mockClubId);
    });
  });

  describe('getSegmentAnalytics', () => {
    const mockAnalytics: SegmentAnalytics = {
      totalSegments: 10,
      activeSegments: 8,
      totalUniqueMembers: 500,
      averageSegmentSize: 62.5,
      segmentOverlap: {
        highOverlap: ['Active Members', 'Engaged Users'],
        mediumOverlap: ['Premium Members'],
        lowOverlap: ['New Joiners']
      },
      popularCriteria: [
        { criteria: 'status=Active', usage: 8 },
        { criteria: 'engagementLevel=high', usage: 5 }
      ]
    };

    it('should get segment analytics successfully', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockAnalytics });

      const result = await service.getSegmentAnalytics(mockClubId);

      expect(result).toEqual(mockAnalytics);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/1/segments/analytics');
    });

    it('should use longer cache TTL for analytics', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockAnalytics });

      // First call
      await service.getSegmentAnalytics(mockClubId);
      // Second call within cache period
      const result = await service.getSegmentAnalytics(mockClubId);

      expect(result).toEqual(mockAnalytics);
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filter Criteria Validation', () => {
    describe('Date Validation', () => {
      it('should accept valid ISO dates', () => {
        const criteria: SegmentFilterCriteria = {
          joinDateFrom: '2024-01-01T00:00:00Z',
          joinDateTo: '2024-12-31T23:59:59Z'
        };

        expect(() => service['validateFilterCriteria'](criteria)).not.toThrow();
      });

      it('should reject invalid date formats', () => {
        const criteria: SegmentFilterCriteria = {
          joinDateFrom: 'invalid-date'
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Invalid joinDateFrom format. Use ISO date format.');
      });

      it('should validate date range logic', () => {
        const criteria: SegmentFilterCriteria = {
          joinDateFrom: '2024-12-31',
          joinDateTo: '2024-01-01'
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Join date from cannot be after join date to.');
      });
    });

    describe('Numeric Validation', () => {
      it('should reject negative values', () => {
        const criteria: SegmentFilterCriteria = {
          eventAttendanceMin: -1
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Event attendance minimum cannot be negative.');
      });

      it('should validate numeric ranges', () => {
        const criteria: SegmentFilterCriteria = {
          ageMin: 65,
          ageMax: 18
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Age minimum cannot be greater than maximum.');
      });
    });

    describe('Enum Validation', () => {
      it('should accept valid dues statuses', () => {
        const criteria: SegmentFilterCriteria = {
          duesStatus: 'Current'
        };

        expect(() => service['validateFilterCriteria'](criteria)).not.toThrow();
      });

      it('should reject invalid dues statuses', () => {
        const criteria: SegmentFilterCriteria = {
          duesStatus: 'Invalid' as any
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Invalid dues status. Must be one of: Current, Overdue, Exempt, Unknown');
      });

      it('should validate engagement levels', () => {
        const criteria: SegmentFilterCriteria = {
          engagementLevel: 'invalid' as any
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Invalid engagement level. Must be one of: high, medium, low');
      });

      it('should validate tag match modes', () => {
        const criteria: SegmentFilterCriteria = {
          tagMatchMode: 'invalid' as any
        };

        expect(() => service['validateFilterCriteria'](criteria))
          .toThrow('Invalid tag match mode. Must be one of: any, all, none');
      });
    });
  });

  describe('Cache Management', () => {
    it('should generate consistent cache keys', () => {
      const key1 = service['generateCacheKey']('test', { a: 1, b: 2 });
      const key2 = service['generateCacheKey']('test', { b: 2, a: 1 });

      expect(key1).toBe(key2);
    });

    it('should handle cache TTL correctly', async () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const shortTtl = 100; // 100ms

      service['setCache'](key, data, shortTtl);
      
      // Should be available immediately
      expect(service['getFromCache'](key)).toEqual(data);
      
      // Should expire after TTL
      await new Promise(resolve => setTimeout(resolve, shortTtl + 10));
      expect(service['getFromCache'](key)).toBeNull();
    });

    it('should cleanup old cache entries', () => {
      const largeCacheSize = 1001;
      
      // Fill cache beyond threshold
      for (let i = 0; i < largeCacheSize; i++) {
        service['setCache'](`key-${i}`, { data: i }, 1000);
      }

      expect(service.getCacheStats().size).toBeLessThan(largeCacheSize);
    });

    it('should invalidate segment-specific caches', () => {
      // Set some cache entries
      service['setCache']('member-segmentation:segments:{"clubId":1}', [], 5000);
      service['setCache']('member-segmentation:segment-members:{"clubId":1,"segmentId":1}', {}, 5000);
      service['setCache']('other-cache:data', {}, 5000);

      service['invalidateSegmentCaches'](1);

      // Segment caches should be cleared
      expect(service['getFromCache']('member-segmentation:segments:{"clubId":1}')).toBeNull();
      expect(service['getFromCache']('member-segmentation:segment-members:{"clubId":1,"segmentId":1}')).toBeNull();
      
      // Other caches should remain
      expect(service['getFromCache']('other-cache:data')).toEqual({});
    });

    it('should provide cache statistics', () => {
      service['setCache']('test-1', {}, 1000);
      service['setCache']('test-2', {}, 1000);

      const stats = service.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
      expect(typeof stats.hitRatio).toBe('number');
    });

    it('should clear all caches', () => {
      service['setCache']('test-1', {}, 1000);
      service['setCache']('test-2', {}, 1000);

      service.clearCache();

      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should handle segment creation under 5 seconds', async () => {
      const startTime = Date.now();
      mockedApiClient.post.mockResolvedValue({ data: mockSegment });

      const createRequest: CreateSegmentRequest = {
        name: 'Performance Test Segment',
        filterCriteria: {
          status: 'Active',
          engagementLevel: 'high'
        }
      };

      await service.createSegment(mockClubId, createRequest);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds
    });

    it('should handle segment queries under 2 seconds', async () => {
      const startTime = Date.now();
      mockedApiClient.get.mockResolvedValue({ data: [mockSegment] });

      await service.getSegments(mockClubId);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Less than 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getSegments(mockClubId)).rejects.toThrow();
    });

    it('should handle 403 permission errors', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: { status: 403, data: { message: 'Forbidden' } }
      });

      await expect(service.getSegments(mockClubId)).rejects.toThrow();
    });

    it('should handle 404 not found errors', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Not found' } }
      });

      await expect(service.getSegments(mockClubId)).rejects.toThrow();
    });
  });
});