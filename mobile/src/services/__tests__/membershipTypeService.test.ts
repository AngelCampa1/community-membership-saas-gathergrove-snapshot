import axios from 'axios';
import type { MembershipTypeResponse } from '../membershipTypeService';

// Create mockAxiosInstance outside so it can be accessed in tests
let mockAxiosInstance: any;

// EXPLICITLY mock axios with inline factory
jest.mock('axios', () => {
  mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
  };

  // Use a regular function (not jest.fn) so resetMocks doesn't clear it
  const axiosMock = {
    __esModule: true,
    default: {
      create: () => mockAxiosInstance,
    },
  };

  return axiosMock;
});

jest.mock('../authService', () => ({
  authService: {
    getStoredToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('@/constants', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:8050',
    TIMEOUT: 30000,
  },
  ERROR_MESSAGES: {
    GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
  },
}));

// CRITICAL: jest.config has resetMocks: true which auto-mocks ALL modules
// We must explicitly unmock the service so it uses the REAL code
jest.unmock('../membershipTypeService');

// Use require() for service import - it runs after jest.mock() is applied
const membershipTypeService = require('../membershipTypeService').membershipTypeService;
const authService = require('../authService').authService;

const _mockAxios = axios as jest.Mocked<typeof axios>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('MembershipTypeService', () => {
  beforeAll(() => {
    // Verify interceptor was called when service loaded
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  beforeEach(() => {
    // Reset only the mock call history, not implementations
    mockAxiosInstance.get.mockClear();
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.put.mockClear();
    mockAxiosInstance.delete.mockClear();
    mockAuthService.getStoredToken.mockClear();
    mockAuthService.getStoredToken.mockResolvedValue('mock-token');
  });

  describe('getMembershipTypes', () => {
    it('should fetch membership types successfully', async () => {
      const clubId = 1;
      const mockMembershipTypes: MembershipTypeResponse[] = [
        {
          id: 1,
          clubId: 1,
          name: 'Gold Membership',
          description: 'Premium membership with full access',
          duesAmount: 100,
          duesFrequency: 'monthly',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          clubId: 1,
          name: 'Silver Membership',
          description: 'Standard membership',
          duesAmount: 50,
          duesFrequency: 'monthly',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual(mockMembershipTypes);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/clubs/1/membership-types');
    });

    it('should fetch membership types for different club', async () => {
      const clubId = 5;
      const mockMembershipTypes: MembershipTypeResponse[] = [
        {
          id: 10,
          clubId: 5,
          name: 'Basic Membership',
          description: 'Entry level membership',
          duesAmount: 25,
          duesFrequency: 'monthly',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual(mockMembershipTypes);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/clubs/5/membership-types');
    });

    it('should return empty array when no membership types exist', async () => {
      const clubId = 1;
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual([]);
    });

    it('should handle inactive membership types', async () => {
      const clubId = 1;
      const mockMembershipTypes: MembershipTypeResponse[] = [
        {
          id: 3,
          clubId: 1,
          name: 'Inactive Type',
          description: 'No longer available',
          duesAmount: 0,
          duesFrequency: 'annual',
          isActive: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual(mockMembershipTypes);
      expect(result[0].isActive).toBe(false);
    });

    it('should handle different dues frequencies', async () => {
      const clubId = 1;
      const mockMembershipTypes: MembershipTypeResponse[] = [
        {
          id: 4,
          clubId: 1,
          name: 'Annual Plan',
          description: 'Yearly membership',
          duesAmount: 500,
          duesFrequency: 'annual',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 5,
          clubId: 1,
          name: 'Quarterly Plan',
          description: 'Every 3 months',
          duesAmount: 150,
          duesFrequency: 'quarterly',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toHaveLength(2);
      expect(result[0].duesFrequency).toBe('annual');
      expect(result[1].duesFrequency).toBe('quarterly');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for 401 Unauthorized', async () => {
      const clubId = 1;
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Session expired. Please log in again.'
      );
    });

    it('should throw error for 403 Forbidden', async () => {
      const clubId = 1;
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Access denied. You are not authorized to view membership types.'
      );
    });

    it('should throw error for 404 Not Found', async () => {
      const clubId = 999;
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Membership types not found.'
      );
    });

    it('should throw error for 500 Server Error', async () => {
      const clubId = 1;
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw error for 502 Bad Gateway', async () => {
      const clubId = 1;
      const error = {
        response: {
          status: 502,
          data: { message: 'Bad gateway' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw error for 503 Service Unavailable', async () => {
      const clubId = 1;
      const error = {
        response: {
          status: 503,
          data: { message: 'Service unavailable' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw network error when request fails', async () => {
      const clubId = 1;
      const error = {
        request: {},
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'Network error. Please check your connection.'
      );
    });

    it('should throw generic error for unknown errors', async () => {
      const clubId = 1;
      const error = new Error('Unknown error');

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('should handle AxiosError by constructor name', async () => {
      const clubId = 1;
      const error = {
        constructor: { name: 'AxiosError' },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(membershipTypeService.getMembershipTypes(clubId)).rejects.toThrow(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  describe('Constructor', () => {
    // Note: interceptor.use check moved to beforeAll to avoid resetMocks clearing call history

    it('should have created a valid axios instance', () => {
      const serviceInstance = (membershipTypeService as any).axiosInstance;
      expect(serviceInstance).toBe(mockAxiosInstance);
      expect(serviceInstance.get).toBeDefined();
      expect(serviceInstance.post).toBeDefined();
    });
  });
});
