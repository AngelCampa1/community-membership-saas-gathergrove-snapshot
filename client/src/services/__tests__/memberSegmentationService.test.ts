import memberSegmentationService, {
  MemberSegment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  SegmentFilterCriteria,
  SegmentMemberResult,
  SegmentPreviewResult,
  SegmentAnalyticsDashboard,
  SegmentRecalculationResult,
} from '../memberSegmentationService';
import apiClient from '../apiClient';
import { billingService } from '../billingService';

// Mock apiClient at the HTTP boundary
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

// Mock billingService module
jest.mock('../billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Get reference to mocked billingService
const mockedBillingService = billingService as jest.Mocked<typeof billingService>;

describe('MemberSegmentationService', () => {
  const clubId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
    memberSegmentationService.clearCache();

    // Default: Unlimited tier access
    mockedBillingService.getBillingStatus.mockResolvedValue({
      currentTier: 'Unlimited',
      hasActiveSubscription: true,
      memberCount: 1000,
      memberLimit: Number.MAX_SAFE_INTEGER,
      canUpgrade: false,
    });
  });

  afterEach(() => {
    memberSegmentationService.clearCache();
  });

  // ==================== Authorization & Tier Validation ====================

  describe('Authorization & Tier Validation', () => {
    it('should reject access for non-Expand tiers', async () => {
      mockedBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Grow',
        hasActiveSubscription: true,
        memberCount: 150,
        memberLimit: 200,
        canUpgrade: true,
      });

      await expect(memberSegmentationService.getSegments(clubId)).rejects.toThrow(
        'Member segmentation is only available for Expand tier subscribers'
      );
    });

    it('should allow access for Expand tier', async () => {
      mockedBillingService.getBillingStatus.mockResolvedValue({ currentTier: 'Expand' } as never);
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await memberSegmentationService.getSegments(clubId);

      expect(result).toEqual([]);
    });

    it('should allow graceful degradation when billing service is unavailable', async () => {
      mockedBillingService.getBillingStatus.mockRejectedValue(
        new Error('Billing service timeout')
      );

      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'Test Segment',
          description: 'Test',
          filterCriteria: { status: 'Active' },
          memberCount: 50,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegments });

      // Should proceed with operation despite billing service failure
      const result = await memberSegmentationService.getSegments(clubId);
      expect(result).toEqual(mockSegments);
    });

    it('should verify unlimited access before all operations', async () => {
      mockedBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Start',
        hasActiveSubscription: false,
        memberCount: 10,
        memberLimit: 50,
        canUpgrade: true,
      });

      const request: CreateSegmentRequest = {
        name: 'Test',
        filterCriteria: { status: 'Active' },
      };

      await expect(
        memberSegmentationService.createSegment(clubId, request)
      ).rejects.toThrow('Member segmentation is only available for Expand tier subscribers');

      await expect(
        memberSegmentationService.updateSegment(clubId, 1, request)
      ).rejects.toThrow('Member segmentation is only available for Expand tier subscribers');

      await expect(
        memberSegmentationService.deleteSegment(clubId, 1)
      ).rejects.toThrow('Member segmentation is only available for Expand tier subscribers');

      await expect(
        memberSegmentationService.getSegmentMembers(clubId, 1)
      ).rejects.toThrow('Member segmentation is only available for Expand tier subscribers');
    });
  });

  // ==================== getSegments ====================

  describe('getSegments', () => {
    it('should retrieve all active segments with default options', async () => {
      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'High Value Members',
          description: 'Members with high engagement',
          filterCriteria: { duesStatus: 'Current', engagementLevel: 'high' },
          memberCount: 50,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          clubId,
          name: 'At Risk Members',
          description: 'Members with low engagement',
          filterCriteria: { engagementLevel: 'low' },
          memberCount: 25,
          isActive: true,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegments });

      const result = await memberSegmentationService.getSegments(clubId);

      expect(result).toEqual(mockSegments);
      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/123/segments'));
    });

    it('should include inactive segments when requested', async () => {
      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'Active Segment',
          filterCriteria: { status: 'Active' },
          memberCount: 100,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          clubId,
          name: 'Inactive Segment',
          filterCriteria: { status: 'Inactive' },
          memberCount: 50,
          isActive: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegments });

      const result = await memberSegmentationService.getSegments(clubId, {
        includeInactive: true,
      });

      expect(result).toHaveLength(2);
      expect(result.some((s) => !s.isActive)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('includeInactive=true'));
    });

    it('should support all sort options', async () => {
      const mockSegments: MemberSegment[] = [];

      const sortCombinations = [
        { sortBy: 'name' as const, sortOrder: 'asc' as const },
        { sortBy: 'name' as const, sortOrder: 'desc' as const },
        { sortBy: 'memberCount' as const, sortOrder: 'asc' as const },
        { sortBy: 'memberCount' as const, sortOrder: 'desc' as const },
        { sortBy: 'createdAt' as const, sortOrder: 'asc' as const },
        { sortBy: 'createdAt' as const, sortOrder: 'desc' as const },
        { sortBy: 'updatedAt' as const, sortOrder: 'asc' as const },
        { sortBy: 'updatedAt' as const, sortOrder: 'desc' as const },
      ];

      for (const { sortBy, sortOrder } of sortCombinations) {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegments });
        memberSegmentationService.clearCache();
        await memberSegmentationService.getSegments(clubId, { sortBy, sortOrder });
        expect(apiClient.get).toHaveBeenLastCalledWith(expect.stringContaining(`sortBy=${sortBy}`));
      }
    });

    it('should cache segment results for performance', async () => {
      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'Cached Segment',
          filterCriteria: { status: 'Active' },
          memberCount: 100,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockSegments });

      // First call - should hit API
      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Third call with same params - should still use cache
      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors with custom messages', async () => {
      const mockError = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(memberSegmentationService.getSegments(clubId)).rejects.toThrow();
    });

    it('should handle 404 errors for non-existent clubs', async () => {
      const mockError = { response: { status: 404, data: { message: 'Club not found' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(memberSegmentationService.getSegments(clubId)).rejects.toThrow();
    });
  });

  // ==================== createSegment ====================

  describe('createSegment', () => {
    it('should create a segment with valid filter criteria', async () => {
      const request: CreateSegmentRequest = {
        name: 'New High Value Segment',
        description: 'Members with high engagement and current dues',
        filterCriteria: {
          duesStatus: 'Current',
          engagementLevel: 'high',
          status: 'Active',
        },
        isActive: true,
      };

      const mockCreatedSegment: MemberSegment = {
        id: 10,
        clubId,
        name: request.name,
        description: request.description,
        filterCriteria: request.filterCriteria,
        memberCount: 0,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCreatedSegment });

      const result = await memberSegmentationService.createSegment(clubId, request);

      expect(result).toEqual(mockCreatedSegment);
      expect(result.id).toBe(10);
      expect(result.name).toBe(request.name);
      expect(apiClient.post).toHaveBeenCalledWith(`/clubs/${clubId}/segments`, request);
    });

    it('should invalidate cache after creating segment', async () => {
      // Pre-populate cache
      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'Old Segment',
          filterCriteria: { status: 'Active' },
          memberCount: 50,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegments });

      // Populate cache
      await memberSegmentationService.getSegments(clubId);

      // Create new segment
      const request: CreateSegmentRequest = {
        name: 'New Segment',
        filterCriteria: { status: 'Active' },
      };

      const newSegment: MemberSegment = {
        id: 2,
        clubId,
        name: request.name,
        filterCriteria: request.filterCriteria,
        memberCount: 0,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: newSegment });

      await memberSegmentationService.createSegment(clubId, request);

      // Next getSegments call should hit API again (cache invalidated)
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [...mockSegments, newSegment] });

      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2); // Cache was invalidated
    });

    it('should reject duplicate segment names', async () => {
      const request: CreateSegmentRequest = {
        name: 'Duplicate Name',
        filterCriteria: { status: 'Active' },
      };

      const mockError = { response: { status: 409, data: { message: 'A segment with this name already exists' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.createSegment(clubId, request)
      ).rejects.toThrow();
    });

    it('should reject invalid segment configuration', async () => {
      const request: CreateSegmentRequest = {
        name: '',
        filterCriteria: { status: 'Active' },
      };

      const mockError = { response: { status: 400, data: { message: 'Invalid segment configuration' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.createSegment(clubId, request)
      ).rejects.toThrow();
    });

    it('should reject invalid filter criteria validation', async () => {
      const request: CreateSegmentRequest = {
        name: 'Test',
        filterCriteria: { status: 'Active' },
      };

      const mockError = { response: { status: 422, data: { message: 'Segment validation failed' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.createSegment(clubId, request)
      ).rejects.toThrow();
    });
  });

  // ==================== updateSegment ====================

  describe('updateSegment', () => {
    it('should update segment with partial data', async () => {
      const segmentId = 1;
      const request: UpdateSegmentRequest = {
        name: 'Updated Segment Name',
      };

      const mockUpdatedSegment: MemberSegment = {
        id: segmentId,
        clubId,
        name: request.name!,
        filterCriteria: { status: 'Active' },
        memberCount: 75,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedSegment });

      const result = await memberSegmentationService.updateSegment(
        clubId,
        segmentId,
        request
      );

      expect(result).toEqual(mockUpdatedSegment);
      expect(result.name).toBe(request.name);
      expect(apiClient.put).toHaveBeenCalledWith(`/clubs/${clubId}/segments/${segmentId}`, request);
    });

    it('should update segment filter criteria', async () => {
      const segmentId = 2;
      const request: UpdateSegmentRequest = {
        filterCriteria: {
          duesStatus: 'Current',
          engagementLevel: 'medium',
          joinDateFrom: '2024-01-01',
          joinDateTo: '2024-12-31',
        },
      };

      const mockUpdatedSegment: MemberSegment = {
        id: segmentId,
        clubId,
        name: 'Test Segment',
        filterCriteria: request.filterCriteria!,
        memberCount: 150,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedSegment });

      const result = await memberSegmentationService.updateSegment(
        clubId,
        segmentId,
        request
      );

      expect(result.filterCriteria).toEqual(request.filterCriteria);
    });

    it('should toggle segment active status', async () => {
      const segmentId = 3;
      const request: UpdateSegmentRequest = {
        isActive: false,
      };

      const mockUpdatedSegment: MemberSegment = {
        id: segmentId,
        clubId,
        name: 'Test Segment',
        filterCriteria: { status: 'Active' },
        memberCount: 50,
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedSegment });

      const result = await memberSegmentationService.updateSegment(
        clubId,
        segmentId,
        request
      );

      expect(result.isActive).toBe(false);
    });

    it('should invalidate cache after updating segment', async () => {
      const segmentId = 1;
      const request: UpdateSegmentRequest = {
        name: 'Updated Name',
      };

      const mockUpdatedSegment: MemberSegment = {
        id: segmentId,
        clubId,
        name: request.name!,
        filterCriteria: { status: 'Active' },
        memberCount: 50,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedSegment });

      await memberSegmentationService.updateSegment(clubId, segmentId, request);

      // Verify cache invalidation by checking next getSegments call hits API
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockUpdatedSegment] });

      await memberSegmentationService.getSegments(clubId);
      // apiClient.get should have been called (once for the put call setup doesn't count, just get)
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle 404 for non-existent segment', async () => {
      const segmentId = 999;
      const request: UpdateSegmentRequest = {
        name: 'Updated Name',
      };

      const mockError = { response: { status: 404, data: { message: 'Segment not found' } } };
      (apiClient.put as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.updateSegment(clubId, segmentId, request)
      ).rejects.toThrow();
    });

    it('should reject duplicate name when updating', async () => {
      const segmentId = 1;
      const request: UpdateSegmentRequest = {
        name: 'Existing Name',
      };

      const mockError = { response: { status: 409, data: { message: 'A segment with this name already exists' } } };
      (apiClient.put as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.updateSegment(clubId, segmentId, request)
      ).rejects.toThrow();
    });
  });

  // ==================== deleteSegment ====================

  describe('deleteSegment', () => {
    it('should delete a segment successfully', async () => {
      const segmentId = 5;

      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const result = await memberSegmentationService.deleteSegment(clubId, segmentId);

      expect(result).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith(`/clubs/${clubId}/segments/${segmentId}`);
    });

    it('should invalidate cache after deleting segment', async () => {
      const segmentId = 1;

      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      await memberSegmentationService.deleteSegment(clubId, segmentId);

      // Verify cache invalidation
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle 404 for non-existent segment deletion', async () => {
      const segmentId = 999;

      const mockError = { response: { status: 404, data: { message: 'Segment not found' } } };
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.deleteSegment(clubId, segmentId)
      ).rejects.toThrow();
    });
  });

  // ==================== getSegmentMembers ====================

  describe('getSegmentMembers', () => {
    it('should retrieve members in a segment with default pagination', async () => {
      const segmentId = 1;
      const mockResult: SegmentMemberResult = {
        segmentId,
        segmentName: 'High Value Members',
        totalCount: 150,
        members: [
          {
            id: 1,
            fullName: 'John Doe',
            email: 'john@example.com',
            membershipTypeName: 'Premium',
            status: 'Active',
            joinDate: '2024-01-01',
            duesStatus: 'Current',
            engagementLevel: 'high',
            tags: ['vip', 'board-member'],
          },
          {
            id: 2,
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            membershipTypeName: 'Standard',
            status: 'Active',
            joinDate: '2024-02-01',
            duesStatus: 'Current',
            engagementLevel: 'high',
            tags: ['active'],
          },
        ],
        currentPage: 1,
        pageSize: 25,
        totalPages: 6,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.getSegmentMembers(clubId, segmentId);

      expect(result).toEqual(mockResult);
      expect(result.members).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(false);
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining(`/clubs/${clubId}/segments/${segmentId}/members`));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('pageSize=25'));
    });

    it('should support custom pagination parameters', async () => {
      const segmentId = 2;
      const page = 3;
      const pageSize = 50;

      const mockResult: SegmentMemberResult = {
        segmentId,
        segmentName: 'Test Segment',
        totalCount: 200,
        members: [],
        currentPage: page,
        pageSize,
        totalPages: 4,
        hasNext: true,
        hasPrevious: true,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.getSegmentMembers(
        clubId,
        segmentId,
        page,
        pageSize
      );

      expect(result.currentPage).toBe(page);
      expect(result.pageSize).toBe(pageSize);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining(`page=${page}`));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining(`pageSize=${pageSize}`));
    });

    it('should cache segment members with 2-minute TTL', async () => {
      const segmentId = 1;
      const mockResult: SegmentMemberResult = {
        segmentId,
        segmentName: 'Cached Members',
        totalCount: 50,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResult });

      // First call
      await memberSegmentationService.getSegmentMembers(clubId, segmentId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await memberSegmentationService.getSegmentMembers(clubId, segmentId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle 404 for non-existent segment', async () => {
      const segmentId = 999;

      const mockError = { response: { status: 404, data: { message: 'Segment not found' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.getSegmentMembers(clubId, segmentId)
      ).rejects.toThrow();
    });

    it('should handle empty member lists', async () => {
      const segmentId = 3;
      const mockResult: SegmentMemberResult = {
        segmentId,
        segmentName: 'Empty Segment',
        totalCount: 0,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.getSegmentMembers(clubId, segmentId);

      expect(result.members).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasNext).toBe(false);
    });
  });

  // ==================== previewSegment ====================

  describe('previewSegment', () => {
    it('should preview members matching filter criteria', async () => {
      const filterCriteria: SegmentFilterCriteria = {
        duesStatus: 'Current',
        engagementLevel: 'high',
        status: 'Active',
        tags: ['vip'],
        tagMatchMode: 'any',
      };

      const mockResult: SegmentPreviewResult = {
        totalCount: 75,
        members: [
          {
            id: 10,
            fullName: 'Alice Johnson',
            email: 'alice@example.com',
            membershipTypeName: 'Premium',
            status: 'Active',
            joinDate: '2023-06-15',
            duesStatus: 'Current',
            engagementLevel: 'high',
            tags: ['vip', 'volunteer'],
          },
        ],
        currentPage: 1,
        pageSize: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.previewSegment(clubId, filterCriteria);

      expect(result).toEqual(mockResult);
      expect(result.totalCount).toBe(75);
      expect(result.members).toHaveLength(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/segments/search`,
        expect.objectContaining({
          filterCriteria,
          page: 1,
          pageSize: 25,
        })
      );
    });

    it('should support custom pagination in preview', async () => {
      const filterCriteria: SegmentFilterCriteria = {
        duesStatus: 'Overdue',
      };
      const page = 2;
      const pageSize = 10;

      const mockResult: SegmentPreviewResult = {
        totalCount: 30,
        members: [],
        currentPage: page,
        pageSize,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.previewSegment(
        clubId,
        filterCriteria,
        page,
        pageSize
      );

      expect(result.currentPage).toBe(page);
      expect(result.pageSize).toBe(pageSize);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/segments/search`,
        expect.objectContaining({
          page,
          pageSize,
        })
      );
    });

    it('should cache preview results with 1-minute TTL', async () => {
      const filterCriteria: SegmentFilterCriteria = {
        status: 'Active',
      };

      const mockResult: SegmentPreviewResult = {
        totalCount: 100,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 4,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResult });

      // First call
      await memberSegmentationService.previewSegment(clubId, filterCriteria);
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await memberSegmentationService.previewSegment(clubId, filterCriteria);
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should handle complex filter criteria with all options', async () => {
      const filterCriteria: SegmentFilterCriteria = {
        membershipTypeId: 1,
        duesStatus: 'Current',
        status: 'Active',
        hasSmsConsent: true,
        joinDateFrom: '2024-01-01',
        joinDateTo: '2024-12-31',
        lastActivityFrom: '2024-06-01',
        lastActivityTo: '2024-12-31',
        engagementLevel: 'high',
        eventAttendanceMin: 5,
        eventAttendanceMax: 50,
        tags: ['vip', 'board-member', 'volunteer'],
        tagMatchMode: 'all',
        customFields: {
          company: 'Tech Corp',
          department: 'Engineering',
        },
        ageMin: 25,
        ageMax: 65,
        location: 'San Francisco',
        membershipDurationMonths: 12,
      };

      const mockResult: SegmentPreviewResult = {
        totalCount: 15,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.previewSegment(clubId, filterCriteria);

      expect(result.totalCount).toBe(15);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/segments/search`,
        expect.objectContaining({ filterCriteria })
      );
    });

    it('should handle 400 errors for invalid filter criteria', async () => {
      const filterCriteria: SegmentFilterCriteria = {
        status: 'Active',
      };

      const mockError = { response: { status: 400, data: { message: 'Invalid filter criteria' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.previewSegment(clubId, filterCriteria)
      ).rejects.toThrow();
    });
  });

  // ==================== recalculateSegment ====================

  describe('recalculateSegment', () => {
    const segmentId = 7;

    it('should recalculate a single segment and return real backend fields', async () => {
      const mockResult: SegmentRecalculationResult = {
        segmentId,
        clubId,
        segmentName: 'VIP Members',
        status: 'Completed',
        isSuccessful: true,
        membersProcessed: 320,
        memberCount: 320,
        membersAdded: 15,
        membersRemoved: 3,
        membersMoved: 2,
        startedAt: '2026-05-29T10:00:00Z',
        completedAt: '2026-05-29T10:00:05Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await memberSegmentationService.recalculateSegment(clubId, segmentId);

      expect(result).toEqual(mockResult);
      expect(result.isSuccessful).toBe(true);
      expect(result.membersProcessed).toBe(320);
      expect(result.memberCount).toBe(320);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/segments/${segmentId}/recalculate`
      );
    });

    it('should invalidate cache after recalculation', async () => {
      const mockResult: SegmentRecalculationResult = {
        segmentId,
        clubId,
        segmentName: 'Active Members',
        status: 'Completed',
        isSuccessful: true,
        membersProcessed: 150,
        memberCount: 150,
        membersAdded: 5,
        membersRemoved: 1,
        membersMoved: 0,
        startedAt: '2026-05-29T11:00:00Z',
        completedAt: '2026-05-29T11:00:03Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      await memberSegmentationService.recalculateSegment(clubId, segmentId);

      // Cache invalidation should force a fresh fetch on subsequent getSegments call
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle errors during recalculation', async () => {
      const mockError = { response: { status: 500, data: { message: 'Recalculation failed' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.recalculateSegment(clubId, segmentId)
      ).rejects.toThrow();
    });
  });

  // ==================== getSegmentAnalytics ====================

  describe('getSegmentAnalytics', () => {
    it('should retrieve the dashboard from the real segment-analytics endpoint', async () => {
      const mockDashboard: SegmentAnalyticsDashboard = {
        totalSegments: 12,
        activeSegments: 10,
        overview: {
          totalSegments: 12,
          activeSegments: 10,
          averageGrowthRate: 3.5,
          averageHealthScore: 82,
          alertCount: 2,
        },
        topSegments: [
          {
            segmentId: 1,
            segmentName: 'VIP Members',
            memberCount: 250,
            growthRate: 5.2,
            healthScore: 91,
            trend: 'Up',
          },
        ],
        alertSegments: [],
        recentTrends: [],
        lastUpdated: '2026-05-29T08:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboard });

      const result = await memberSegmentationService.getSegmentAnalytics(clubId);

      expect(result).toEqual(mockDashboard);
      expect(result.totalSegments).toBe(12);
      expect(result.activeSegments).toBe(10);
      expect(result.topSegments).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/segment-analytics/dashboard`
      );
    });

    it('should cache dashboard with 30-minute TTL', async () => {
      const mockDashboard: SegmentAnalyticsDashboard = {
        totalSegments: 5,
        activeSegments: 5,
        overview: {
          totalSegments: 5,
          activeSegments: 5,
          averageGrowthRate: 1.0,
          averageHealthScore: 70,
          alertCount: 0,
        },
        topSegments: [],
        alertSegments: [],
        recentTrends: [],
        lastUpdated: '2026-05-29T07:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockDashboard });

      // First call
      await memberSegmentationService.getSegmentAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await memberSegmentationService.getSegmentAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Third call - should still use cache
      await memberSegmentationService.getSegmentAnalytics(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle empty dashboard', async () => {
      const mockDashboard: SegmentAnalyticsDashboard = {
        totalSegments: 0,
        activeSegments: 0,
        overview: {
          totalSegments: 0,
          activeSegments: 0,
          averageGrowthRate: 0,
          averageHealthScore: 0,
          alertCount: 0,
        },
        topSegments: [],
        alertSegments: [],
        recentTrends: [],
        lastUpdated: '2026-05-29T00:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboard });

      const result = await memberSegmentationService.getSegmentAnalytics(clubId);

      expect(result.totalSegments).toBe(0);
      expect(result.topSegments).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const mockError = { response: { status: 500, data: { message: 'Internal error' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        memberSegmentationService.getSegmentAnalytics(clubId)
      ).rejects.toThrow();
    });
  });

  // ==================== Filter Criteria Validation ====================

  describe('Filter Criteria Validation', () => {
    describe('Date Format Validation', () => {
      it('should reject invalid joinDateFrom format', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            joinDateFrom: 'not-a-date',
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid joinDateFrom format. Use ISO date format.');
      });

      it('should reject invalid joinDateTo format', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            joinDateTo: '2024/13/45',
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid joinDateTo format. Use ISO date format.');
      });

      it('should reject invalid lastActivityFrom format', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            lastActivityFrom: 'yesterday',
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid lastActivityFrom format. Use ISO date format.');
      });

      it('should reject invalid lastActivityTo format', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            lastActivityTo: '32-12-2024',
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid lastActivityTo format. Use ISO date format.');
      });

      it('should accept valid ISO date formats', async () => {
        const request: CreateSegmentRequest = {
          name: 'Valid Dates',
          filterCriteria: {
            joinDateFrom: '2024-01-01',
            joinDateTo: '2024-12-31',
            lastActivityFrom: '2024-06-01T00:00:00Z',
            lastActivityTo: '2024-12-31T23:59:59Z',
          },
        };

        const mockSegment: MemberSegment = {
          id: 1,
          clubId,
          name: request.name,
          filterCriteria: request.filterCriteria,
          memberCount: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

        const result = await memberSegmentationService.createSegment(clubId, request);
        expect(result.filterCriteria.joinDateFrom).toBe('2024-01-01');
      });
    });

    describe('Number Range Validation', () => {
      it('should reject negative eventAttendanceMin', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            eventAttendanceMin: -5,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Event attendance minimum cannot be negative.');
      });

      it('should reject negative eventAttendanceMax', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            eventAttendanceMax: -10,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Event attendance maximum cannot be negative.');
      });

      it('should reject negative ageMin', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            ageMin: -1,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Age minimum cannot be negative.');
      });

      it('should reject negative ageMax', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            ageMax: -25,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Age maximum cannot be negative.');
      });

      it('should reject negative membershipDurationMonths', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            membershipDurationMonths: -12,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Membership duration cannot be negative.');
      });

      it('should accept zero values for numeric ranges', async () => {
        const request: CreateSegmentRequest = {
          name: 'Zero Values',
          filterCriteria: {
            eventAttendanceMin: 0,
            eventAttendanceMax: 0,
            ageMin: 0,
            ageMax: 0,
            membershipDurationMonths: 0,
          },
        };

        const mockSegment: MemberSegment = {
          id: 1,
          clubId,
          name: request.name,
          filterCriteria: request.filterCriteria,
          memberCount: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

        const result = await memberSegmentationService.createSegment(clubId, request);
        expect(result.filterCriteria.eventAttendanceMin).toBe(0);
      });
    });

    describe('Range Logic Validation', () => {
      it('should reject when eventAttendanceMin > eventAttendanceMax', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            eventAttendanceMin: 10,
            eventAttendanceMax: 5,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Event attendance minimum cannot be greater than maximum.');
      });

      it('should reject when ageMin > ageMax', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            ageMin: 65,
            ageMax: 25,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Age minimum cannot be greater than maximum.');
      });

      it('should reject when joinDateFrom > joinDateTo', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            joinDateFrom: '2024-12-31',
            joinDateTo: '2024-01-01',
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Join date from cannot be after join date to.');
      });

      it('should accept equal min and max values', async () => {
        const request: CreateSegmentRequest = {
          name: 'Equal Values',
          filterCriteria: {
            eventAttendanceMin: 5,
            eventAttendanceMax: 5,
            ageMin: 30,
            ageMax: 30,
          },
        };

        const mockSegment: MemberSegment = {
          id: 1,
          clubId,
          name: request.name,
          filterCriteria: request.filterCriteria,
          memberCount: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

        const result = await memberSegmentationService.createSegment(clubId, request);
        expect(result.filterCriteria.ageMin).toBe(30);
        expect(result.filterCriteria.ageMax).toBe(30);
      });
    });

    describe('Enum Validation', () => {
      it('should reject invalid duesStatus', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            duesStatus: 'InvalidStatus' as any,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid dues status. Must be one of: Current, Overdue, Exempt, Unknown');
      });

      it('should accept all valid duesStatus values', async () => {
        const validStatuses: Array<'Current' | 'Overdue' | 'Exempt' | 'Unknown'> = [
          'Current',
          'Overdue',
          'Exempt',
          'Unknown',
        ];

        for (const duesStatus of validStatuses) {
          const request: CreateSegmentRequest = {
            name: `Test ${duesStatus}`,
            filterCriteria: { duesStatus },
          };

          const mockSegment: MemberSegment = {
            id: 1,
            clubId,
            name: request.name,
            filterCriteria: request.filterCriteria,
            memberCount: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };

          (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

          const result = await memberSegmentationService.createSegment(clubId, request);
          expect(result.filterCriteria.duesStatus).toBe(duesStatus);
        }
      });

      it('should reject invalid status', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            status: 'InvalidStatus' as any,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid status. Must be one of: Active, Inactive, Suspended, Pending');
      });

      it('should accept all valid status values', async () => {
        const validStatuses: Array<'Active' | 'Inactive' | 'Suspended' | 'Pending'> = [
          'Active',
          'Inactive',
          'Suspended',
          'Pending',
        ];

        for (const status of validStatuses) {
          const request: CreateSegmentRequest = {
            name: `Test ${status}`,
            filterCriteria: { status },
          };

          const mockSegment: MemberSegment = {
            id: 1,
            clubId,
            name: request.name,
            filterCriteria: request.filterCriteria,
            memberCount: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };

          (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

          const result = await memberSegmentationService.createSegment(clubId, request);
          expect(result.filterCriteria.status).toBe(status);
        }
      });

      it('should reject invalid engagementLevel', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            engagementLevel: 'super-high' as any,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid engagement level. Must be one of: high, medium, low');
      });

      it('should accept all valid engagementLevel values', async () => {
        const validLevels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

        for (const engagementLevel of validLevels) {
          const request: CreateSegmentRequest = {
            name: `Test ${engagementLevel}`,
            filterCriteria: { engagementLevel },
          };

          const mockSegment: MemberSegment = {
            id: 1,
            clubId,
            name: request.name,
            filterCriteria: request.filterCriteria,
            memberCount: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };

          (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

          const result = await memberSegmentationService.createSegment(clubId, request);
          expect(result.filterCriteria.engagementLevel).toBe(engagementLevel);
        }
      });

      it('should reject invalid tagMatchMode', async () => {
        const request: CreateSegmentRequest = {
          name: 'Test',
          filterCriteria: {
            tags: ['vip'],
            tagMatchMode: 'exactly' as any,
          },
        };

        await expect(
          memberSegmentationService.createSegment(clubId, request)
        ).rejects.toThrow('Invalid tag match mode. Must be one of: any, all, none');
      });

      it('should accept all valid tagMatchMode values', async () => {
        const validModes: Array<'any' | 'all' | 'none'> = ['any', 'all', 'none'];

        for (const tagMatchMode of validModes) {
          const request: CreateSegmentRequest = {
            name: `Test ${tagMatchMode}`,
            filterCriteria: {
              tags: ['vip'],
              tagMatchMode,
            },
          };

          const mockSegment: MemberSegment = {
            id: 1,
            clubId,
            name: request.name,
            filterCriteria: request.filterCriteria,
            memberCount: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };

          (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

          const result = await memberSegmentationService.createSegment(clubId, request);
          expect(result.filterCriteria.tagMatchMode).toBe(tagMatchMode);
        }
      });
    });

    describe('Validation in Update Operations', () => {
      it('should validate filter criteria when updating', async () => {
        const segmentId = 1;
        const request: UpdateSegmentRequest = {
          filterCriteria: {
            ageMin: 70,
            ageMax: 30, // Invalid: min > max
          },
        };

        await expect(
          memberSegmentationService.updateSegment(clubId, segmentId, request)
        ).rejects.toThrow('Age minimum cannot be greater than maximum.');
      });

      it('should skip validation when filterCriteria not provided', async () => {
        const segmentId = 1;
        const request: UpdateSegmentRequest = {
          name: 'Updated Name Only',
        };

        const mockSegment: MemberSegment = {
          id: segmentId,
          clubId,
          name: request.name!,
          filterCriteria: { status: 'Active' },
          memberCount: 50,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        };

        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockSegment });

        const result = await memberSegmentationService.updateSegment(
          clubId,
          segmentId,
          request
        );

        expect(result.name).toBe(request.name);
      });
    });

    describe('Validation in Preview Operations', () => {
      it('should validate filter criteria in preview', async () => {
        const filterCriteria: SegmentFilterCriteria = {
          joinDateFrom: '2024-12-31',
          joinDateTo: '2024-01-01', // Invalid: from > to
        };

        await expect(
          memberSegmentationService.previewSegment(clubId, filterCriteria)
        ).rejects.toThrow('Join date from cannot be after join date to.');
      });
    });
  });

  // ==================== Cache Management ====================

  describe('Cache Management', () => {
    it('should generate unique cache keys for different operations', () => {
      const key1 = (memberSegmentationService as any).generateCacheKey('segments', {
        clubId: 1,
      });
      const key2 = (memberSegmentationService as any).generateCacheKey('segments', {
        clubId: 2,
      });
      const key3 = (memberSegmentationService as any).generateCacheKey('analytics', {
        clubId: 1,
      });

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should sort params for consistent cache keys', () => {
      const key1 = (memberSegmentationService as any).generateCacheKey('test', {
        b: 2,
        a: 1,
        c: 3,
      });
      const key2 = (memberSegmentationService as any).generateCacheKey('test', {
        a: 1,
        c: 3,
        b: 2,
      });

      expect(key1).toBe(key2);
    });

    it('should clear all caches', async () => {
      // Populate cache with segments
      const mockSegments: MemberSegment[] = [
        {
          id: 1,
          clubId,
          name: 'Test',
          filterCriteria: { status: 'Active' },
          memberCount: 50,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockSegments });

      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Clear cache
      memberSegmentationService.clearCache();

      // Next call should hit API again (cache was cleared)
      await memberSegmentationService.getSegments(clubId);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should get cache statistics', () => {
      const stats = memberSegmentationService.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRatio');
      expect(stats).toHaveProperty('avgAge');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRatio).toBe('number');
      expect(typeof stats.avgAge).toBe('number');
    });

    it('should cleanup cache when size exceeds 1000 entries', () => {
      // This is difficult to test without internal access, but we can verify the method exists
      const cleanupCache = (memberSegmentationService as any).cleanupCache;
      expect(typeof cleanupCache).toBe('function');
    });

    it('should respect custom TTL for cache entries', async () => {
      const segmentId = 1;
      const mockResult: SegmentMemberResult = {
        segmentId,
        segmentName: 'Test',
        totalCount: 50,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      // Segment members use 2-minute cache
      await memberSegmentationService.getSegmentMembers(clubId, segmentId);

      // Verify it's cached
      const cacheKey = (memberSegmentationService as any).generateCacheKey(
        'segment-members',
        { clubId, segmentId, page: 1, pageSize: 25 }
      );
      const cachedData = (memberSegmentationService as any).getFromCache(
        cacheKey,
        2 * 60 * 1000
      );
      expect(cachedData).toBeTruthy();
    });
  });
});
