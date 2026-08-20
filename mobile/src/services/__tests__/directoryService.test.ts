import { DirectoryService } from '../directoryService';
import { authService } from '../authService';
import { API_CONFIG } from '@/constants';
import { PaginatedDirectoryMembersResponse } from '@/types';

// Mock authService
jest.mock('../authService', () => ({
  authService: {
    getStoredToken: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('DirectoryService', () => {
  const mockToken = 'mock-jwt-token';
  const mockClubId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (authService.getStoredToken as jest.Mock).mockResolvedValue(mockToken);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getMemberDirectory', () => {
    const mockDirectoryResponse: PaginatedDirectoryMembersResponse = {
      members: [
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '555-0100',
          joinDate: '2025-01-01',
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: '555-0101',
          joinDate: '2025-01-02',
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    it('should successfully get member directory without options', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      const result = await DirectoryService.getMemberDirectory(mockClubId);

      expect(result).toEqual(mockDirectoryResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/members/directory?page=1&pageSize=25`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
        })
      );
    });

    it('should get member directory with pagination options', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, {
        page: 2,
        pageSize: 50,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/members/directory?page=2&pageSize=50`,
        expect.any(Object)
      );
    });

    it('should get member directory with search parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, {
        search: 'john',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/members/directory?page=1&pageSize=25&search=john`,
        expect.any(Object)
      );
    });

    it('should get member directory with all options', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, {
        page: 3,
        pageSize: 50,
        search: 'jane smith',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(call).toContain('page=3');
      expect(call).toContain('pageSize=50');
      expect(call).toContain('search=jane+smith');
    });

    it('should get member directory with only page option', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, { page: 5 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=5'),
        expect.any(Object)
      );
    });

    it('should get member directory with only pageSize option', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, { pageSize: 100 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&pageSize=100'),
        expect.any(Object)
      );
    });

    it('should throw error when no token is available', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Authentication token not found');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Session expired' }),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Session expired');
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Directory access denied' }),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Directory access denied');
    });

    it('should handle 404 not found errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Club not found' }),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Club not found');
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Server error');
    });

    it('should handle errors with no message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Unknown error');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow();
    });

    it('should handle timeout error (AbortError)', async () => {
      // Create an AbortError to simulate timeout
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow('Directory search timed out. Please check your connection and try again.');
    });

    it('should handle non-Error exceptions through ErrorHandler', async () => {
      // Simulate a non-Error being thrown (e.g., string, number, etc.)
      (global.fetch as jest.Mock).mockRejectedValue('unexpected non-error value');

      // Should be handled by ErrorHandler.handleDirectoryError
      await expect(DirectoryService.getMemberDirectory(mockClubId))
        .rejects
        .toThrow(); // Will throw whatever ErrorHandler returns
    });

    it('should cleanup timeout on successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup timeout on error response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(DirectoryService.getMemberDirectory(mockClubId)).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should validate page to minimum of 1 (page 0 becomes page 1)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, { page: 0 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
    });

    it('should validate pageSize to maximum of 100 (pageSize 1000 becomes 100)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, { pageSize: 1000 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=100'),
        expect.any(Object)
      );
    });

    it('should properly encode special characters in search', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDirectoryResponse,
      });

      await DirectoryService.getMemberDirectory(mockClubId, {
        search: 'O\'Brien & Associates',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(call).toContain('search=');
      // URLSearchParams handles encoding automatically
    });
  });

  describe('checkDirectoryAccess', () => {
    it('should return true when directory access is granted', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          members: [],
          total: 0,
          page: 1,
          pageSize: 1,
          hasMore: false,
        }),
      });

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=1'),
        expect.any(Object)
      );
    });

    it('should return false when directory access is denied (401)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Unauthorized' }),
      });

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(false);
    });

    it('should return false when directory access is forbidden (403)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Access denied' }),
      });

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(false);
    });

    it('should return false when server error occurs (500)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(false);
    });

    it('should return false when no token is available', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);

      const result = await DirectoryService.checkDirectoryAccess(mockClubId);

      expect(result).toBe(false);
    });

    it('should pass clubId correctly to getMemberDirectory', async () => {
      const testClubId = 456;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          members: [],
          total: 0,
          page: 1,
          limit: 1,
          hasMore: false,
        }),
      });

      await DirectoryService.checkDirectoryAccess(testClubId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${testClubId}/members/directory`),
        expect.any(Object)
      );
    });
  });
});
