import { profileService, UpdateProfileRequest, ChangePasswordRequest } from '../profileService';
import apiClient from '../apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';

// Mock the API client
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock the ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateProfile', () => {
    const mockRequest: UpdateProfileRequest = {
      fullName: 'Jane Smith',
    };

    const mockResponse = {
      message: 'Profile updated successfully!',
    };

    it('should successfully update profile', async () => {
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await profileService.updateProfile(mockRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/profile', mockRequest);
      expect(result).toEqual(mockResponse);
    });

      it('should handle API errors and re-throw them', async () => {
    const mockError = new Error('Network error');
    const mockApiError = new ApiErrorClass('Error updating your profile', 0, ErrorTypes.NETWORK_ERROR);
    
    mockApiClient.put.mockRejectedValue(mockError);
    mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

    await expect(profileService.updateProfile(mockRequest)).rejects.toEqual(mockApiError);
    
    expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/profile', mockRequest);
    expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(mockError, expect.any(Object));
  });

    it('should handle HTTP error responses', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid input' }
        }
      };
      const mockApiError = new ApiErrorClass('Error updating your profile: Please enter a valid full name', 400, ErrorTypes.VALIDATION_ERROR);
      
      mockApiClient.put.mockRejectedValue(mockError);
      mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

      await expect(profileService.updateProfile(mockRequest)).rejects.toEqual(mockApiError);
      
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });

    it('should handle empty full name', async () => {
      const emptyRequest: UpdateProfileRequest = {
        fullName: '',
      };
      
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      await profileService.updateProfile(emptyRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/profile', emptyRequest);
    });

    it('should handle very long full name', async () => {
      const longNameRequest: UpdateProfileRequest = {
        fullName: 'a'.repeat(100), // Maximum allowed length
      };
      
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      await profileService.updateProfile(longNameRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/profile', longNameRequest);
    });
  });

  describe('changePassword', () => {
    const mockRequest: ChangePasswordRequest = {
      currentPassword: 'oldPassword123!',
      newPassword: 'newPassword456@',
    };

    const mockResponse = {
      message: 'Password changed successfully!',
    };

    it('should successfully change password', async () => {
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await profileService.changePassword(mockRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/change-password', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should handle incorrect current password error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Current password is incorrect' }
        }
      };
      const mockApiError = new ApiErrorClass('Error changing your password: Current password is incorrect', 401, ErrorTypes.AUTHENTICATION_ERROR);
      
      mockApiClient.put.mockRejectedValue(mockError);
      mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

      await expect(profileService.changePassword(mockRequest)).rejects.toEqual(mockApiError);
      
      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/change-password', mockRequest);
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });

    it('should handle weak password validation error', async () => {
      const weakPasswordRequest: ChangePasswordRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'weak',
      };

      const mockError = {
        response: {
          status: 400,
          data: { message: 'Password does not meet requirements' }
        }
      };
      const mockApiError = new ApiErrorClass('Error changing your password: Please enter a valid current password and new password', 400, ErrorTypes.VALIDATION_ERROR);
      
      mockApiClient.put.mockRejectedValue(mockError);
      mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

      await expect(profileService.changePassword(weakPasswordRequest)).rejects.toEqual(mockApiError);
      
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      const mockApiError = new ApiErrorClass('Error changing your password', 0, ErrorTypes.NETWORK_ERROR);
      
      mockApiClient.put.mockRejectedValue(networkError);
      mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

      await expect(profileService.changePassword(mockRequest)).rejects.toEqual(mockApiError);
      
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(networkError, expect.any(Object));
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      const mockApiError = new ApiErrorClass('Error changing your password: Server error occurred', 500, ErrorTypes.SERVER_ERROR);
      
      mockApiClient.put.mockRejectedValue(serverError);
      mockErrorHandler.handleApiError.mockReturnValue(mockApiError);

      await expect(profileService.changePassword(mockRequest)).rejects.toEqual(mockApiError);
      
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(serverError, expect.any(Object));
    });

    it('should handle request with strong password', async () => {
      const strongPasswordRequest: ChangePasswordRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'VeryStrong@Password456#',
      };
      
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await profileService.changePassword(strongPasswordRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/change-password', strongPasswordRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('API endpoint validation', () => {
    it('should use correct endpoint for profile updates', async () => {
      const request: UpdateProfileRequest = { fullName: 'Test User' };
      mockApiClient.put.mockResolvedValue({ data: { message: 'Success' } });

      await profileService.updateProfile(request);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/profile', request);
    });

    it('should use correct endpoint for password changes', async () => {
      const request: ChangePasswordRequest = {
        currentPassword: 'old',
        newPassword: 'new',
      };
      mockApiClient.put.mockResolvedValue({ data: { message: 'Success' } });

      await profileService.changePassword(request);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me/change-password', request);
    });
  });

  describe('TypeScript type safety', () => {
    it('should enforce UpdateProfileRequest structure', () => {
      const validRequest: UpdateProfileRequest = {
        fullName: 'Valid Name',
      };

      // This should compile without errors
      expect(validRequest.fullName).toBe('Valid Name');
    });

    it('should enforce ChangePasswordRequest structure', () => {
      const validRequest: ChangePasswordRequest = {
        currentPassword: 'current123!',
        newPassword: 'new456@',
      };

      // This should compile without errors
      expect(validRequest.currentPassword).toBe('current123!');
      expect(validRequest.newPassword).toBe('new456@');
    });
  });
}); 