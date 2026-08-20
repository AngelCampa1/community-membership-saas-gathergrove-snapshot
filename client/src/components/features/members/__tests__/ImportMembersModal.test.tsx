import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportMembersModal } from '../ImportMembersModal';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';
import { validateImportSize } from '@/utils/memberUtils';

const mockApiClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

// Apply proven RadixUI mock patterns

// Mock ReactDOM createPortal to render in place instead of using portals
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock UI Dialog components using proven pattern
jest.mock('@/components/ui/dialog', () => ({
  Dialog: React.forwardRef<HTMLDivElement, any>(function Dialog({ children, open, ...props }, ref) {
    return open ? React.createElement('div', { ref, 'data-testid': 'dialog-root', ...props }, children) : null;
  }),
  DialogContent: React.forwardRef<HTMLDivElement, any>(function DialogContent({ children, className, ...props }, ref) {
    const { onOpenChange: _, ...restProps } = props;
    return React.createElement('div', { 
      ref,
      className: `dialog-content ${className || ''}`, 
      'data-testid': 'dialog-content',
      ...restProps 
    }, children);
  }),
  DialogHeader: React.forwardRef<HTMLDivElement, any>(function DialogHeader({ children, className, ...props }, ref) {
    return React.createElement('div', { 
      ref,
      className: `dialog-header ${className || ''}`, 
      'data-testid': 'dialog-header',
      ...props 
    }, children);
  }),
  DialogTitle: React.forwardRef<HTMLHeadingElement, any>(function DialogTitle({ children, className, ...props }, ref) {
    return React.createElement('h2', { 
      ref,
      className: `dialog-title ${className || ''}`, 
      'data-testid': 'dialog-title',
      ...props 
    }, children);
  }),
  DialogDescription: React.forwardRef<HTMLParagraphElement, any>(function DialogDescription({ children, className, ...props }, ref) {
    return React.createElement('p', { 
      ref,
      className: `dialog-description ${className || ''}`, 
      'data-testid': 'dialog-description',
      ...props 
    }, children);
  }),
  DialogFooter: React.forwardRef<HTMLDivElement, any>(function DialogFooter({ children, className, ...props }, ref) {
    return React.createElement('div', { 
      ref,
      className: `dialog-footer ${className || ''}`, 
      'data-testid': 'dialog-footer',
      ...props 
    }, children);
  }),
}));

// Mock UI Button component using proven pattern
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, variant, size, asChild, ...props }, ref) => {
    if (asChild && children) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        className={`button ${variant || ''} ${size || ''} ${className || ''}`}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  })
}));

// Mock UI Alert components using proven pattern
jest.mock('@/components/ui/alert', () => ({
  Alert: React.forwardRef<HTMLDivElement, any>(function Alert({ children, variant, className, ...props }, ref) {
    return React.createElement('div', {
      ref,
      className: `alert ${variant || ''} ${className || ''}`,
      'data-testid': 'alert',
      ...props
    }, children);
  }),
  AlertDescription: React.forwardRef<HTMLDivElement, any>(function AlertDescription({ children, className, ...props }, ref) {
    return React.createElement('div', {
      ref,
      className: `alert-description ${className || ''}`,
      'data-testid': 'alert-description',
      ...props
    }, children);
  }),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    
  },
}));

// Mock ONLY the HTTP boundary (apiClient). The real memberImportService runs,
// so these tests exercise the actual component -> service -> apiClient wiring
// (W-017: the modal previously used raw fetch to a relative /api/v1 URL that
// resolved to the Next.js origin instead of the backend).
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      userId: 'test-user-id',
      clubId: 123,
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'Admin',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }),
}));

// Mock local components
jest.mock('../FileUpload', () => ({
  FileUpload: ({ onFileSelect, ...props }: any) => (
    <div data-testid="file-upload" {...props}>
      <input type="file" onChange={(e) => onFileSelect?.(e.target.files?.[0])} />
    </div>
  ),
}));

jest.mock('../ValidationPreviewTest', () => ({
  ValidationPreviewTest: ({ data, ...props }: any) => (
    <div data-testid="validation-preview" {...props}>
      Validation Preview
    </div>
  ),
}));

