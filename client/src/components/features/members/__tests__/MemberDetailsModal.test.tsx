import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

// Import universal RadixUI mocking setup

// Mock dependencies BEFORE importing the component
jest.mock('@/hooks/useAuth');
jest.mock('@/services/memberService');
jest.mock('@/services/membershipTypeService');
jest.mock('@/services/customFieldsService');
jest.mock('sonner');

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Save: () => <span data-testid="save-icon">Save</span>,
  X: () => <span data-testid="x-icon">X</span>,
  XIcon: () => <span data-testid="x-icon">X</span>, // Used by shadcn dialog
  User: () => <span data-testid="user-icon">User</span>,
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  Phone: () => <span data-testid="phone-icon">Phone</span>,
  MapPin: () => <span data-testid="mappin-icon">MapPin</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  DollarSign: () => <span data-testid="dollarsign-icon">DollarSign</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
}));

// Mock child components
jest.mock('../RecordPaymentModal', () => ({
  RecordPaymentModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="record-payment-modal">Record Payment Modal</div> : null
}));

jest.mock('../CustomFieldInput', () => ({
  CustomFieldInput: ({ field, value, onChange }: any) => (
    <input
      data-testid={`custom-field-input-${field.id}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  formatCustomFieldValue: (field: any, value: string) => value
}));

// NOW import the component and types after mocks are set up
import { MemberDetailsModal } from '../MemberDetailsModal';
import { MemberResponse } from '@/services/memberService';
import { MembershipTypeResponse } from '@/services/membershipTypeService';

// Mock RadixUI components inline to bypass Jest module mapping issues
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {}) });
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Note: @radix-ui/react-dialog is handled by the global mock in __mocks__

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

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, asChild, ...props }, ref) {
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

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`input ${className || ''}`}
        data-testid="input"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} data-testid="label" {...props}>
      {children}
    </label>
  )
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, checked, onCheckedChange, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`checkbox ${className || ''}`}
        data-testid="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange } as any) : child
      )}
    </div>
  ),
  SelectTrigger: ({ children, className, ...props }: any) => (
    <div className={`select-trigger ${className || ''}`} data-testid="select-trigger" {...props}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>
      {children}
    </div>
  )
}));

// Get the mocked instances for test assertions
import { useAuth } from '@/hooks/useAuth';
import memberService from '@/services/memberService';
import { membershipTypeService } from '@/services/membershipTypeService';
import customFieldsService from '@/services/customFieldsService';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockMemberService = memberService as jest.Mocked<typeof memberService>;
const mockMembershipTypeService = membershipTypeService as jest.Mocked<typeof membershipTypeService>;
const mockCustomFieldsService = customFieldsService as jest.Mocked<typeof customFieldsService>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock ReactDOM createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('MemberDetailsModal', () => {
  const mockMember: MemberResponse = {
    id: 1,
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '555-1234',
    membershipTypeId: 1,
    membershipTypeName: 'Premium',
    status: 'active',
    joinDate: '2024-01-01',
    clubId: 1,
    hasSmsConsent: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    customFieldValues: [],
    totalPaidCurrentPeriod: 0,
    expectedDuesAmount: 100,
    hasPartialPayments: false,
  };

  const mockMembershipTypes: MembershipTypeResponse[] = [
    {
      id: 1,
      clubId: 1,
      name: 'Premium',
      description: 'Premium membership',
      duesAmount: 50,
      duesFrequency: 'monthly',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      memberCount: 0,
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    member: mockMember,
    membershipTypes: mockMembershipTypes,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onMemberUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useAuth mock with proper return value
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        userId: 1,
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        isAuthenticated: true,
        isOnboardingCompleted: true,
        roles: ['admin'],
        permissions: ['read', 'write']
      },
      loading: false,
      error: null,
      login: jest.fn().mockResolvedValue({ success: true }),
      logout: jest.fn().mockResolvedValue(undefined),
      register: jest.fn().mockResolvedValue({ success: true }),
      refreshSession: jest.fn().mockResolvedValue(undefined),
      completeOnboarding: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
      retryLastOperation: jest.fn().mockResolvedValue(undefined)
    });

    // Setup customFieldsService mock to return empty array by default
    mockCustomFieldsService.getCustomFields = jest.fn().mockResolvedValue([]);
  });

  it('should render the member details modal', () => {
    render(<MemberDetailsModal {...defaultProps} />);

    // Check dialog title is present
    expect(screen.getByText('Member Details')).toBeInTheDocument();

    // Check member information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();

    // Check Edit button is present
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests once component is fully implemented
});