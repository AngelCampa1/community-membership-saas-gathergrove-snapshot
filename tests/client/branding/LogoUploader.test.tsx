import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoUploader } from '../../../client/src/components/branding/LogoUploader';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/png;base64,mock-data',
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((event: ProgressEvent<FileReader>) => void) | null
};

global.FileReader = jest.fn(() => mockFileReader) as any;

describe('LogoUploader', () => {
  const mockOnLogoChange = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    onLogoChange: mockOnLogoChange,
    onError: mockOnError,
    currentLogo: null,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    acceptedFormats: ['image/jpeg', 'image/png', 'image/svg+xml']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.readAsDataURL.mockClear();
  });

  describe('Component Rendering', () => {
    it('renders upload area with proper styling', () => {
      render(<LogoUploader {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button', { name: /upload logo/i });
      expect(uploadArea).toBeInTheDocument();
      expect(uploadArea).toHaveClass('border-dashed', 'border-2');
    });

    it('displays upload instructions and file requirements', () => {
      render(<LogoUploader {...defaultProps} />);
      
      expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/png, jpg, svg up to 2mb/i)).toBeInTheDocument();
    });

    it('shows current logo when provided', () => {
      const propsWithLogo = {
        ...defaultProps,
        currentLogo: 'https://example.com/logo.png'
      };
      
      render(<LogoUploader {...propsWithLogo} />);
      
      const currentLogo = screen.getByAltText(/current logo/i);
      expect(currentLogo).toBeInTheDocument();
      expect(currentLogo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('displays remove button when logo exists', () => {
      const propsWithLogo = {
        ...defaultProps,
        currentLogo: 'https://example.com/logo.png'
      };
      
      render(<LogoUploader {...propsWithLogo} />);
      
      const removeButton = screen.getByRole('button', { name: /remove logo/i });
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('File Upload Functionality', () => {
    it('handles file selection via input', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(validFile);
    });

    it('processes valid file and calls onLogoChange', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({} as ProgressEvent<FileReader>);
      }
      
      await waitFor(() => {
        expect(mockOnLogoChange).toHaveBeenCalledWith({
          file: validFile,
          preview: mockFileReader.result
        });
      });
    });

    it('handles drag and drop upload', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button', { name: /upload logo/i });
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-primary');

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [validFile]
        }
      });
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(validFile);
    });

    it('resets drag state on drag leave', () => {
      render(<LogoUploader {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button', { name: /upload logo/i });
      
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-primary');

      fireEvent.dragLeave(uploadArea);
      expect(uploadArea).not.toHaveClass('border-primary');
    });
  });

  describe('File Validation', () => {
    it('rejects files exceeding size limit', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const oversizedFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, oversizedFile);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File size must be less than')
      );
      expect(mockOnLogoChange).not.toHaveBeenCalled();
    });

    it('rejects invalid file types', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      
      await userEvent.upload(fileInput, invalidFile);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type')
      );
      expect(mockOnLogoChange).not.toHaveBeenCalled();
    });

    it('accepts valid image formats', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFormats = [
        new File(['test'], 'logo.png', { type: 'image/png' }),
        new File(['test'], 'logo.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'logo.svg', { type: 'image/svg+xml' })
      ];
      
      for (const file of validFormats) {
        await userEvent.upload(fileInput, file);
        expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
      }
    });

    it('validates image dimensions when specified', async () => {
      const propsWithDimensions = {
        ...defaultProps,
        maxWidth: 500,
        maxHeight: 300
      };
      
      render(<LogoUploader {...propsWithDimensions} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      // Mock Image constructor
      const mockImage = {
        width: 600,
        height: 400,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      await userEvent.upload(fileInput, validFile);
      
      // Simulate image load with oversized dimensions
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('Image dimensions exceed maximum')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles file read errors', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      // Simulate FileReader error
      if (mockFileReader.onerror) {
        mockFileReader.onerror({} as ProgressEvent<FileReader>);
      }
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read file')
      );
    });

    it('handles image load errors for dimension validation', async () => {
      const propsWithDimensions = {
        ...defaultProps,
        maxWidth: 500,
        maxHeight: 300
      };
      
      render(<LogoUploader {...propsWithDimensions} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      const mockImage = {
        width: 0,
        height: 0,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      await userEvent.upload(fileInput, validFile);
      
      // Simulate FileReader success first
      if (mockFileReader.onload) {
        mockFileReader.onload({} as ProgressEvent<FileReader>);
      }
      
      // Then simulate image load error
      if (mockImage.onerror) {
        mockImage.onerror();
      }
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to validate image')
        );
      });
    });
  });

  describe('Logo Management', () => {
    it('removes current logo when remove button is clicked', async () => {
      const propsWithLogo = {
        ...defaultProps,
        currentLogo: 'https://example.com/logo.png'
      };
      
      render(<LogoUploader {...propsWithLogo} />);
      
      const removeButton = screen.getByRole('button', { name: /remove logo/i });
      await userEvent.click(removeButton);
      
      expect(mockOnLogoChange).toHaveBeenCalledWith(null);
    });

    it('shows preview of selected file before upload', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({} as ProgressEvent<FileReader>);
      }
      
      await waitFor(() => {
        const preview = screen.getByAltText(/logo preview/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', mockFileReader.result);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const uploadArea = screen.getByRole('button');
      
      expect(fileInput).toHaveAttribute('aria-describedby');
      expect(uploadArea).toHaveAttribute('aria-describedby');
    });

    it('supports keyboard navigation', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button', { name: /upload logo/i });
      
      uploadArea.focus();
      expect(uploadArea).toHaveFocus();
      
      // Test Enter key activation
      fireEvent.keyDown(uploadArea, { key: 'Enter', code: 'Enter' });
      const fileInput = screen.getByLabelText(/upload logo/i);
      expect(fileInput).toHaveFocus();
    });

    it('provides screen reader friendly feedback', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const oversizedFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, oversizedFile);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner during file processing', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      // Should show loading state before FileReader onload
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('disables upload area during processing', async () => {
      render(<LogoUploader {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload logo/i);
      const uploadArea = screen.getByRole('button', { name: /upload logo/i });
      const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, validFile);
      
      expect(uploadArea).toHaveClass('opacity-50', 'pointer-events-none');
    });
  });
});
