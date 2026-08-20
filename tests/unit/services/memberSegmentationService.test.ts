/**
 * Unit Tests for Member Segmentation Service
 * Test coverage for complex filtering, segment creation, and management
 */

import { memberSegmentationService } from '@/services/memberSegmentationService';
import { apiClient } from '@/services/apiClient';
import { 
  MemberSegment, 
  SegmentFilter, 
  FilterOperator, 
  FilterCondition,
  SegmentMember 
} from '@/types/memberSegmentation';

// Mock the API client
jest.mock('@/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('MemberSegmentationService', () => {
  const mockClubId = 'club-123';
  
  const mockSegmentFilter: SegmentFilter = {
    conditions: [
      {
        field: 'joinDate',
        operator: FilterOperator.GREATER_THAN,
        value: '2024-01-01',
        logicalOperator: 'AND'
      },
      {
        field: 'customField.emergencyContact',
        operator: FilterOperator.IS_NOT_EMPTY,
        value: '',
        logicalOperator: 'AND'
      }
    ],
    tagFilters: {
      includeTags: ['tag-1'],
      excludeTags: ['tag-2'],
      tagOperation: 'OR'
    }
  };

  const mockSegment: MemberSegment = {
    id: 'segment-1',
    clubId: mockClubId,
    segmentName: 'New VIP Members',
    filterCriteria: mockSegmentFilter,
    memberCount: 25,
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-02')
  };

  const mockSegmentMember: SegmentMember = {
    id: 'member-1',
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: new Date('2024-01-15'),
    tags: ['VIP'],
    customFields: {
      emergencyContact: 'Jane Doe'
    },
    matchedConditions: ['joinDate', 'customField.emergencyContact']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSegments', () => {
    it('should fetch all segments for a club', async () => {
      const mockSegments = [mockSegment];
      mockApiClient.get.mockResolvedValue({ data: mockSegments });

      const result = await memberSegmentationService.getSegments(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments`
      );
      expect(result).toEqual(mockSegments);
    });

    it('should handle empty segment list', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await memberSegmentationService.getSegments(mockClubId);

      expect(result).toEqual([]);
    });

    it('should include member counts when requested', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockSegment] });

      await memberSegmentationService.getSegments(mockClubId, true);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments?includeMemberCount=true`
      );
    });
  });

  describe('createSegment', () => {
    it('should create a new segment', async () => {
      const segmentData = {
        segmentName: 'Active Members',
        filterCriteria: mockSegmentFilter
      };

      mockApiClient.post.mockResolvedValue({ data: mockSegment });

      const result = await memberSegmentationService.createSegment(
        mockClubId,
        segmentData,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments`,
        {
          ...segmentData,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockSegment);
    });

    it('should validate segment name is required', async () => {
      const invalidData = {
        segmentName: '',
        filterCriteria: mockSegmentFilter
      };

      await expect(memberSegmentationService.createSegment(
        mockClubId,
        invalidData,
        'admin-1'
      )).rejects.toThrow('Segment name is required');
    });

    it('should validate segment name length', async () => {
      const longName = 'a'.repeat(101);
      const invalidData = {
        segmentName: longName,
        filterCriteria: mockSegmentFilter
      };

      await expect(memberSegmentationService.createSegment(
        mockClubId,
        invalidData,
        'admin-1'
      )).rejects.toThrow('Segment name must be 100 characters or less');
    });

    it('should validate filter criteria has conditions', async () => {
      const invalidData = {
        segmentName: 'Test Segment',
        filterCriteria: {
          conditions: [],
          tagFilters: undefined
        }
      };

      await expect(memberSegmentationService.createSegment(
        mockClubId,
        invalidData,
        'admin-1'
      )).rejects.toThrow('Segment must have at least one filter condition or tag filter');
    });

    it('should handle duplicate segment name error', async () => {
      const segmentData = {
        segmentName: 'Existing Segment',
        filterCriteria: mockSegmentFilter
      };

      mockApiClient.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Segment name already exists' } }
      });

      await expect(memberSegmentationService.createSegment(
        mockClubId,
        segmentData,
        'admin-1'
      )).rejects.toThrow('Segment name already exists');
    });
  });

  describe('updateSegment', () => {
    it('should update an existing segment', async () => {
      const updateData = {
        segmentName: 'Updated Active Members',
        filterCriteria: mockSegmentFilter
      };

      const updatedSegment = { ...mockSegment, ...updateData };
      mockApiClient.put.mockResolvedValue({ data: updatedSegment });

      const result = await memberSegmentationService.updateSegment(
        mockClubId,
        mockSegment.id,
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}`,
        updateData
      );
      expect(result).toEqual(updatedSegment);
    });

    it('should handle segment not found error', async () => {
      mockApiClient.put.mockRejectedValue({
        response: { status: 404, data: { message: 'Segment not found' } }
      });

      await expect(memberSegmentationService.updateSegment(
        mockClubId,
        'invalid-id',
        {}
      )).rejects.toThrow('Segment not found');
    });
  });

  describe('deleteSegment', () => {
    it('should delete a segment', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await memberSegmentationService.deleteSegment(mockClubId, mockSegment.id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}`
      );
    });
  });

  describe('getSegmentMembers', () => {
    it('should fetch members matching segment criteria', async () => {
      const mockMembers = [mockSegmentMember];
      mockApiClient.get.mockResolvedValue({ 
        data: { 
          members: mockMembers, 
          totalCount: 1,
          appliedAt: new Date('2024-01-01')
        } 
      });

      const result = await memberSegmentationService.getSegmentMembers(
        mockClubId,
        mockSegment.id
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/members`
      );
      expect(result.members).toEqual(mockMembers);
      expect(result.totalCount).toBe(1);
    });

    it('should support pagination for large segments', async () => {
      const mockMembers = Array.from({ length: 20 }, (_, i) => ({
        ...mockSegmentMember,
        id: `member-${i}`,
        name: `Member ${i}`
      }));

      mockApiClient.get.mockResolvedValue({ 
        data: { 
          members: mockMembers, 
          totalCount: 500,
          page: 1,
          pageSize: 20
        } 
      });

      const result = await memberSegmentationService.getSegmentMembers(
        mockClubId,
        mockSegment.id,
        { page: 1, pageSize: 20 }
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/members?page=1&pageSize=20`
      );
      expect(result.totalCount).toBe(500);
    });

    it('should support member search within segment', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: { 
          members: [mockSegmentMember], 
          totalCount: 1
        } 
      });

      await memberSegmentationService.getSegmentMembers(
        mockClubId,
        mockSegment.id,
        { search: 'john' }
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/members?search=john`
      );
    });
  });

  describe('previewSegment', () => {
    it('should preview members matching filter criteria without saving', async () => {
      const mockPreview = {
        members: [mockSegmentMember],
        totalCount: 1,
        sampleSize: 100,
        filterBreakdown: {
          'joinDate': 150,
          'customField.emergencyContact': 120,
          'tags': 80
        }
      };

      mockApiClient.post.mockResolvedValue({ data: mockPreview });

      const result = await memberSegmentationService.previewSegment(
        mockClubId,
        mockSegmentFilter
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/preview`,
        { filterCriteria: mockSegmentFilter }
      );
      expect(result).toEqual(mockPreview);
    });

    it('should handle preview with custom sample size', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          members: [], 
          totalCount: 0, 
          sampleSize: 50 
        } 
      });

      await memberSegmentationService.previewSegment(
        mockClubId,
        mockSegmentFilter,
        { sampleSize: 50 }
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/preview`,
        { 
          filterCriteria: mockSegmentFilter,
          sampleSize: 50
        }
      );
    });
  });

  describe('validateFilterCondition', () => {
    it('should validate basic field conditions', () => {
      const validCondition: FilterCondition = {
        field: 'email',
        operator: FilterOperator.CONTAINS,
        value: '@gmail.com'
      };

      expect(() => memberSegmentationService.validateFilterCondition(validCondition))
        .not.toThrow();
    });

    it('should validate date field conditions', () => {
      const validDateCondition: FilterCondition = {
        field: 'joinDate',
        operator: FilterOperator.GREATER_THAN,
        value: '2024-01-01'
      };

      expect(() => memberSegmentationService.validateFilterCondition(validDateCondition))
        .not.toThrow();

      const invalidDateCondition: FilterCondition = {
        field: 'joinDate',
        operator: FilterOperator.GREATER_THAN,
        value: 'invalid-date'
      };

      expect(() => memberSegmentationService.validateFilterCondition(invalidDateCondition))
        .toThrow('Invalid date format');
    });

    it('should validate number field conditions', () => {
      const validNumberCondition: FilterCondition = {
        field: 'age',
        operator: FilterOperator.LESS_THAN,
        value: '30'
      };

      expect(() => memberSegmentationService.validateFilterCondition(validNumberCondition))
        .not.toThrow();

      const invalidNumberCondition: FilterCondition = {
        field: 'age',
        operator: FilterOperator.LESS_THAN,
        value: 'not-a-number'
      };

      expect(() => memberSegmentationService.validateFilterCondition(invalidNumberCondition))
        .toThrow('Invalid number format');
    });

    it('should validate custom field conditions', () => {
      const validCustomFieldCondition: FilterCondition = {
        field: 'customField.emergencyContact',
        operator: FilterOperator.IS_NOT_EMPTY,
        value: ''
      };

      expect(() => memberSegmentationService.validateFilterCondition(validCustomFieldCondition))
        .not.toThrow();
    });

    it('should validate engagement field conditions', () => {
      const validEngagementCondition: FilterCondition = {
        field: 'engagement.eventAttendance',
        operator: FilterOperator.GREATER_THAN,
        value: '5'
      };

      expect(() => memberSegmentationService.validateFilterCondition(validEngagementCondition))
        .not.toThrow();
    });

    it('should reject empty field names', () => {
      const invalidCondition: FilterCondition = {
        field: '',
        operator: FilterOperator.EQUALS,
        value: 'test'
      };

      expect(() => memberSegmentationService.validateFilterCondition(invalidCondition))
        .toThrow('Field name is required');
    });

    it('should reject invalid operators for field types', () => {
      const invalidCondition: FilterCondition = {
        field: 'joinDate',
        operator: FilterOperator.CONTAINS, // Invalid for date fields
        value: '2024-01-01'
      };

      expect(() => memberSegmentationService.validateFilterCondition(invalidCondition))
        .toThrow('Invalid operator for date field');
    });
  });

  describe('buildFilterQuery', () => {
    it('should build SQL-like query from filter conditions', () => {
      const filter: SegmentFilter = {
        conditions: [
          {
            field: 'name',
            operator: FilterOperator.CONTAINS,
            value: 'John',
            logicalOperator: 'AND'
          },
          {
            field: 'joinDate',
            operator: FilterOperator.GREATER_THAN,
            value: '2024-01-01',
            logicalOperator: 'AND'
          }
        ]
      };

      const query = memberSegmentationService.buildFilterQuery(filter);

      expect(query).toContain("name LIKE '%John%'");
      expect(query).toContain("joinDate > '2024-01-01'");
      expect(query).toContain('AND');
    });

    it('should handle OR conditions', () => {
      const filter: SegmentFilter = {
        conditions: [
          {
            field: 'name',
            operator: FilterOperator.EQUALS,
            value: 'John',
            logicalOperator: 'OR'
          },
          {
            field: 'name',
            operator: FilterOperator.EQUALS,
            value: 'Jane'
          }
        ]
      };

      const query = memberSegmentationService.buildFilterQuery(filter);

      expect(query).toContain("name = 'John'");
      expect(query).toContain("name = 'Jane'");
      expect(query).toContain('OR');
    });

    it('should handle nested conditions with parentheses', () => {
      const filter: SegmentFilter = {
        conditions: [
          {
            field: 'name',
            operator: FilterOperator.EQUALS,
            value: 'John',
            logicalOperator: 'AND',
            group: 'group1'
          },
          {
            field: 'age',
            operator: FilterOperator.GREATER_THAN,
            value: '25',
            logicalOperator: 'OR',
            group: 'group1'
          },
          {
            field: 'city',
            operator: FilterOperator.EQUALS,
            value: 'Seattle',
            logicalOperator: 'AND',
            group: 'group2'
          }
        ]
      };

      const query = memberSegmentationService.buildFilterQuery(filter);

      expect(query).toContain('(');
      expect(query).toContain(')');
    });

    it('should include tag filters', () => {
      const filter: SegmentFilter = {
        conditions: [],
        tagFilters: {
          includeTags: ['VIP', 'Active'],
          excludeTags: ['Inactive'],
          tagOperation: 'AND'
        }
      };

      const query = memberSegmentationService.buildFilterQuery(filter);

      expect(query).toContain('tags');
      expect(query).toContain('VIP');
      expect(query).toContain('Active');
      expect(query).toContain('NOT IN');
      expect(query).toContain('Inactive');
    });
  });

  describe('getSegmentStats', () => {
    it('should return segment usage statistics', async () => {
      const mockStats = {
        totalSegments: 10,
        activeSegments: 8,
        averageMembersPerSegment: 45.6,
        segmentSizes: {
          small: 6,  // < 50 members
          medium: 3, // 50-200 members
          large: 1   // > 200 members
        },
        mostUsedFilters: [
          { field: 'joinDate', usage: 8 },
          { field: 'tags', usage: 6 },
          { field: 'customField.emergencyContact', usage: 4 }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await memberSegmentationService.getSegmentStats(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/stats`
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('refreshSegmentCounts', () => {
    it('should recalculate member counts for all segments', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: true, 
          updatedSegments: 5,
          totalMembersProcessed: 1200
        } 
      });

      const result = await memberSegmentationService.refreshSegmentCounts(mockClubId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/refresh-counts`
      );
      expect(result.updatedSegments).toBe(5);
    });

    it('should refresh count for specific segment', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: true, 
          updatedCount: 25
        } 
      });

      const result = await memberSegmentationService.refreshSegmentCounts(
        mockClubId, 
        mockSegment.id
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/refresh-count`
      );
      expect(result.updatedCount).toBe(25);
    });
  });

  describe('exportSegmentData', () => {
    it('should export segment member data', async () => {
      const mockExportData = {
        segment: mockSegment,
        members: [mockSegmentMember],
        exportedAt: new Date('2024-01-01'),
        format: 'csv'
      };

      mockApiClient.post.mockResolvedValue({ data: mockExportData });

      const result = await memberSegmentationService.exportSegmentData(
        mockClubId,
        mockSegment.id,
        { format: 'csv', includeCustomFields: true }
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/export`,
        { format: 'csv', includeCustomFields: true }
      );
      expect(result).toEqual(mockExportData);
    });

    it('should support different export formats', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} });

      await memberSegmentationService.exportSegmentData(
        mockClubId,
        mockSegment.id,
        { format: 'json' }
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/export`,
        { format: 'json' }
      );
    });
  });

  describe('duplicateSegment', () => {
    it('should create a copy of an existing segment', async () => {
      const duplicatedSegment = {
        ...mockSegment,
        id: 'segment-2',
        segmentName: 'Copy of New VIP Members'
      };

      mockApiClient.post.mockResolvedValue({ data: duplicatedSegment });

      const result = await memberSegmentationService.duplicateSegment(
        mockClubId,
        mockSegment.id,
        'admin-1',
        'Copy of New VIP Members'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-segments/${mockSegment.id}/duplicate`,
        {
          newName: 'Copy of New VIP Members',
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(duplicatedSegment);
    });
  });
});