import memberService, { CreateMemberRequest } from '../memberService';
import apiClient from '../apiClient';
import type { AxiosRequestConfig } from 'axios';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';
import { ErrorHandler } from '@/lib/errorHandler';
import { billingService } from '../billingService';

// Mock the apiClient module
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the billingService module
jest.mock('../billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));

// Get typed reference to mocked billingService
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

describe('memberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up default billingService mock response
    mockBillingService.getBillingStatus.mockResolvedValue({
      clubId: 1,
      currentTier: 'Unlimited',
      memberLimit: 1000,
      memberCount: 10,
      isTrialActive: false,
      daysUntilTrialEnds: 0,
      canAccessFeature: true,
      subscriptionStatus: 'active'
    } as any);
  });

  const mockMember = {
    id: 1,
    clubId: 1,
    membershipTypeId: 1,
    membershipTypeName: 'Individual',
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phoneNumber: '(555) 123-4567',
    address: '123 Main St, Anytown, ST 12345',
    status: 'Active',
    joinDate: '2023-01-01',
    duesPaidUntil: null,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  describe('createMember', () => {
    it('should create a member successfully', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        phoneNumber: '(555) 123-4567',
        address: '123 Main St, Anytown, ST 12345',
        joinDate: '2023-01-01',
        hasSmsConsent: true,
        customFieldValues: []
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockMember,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.createMember(clubId, request);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members`,
        request
      );

      expect(result).toEqual(mockMember);
    });

    it('should create a member without join date (defaults to today)', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      const expectedMember = {
        ...mockMember,
        id: 2,
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        joinDate: new Date().toISOString().split('T')[0] // Today's date
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: expectedMember,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.createMember(clubId, request);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members`,
        request
      );

      expect(result).toEqual(expectedMember);
    });

    it('should throw error when creation fails with duplicate email', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'Duplicate User',
        email: 'duplicate@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'A member with this email already exists in this club'
          }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.createMember(clubId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members`,
        request
      );
    });

    it('should throw error when membership type not found', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 999,
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Membership type not found in this club'
          }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.createMember(clubId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when network request fails', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'Test Member',
        email: 'test@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      const networkError = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(memberService.createMember(clubId, request))
        .rejects.toThrow('Network error');
    });

    it('should throw error when member limit exceeded for non-unlimited tier', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'New Member',
        email: 'new@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      // Mock billing status at limit for Grow tier
      mockBillingService.getBillingStatus.mockResolvedValueOnce({
        clubId: 1,
        currentTier: 'Grow',
        memberLimit: 50,
        memberCount: 50, // At limit
        isTrialActive: false,
        daysUntilTrialEnds: 0,
        canAccessFeature: true,
        subscriptionStatus: 'active'
      } as any);

      await expect(memberService.createMember(clubId, request))
        .rejects.toThrow('Member limit exceeded');
    });

    it('should throw error when member limit exceeded for Grow tier with specific message', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'New Member',
        email: 'new@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      // Mock billing status at limit for Grow tier
      mockBillingService.getBillingStatus.mockResolvedValueOnce({
        clubId: 1,
        currentTier: 'Grow',
        memberLimit: 25,
        memberCount: 25, // At limit
        isTrialActive: false,
        daysUntilTrialEnds: 0,
        canAccessFeature: true,
        subscriptionStatus: 'active'
      } as any);

      await expect(memberService.createMember(clubId, request))
        .rejects.toThrow('Member limit exceeded for current tier');
    });

    it('should proceed with member creation when billing service is unavailable (graceful degradation)', async () => {
      const clubId = 1;
      const request: CreateMemberRequest = {
        membershipTypeId: 1,
        fullName: 'Test Member',
        email: 'test@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      };

      // Mock billing service failing with network error
      mockBillingService.getBillingStatus.mockRejectedValueOnce(new Error('Service unavailable'));

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockMember,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.createMember(clubId, request);

      expect(result).toEqual(mockMember);
    });
  });

  describe('getMembers', () => {
    it('should fetch members for a club successfully', async () => {
      const clubId = 1;
      const mockMembers = [
        mockMember,
        {
          ...mockMember,
          id: 2,
          fullName: 'Alice Johnson',
          email: 'alice@example.com',
          membershipTypeId: 2,
          membershipTypeName: 'Family'
        }
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockMembers,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getMembers(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members`
      );

      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when club has no members', async () => {
      const clubId = 1;

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getMembers(clubId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when fetch fails', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Club not found' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMembers(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should handle server error gracefully', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMembers(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('getMember', () => {
    it('should fetch a specific member successfully', async () => {
      const clubId = 1;
      const memberId = 1;

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getMember(clubId, memberId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}`
      );

      expect(result).toEqual(mockMember);
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when accessing member from different club', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('getPaginatedMembers', () => {
    const mockPaginatedResponse = {
      members: [mockMember],
      currentPage: 1,
      pageSize: 25,
      totalCount: 1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
      search: undefined
    };

    it('should fetch paginated members with default parameters', async () => {
      const clubId = 1;

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockPaginatedResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getPaginatedMembers(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/paginated?page=1&pageSize=25`
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch paginated members with search parameter', async () => {
      const clubId = 1;
      const search = 'John';

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { ...mockPaginatedResponse, search },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getPaginatedMembers(clubId, search);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/paginated?search=John&page=1&pageSize=25`
      );
      expect(result.search).toBe(search);
    });

    it('should fetch paginated members with custom page and pageSize', async () => {
      const clubId = 1;

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { ...mockPaginatedResponse, currentPage: 2, pageSize: 50 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getPaginatedMembers(clubId, undefined, 2, 50);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/paginated?page=2&pageSize=50`
      );
      expect(result.currentPage).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it('should throw error when pagination request fails', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getPaginatedMembers(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('updateMember', () => {
    const updateRequest = {
      membershipTypeId: 1,
      fullName: 'John Smith Updated',
      email: 'john.updated@example.com',
      phoneNumber: '(555) 999-8888',
      address: '456 New St',
      hasSmsConsent: true,
      customFieldValues: []
    };

    it('should update a member successfully', async () => {
      const clubId = 1;
      const memberId = 1;
      const updatedMember = { ...mockMember, ...updateRequest };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.updateMember(clubId, memberId, updateRequest);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}`,
        updateRequest
      );
      expect(result.fullName).toBe('John Smith Updated');
    });

    it('should throw error when update fails with duplicate email', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 409,
          data: { message: 'Email already in use' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMember(clubId, memberId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMember(clubId, memberId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMember(clubId, memberId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('archiveMember', () => {
    it('should archive a member successfully', async () => {
      const clubId = 1;
      const memberId = 1;
      const archivedMember = { ...mockMember, status: 'Archived' };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: archivedMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.archiveMember(clubId, memberId);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}/status`,
        { status: 'Archived' }
      );
      expect(result.status).toBe('Archived');
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.archiveMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.archiveMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('unarchiveMember', () => {
    it('should unarchive a member successfully', async () => {
      const clubId = 1;
      const memberId = 1;
      const activeMember = { ...mockMember, status: 'Active' };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: activeMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.unarchiveMember(clubId, memberId);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}/status`,
        { status: 'Active' }
      );
      expect(result.status).toBe('Active');
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.unarchiveMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.unarchiveMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('recordPayment', () => {
    const paymentRequest = {
      amount: 50.00,
      paymentDate: '2024-01-15',
      paymentMethod: 'Credit Card',
      notes: 'Monthly dues'
    };

    const mockPaymentResponse = {
      paymentId: 1,
      memberId: 1,
      clubId: 1,
      amount: 50.00,
      paymentDate: '2024-01-15',
      paymentMethod: 'Credit Card',
      notes: 'Monthly dues',
      createdAt: '2024-01-15T00:00:00Z',
      isPartialPayment: false
    };

    it('should record a payment successfully', async () => {
      const clubId = 1;
      const memberId = 1;

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockPaymentResponse,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.recordPayment(clubId, memberId, paymentRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}/payments`,
        paymentRequest
      );
      expect(result.amount).toBe(50.00);
      expect(result.paymentMethod).toBe('Credit Card');
    });

    it('should throw error when payment has invalid amount', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid payment amount' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.recordPayment(clubId, memberId, paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.recordPayment(clubId, memberId, paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.recordPayment(clubId, memberId, paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('getMyProfile', () => {
    it('should fetch current user profile successfully', async () => {
      const clubId = 1;

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.getMyProfile(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/me`
      );
      expect(result).toEqual(mockMember);
    });

    it('should throw error when profile not found', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Profile not found' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMyProfile(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.getMyProfile(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('updateMyProfile', () => {
    const updateRequest = {
      membershipTypeId: 1,
      fullName: 'John Smith Updated',
      email: 'john.updated@example.com',
      phoneNumber: '(555) 999-8888',
      address: '456 New St',
      hasSmsConsent: true,
      customFieldValues: []
    };

    it('should update current user profile successfully', async () => {
      const clubId = 1;
      const updatedMember = { ...mockMember, ...updateRequest };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.updateMyProfile(clubId, updateRequest);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/me`,
        updateRequest
      );
      expect(result.fullName).toBe('John Smith Updated');
    });

    it('should throw error when update fails with duplicate email', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 409,
          data: { message: 'Email already in use' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMyProfile(clubId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when validation fails', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid data' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMyProfile(clubId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.put as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.updateMyProfile(clubId, updateRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('payMyDues', () => {
    const paymentRequest = {
      paymentMethodId: 'pm_test_123',
      membershipTypeId: 1
    };

    const mockPaymentResponse = {
      paymentId: 1,
      memberId: 1,
      clubId: 1,
      amount: 50.00,
      paymentDate: '2024-01-15',
      paymentMethod: 'Stripe',
      createdAt: '2024-01-15T00:00:00Z',
      isPartialPayment: false
    };

    it('should process dues payment successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockPaymentResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.payMyDues(paymentRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/users/me/dues/pay`,
        paymentRequest
      );
      expect(result.amount).toBe(50.00);
    });

    it('should throw error when payment information is invalid', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid payment information' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.payMyDues(paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when payment fails', async () => {
      const errorResponse = {
        response: {
          status: 402,
          data: { message: 'Payment failed' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.payMyDues(paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.payMyDues(paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when duplicate payment detected', async () => {
      const errorResponse = {
        response: {
          status: 409,
          data: { message: 'Payment already being processed' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.payMyDues(paymentRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('createBulkMembers', () => {
    const bulkRequest: CreateMemberRequest[] = [
      {
        membershipTypeId: 1,
        fullName: 'Bulk User 1',
        email: 'bulk1@example.com',
        hasSmsConsent: true,
        customFieldValues: []
      },
      {
        membershipTypeId: 1,
        fullName: 'Bulk User 2',
        email: 'bulk2@example.com',
        hasSmsConsent: false,
        customFieldValues: []
      }
    ];

    const mockBulkResponse = {
      successful: 2,
      failed: 0,
      results: [
        { ...mockMember, id: 10, fullName: 'Bulk User 1', email: 'bulk1@example.com' },
        { ...mockMember, id: 11, fullName: 'Bulk User 2', email: 'bulk2@example.com' }
      ]
    };

    it('should create multiple members in bulk successfully', async () => {
      const clubId = 1;

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockBulkResponse,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.createBulkMembers(clubId, bulkRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/bulk`,
        { members: bulkRequest }
      );
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should handle partial success in bulk creation', async () => {
      const clubId = 1;

      const partialResponse = {
        successful: 1,
        failed: 1,
        results: [
          { ...mockMember, id: 10, fullName: 'Bulk User 1', email: 'bulk1@example.com' }
        ]
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: partialResponse,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.createBulkMembers(clubId, bulkRequest);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should throw error when bulk operation exceeds member limit', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Bulk operation would exceed member limit' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.createBulkMembers(clubId, bulkRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when validation fails', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid member data' }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.createBulkMembers(clubId, bulkRequest))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when bulk operation would exceed member limit', async () => {
      const clubId = 1;

      // Mock billing status where adding 2 members would exceed limit
      mockBillingService.getBillingStatus.mockResolvedValueOnce({
        clubId: 1,
        currentTier: 'Grow',
        memberLimit: 50,
        memberCount: 49, // Adding 2 would go to 51, exceeding limit
        isTrialActive: false,
        daysUntilTrialEnds: 0,
        canAccessFeature: true,
        subscriptionStatus: 'active'
      } as any);

      await expect(memberService.createBulkMembers(clubId, bulkRequest))
        .rejects.toThrow('Bulk operation would exceed member limit');
    });
  });

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      const clubId = 1;
      const memberId = 1;

      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await memberService.deleteMember(clubId, memberId);

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/${memberId}`
      );
      expect(result.success).toBe(true);
    });

    it('should throw error when member not found', async () => {
      const clubId = 1;
      const memberId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        }
      };

      (apiClient.delete as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.deleteMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when user lacks permission', async () => {
      const clubId = 1;
      const memberId = 1;

      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      (apiClient.delete as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(memberService.deleteMember(clubId, memberId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });
}); 