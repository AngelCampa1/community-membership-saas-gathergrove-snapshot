import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';

export interface CreateLocationRequest {
  locationName: string;
  locationCode: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface UpdateLocationRequest {
  locationName?: string;
  locationCode?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface LocationResponse {
  id: number;
  parentClubId: number;
  locationName: string;
  locationCode: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, string>;
}

class LocationService {
  /**
   * Creates a new location for a club
   */
  async createLocation(clubId: number, data: CreateLocationRequest): Promise<LocationResponse> {
    const response = await axios.post<LocationResponse>(`${API_BASE_URL}/clubs/${clubId}/locations`, data, {
      withCredentials: true,
    });
    return response.data;
  }

  /**
   * Gets all locations for a club
   */
  async getClubLocations(clubId: number): Promise<LocationResponse[]> {
    const response = await axios.get<LocationResponse[]>(`${API_BASE_URL}/clubs/${clubId}/locations`, {
      withCredentials: true,
    });
    return response.data;
  }

  /**
   * Gets a single location by ID
   */
  async getLocation(locationId: number): Promise<LocationResponse> {
    const response = await axios.get<LocationResponse>(`${API_BASE_URL}/locations/${locationId}`, {
      withCredentials: true,
    });
    return response.data;
  }

  /**
   * Updates an existing location
   */
  async updateLocation(locationId: number, data: UpdateLocationRequest): Promise<LocationResponse> {
    const response = await axios.put<LocationResponse>(`${API_BASE_URL}/locations/${locationId}`, data, {
      withCredentials: true,
    });
    return response.data;
  }

  /**
   * Deactivates a location
   */
  async deactivateLocation(locationId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/locations/${locationId}`, {
      withCredentials: true,
    });
  }

  /**
   * Gets detailed statistics for a location
   */
  async getLocationStats(locationId: number): Promise<LocationResponse> {
    const response = await axios.get<LocationResponse>(`${API_BASE_URL}/locations/${locationId}/stats`, {
      withCredentials: true,
    });
    return response.data;
  }
}

export const locationService = new LocationService();

