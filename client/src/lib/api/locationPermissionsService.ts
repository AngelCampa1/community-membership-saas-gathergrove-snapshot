import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';

export enum LocationPermissionLevel {
  SuperAdmin = 0,
  RegionalManager = 1,
  LocationAdmin = 2,
  LocationModerator = 3,
  Staff = 4,
}

export interface AssignLocationAdminRequest {
  userId: number;
  permissionLevel: LocationPermissionLevel;
}

export interface LocationAdminResponse {
  id: number;
  locationId: number;
  locationName: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  permissionLevel: LocationPermissionLevel;
  permissionLevelName: string;
  assignedAt: string;
  assignedBy?: number;
  assignedByName?: string;
}

class LocationPermissionsService {
  /**
   * Assigns an admin to a location with specified permission level
   */
  async assignLocationAdmin(
    locationId: number,
    data: AssignLocationAdminRequest
  ): Promise<LocationAdminResponse> {
    const response = await axios.post<LocationAdminResponse>(
      `${API_BASE_URL}/locations/${locationId}/admins`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Gets all admins for a location
   */
  async getLocationAdmins(locationId: number): Promise<LocationAdminResponse[]> {
    const response = await axios.get<LocationAdminResponse[]>(
      `${API_BASE_URL}/locations/${locationId}/admins`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Removes an admin from a location
   */
  async removeLocationAdmin(locationId: number, userId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/locations/${locationId}/admins/${userId}`, {
      withCredentials: true,
    });
  }

  /**
   * Gets all location permissions for a user within a club
   */
  async getUserLocationPermissions(userId: number, clubId: number): Promise<LocationAdminResponse[]> {
    const response = await axios.get<LocationAdminResponse[]>(
      `${API_BASE_URL}/users/${userId}/clubs/${clubId}/location-permissions`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

export const locationPermissionsService = new LocationPermissionsService();

