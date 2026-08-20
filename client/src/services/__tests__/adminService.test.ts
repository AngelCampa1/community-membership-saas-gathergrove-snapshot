/**
 * @jest-environment jsdom
 *
 * Admin Service Tests
 *
 * Tests club administrator management following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, error handling)
 */

import { adminService, ClubAdminResponse, AdminInviteResponse } from '../adminService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockAdmin: ClubAdminResponse = {
    userId: 123,
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'Administrator',
    createdAt: '2025-01-01T00:00:00Z',
    isCurrentUser: true,
  };

  const mockAdmins: ClubAdminResponse[] = [
    mockAdmin,
    {
      userId: 456,
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Administrator',
      createdAt: '2025-01-10T00:00:00Z',
      isCurrentUser: false,
    },
  ];

  const mockInvite: AdminInviteResponse = {
    inviteId: 1,
    email: 'newadmin@example.com',
    status: 'pending',
    createdAt: '2025-01-15T00:00:00Z',
    expiresAt: '2025-01-22T00:00:00Z',
    invitedByName: 'John Doe',
  };

  describe('getClubAdmins', () => {
    it('should fetch all club administrators successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockAdmins });

      const result = await adminService.getClubAdmins(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/admins`);
      expect(result).toEqual(mockAdmins);
      expect(result).toHaveLength(2);
    });

    it('should return admin with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockAdmin] });

      const result = await adminService.getClubAdmins(clubId);

      expect(result[0].userId).toBe(123);
      expect(result[0].fullName).toBe('John Doe');
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].isCurrentUser).toBe(true);
    });

    it('should return empty array when no admins', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await adminService.getClubAdmins(clubId);

      expect(result).toEqual([]);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(adminService.getClubAdmins(clubId)).rejects.toBeDefined();
    });

    it('should throw error when club not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(adminService.getClubAdmins(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(adminService.getClubAdmins(clubId)).rejects.toBeDefined();
    });
  });

  describe('createAdminInvite', () => {
    const inviteRequest = { email: 'newadmin@example.com' };

    it('should create admin invite successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockInvite });

      const result = await adminService.createAdminInvite(clubId, inviteRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/admins/invites`,
        inviteRequest
      );
      expect(result).toEqual(mockInvite);
    });

    it('should return invite with all properties', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockInvite });

      const result = await adminService.createAdminInvite(clubId, inviteRequest);

      expect(result.inviteId).toBe(1);
      expect(result.email).toBe('newadmin@example.com');
      expect(result.status).toBe('pending');
      expect(result.invitedByName).toBe('John Doe');
    });

    it('should throw error on invalid email (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(adminService.createAdminInvite(clubId, inviteRequest)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(adminService.createAdminInvite(clubId, inviteRequest)).rejects.toBeDefined();
    });

    it('should throw error on duplicate invite (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(adminService.createAdminInvite(clubId, inviteRequest)).rejects.toBeDefined();
    });

    it('should throw error when email already admin (422)', async () => {
      const error = { response: { status: 422, data: { message: 'Unprocessable Entity' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(adminService.createAdminInvite(clubId, inviteRequest)).rejects.toBeDefined();
    });
  });

  describe('getPendingInvites', () => {
    it('should fetch pending invites successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockInvite] });

      const result = await adminService.getPendingInvites(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/admins/invites`);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockInvite);
    });

    it('should return empty array when no pending invites', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await adminService.getPendingInvites(clubId);

      expect(result).toEqual([]);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(adminService.getPendingInvites(clubId)).rejects.toBeDefined();
    });

    it('should throw error when club not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(adminService.getPendingInvites(clubId)).rejects.toBeDefined();
    });
  });

  describe('cancelInvite', () => {
    const inviteId = 1;

    it('should cancel invite successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await adminService.cancelInvite(clubId, inviteId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/admins/invites/${inviteId}`
      );
    });

    it('should throw error when invite not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.cancelInvite(clubId, inviteId)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.cancelInvite(clubId, inviteId)).rejects.toBeDefined();
    });

    it('should throw error when invite already accepted (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.cancelInvite(clubId, inviteId)).rejects.toBeDefined();
    });
  });

  describe('removeAdmin', () => {
    const userId = 456;

    it('should remove admin successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await adminService.removeAdmin(clubId, userId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/admins/${userId}`
      );
    });

    it('should throw error when admin not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.removeAdmin(clubId, userId)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.removeAdmin(clubId, userId)).rejects.toBeDefined();
    });

    it('should throw error when last admin (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(adminService.removeAdmin(clubId, userId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network Error'));

      await expect(adminService.removeAdmin(clubId, userId)).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export adminService instance', () => {
      expect(adminService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof adminService.getClubAdmins).toBe('function');
      expect(typeof adminService.createAdminInvite).toBe('function');
      expect(typeof adminService.getPendingInvites).toBe('function');
      expect(typeof adminService.cancelInvite).toBe('function');
      expect(typeof adminService.removeAdmin).toBe('function');
    });
  });
});
