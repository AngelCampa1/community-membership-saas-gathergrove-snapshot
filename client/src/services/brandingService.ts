import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

export interface BrandSettings {
  clubId: number;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCSS?: string;
  whiteLabelDomain?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedInUrl?: string;
  youTubeUrl?: string;
  websiteUrl?: string;
  hideGatherGroveBranding: boolean;
  customFooterText?: string;
  customClubName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveBrandSettingsRequest {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCSS?: string;
  whiteLabelDomain?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedInUrl?: string;
  youTubeUrl?: string;
  websiteUrl?: string;
  hideGatherGroveBranding?: boolean;
  customFooterText?: string;
  customClubName?: string;
}

export interface LogoUploadResponse {
  logoUrl: string;
  uploadedAt: string;
  fileSizeBytes: number;
  contentType: string;
}

export interface FaviconUploadResponse {
  faviconUrl: string;
  uploadedAt: string;
  fileSizeBytes: number;
  contentType: string;
}

export const brandingService = {
  /**
   * Get branding settings for a club
   */
  async getBrandSettings(clubId: number): Promise<BrandSettings> {
    try {
      const response = await apiClient.get<BrandSettings>(`/clubs/${clubId}/branding`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading branding settings',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view branding settings for this club',
          404: 'Club not found or branding settings not configured'
        }
      });
    }
  },

  /**
   * Save branding settings
   */
  async saveBrandSettings(clubId: number, settings: SaveBrandSettingsRequest): Promise<BrandSettings> {
    try {
      const response = await apiClient.put<BrandSettings>(`/clubs/${clubId}/branding`, settings);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'saving branding settings',
        action: 'Please check your settings and try again',
        customMessages: {
          400: 'Invalid branding configuration. Please check your inputs.',
          403: 'You do not have permission to modify branding settings for this club',
          413: 'File size is too large. Please use smaller images.'
        }
      });
    }
  },

  /**
   * Upload logo file
   */
  async uploadLogo(clubId: number, file: File): Promise<LogoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<LogoUploadResponse>(
        `/clubs/${clubId}/branding/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'uploading logo',
        action: 'Please try again with a different image',
        customMessages: {
          413: 'Logo file is too large. Please use an image smaller than 5MB.'
        }
      });
    }
  },

  /**
   * Upload favicon file
   */
  async uploadFavicon(clubId: number, file: File): Promise<FaviconUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<FaviconUploadResponse>(
        `/clubs/${clubId}/branding/favicon/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'uploading favicon',
        action: 'Please try again with a different image',
        customMessages: {
          413: 'Favicon file is too large. Please use an image smaller than 2MB.'
        }
      });
    }
  },

  /**
   * Delete/reset branding settings
   */
  async resetBrandSettings(clubId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/branding`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'resetting branding settings',
        action: 'Please try again',
        customMessages: {
          403: 'You do not have permission to modify branding settings for this club'
        }
      });
    }
  },

  /**
   * Create new branding settings
   */
  async createBrandSettings(clubId: number, settings: SaveBrandSettingsRequest): Promise<BrandSettings> {
    try {
      const response = await apiClient.post<BrandSettings>(`/clubs/${clubId}/branding`, settings);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating branding settings',
        action: 'Please check your settings and try again',
        customMessages: {
          409: 'Branding settings already exist for this club. Use update instead.',
          403: 'You do not have permission to create branding settings for this club'
        }
      });
    }
  }
};
