import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddMemberModal } from '../AddMemberModal';
import { toast } from 'sonner';

// Mock ErrorHandler explicitly to fix "handleMemberError is not a function" error
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn(),
    handleApiErrorAsync: jest.fn(),
    parseError: jest.fn(),
    handleAndToast: jest.fn(),
    handleValidationErrors: jest.fn(() => ({})),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showWarningToast: jest.fn(),
    showInfoToast: jest.fn(),
    handleAuthError: jest.fn(),
    handlePaymentError: jest.fn(),
    handleMemberError: jest.fn(),
    handleEventError: jest.fn(),
    handleChatError: jest.fn(),
    handleBillingError: jest.fn(),
    handlePushNotificationError: jest.fn(),
  },
  HookErrorHandler: {
    handleDataFetchError: jest.fn(),
    handleFormSubmissionError: jest.fn(),
  },
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showWarningToast: jest.fn(),
  showInfoToast: jest.fn(),
}));

// Import universal RadixUI mocking setup

// Mock RadixUI Slot component
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {}) });
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Mock RadixUI Separator component
jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(({ orientation = 'horizontal', decorative = true, ...props }: any, ref) => (
    <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />
  ))
}));

// Mock UI Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

// Mock UI Button component
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

// Mock UI Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge ${variant || ''} ${className || ''}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock UI Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange, ...restProps } = props;
    return <div className={`dialog-content ${className || ''}`} data-testid="dialog-content" {...restProps}>{children}</div>;
  },
  DialogHeader: ({ children, className, ...props }: any) => (
    <div className={`dialog-header ${className || ''}`} data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={`dialog-title ${className || ''}`} data-testid="dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, className, ...props }: any) => (
    <p className={`dialog-description ${className || ''}`} data-testid="dialog-description" {...props}>{children}</p>
  ),
  DialogFooter: ({ children, className, ...props }: any) => (
    <div className={`dialog-footer ${className || ''}`} data-testid="dialog-footer" {...props}>{children}</div>
  ),
}));

// Mock UI Select components using proven pattern
jest.mock('@/components/ui/select', () => ({
  Select: React.forwardRef<HTMLDivElement, any>(function Select({ children, value, onValueChange, defaultValue, ...props }, ref) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');
    
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return React.createElement('div', {
      ref,
      'data-testid': 'select', 
      'data-value': value || internalValue,
      ...props
    }, React.Children.map(children, child => 
      React.isValidElement(child) 
        ? React.cloneElement(child, { onValueChange: handleChange, value: value || internalValue } as any)
        : child
    ));
  }),
  SelectTrigger: React.forwardRef<HTMLButtonElement, any>(function SelectTrigger({ children, className, ...props }, ref) {
    return React.createElement('button', {
      ref,
      className: `select-trigger ${className || ''}`,
      'data-testid': props['data-testid'] || 'select-trigger',
      ...props
    }, children);
  }),
  SelectValue: React.forwardRef<HTMLSpanElement, any>(function SelectValue({ placeholder, value, ...props }, ref) {
    return React.createElement('span', { 
      ref,
      'data-testid': 'select-value',
      ...props
    }, value || placeholder);
  }),
  SelectContent: React.forwardRef<HTMLDivElement, any>(function SelectContent({ children, className, ...props }, ref) {
    return React.createElement('div', { 
      ref,
      className: `select-content ${className || ''}`,
      'data-testid': 'select-content',
      ...props 
    }, children);
  }),
  SelectItem: React.forwardRef<HTMLDivElement, any>(function SelectItem({ children, value, className, ...props }, ref) {
    const handleClick = () => {
      // Find parent Select and call onValueChange
      const event = { target: { value } };
      props.onSelect?.(value);
    };
    
    return React.createElement('div', {
      ref,
      className: `select-item ${className || ''}`,
      'data-testid': 'select-item',
      'data-value': value,
      onClick: handleClick,
      ...props
    }, children);
  }),
}));

// Mock UI Checkbox component using proven pattern
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, checked, onCheckedChange, ...props }, ref) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };
    
    return React.createElement('input', {
      ref,
      type: 'checkbox',
      className: `checkbox ${className || ''}`,
      'data-testid': 'checkbox',
      checked: Boolean(checked),
      onChange: handleChange,
      ...props
    });
  }),
}));

// Mock UI Input component using proven pattern
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, type, ...props }, ref) {
    return React.createElement('input', {
      ref,
      type: type || 'text',
      className: `input ${className || ''}`,
      'data-testid': 'input',
      ...props
    });
  }),
}));

// Mock UI Label component using proven pattern
jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<HTMLLabelElement, any>(function Label({ children, className, ...props }, ref) {
    return React.createElement('label', {
      ref,
      className: `label ${className || ''}`,
      'data-testid': 'label',
      ...props
    }, children);
  }),
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
    Plus: IconComponent,
    Settings: IconComponent,
    ArrowRight: IconComponent,
    X: IconComponent,
    ChevronDown: IconComponent,
    ChevronUp: IconComponent,
    Check: IconComponent,
    Upload: IconComponent,
    Download: IconComponent,
    AlertCircle: IconComponent,
    CheckCircle: IconComponent,
    Info: IconComponent,
  };
});

// Mock CustomFieldInput component
jest.mock('../CustomFieldInput', () => ({
  CustomFieldInput: ({ label, value, onChange, ...props }: any) => (
    <div data-testid="custom-field-input" {...props}>
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  ),
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock UI Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      data-value={value}
      {...props}
    >
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
}));

// Mock UI Alert components
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h4 className={`alert-title ${className || ''}`} data-testid="alert-title" {...props}>{children}</h4>
  ),
}));

