import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import CustomFieldsPage from '../page';
import { customFieldsService } from '@/services/customFieldsService';

// Import universal RadixUI mocking setup

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => React.createElement('svg', { 'data-testid': 'plus-icon' }),
  Edit2: () => React.createElement('svg', { 'data-testid': 'edit2-icon' }),
  Trash2: () => React.createElement('svg', { 'data-testid': 'trash2-icon' }),
  AlertCircle: () => React.createElement('svg', { 'data-testid': 'alert-circle-icon' }),
  FileText: () => React.createElement('svg', { 'data-testid': 'file-text-icon' }),
  X: () => React.createElement('svg', { 'data-testid': 'x-icon' }),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? React.createElement('div', { 'data-testid': 'dialog-root' }, children) : null,
  DialogTrigger: ({ children, asChild, ...props }: any) => {
    if (asChild && children) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement('button', { 'data-testid': 'dialog-trigger', ...props }, children);
  },
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange: _, ...restProps } = props;
    return React.createElement('div', {
      className: `dialog-content ${className || ''}`,
      'data-testid': 'dialog-content',
      ...restProps
    }, children);
  },
  DialogHeader: ({ children, className, ...props }: any) =>
    React.createElement('div', {
      className: `dialog-header ${className || ''}`,
      'data-testid': 'dialog-header',
      ...props
    }, children),
  DialogTitle: ({ children, className, ...props }: any) =>
    React.createElement('h2', {
      className: `dialog-title ${className || ''}`,
      'data-testid': 'dialog-title',
      ...props
    }, children),
  DialogDescription: ({ children, className, ...props }: any) =>
    React.createElement('p', {
      className: `dialog-description ${className || ''}`,
      'data-testid': 'dialog-description',
      ...props
    }, children),
  DialogFooter: ({ children, className, ...props }: any) =>
    React.createElement('div', {
      className: `dialog-footer ${className || ''}`,
      'data-testid': 'dialog-footer',
      ...props
    }, children),
}));

// Mock AlertDialog components
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'alert-dialog' }, children),
  AlertDialogTrigger: ({ children, asChild, ...props }: any) => {
    if (asChild && children) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement('button', { 'data-testid': 'alert-dialog-trigger', ...props }, children);
  },
  AlertDialogContent: ({ children, className, ...props }: any) =>
    React.createElement('div', {
      className: `alert-dialog-content ${className || ''}`,
      'data-testid': 'alert-dialog-content',
      ...props
    }, children),
  AlertDialogHeader: ({ children, className, ...props }: any) =>
    React.createElement('div', {
      className: `alert-dialog-header ${className || ''}`,
      'data-testid': 'alert-dialog-header',
      ...props
    }, children),
  AlertDialogTitle: ({ children, className, ...props }: any) =>
    React.createElement('h2', {
      className: `alert-dialog-title ${className || ''}`,
      'data-testid': 'alert-dialog-title',
      ...props
    }, children),
  AlertDialogDescription: ({ children, className, ...props }: any) =>
    React.createElement('p', {
      className: `alert-dialog-description ${className || ''}`,
      'data-testid': 'alert-dialog-description',
      ...props
    }, children),
  AlertDialogFooter: ({ children, className, ...props }: any) =>
    React.createElement('div', {
      className: `alert-dialog-footer ${className || ''}`,
      'data-testid': 'alert-dialog-footer',
      ...props
    }, children),
  AlertDialogAction: ({ children, className, ...props }: any) =>
    React.createElement('button', {
      className: `alert-dialog-action ${className || ''}`,
      'data-testid': 'alert-dialog-action',
      ...props
    }, children),
  AlertDialogCancel: ({ children, className, ...props }: any) =>
    React.createElement('button', {
      className: `alert-dialog-cancel ${className || ''}`,
      'data-testid': 'alert-dialog-cancel',
      ...props
    }, children),
}));

// Mock dependencies
jest.mock('@/hooks/useAuth');

// Mock customFieldsService - preserve all actual exports and types
jest.mock('@/services/customFieldsService', () => {
  const actual = jest.requireActual('@/services/customFieldsService');
  
  // Create mock service instance
  const mockService = {
    getCustomFields: jest.fn().mockResolvedValue([]),
    createCustomField: jest.fn(),
    updateCustomField: jest.fn(),
    deleteCustomField: jest.fn(),
  };
  
  return {
    ...actual, // Preserve all types and named exports
    default: mockService, // Mock the default export (service instance)
    customFieldsService: mockService, // Mock the named export
  };
});

// Mock auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      role: 'Admin',
    },
    loading: false,
    error: null,
  }),
}));

describe('Custom Fields Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(customFieldsService.getCustomFields).mockResolvedValue([]);
  });

  it('should render custom fields page', async () => {
    render(<CustomFieldsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/custom member fields/i)).toBeInTheDocument();
    });
  });

  it('should load custom fields on mount', async () => {
    const mockFields = [
      { 
        id: 1, 
        clubId: 1,
        fieldName: 'Emergency Contact',
        fieldLabel: 'Emergency Contact', 
        fieldType: 'text' as const, 
        fieldOptions: undefined,
        isRequired: true,
        isActive: true,
        sortOrder: 1,
        memberCount: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      { 
        id: 2, 
        clubId: 1,
        fieldName: 'Dietary Restrictions',
        fieldLabel: 'Dietary Restrictions', 
        fieldType: 'textarea' as const, 
        fieldOptions: undefined,
        isRequired: false,
        isActive: true,
        sortOrder: 2,
        memberCount: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    jest.mocked(customFieldsService.getCustomFields).mockResolvedValue(mockFields);
    
    render(<CustomFieldsPage />);
    
    await waitFor(() => {
      expect(customFieldsService.getCustomFields).toHaveBeenCalled();
    });
  });

  it('should handle loading state', () => {
    render(<CustomFieldsPage />);
    
    // Should render without errors during loading
    expect(screen.getByText(/custom member fields/i)).toBeInTheDocument();
  });

  it('should handle empty fields state', async () => {
    jest.mocked(customFieldsService.getCustomFields).mockResolvedValue([]);
    
    render(<CustomFieldsPage />);
    
    await waitFor(() => {
      expect(customFieldsService.getCustomFields).toHaveBeenCalled();
    });
  });

  it('should handle error state', async () => {
    jest.mocked(customFieldsService.getCustomFields).mockRejectedValue(new Error('Failed to load'));
    
    render(<CustomFieldsPage />);
    
    await waitFor(() => {
      expect(customFieldsService.getCustomFields).toHaveBeenCalled();
    });
  });
});