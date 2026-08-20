/**
 * @jest-environment jsdom
 *
 * Branding Service Tests
 *
 * Tests club branding management following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, FormData handling, error handling)
 */

import { brandingService, BrandSettings, SaveBrandSettingsRequest } from '../brandingService';
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

describe('BrandingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockBrandSettings: BrandSettings = {
    clubId: 1,
    logoUrl: 'https://example.com/logo.png',
    faviconUrl: 'https://example.com/favicon.ico',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontFamily: 'Inter',
    customCSS: '.custom { color: blue; }',
    whiteLabelDomain: 'club.example.com',
    facebookUrl: 'https://facebook.com/club',
    twitterUrl: 'https://twitter.com/club',
    instagramUrl: 'https://instagram.com/club',
    linkedInUrl: 'https://linkedin.com/company/club',
    youTubeUrl: 'https://youtube.com/club',
    websiteUrl: 'https://example.com',
    hideGatherGroveBranding: true,
    customFooterText: 'Copyright 2025 Test Club',
    customClubName: 'Test Club',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  };

  const mockLogoResponse = {
    logoUrl: 'https://example.com/new-logo.png',
    uploadedAt: '2025-01-15T10:30:00Z',
    fileSizeBytes: 1024000,
    contentType: 'image/png',
  };

  const mockFaviconResponse = {
    faviconUrl: 'https://example.com/new-favicon.ico',
    uploadedAt: '2025-01-15T10:30:00Z',
    fileSizeBytes: 32000,
    contentType: 'image/x-icon',
  };

  describe('getBrandSettings', () => {
    it('should fetch brand settings successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBrandSettings });

      const result = await brandingService.getBrandSettings(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/branding`);
      expect(result).toEqual(mockBrandSettings);
    });

    it('should return settings with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBrandSettings });

      const result = await brandingService.getBrandSettings(clubId);

      expect(result.primaryColor).toBe('#3B82F6');
      expect(result.fontFamily).toBe('Inter');
      expect(result.hideGatherGroveBranding).toBe(true);
      expect(result.customClubName).toBe('Test Club');
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(brandingService.getBrandSettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(brandingService.getBrandSettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(brandingService.getBrandSettings(clubId)).rejects.toBeDefined();
    });
  });

  describe('saveBrandSettings', () => {
    const saveRequest: SaveBrandSettingsRequest = {
      primaryColor: '#FF5733',
      secondaryColor: '#33FF57',
      fontFamily: 'Roboto',
      customClubName: 'Updated Club Name',
    };

    it('should save brand settings successfully', async () => {
      const updatedSettings = { ...mockBrandSettings, ...saveRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await brandingService.saveBrandSettings(clubId, saveRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/branding`,
        saveRequest
      );
      expect(result.primaryColor).toBe('#FF5733');
    });

    it('should throw error on invalid data (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(brandingService.saveBrandSettings(clubId, saveRequest)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(brandingService.saveBrandSettings(clubId, saveRequest)).rejects.toBeDefined();
    });

    it('should throw error on file too large (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload Too Large' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(brandingService.saveBrandSettings(clubId, saveRequest)).rejects.toBeDefined();
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLogoResponse });
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });

      const result = await brandingService.uploadLogo(clubId, file);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/branding/upload`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockLogoResponse);
    });

    it('should return upload details', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLogoResponse });
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });

      const result = await brandingService.uploadLogo(clubId, file);

      expect(result.logoUrl).toBe('https://example.com/new-logo.png');
      expect(result.contentType).toBe('image/png');
      expect(result.fileSizeBytes).toBe(1024000);
    });

    it('should create FormData with file', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLogoResponse });
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });

      await brandingService.uploadLogo(clubId, file);

      const callArgs = mockApiClient.post.mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('file')).toEqual(file);
    });

    it('should throw error on file too large (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload Too Large' } } };
      mockApiClient.post.mockRejectedValue(error);
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });

      await expect(brandingService.uploadLogo(clubId, file)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });

      await expect(brandingService.uploadLogo(clubId, file)).rejects.toBeDefined();
    });
  });

  describe('uploadFavicon', () => {
    it('should upload favicon successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockFaviconResponse });
      const file = new File(['dummy content'], 'favicon.ico', { type: 'image/x-icon' });

      const result = await brandingService.uploadFavicon(clubId, file);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/branding/favicon/upload`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockFaviconResponse);
    });

    it('should return favicon upload details', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockFaviconResponse });
      const file = new File(['dummy content'], 'favicon.ico', { type: 'image/x-icon' });

      const result = await brandingService.uploadFavicon(clubId, file);

      expect(result.faviconUrl).toBe('https://example.com/new-favicon.ico');
      expect(result.contentType).toBe('image/x-icon');
    });

    it('should throw error on file too large (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload Too Large' } } };
      mockApiClient.post.mockRejectedValue(error);
      const file = new File(['dummy content'], 'favicon.ico', { type: 'image/x-icon' });

      await expect(brandingService.uploadFavicon(clubId, file)).rejects.toBeDefined();
    });
  });

  describe('resetBrandSettings', () => {
    it('should reset brand settings successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await brandingService.resetBrandSettings(clubId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/clubs/${clubId}/branding`);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(brandingService.resetBrandSettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network Error'));

      await expect(brandingService.resetBrandSettings(clubId)).rejects.toBeDefined();
    });
  });

  describe('createBrandSettings', () => {
    const createRequest: SaveBrandSettingsRequest = {
      primaryColor: '#3B82F6',
      customClubName: 'New Club',
    };

    it('should create brand settings successfully', async () => {
      const createdSettings = { ...mockBrandSettings, ...createRequest };
      mockApiClient.post.mockResolvedValue({ data: createdSettings });

      const result = await brandingService.createBrandSettings(clubId, createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/branding`,
        createRequest
      );
      expect(result.customClubName).toBe('New Club');
    });

    it('should throw error when settings already exist (409)', async () => {
      const error = { response: { status: 409, data: { message: 'Conflict' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(brandingService.createBrandSettings(clubId, createRequest)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(brandingService.createBrandSettings(clubId, createRequest)).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export brandingService instance', () => {
      expect(brandingService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof brandingService.getBrandSettings).toBe('function');
      expect(typeof brandingService.saveBrandSettings).toBe('function');
      expect(typeof brandingService.uploadLogo).toBe('function');
      expect(typeof brandingService.uploadFavicon).toBe('function');
      expect(typeof brandingService.resetBrandSettings).toBe('function');
      expect(typeof brandingService.createBrandSettings).toBe('function');
    });
  });
});
