import apiClient from './apiClient';
import {
  MemberDirectorySettingsResponse,
  UpdateMemberDirectorySettingsRequest,
} from '@/types/memberDirectorySettings';

/**
 * Service for managing member directory settings (Story 29).
 *
 * Targets the backend `UserDirectorySettingsController` mounted at
 * `[Route("api/v1/users/me")]` with GET/PUT `directory-settings` actions.
 * Uses apiClient (baseURL `/api/v1`), so the path is the bare
 * `/users/me/directory-settings` — apiClient also attaches auth headers and
 * the shared error/transport handling, replacing the previous raw `fetch`
 * against a relative `/api/v1` URL (which hit the frontend origin in dev).
 */
function toError(error: unknown, fallback: string): Error {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  const serverMessage = e?.response?.data?.message;
  if (serverMessage) {
    return new Error(serverMessage);
  }
  if (e?.message) {
    return new Error(e.message);
  }
  return new Error(fallback);
}

export class MemberDirectoryService {
  /**
   * Gets the current member's directory settings.
   */
  static async getDirectorySettings(): Promise<MemberDirectorySettingsResponse> {
    try {
      const response = await apiClient.get<MemberDirectorySettingsResponse>(
        '/users/me/directory-settings',
      );
      return response.data;
    } catch (error) {
      throw toError(error, 'Failed to get directory settings');
    }
  }

  /**
   * Updates the current member's directory settings.
   */
  static async updateDirectorySettings(
    request: UpdateMemberDirectorySettingsRequest,
  ): Promise<MemberDirectorySettingsResponse> {
    try {
      const response = await apiClient.put<MemberDirectorySettingsResponse>(
        '/users/me/directory-settings',
        request,
      );
      return response.data;
    } catch (error) {
      throw toError(error, 'Failed to update directory settings');
    }
  }
}
