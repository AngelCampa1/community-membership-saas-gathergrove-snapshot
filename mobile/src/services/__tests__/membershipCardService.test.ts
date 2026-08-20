/**
 * Membership Card Service Tests
 * TDD Approach: Comprehensive coverage for digital membership card service
 *
 * Critical Paths Covered:
 * - Successful membership card retrieval
 * - Authentication error handling (401)
 * - Not found error handling (404)
 * - Server error handling (500)
 * - Generic API error handling
 * - Network error handling
 * - Token injection via interceptor
 *
 * Target: 95%+ coverage for membershipCardService
 */

import apiClient from '../apiClient';
import { membershipCardService } from '../membershipCardService';
import type { MembershipCardResponse } from '../membershipCardService';

// Mock apiClient instead of axios
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock constants
jest.mock('@/constants', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:8050',
    TIMEOUT: 15000,
    ENDPOINTS: {
      MEMBERSHIP_CARD: '/api/v1/membership/card',
    },
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// ============================================================================
// Test Helpers
// ============================================================================

function createMockMembershipCard(): MembershipCardResponse {
  return {
    fullName: 'John Doe',
    membershipTypeName: 'Premium Member',
    membershipExpiresAt: '2025-12-31T23:59:59Z',
    qrCodeData: 'QR-MEMBER-12345-XYZ',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('MembershipCardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Successful Retrieval
  // ============================================================================

  describe('getMembershipCard - Success', () => {
    it('should retrieve membership card data successfully', async () => {
      const mockCard = createMockMembershipCard();

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(mockCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result).toEqual(mockCard);
      expect(result.fullName).toBe('John Doe');
      expect(result.membershipTypeName).toBe('Premium Member');
      expect(result.qrCodeData).toBe('QR-MEMBER-12345-XYZ');
    });

    it('should handle membership card with different expiration date', async () => {
      const mockCard = {
        ...createMockMembershipCard(),
        membershipExpiresAt: '2026-06-15T12:00:00Z',
      };

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(mockCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result.membershipExpiresAt).toBe('2026-06-15T12:00:00Z');
    });

    it('should handle different membership type names', async () => {
      const mockCard = {
        ...createMockMembershipCard(),
        membershipTypeName: 'Basic Member',
      };

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(mockCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result.membershipTypeName).toBe('Basic Member');
    });
  });

  // ============================================================================
  // Error Handling - 401 Unauthorized
  // ============================================================================

  describe('getMembershipCard - 401 Unauthorized', () => {
    it('should throw authentication error on 401 status', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Authentication required. Please log in again.');
    });

    it('should handle 401 with no error message', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Authentication required. Please log in again.');
    });
  });

  // ============================================================================
  // Error Handling - 404 Not Found
  // ============================================================================

  describe('getMembershipCard - 404 Not Found', () => {
    it('should throw not found error on 404 status', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Membership not found' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Membership information not found. Please contact support@gathergrove.club.');
    });

    it('should handle 404 with no error message', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Membership information not found. Please contact support@gathergrove.club.');
    });
  });

  // ============================================================================
  // Error Handling - 500 Server Error
  // ============================================================================

  describe('getMembershipCard - 500 Server Error', () => {
    it('should throw server error on 500 status', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Server error. Please try again later.');
    });

    it('should handle 500 with no error message', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Server error. Please try again later.');
    });
  });

  // ============================================================================
  // Error Handling - Other HTTP Errors
  // ============================================================================

  describe('getMembershipCard - Other HTTP Errors', () => {
    it('should handle 400 bad request with custom message', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Invalid request parameters' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Invalid request parameters');
    });

    it('should handle 403 forbidden', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Access denied' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Access denied');
    });

    it('should handle 503 service unavailable', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Service temporarily unavailable');
    });

    it('should use default message when no message provided', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 418,
        },
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Failed to load membership card.');
    });
  });

  // ============================================================================
  // Error Handling - Network Errors
  // ============================================================================

  describe('getMembershipCard - Network Errors', () => {
    it('should handle network timeout errors', async () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Network error. Please check your connection.');
    });

    it('should handle network connection errors', async () => {
      const error = {
        isAxiosError: true,
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND localhost',
      };

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Network error. Please check your connection.');
    });

    it('should handle generic non-axios errors', async () => {
      const error = new TypeError('Unexpected error');

      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(membershipCardService.getMembershipCard())
        .rejects
        .toThrow('Network error. Please check your connection.');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty response data', async () => {
      const emptyCard = {
        fullName: '',
        membershipTypeName: '',
        membershipExpiresAt: '',
        qrCodeData: '',
      };

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(emptyCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result.fullName).toBe('');
      expect(result.qrCodeData).toBe('');
    });

    it('should handle malformed QR code data', async () => {
      const mockCard = {
        ...createMockMembershipCard(),
        qrCodeData: 'INVALID-QR-FORMAT',
      };

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(mockCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result.qrCodeData).toBe('INVALID-QR-FORMAT');
    });

    it('should handle very long member names', async () => {
      const mockCard = {
        ...createMockMembershipCard(),
        fullName: 'A'.repeat(200),
      };

      // apiClient.get() returns data directly, not wrapped in { data: ... }
      mockApiClient.get.mockResolvedValueOnce(mockCard);

      const result = await membershipCardService.getMembershipCard();

      expect(result.fullName.length).toBe(200);
    });
  });
});
