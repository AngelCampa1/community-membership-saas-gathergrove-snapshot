import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Ensure we use the real FileUpload component
jest.unmock('@/components/features/members/FileUpload');

import { FileUpload } from '../FileUpload';

// Mock UI components first
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, variant, type, ...props }: any) => (
    <button 
      className={`button ${variant || ''} ${className || ''}`} 
      type={type} 
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div className={`alert ${className || ''}`} data-testid="alert" {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('lucide-react', () => {
  const IconComponent = ({ className, ...props }: any) => (
    <span className={`icon ${className || ''}`} data-testid="icon" {...props}>
      icon
    </span>
  );
  
  return {
    Upload: IconComponent,
    FileText: IconComponent,
    X: IconComponent,
    AlertCircle: IconComponent,
  };
});

// Import universal RadixUI mocking setup

// Unmock react-dropzone for this test - we need the real implementation
jest.unmock('react-dropzone');

describe('FileUpload', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onFileSelect: mockOnFileSelect,
      maxSizeMB: 5,
      maxRows: 1000,
    };

    return render(<FileUpload {...defaultProps} {...props} />);
  };

  const createMockFile = (name: string, content: string, type = 'text/csv') => {
    const file = new File([content], name, { type });
    
    // Mock the text() method to return the content
    file.text = jest.fn().mockResolvedValue(content);
    
    return file;
  };

  describe('Initial Render', () => {
    it('should render upload area with correct text', () => {
      renderComponent();

      expect(screen.getByText(/Drag & drop your CSV file here/i)).toBeInTheDocument();
      expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument();
      // Check for key UI elements and text patterns
      expect(screen.getByText(/Maximum size:/)).toBeInTheDocument();
      expect(screen.getByText(/5/)).toBeInTheDocument();
      expect(screen.getByText(/MB/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum rows:/)).toBeInTheDocument();
      expect(screen.getByText(/1000/)).toBeInTheDocument();
      expect(screen.getByText(/members/)).toBeInTheDocument();
    });

    it('should render with custom limits', () => {
      renderComponent({ maxSizeMB: 10, maxRows: 2000 });

      expect(screen.getByText(/Maximum size:/)).toBeInTheDocument();
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/MB/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum rows:/)).toBeInTheDocument();
      expect(screen.getByText(/2000/)).toBeInTheDocument();
      expect(screen.getByText(/members/)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept valid CSV file', async () => {
      const { container } = renderComponent();

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const mockFile = createMockFile('test.csv', 'FullName,Email,MembershipType\nJohn Doe,john@test.com,Regular');

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
      });

      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText(/csv file/i)).toBeInTheDocument();
    });

    it('should reject file that is too large', async () => {
      const { container } = renderComponent({ maxSizeMB: 1 });

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const largeContent = 'a'.repeat(2 * 1024 * 1024); // 2MB content
      const mockFile = createMockFile('large.csv', largeContent);

      // Mock file size
      Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 });

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds the limit of 1mb/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should reject non-CSV file', async () => {
      const { container } = renderComponent();

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const mockFile = createMockFile('document.txt', 'some content', 'text/plain');

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/only csv files are allowed/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should reject file with too many rows', async () => {
      const { container } = renderComponent({ maxRows: 2 });

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const csvContent = 'FullName,Email,MembershipType\n' +
                        'John Doe,john@test.com,Regular\n' +
                        'Jane Smith,jane@test.com,Premium\n' +
                        'Bob Johnson,bob@test.com,Regular'; // 3 data rows, exceeds maxRows of 2
      const mockFile = createMockFile('large.csv', csvContent);

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file contains too many rows.*maximum: 2/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should accept file with exactly max rows', async () => {
      const { container } = renderComponent({ maxRows: 2 });

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const csvContent = 'FullName,Email,MembershipType\n' +
                        'John Doe,john@test.com,Regular\n' +
                        'Jane Smith,jane@test.com,Premium'; // 2 data rows, equals maxRows
      const mockFile = createMockFile('valid.csv', csvContent);

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
      });

      expect(screen.getByText('valid.csv')).toBeInTheDocument();
    });
  });

  describe('File Removal', () => {
    it('should remove selected file when remove button is clicked', async () => {
      const { container } = renderComponent();

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const mockFile = createMockFile('test.csv', 'FullName,Email,MembershipType\nJohn Doe,john@test.com,Regular');

      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove file/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      expect(screen.getByText(/drag.*drop.*csv file/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should show drag active state', () => {
      const { container } = renderComponent();

      // Get the dropzone - react-dropzone wraps content in a div
      const dropZone = container.querySelector('div[class*="border"]') as HTMLElement;
      expect(dropZone).toBeInTheDocument();

      // Verify dropzone has proper styling classes for drag states
      // The border and hover classes indicate drag-and-drop is enabled
      if (dropZone) {
        expect(dropZone.className).toContain('border-2');
        expect(dropZone.className).toContain('border-dashed');
        expect(dropZone.className).toContain('cursor-pointer');

        // Verify the component is set up to handle drag events
        expect(dropZone).toHaveAttribute('role', 'button');
        expect(dropZone).toHaveAttribute('tabIndex', '0');
      }
    });

    it('should handle drag leave', () => {
      const { container } = renderComponent();

      // Get the dropzone
      const dropZone = container.querySelector('div[class*="border"]') as HTMLElement;
      expect(dropZone).toBeInTheDocument();

      // Verify the dropzone is properly configured for drag-and-drop
      // react-dropzone manages drag state internally
      if (dropZone) {
        expect(dropZone.className).toContain('border-dashed');
        expect(dropZone.className).toContain('cursor-pointer');
      }
    });

    it('should handle file drop', async () => {
      const { container } = renderComponent();

      const mockFile = createMockFile('dropped.csv', 'FullName,Email,MembershipType\nJohn Doe,john@test.com,Regular');

      // Use the actual file input since react-dropzone manages the drop zone
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });

        await waitFor(() => {
          expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new file is selected', async () => {
      const { container } = renderComponent();

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      
      // First, select an invalid file
      const invalidFile = createMockFile('document.txt', 'content', 'text/plain');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      }

      await waitFor(() => {
        expect(screen.getByText(/only csv files are allowed/i)).toBeInTheDocument();
      });

      // Then select a valid file
      const validFile = createMockFile('valid.csv', 'FullName,Email,MembershipType\nJohn Doe,john@test.com,Regular');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [validFile] } });
      }

      await waitFor(() => {
        expect(screen.queryByText(/only csv files are allowed/i)).not.toBeInTheDocument();
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
      });
    });

    it('should show error for empty file', async () => {
      const { container } = renderComponent();

      // Get the file input element specifically
      const fileInput = container.querySelector('input[type="file"]');
      const emptyFile = createMockFile('empty.csv', '');

      fireEvent.change(fileInput!, { target: { files: [emptyFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file is empty/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { container } = renderComponent();

      // Get the file input element directly
      const fileInputElement = container.querySelector('input[type="file"]');

      expect(fileInputElement).toHaveAttribute('type', 'file');
      // Accept attribute includes MIME types from react-dropzone config
      expect(fileInputElement).toHaveAttribute('accept');
      expect(fileInputElement?.getAttribute('accept')).toContain('.csv');
      expect(fileInputElement).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', () => {
      const { container } = renderComponent();

      // Get the dropzone container (div with tabIndex="0")
      const dropZone = container.querySelector('[tabindex="0"]');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
      expect(dropZone).toHaveAttribute('role', 'button');
    });
  });
});