// Mock Textarea component
jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, any>(({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`textarea ${className || ''}`}
      data-testid="textarea"
      {...props}
    />
  ))
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock memberService
jest.mock('@/services/memberService', () => ({
  createMember: jest.fn(),
}));

// Mock customFieldsService
jest.mock('@/services/customFieldsService', () => ({
  customFieldsService: {
    getCustomFields: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useToast hook to match the actual hook interface
// Create local toast mock instance to ensure it's available
const mockToastInstance = {
  success: jest.fn((message: string) => {
    console.log('Mock success toast:', message);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  error: jest.fn((message: string) => {
    console.log('Mock error toast:', message);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  warning: jest.fn((message: string) => {
    console.log('Mock warning toast:', message);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  info: jest.fn((message: string) => {
    console.log('Mock info toast:', message);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
};

// Mock the useToast hook directly - override the global mock from setupTests
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(() => mockToastInstance),
}));

// Force the mock to use our local instance by importing after the mock
const { useToast: mockUseToast } = jest.requireMock('@/hooks/useToast');

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

import { useAuth } from '@/hooks/useAuth';
import { customFieldsService } from '@/services/customFieldsService';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCustomFieldsService = customFieldsService as jest.Mocked<typeof customFieldsService>;

const mockUser = {
  userId: 1,
  fullName: 'Test Admin',
  email: 'admin@testclub.com',
  clubId: 1,
  clubName: 'Test Club',
  clubTier: 'Grow',
  role: 'Admin',
  isOnboardingCompleted: true,
};

const mockMembershipTypes = [
  {
    id: 1,
    clubId: 1,
    name: 'Individual',
    description: 'Individual membership',
    duesAmount: 50,
    duesFrequency: 'Monthly',
    memberCount: 10,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    clubId: 1,
    name: 'Family',
    description: 'Family membership',
    duesAmount: 80,
    duesFrequency: 'Monthly',
    memberCount: 5,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('AddMemberModal', () => {
  const mockOnClose = jest.fn();
  const mockOnMemberAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear toast mocks
    mockToastInstance.error.mockClear();
    mockToastInstance.success.mockClear();
    mockToastInstance.warning.mockClear();
    mockToastInstance.info.mockClear();
    
    // Ensure our mock implementation is active
    mockUseToast.mockReturnValue(mockToastInstance);
    
    // Mock scrollIntoView for JSDOM compatibility with Radix UI Select
    Element.prototype.scrollIntoView = jest.fn();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
    });

    mockCustomFieldsService.getCustomFields.mockResolvedValue([]);
  });

  describe('when membership types are available', () => {
    it('should render the normal form', async () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={mockMembershipTypes}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      expect(screen.getByText('Add New Member')).toBeInTheDocument();
      expect(screen.getByText('Add a new member to your club by filling out their information below.')).toBeInTheDocument();
      
      // Should show form fields
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Address')).toBeInTheDocument();
      
      expect(screen.getByLabelText('Membership Type *')).toBeInTheDocument();
      
      // Should show membership type options - use the actual rendered test ID
      const membershipSelect = await waitFor(() => 
        screen.getByTestId('select-membershipType')
      );
      fireEvent.click(membershipSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Individual - $50')).toBeInTheDocument();
        expect(screen.getByText('Family - $80')).toBeInTheDocument();
      });
    });

    it('should show save button when form is filled', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={mockMembershipTypes}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      expect(screen.getByTestId('button-save')).toBeInTheDocument();
      expect(screen.getByText('Save Member')).toBeInTheDocument();
    });
  });

  describe('when no membership types are available', () => {
    it('should show the no membership types message', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={[]}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      expect(screen.getByText('Add New Member')).toBeInTheDocument();
      expect(screen.getByText('Before adding members, you need to create membership types to categorize them.')).toBeInTheDocument();
      
      // Should show no membership types found message
      expect(screen.getByText('No Membership Types Found')).toBeInTheDocument();
      expect(screen.getByText('You need to create at least one membership type before adding members. Membership types help you categorize members and set dues amounts.')).toBeInTheDocument();
    });

    it('should show create membership types link', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={[]}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      const createLink = screen.getByTestId('link-create-membership-types');
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute('href', '/admin/members/types');
      expect(screen.getByText('Create Membership Types First')).toBeInTheDocument();
    });

    it('should not show form fields when no membership types', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={[]}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      // Should not show form fields
      expect(screen.queryByLabelText('Full Name *')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email Address *')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Phone Number')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Address')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Membership Type *')).not.toBeInTheDocument();
      
      // Should not show save button
      expect(screen.queryByTestId('button-save')).not.toBeInTheDocument();
    });

    it('should close modal when create membership types link is clicked', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={[]}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      const createLink = screen.getByTestId('link-create-membership-types');
      fireEvent.click(createLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when cancel button is clicked', () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={[]}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      const cancelButton = screen.getByTestId('button-cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('form validation with membership types', () => {
    it('should show error when trying to save without membership type selection', async () => {
      render(
        <AddMemberModal
          isOpen={true}
          onClose={mockOnClose}
          membershipTypes={mockMembershipTypes}
          onMemberAdded={mockOnMemberAdded}
        />
      );

      // Fill in required fields except membership type
      fireEvent.change(screen.getByTestId('input-fullName'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      // Try to save without selecting membership type
      fireEvent.click(screen.getByTestId('button-save'));

      await waitFor(() => {
        expect(mockToastInstance.error).toHaveBeenCalledWith('Please select a membership type');
      });
    });
  });
});