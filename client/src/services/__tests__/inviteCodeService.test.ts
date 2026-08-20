/**
 * @jest-environment jsdom
 *
 * Invite Code Service Tests
 *
 * Tests invite code management following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, error handling)
 */

import inviteCodeService, {
  InviteCodeResponse,
  ValidateInviteCodeResponse,
  CreateInviteCodeRequest,
} from '../inviteCodeService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('InviteCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockInviteCode: InviteCodeResponse = {
    id: 1,
    clubId: 1,
    code: 'WELCOME2025',
    name: 'Welcome Promotion',
    description: 'New member promotion',
    membershipTypeId: 1,
    membershipTypeName: 'Standard',
    expiresAt: '2025-12-31T23:59:59Z',
    maxUses: 100,
    currentUses: 25,
    isActive: true,
    joinUrl: 'https://example.com/join/WELCOME2025',
    qrCodeDataUrl: 'data:image/png;base64,abc123',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockValidationResult: ValidateInviteCodeResponse = {
    isValid: true,
    clubName: 'Test Club',
    membershipTypeName: 'Standard',
    expiresAt: '2025-12-31T23:59:59Z',
    isExpired: false,
    isAtLimit: false,
  };

  describe('createInviteCode', () => {
    const createRequest: CreateInviteCodeRequest = {
      name: 'Welcome Promotion',
      description: 'New member promotion',
      membershipTypeId: 1,
      expiresAt: '2025-12-31T23:59:59Z',
      maxUses: 100,
      isActive: true,
    };

    it('should create invite code successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: { data: mockInviteCode } });

      const result = await inviteCodeService.createInviteCode(clubId, createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/invite-codes`,
        createRequest
      );
      expect(result).toEqual(mockInviteCode);
    });

    it('should return invite code with all properties', async () => {
      mockApiClient.post.mockResolvedValue({ data: { data: mockInviteCode } });

      const result = await inviteCodeService.createInviteCode(clubId, createRequest);

      expect(result.code).toBe('WELCOME2025');
      expect(result.name).toBe('Welcome Promotion');
      expect(result.membershipTypeName).toBe('Standard');
      expect(result.isActive).toBe(true);
    });

    it('should throw error on invalid data (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.createInviteCode(clubId, createRequest)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.createInviteCode(clubId, createRequest)).rejects.toBeDefined();
    });

    it('should throw error on duplicate name (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.createInviteCode(clubId, createRequest)).rejects.toBeDefined();
    });
  });

  describe('getInviteCodes', () => {
    it('should fetch all invite codes successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [mockInviteCode] } });

      const result = await inviteCodeService.getInviteCodes(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/invite-codes`);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockInviteCode);
    });

    it('should return empty array when no invite codes', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [] } });

      const result = await inviteCodeService.getInviteCodes(clubId);

      expect(result).toEqual([]);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCodes(clubId)).rejects.toBeDefined();
    });

    it('should throw error when club not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCodes(clubId)).rejects.toBeDefined();
    });
  });

  describe('getInviteCode', () => {
    const inviteCodeId = 1;

    it('should fetch specific invite code successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: mockInviteCode } });

      const result = await inviteCodeService.getInviteCode(clubId, inviteCodeId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/invite-codes/${inviteCodeId}`
      );
      expect(result).toEqual(mockInviteCode);
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCode(clubId, inviteCodeId)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCode(clubId, inviteCodeId)).rejects.toBeDefined();
    });
  });

  describe('toggleInviteCodeStatus', () => {
    const inviteCodeId = 1;

    it('should toggle status successfully', async () => {
      mockApiClient.patch.mockResolvedValue({});

      await inviteCodeService.toggleInviteCodeStatus(clubId, inviteCodeId);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/clubs/${clubId}/invite-codes/${inviteCodeId}/toggle-status`
      );
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.patch.mockRejectedValue(error);

      await expect(inviteCodeService.toggleInviteCodeStatus(clubId, inviteCodeId)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.patch.mockRejectedValue(error);

      await expect(inviteCodeService.toggleInviteCodeStatus(clubId, inviteCodeId)).rejects.toBeDefined();
    });
  });

  describe('deleteInviteCode', () => {
    const inviteCodeId = 1;

    it('should delete invite code successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await inviteCodeService.deleteInviteCode(clubId, inviteCodeId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/invite-codes/${inviteCodeId}`
      );
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(inviteCodeService.deleteInviteCode(clubId, inviteCodeId)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(inviteCodeService.deleteInviteCode(clubId, inviteCodeId)).rejects.toBeDefined();
    });
  });

  describe('validateInviteCode', () => {
    const code = 'WELCOME2025';

    it('should validate invite code successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: mockValidationResult } });

      const result = await inviteCodeService.validateInviteCode(code);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/invite-codes/${code}/validate`);
      expect(result).toEqual(mockValidationResult);
    });

    it('should return validation result with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: mockValidationResult } });

      const result = await inviteCodeService.validateInviteCode(code);

      expect(result.isValid).toBe(true);
      expect(result.clubName).toBe('Test Club');
      expect(result.isExpired).toBe(false);
      expect(result.isAtLimit).toBe(false);
    });

    it('should return invalid for expired code', async () => {
      const expiredResult = { ...mockValidationResult, isValid: false, isExpired: true };
      mockApiClient.get.mockResolvedValue({ data: { data: expiredResult } });

      const result = await inviteCodeService.validateInviteCode(code);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.validateInviteCode(code)).rejects.toBeDefined();
    });

    it('should throw error on invalid format (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.validateInviteCode(code)).rejects.toBeDefined();
    });
  });

  describe('getInviteCodeByCode', () => {
    const code = 'WELCOME2025';

    it('should get invite code by code successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: mockInviteCode } });

      const result = await inviteCodeService.getInviteCodeByCode(code);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/invite-codes/${code}`);
      expect(result).toEqual(mockInviteCode);
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCodeByCode(code)).rejects.toBeDefined();
    });

    it('should throw error on invalid format (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(inviteCodeService.getInviteCodeByCode(code)).rejects.toBeDefined();
    });
  });

  describe('registerWithInviteCode', () => {
    const registerRequest = {
      inviteCode: 'WELCOME2025',
      fullName: 'New Member',
      email: 'newmember@example.com',
      password: 'SecurePassword123!',
    };

    it('should register with invite code successfully', async () => {
      const mockResult = { memberId: 123, success: true };
      mockApiClient.post.mockResolvedValue({ data: { data: mockResult } });

      const result = await inviteCodeService.registerWithInviteCode(registerRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/invite-codes/register', registerRequest);
      expect(result).toEqual(mockResult);
    });

    it('should include custom fields when provided', async () => {
      const requestWithFields = {
        ...registerRequest,
        customFields: { phone: '555-1234', company: 'Test Corp' },
      };
      mockApiClient.post.mockResolvedValue({ data: { data: { success: true } } });

      await inviteCodeService.registerWithInviteCode(requestWithFields);

      expect(mockApiClient.post).toHaveBeenCalledWith('/invite-codes/register', requestWithFields);
    });

    it('should throw error on invalid data (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.registerWithInviteCode(registerRequest)).rejects.toBeDefined();
    });

    it('should throw error when code not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.registerWithInviteCode(registerRequest)).rejects.toBeDefined();
    });

    it('should throw error when email exists (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(inviteCodeService.registerWithInviteCode(registerRequest)).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export inviteCodeService instance', () => {
      expect(inviteCodeService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof inviteCodeService.createInviteCode).toBe('function');
      expect(typeof inviteCodeService.getInviteCodes).toBe('function');
      expect(typeof inviteCodeService.getInviteCode).toBe('function');
      expect(typeof inviteCodeService.toggleInviteCodeStatus).toBe('function');
      expect(typeof inviteCodeService.deleteInviteCode).toBe('function');
      expect(typeof inviteCodeService.validateInviteCode).toBe('function');
      expect(typeof inviteCodeService.getInviteCodeByCode).toBe('function');
      expect(typeof inviteCodeService.registerWithInviteCode).toBe('function');
    });
  });
});
