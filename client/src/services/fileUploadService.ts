import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface FileUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export const fileUploadService = {
  /**
   * Upload a file to the server
   */
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<UploadedFile> {
    // Validate file size
    const maxSize = options.maxSizeBytes || 2 * 1024 * 1024; // Default 2MB
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    // Validate file type
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.generateThumbnail) {
        formData.append('generateThumbnail', 'true');
      }
      
      const response = await apiClient.post<UploadedFile>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'uploading file',
        action: 'Please try again with a different file',
        customMessages: {
          400: 'Invalid file format or corrupted file',
          413: 'File is too large. Please use a smaller file.',
          415: 'File type is not supported'
        }
      });
    }
  },
  
  /**
   * Delete an uploaded file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await apiClient.delete(`/files/${fileId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting file',
        action: 'Please try again'
      });
    }
  },
  
  /**
   * Validate image dimensions
   */
  validateImageDimensions(file: File, maxWidth?: number, maxHeight?: number): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        if (maxWidth && img.width > maxWidth) {
          reject(new Error(`Image width (${img.width}px) exceeds maximum (${maxWidth}px)`));
          return;
        }
        
        if (maxHeight && img.height > maxHeight) {
          reject(new Error(`Image height (${img.height}px) exceeds maximum (${maxHeight}px)`));
          return;
        }
        
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to validate image'));
      };
      
      img.src = url;
    });
  },
  
  /**
   * Create file preview URL
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },
  
  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
};
