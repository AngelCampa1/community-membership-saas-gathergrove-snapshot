import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';

export interface UpdateLocationBrandingRequest {
  customLogoUrl?: string;
  colorScheme?: string;
  customNameOverride?: string;
  settingsJson?: string;
}

export interface LocationBrandingResponse {
  id: number;
  locationId: number;
  locationName: string;
  customLogoUrl?: string;
  colorScheme?: string;
  customNameOverride?: string;
  settingsJson?: string;
  createdAt: string;
  updatedAt: string;
}

class LocationBrandingService {
  /**
   * Gets branding for a location
   */
  async getLocationBranding(locationId: number): Promise<LocationBrandingResponse> {
    const response = await axios.get<LocationBrandingResponse>(
      `${API_BASE_URL}/locations/${locationId}/branding`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Updates branding for a location
   */
  async updateLocationBranding(
    locationId: number,
    data: UpdateLocationBrandingRequest
  ): Promise<LocationBrandingResponse> {
    const response = await axios.put<LocationBrandingResponse>(
      `${API_BASE_URL}/locations/${locationId}/branding`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

export const locationBrandingService = new LocationBrandingService();

