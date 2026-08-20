import { ErrorHandler } from '@/lib/errorHandler';
import apiClient from './apiClient';
import { PaginatedDirectoryMembersResponse } from '@/types/directoryMember';

/**
 * Service for member directory listing (Story 30).
 *
 * Targets the backend `MembersController` mounted at
 * `[Route("api/v1/clubs/{clubId}/members")]` with `GET directory`. Uses
 * apiClient (baseURL `/api/v1`), so the path is the bare
 * `clubs/{clubId}/members/directory` — apiClient attaches auth headers and the
 * shared error/transport handling, replacing the previous raw `fetch` against a
 * relative `/api/v1` URL (which hit the frontend origin in dev/prod rather than
 * the backend, breaking the directory page entirely).
 */
export class DirectoryService {
  /**
   * Gets the member directory for a club.
   */
  static async getMemberDirectory(
    clubId: number,
    search?: string,
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedDirectoryMembersResponse> {
    try {
      const params: Record<string, string | number> = { page, pageSize };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await apiClient.get<PaginatedDirectoryMembersResponse>(
        `/clubs/${clubId}/members/directory`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member directory',
        action: 'Please try refreshing the page or check your permissions',
        customMessages: {
          403: 'You do not have permission to view the member directory',
          404: 'Member directory not found or has been disabled',
          423: 'Member directory has been temporarily disabled by administrators'
        }
      });
    }
  }
}
