/**
 * @jest-environment jsdom
 *
 * File Upload Service Tests
 *
 * Tests file upload functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (validation, FormData handling, URL creation)
 */

import { fileUploadService, UploadedFile } from '../fileUploadService';
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

// Mock URL methods
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

describe('FileUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup URL mock
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/test-url');
  });

  // Mock response data
  const mockUploadedFile: UploadedFile = {
    id: 'file-123',
    filename: 'uploaded-file.png',
    originalName: 'my-image.png',
    mimeType: 'image/png',
    size: 1024000,
    url: 'https://storage.example.com/file-123.png',
    thumbnailUrl: 'https://storage.example.com/thumb-123.png',
  };

  // Helper to create test files
  const createTestFile = (
    name: string,
    type: string,
    size: number = 1024
  ): File => {
    const content = new Array(size).fill('a').join('');
    return new File([content], name, { type });
  };

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockUploadedFile });
      const file = createTestFile('test.png', 'image/png');

      const result = await fileUploadService.uploadFile(file);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/files/upload',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockUploadedFile);
    });

    it('should include file in FormData', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockUploadedFile });
      const file = createTestFile('test.png', 'image/png');

      await fileUploadService.uploadFile(file);

      const callArgs = mockApiClient.post.mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('file')).toEqual(file);
    });

    it('should include generateThumbnail when requested', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockUploadedFile });
      const file = createTestFile('test.png', 'image/png');

      await fileUploadService.uploadFile(file, { generateThumbnail: true });

      const callArgs = mockApiClient.post.mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('generateThumbnail')).toBe('true');
    });

    it('should reject file exceeding default size limit (2MB)', async () => {
      const largeFile = createTestFile('large.png', 'image/png', 3 * 1024 * 1024);

      await expect(fileUploadService.uploadFile(largeFile)).rejects.toThrow(
        'File size must be less than 2MB'
      );
    });

    it('should reject file exceeding custom size limit', async () => {
      const file = createTestFile('medium.png', 'image/png', 2 * 1024 * 1024);

      await expect(
        fileUploadService.uploadFile(file, { maxSizeBytes: 1 * 1024 * 1024 })
      ).rejects.toThrow('File size must be less than 1MB');
    });

    it('should reject invalid file type with default allowed types', async () => {
      const file = createTestFile('document.pdf', 'application/pdf');

      await expect(fileUploadService.uploadFile(file)).rejects.toThrow(
        'Invalid file type. Allowed types: image/jpeg, image/png, image/svg+xml'
      );
    });

    it('should accept file with custom allowed types', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockUploadedFile });
      const file = createTestFile('document.pdf', 'application/pdf');

      await fileUploadService.uploadFile(file, {
        allowedTypes: ['application/pdf'],
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should throw error on invalid file format (400)', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 400, data: { message: 'Bad Request' } },
      });
      const file = createTestFile('test.png', 'image/png');

      await expect(fileUploadService.uploadFile(file)).rejects.toBeDefined();
    });

    it('should throw error on file too large (413)', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 413, data: { message: 'Payload Too Large' } },
      });
      const file = createTestFile('test.png', 'image/png');

      await expect(fileUploadService.uploadFile(file)).rejects.toBeDefined();
    });

    it('should throw error on unsupported type (415)', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 415, data: { message: 'Unsupported Media Type' } },
      });
      const file = createTestFile('test.png', 'image/png');

      await expect(fileUploadService.uploadFile(file)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));
      const file = createTestFile('test.png', 'image/png');

      await expect(fileUploadService.uploadFile(file)).rejects.toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await fileUploadService.deleteFile('file-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/files/file-123');
    });

    it('should throw error when file not found (404)', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: { status: 404, data: { message: 'Not Found' } },
      });

      await expect(fileUploadService.deleteFile('nonexistent')).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network Error'));

      await expect(fileUploadService.deleteFile('file-123')).rejects.toBeDefined();
    });
  });

  describe('validateImageDimensions', () => {
    // Create a mock Image for testing
    const createMockImage = (width: number, height: number) => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        width,
        height,
      };

      // Override Image constructor
      jest.spyOn(global, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      return mockImage;
    };

    it('should validate image dimensions successfully', async () => {
      createMockImage(800, 600);
      const file = createTestFile('test.png', 'image/png');

      const result = await fileUploadService.validateImageDimensions(file);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should pass when dimensions are within limits', async () => {
      createMockImage(500, 400);
      const file = createTestFile('test.png', 'image/png');

      const result = await fileUploadService.validateImageDimensions(file, 1000, 1000);

      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
    });

    it('should reject when width exceeds maximum', async () => {
      createMockImage(1500, 600);
      const file = createTestFile('test.png', 'image/png');

      await expect(
        fileUploadService.validateImageDimensions(file, 1000)
      ).rejects.toThrow('Image width (1500px) exceeds maximum (1000px)');
    });

    it('should reject when height exceeds maximum', async () => {
      createMockImage(800, 1200);
      const file = createTestFile('test.png', 'image/png');

      await expect(
        fileUploadService.validateImageDimensions(file, undefined, 1000)
      ).rejects.toThrow('Image height (1200px) exceeds maximum (1000px)');
    });

    it('should handle image load error', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      const file = createTestFile('test.png', 'image/png');

      await expect(fileUploadService.validateImageDimensions(file)).rejects.toThrow(
        'Failed to validate image'
      );
    });

    it('should revoke object URL after validation', async () => {
      createMockImage(800, 600);
      const file = createTestFile('test.png', 'image/png');

      await fileUploadService.validateImageDimensions(file);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-url');
    });
  });

  describe('createPreviewUrl', () => {
    it('should create preview URL for file', () => {
      const file = createTestFile('test.png', 'image/png');

      const result = fileUploadService.createPreviewUrl(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(result).toBe('blob:http://localhost/test-url');
    });
  });

  describe('revokePreviewUrl', () => {
    it('should revoke preview URL', () => {
      const url = 'blob:http://localhost/test-url';

      fileUploadService.revokePreviewUrl(url);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });
  });

  describe('service export', () => {
    it('should export fileUploadService instance', () => {
      expect(fileUploadService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof fileUploadService.uploadFile).toBe('function');
      expect(typeof fileUploadService.deleteFile).toBe('function');
      expect(typeof fileUploadService.validateImageDimensions).toBe('function');
      expect(typeof fileUploadService.createPreviewUrl).toBe('function');
      expect(typeof fileUploadService.revokePreviewUrl).toBe('function');
    });
  });
});