jest.mock('../ImportProgress', () => ({
  ImportProgress: ({ progress, ...props }: any) => (
    <div data-testid="import-progress" data-progress={progress} {...props}>
      Import Progress: {progress}%
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent({ size = 16, className, ...props }, ref) {
    return React.createElement('span', {
      ref,
      className: `lucide-icon ${className || ''}`,
      'data-testid': 'lucide-icon',
      style: { width: size, height: size },
      ...props
    });
  });
  
  return {
    CheckCircle: IconComponent,
    AlertCircle: IconComponent,
    FileText: IconComponent,
    Upload: IconComponent,
    Play: IconComponent,
  };
});

// Mock utils
jest.mock('@/utils/memberUtils', () => ({
  validateImportSize: jest.fn(() => ({ isValid: true })),
}));

describe('ImportMembersModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    clubId: 123,
    onSuccess: jest.fn(),
  };

  // jsdom does not implement Blob/File async text(), and this project's jest
  // setup stubs FileReader without readAsText. The component reads file content
  // via file.text() before advancing to the validate step, so build CSV files
  // with a real text() resolving to known content.
  const makeCsvFile = (content: string, name = 'members.csv') => {
    const file = new File([content], name, { type: 'text/csv' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (file as any).text = () => Promise.resolve(content);
    return file;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // jest config uses resetMocks:true, which wipes factory implementations
    // between tests. Re-establish the size-validation pass-through each run.
    (validateImportSize as jest.Mock).mockReturnValue({ isValid: true });
  });

  it('should render the import members modal', () => {
    render(<ImportMembersModal {...defaultProps} />);

    // Basic test - check if the modal renders without crashing
    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
  });

  it('downloads the CSV template through apiClient against the backend (not a relative URL)', async () => {
    // jsdom does not implement object URL APIs used by the download path
    const createObjectURL = jest.fn(() => 'blob:mock');
    const revokeObjectURL = jest.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    mockApiClient.get.mockResolvedValueOnce({ data: new Blob(['csv'], { type: 'text/csv' }) });

    render(<ImportMembersModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Download CSV Template'));

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/clubs/123/members/import/template',
        { responseType: 'blob' }
      );
    });
    // Proves it is NOT a raw fetch to a relative origin
    expect(createObjectURL).toHaveBeenCalled();
  });

  it('validates then executes the import through apiClient with backend-correct paths', async () => {
    render(<ImportMembersModal {...defaultProps} />);

    // Select a CSV file -> advances to the "validate" step
    const file = makeCsvFile('FullName,Email\nJane,jane@example.com');
    const fileInput = screen.getByTestId('file-upload').querySelector('input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // validate call resolves a valid result
    mockApiClient.post.mockResolvedValueOnce({
      data: {
        isValid: true,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateEmails: 0,
        validationErrors: [],
        warnings: [],
      },
    });

    const validateBtn = await screen.findByText('Start Validation');
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/clubs/123/members/import/validate',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        })
      );
    });

    // execute call resolves a completed import
    mockApiClient.post.mockResolvedValueOnce({
      data: {
        importId: 'imp-1',
        status: 'completed',
        summary: { totalProcessed: 1, successful: 1, skipped: 0, failed: 0 },
        errors: [],
      },
    });

    const importBtn = await screen.findByText(/Import 1 Valid Members/);
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/clubs/123/members/import/execute',
        expect.objectContaining({
          csvData: expect.any(String),
          options: expect.objectContaining({
            skipDuplicates: true,
            skipInvalid: true,
            notifyMembers: false,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  it('surfaces a validation error returned by the backend', async () => {
    render(<ImportMembersModal {...defaultProps} />);

    const file = makeCsvFile('bad');
    const fileInput = screen.getByTestId('file-upload').querySelector('input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    mockApiClient.post.mockRejectedValueOnce(new Error('File must be a CSV file.'));

    const validateBtn = await screen.findByText('Start Validation');
    fireEvent.click(validateBtn);

    expect(await screen.findByText('File must be a CSV file.')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});