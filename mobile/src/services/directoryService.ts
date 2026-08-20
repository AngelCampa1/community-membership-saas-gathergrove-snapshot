import { authService } from './authService';
import { PaginatedDirectoryMembersResponse } from '@/types';
import { API_CONFIG } from '@/constants';
import { ErrorHandler } from '@/utils/errorHandler';

/**
 * Service for directory operations - leverages existing Story 30 API
 */
export class DirectoryService {
  /**
   * Get member directory with optional search and pagination
   */
  static async getMemberDirectory(
    clubId: number,
    options: {
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedDirectoryMembersResponse> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const { search = '', page = 1, pageSize = 25 } = options;

      // VAL-05 fix: Validate pagination parameters
      const validPage = Math.max(1, Math.floor(page || 1));
      const validPageSize = Math.min(100, Math.max(1, Math.floor(pageSize || 25)));

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: validPage.toString(),
        pageSize: validPageSize.toString(),
      });

      if (search.trim()) {
        queryParams.set('search', search.trim());
      }

      const url = `${API_CONFIG.BASE_URL}/api/v1/clubs/${clubId}/members/directory?${queryParams}`;

      // MEM-07 fix: Use finally block for guaranteed timeout cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for directory search

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Directory search timed out. Please check your connection and try again.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      
      // Handle fetch/AbortError before passing to ErrorHandler
      if (error instanceof Error) {
        throw error;
      }
      
      // Use centralized error handler for consistent error messages
      const appError = ErrorHandler.handleDirectoryError(error, 'Directory Load');
      throw new Error(appError.message);
    }
  }

  /**
   * Check if directory is accessible (wrapper around getMemberDirectory with page size 1)
   */
  static async checkDirectoryAccess(clubId: number): Promise<boolean> {
    try {
      await this.getMemberDirectory(clubId, { page: 1, pageSize: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
} 