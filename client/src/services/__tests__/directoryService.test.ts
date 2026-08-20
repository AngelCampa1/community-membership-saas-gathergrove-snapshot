/**
 * @jest-environment jsdom
 *
 * Directory Service Tests
 *
 * Tests member directory listing following the boundary-mocking pattern:
 * - Mock ONLY the apiClient transport boundary (HTTP layer)
 * - Test REAL service logic (path construction, search handling) and the REAL
 *   ErrorHandler error mapping
 */

import { DirectoryService } from '../directoryService';
import apiClient from '../apiClient';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;

const mockAxiosError = (status: number, message: string) => ({
  response: { status, data: { message } },
  message,
});

describe('DirectoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockDirectoryResponse = {
    items: [
      {
        memberId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        membershipTypeName: 'Standard',
        joinedAt: '2025-01-01T00:00:00Z',
        isVisible: true,
      },
      {
        memberId: 2,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        membershipTypeName: 'Premium',
        joinedAt: '2025-01-10T00:00:00Z',
        isVisible: true,
      },
    ],
    totalCount: 2,
    currentPage: 1,
    pageSize: 25,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  describe('getMemberDirectory', () => {
    it('should request the bare club-scoped directory path with default params', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      const result = await DirectoryService.getMemberDirectory(clubId);

      expect(mockGet).toHaveBeenCalledWith('/clubs/1/members/directory', {
        params: { page: 1, pageSize: 25 },
      });
      expect(result).toEqual(mockDirectoryResponse);
    });

    it('should include search parameter when provided', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, 'John');

      expect(mockGet).toHaveBeenCalledWith('/clubs/1/members/directory', {
        params: { page: 1, pageSize: 25, search: 'John' },
      });
    });

    it('should trim search parameter', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, '  John  ');

      expect(mockGet).toHaveBeenCalledWith('/clubs/1/members/directory', {
        params: { page: 1, pageSize: 25, search: 'John' },
      });
    });

    it('should not include empty search parameter', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, '   ');

      const params = mockGet.mock.calls[0][1].params;
      expect(params).not.toHaveProperty('search');
    });

    it('should use custom page number', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, undefined, 3);

      expect(mockGet.mock.calls[0][1].params.page).toBe(3);
    });

    it('should use custom page size', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, undefined, 1, 50);

      expect(mockGet.mock.calls[0][1].params.pageSize).toBe(50);
    });

    it('should combine search, page, and pageSize parameters', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      await DirectoryService.getMemberDirectory(clubId, 'test', 2, 10);

      expect(mockGet).toHaveBeenCalledWith('/clubs/1/members/directory', {
        params: { page: 2, pageSize: 10, search: 'test' },
      });
    });

    it('should return paginated response with all properties', async () => {
      mockGet.mockResolvedValue({ data: mockDirectoryResponse });

      const result = await DirectoryService.getMemberDirectory(clubId);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
    });

    it('should throw error when forbidden (403)', async () => {
      mockGet.mockRejectedValue(mockAxiosError(403, 'Forbidden'));

      await expect(DirectoryService.getMemberDirectory(clubId)).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      mockGet.mockRejectedValue(mockAxiosError(404, 'Not Found'));

      await expect(DirectoryService.getMemberDirectory(clubId)).rejects.toBeDefined();
    });

    it('should throw error when directory disabled (423)', async () => {
      mockGet.mockRejectedValue(mockAxiosError(423, 'Locked'));

      await expect(DirectoryService.getMemberDirectory(clubId)).rejects.toBeDefined();
    });

    it('should throw error on server error (500)', async () => {
      mockGet.mockRejectedValue(mockAxiosError(500, 'Internal Server Error'));

      await expect(DirectoryService.getMemberDirectory(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(DirectoryService.getMemberDirectory(clubId)).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export DirectoryService class', () => {
      expect(DirectoryService).toBeDefined();
    });

    it('should have getMemberDirectory method', () => {
      expect(typeof DirectoryService.getMemberDirectory).toBe('function');
    });
  });
});
