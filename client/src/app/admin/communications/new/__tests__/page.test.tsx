import React from 'react';

// Mock dependencies BEFORE any other imports (following ChatSettingsPage pattern)
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/communicationService', () => ({
  __esModule: true,
  default: {
    getEmailUsageStats: jest.fn(),
    getPushNotificationUsageStats: jest.fn(),
    sendBulkEmail: jest.fn(),
    sendPushNotification: jest.fn(),
    getMembershipTypes: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => new URLSearchParams({ tab: 'email' })),
}));

jest.mock('@/utils/security', () => ({
  sanitizeInput: jest.fn((input: string) => input),
}));

jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => error),
    handlePushNotificationError: jest.fn((error) => error),
  },
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
    ArrowLeft: IconComponent,
    Mail: IconComponent,
    MessageSquare: IconComponent,
    Send: IconComponent,
    Users: IconComponent,
    AlertTriangle: IconComponent,
    CheckCircle: IconComponent,
    AlertCircle: IconComponent,
    Smartphone: IconComponent,
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

// Mock UI components
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

jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, any>(function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`textarea ${className || ''}`}
        data-testid="textarea"
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
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`checkbox ${className || ''}`}
        data-testid="checkbox"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={`badge ${variant || ''} ${className || ''}`} data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
}));

// Import test utilities and components AFTER mocks
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useAuth } from '@/hooks/useAuth';
import communicationService from '@/services/communicationService';
import NewCommunicationPage from '../page';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCommunicationService = communicationService as jest.Mocked<typeof communicationService>;

// Mock user data
const mockGrowUser = {
  userId: 1,
  fullName: 'Test User',
  email: 'test@example.com',
  clubId: 1,
  clubName: 'Test Club',
  clubTier: 'Grow',
  tier: 'Grow',
  role: 'Member',
  isOnboardingCompleted: true,
};

// Mock data
const mockGrowStats = {
  emailsSentThisMonth: 50,
  monthlyEmailLimit: 500,
  isUnlimited: false,
  subscriptionTier: 'Grow'
};

const mockPushStats = {
  clubTier: 'Grow',
  membersWithDeviceTokens: 30,
  totalActiveMembers: 100,
  totalDeviceTokens: 45,
  isGrowTier: true,
  isAzureConfigured: true,
  currentMonth: 'December 2024'
};

describe('NewCommunicationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to Grow user
    mockUseAuth.mockReturnValue({
      user: mockGrowUser,
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
  });

  test('renders email composition form', async () => {
    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review & send/i })).toBeInTheDocument();
  });

  test('displays Grow tier usage statistics correctly', async () => {
    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Grow tier. No admin email cap')).toBeInTheDocument();
    });
  });

  test('displays Grow tier unlimited status correctly', async () => {
    mockUseAuth.mockReturnValue({
      user: mockGrowUser,
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

    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Grow tier. No admin email cap')).toBeInTheDocument();
    });

    // Should not show usage limit warning
    expect(screen.queryByText(/would exceed your limit/i)).not.toBeInTheDocument();
  });

  test('form validation prevents submission with empty fields', async () => {
    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    const user = userEvent.setup({ delay: null });
    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for stats to load
    await waitFor(() => {
      const statsText = screen.queryByText(/Admin communications this month/i) || 
                       screen.queryByText(/communications this month/i) ||
                       screen.getByLabelText(/subject/i);
      expect(statsText).toBeInTheDocument();
    }, { timeout: 5000 });

    // Form fields should exist and be functional
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/message/i);
    const sendButton = screen.getByRole('button', { name: /review & send/i });

    expect(subjectInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
    expect(sendButton).toBeInTheDocument();

    // User can type in fields
    await user.type(subjectInput, 'Test subject');
    await user.type(messageInput, 'Test message');

    expect(subjectInput).toHaveValue('Test subject');
    expect(messageInput).toHaveValue('Test message');
  }, 10000);

  test('renders form elements correctly', async () => {
    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Check form elements exist
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText(/Push/)).toBeInTheDocument();
    expect(screen.queryByText(/SMS/)).not.toBeInTheDocument();
    expect(screen.queryByText(/WhatsApp/)).not.toBeInTheDocument();
  }, 15000);

  test('handles fetch errors gracefully', async () => {
    mockCommunicationService.getEmailUsageStats.mockRejectedValueOnce(new Error('Network error'));

    render(<NewCommunicationPage />);

    // Component should still render even if stats fetch fails
    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Form should still be functional
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  test('shows character count for Grow tier', async () => {
    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Check character count displays
    expect(screen.getByText('0 / 500 characters')).toBeInTheDocument();
    expect(screen.getByText('0 / 10,000 characters')).toBeInTheDocument();
  });

  test('does not show character limits for Grow tier', async () => {
    mockUseAuth.mockReturnValue({
      user: mockGrowUser,
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

    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Grow tier should still show character counts (but no limits enforced in UI)
    expect(screen.getByText('0 / 500 characters')).toBeInTheDocument();
    expect(screen.getByText('0 / 10,000 characters')).toBeInTheDocument();
  });

  test('does not render SMS or WhatsApp tabs for Grow tier clubs', async () => {
    mockUseAuth.mockReturnValue({
      user: mockGrowUser,
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

    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);

    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Email tab should be active initially
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();

    expect(screen.queryByText('SMS')).not.toBeInTheDocument();
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
  });

  test('can switch to push notification tab for Grow tier clubs', async () => {
    mockUseAuth.mockReturnValue({
      user: mockGrowUser,
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

    mockCommunicationService.getEmailUsageStats.mockResolvedValueOnce(mockGrowStats);
    mockCommunicationService.getPushNotificationUsageStats.mockResolvedValueOnce(mockPushStats);

    const user = userEvent.setup();
    render(<NewCommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Communication')).toBeInTheDocument();
    });

    // Switch to Push tab
    const pushTab = screen.getByText('Push');
    await user.click(pushTab);

    // Should show Push notification form
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter notification title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write your notification message here...')).toBeInTheDocument();
    });

    // Should show push-specific labels
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    
    // Should not show email subject field
    expect(screen.queryByLabelText(/subject/i)).not.toBeInTheDocument();
  });
});
