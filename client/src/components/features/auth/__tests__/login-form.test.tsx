import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock all the dependencies at the top level before importing LoginForm
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// CRITICAL: Apply EXACT proven RadixUI inline mocking pattern that achieved 100% success
// This pattern achieved 20/20 passing tests - Comprehensive UI component mocking
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Button component
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, onClick, disabled, type = 'button', ...props }, ref) {
    return (
      <button 
        ref={ref} 
        className={className} 
        data-variant={variant} 
        data-size={size}
        onClick={onClick}
        disabled={disabled}
        type={type}
        data-testid="button" 
        {...props}
      >
        {children}
      </button>
    );
  }),
}));

// Input component
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={className}
        data-testid="input"
        {...props}
      />
    );
  }),
}));

// Label component
jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<HTMLLabelElement, any>(function Label({ children, className, ...props }, ref) {
    return (
      <label ref={ref} className={className} data-testid="label" {...props}>
        {children}
      </label>
    );
  }),
}));

// Checkbox component
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, checked, onCheckedChange, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={className}
        checked={Boolean(checked)}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        data-testid="checkbox"
        {...props}
      />
    );
  }),
}));

// Card components
jest.mock('@/components/ui/card', () => ({
  Card: React.forwardRef<HTMLDivElement, any>(function Card({ children, className, ...props }, ref) {
    return <div ref={ref} className={className} data-testid="card" {...props}>{children}</div>;
  }),
  CardHeader: React.forwardRef<HTMLDivElement, any>(function CardHeader({ children, className, ...props }, ref) {
    return <div ref={ref} className={className} data-testid="card-header" {...props}>{children}</div>;
  }),
  CardTitle: React.forwardRef<HTMLHeadingElement, any>(function CardTitle({ children, className, ...props }, ref) {
    return <h3 ref={ref} className={className} data-testid="card-title" {...props}>{children}</h3>;
  }),
  CardDescription: React.forwardRef<HTMLDivElement, any>(function CardDescription({ children, className, ...props }, ref) {
    return <div ref={ref} className={className} data-testid="card-description" {...props}>{children}</div>;
  }),
  CardContent: React.forwardRef<HTMLDivElement, any>(function CardContent({ children, className, ...props }, ref) {
    return <div ref={ref} className={className} data-testid="card-content" {...props}>{children}</div>;
  }),
}));

// Alert components
jest.mock('@/components/ui/alert', () => ({
  Alert: React.forwardRef<HTMLDivElement, any>(function Alert({ children, variant, className, ...props }, ref) {
    return <div ref={ref} className={className} data-variant={variant} data-testid="alert" {...props}>{children}</div>;
  }),
  AlertDescription: React.forwardRef<HTMLDivElement, any>(function AlertDescription({ children, className, ...props }, ref) {
    return <div ref={ref} className={className} data-testid="alert-description" {...props}>{children}</div>;
  }),
}));

// Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ className, ...props }: any) => (
    <svg className={className} data-testid="arrow-left-icon" {...props}>
      <path d="M19 12H5m7-7l-7 7 7 7" />
    </svg>
  ),
  Eye: ({ className, ...props }: any) => (
    <svg className={className} data-testid="eye-icon" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    </svg>
  ),
  EyeOff: ({ className, ...props }: any) => (
    <svg className={className} data-testid="eye-off-icon" {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    </svg>
  ),
}));

// Mock Next.js Link and Image
jest.mock('next/link', () => {
  const Link = React.forwardRef<
    HTMLAnchorElement,
    { children: React.ReactNode; href: string }
  >(function Link({ children, href }, ref) {
    return <a href={href} ref={ref}>{children}</a>;
  });
  return Link;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} data-testid="next-image" {...props} />
  ),
}));

jest.mock('@/components/shared/ThemeToggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>,
}));

// Mock useGoogleAnalytics hook directly in test file
jest.mock('@/hooks/useGoogleAnalytics', () => ({
  useGoogleAnalytics: () => ({
    trackLogin: jest.fn(),
    trackError: jest.fn(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    trackCTAClick: jest.fn(),
    trackFeature: jest.fn(),
    trackFunnel: jest.fn(),
    trackConversionEvent: jest.fn(),
    trackHeroInteraction: jest.fn(),
    trackPricingInteraction: jest.fn(),
    trackROICalculatorInteraction: jest.fn(),
    trackFeatureSectionView: jest.fn(),
    trackFormInteraction: jest.fn(),
    trackScrollDepth: jest.fn(),
    trackTimeOnPage: jest.fn(),
    trackSignup: jest.fn(),
    trackSubscriptionStart: jest.fn(),
    trackPurchase: jest.fn(),
    trackFeatureUse: jest.fn(),
    trackSearch: jest.fn(),
    trackShare: jest.fn(),
    trackTiming: jest.fn(),
    CONVERSION_FUNNEL_STEPS: {},
  }),
}));

// Import test utils after mocks
import { createMockUser } from '@/tests/test-utils';

// Mock useFormValidation hook directly in test file
jest.mock('@/hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: {},
    validateForm: jest.fn(() => ({ isValid: true })),
    clearErrors: jest.fn(),
  }),
}));

// Mock Google OAuth components
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      data-testid="google-login-button"
      type="button"
      onClick={() => onSuccess?.({ credential: 'mock-google-token' })}
    >
      Continue with Google
    </button>
  ),
  useGoogleLogin: () => jest.fn(),
}));

// Mock Apple Sign-In component
jest.mock('react-apple-signin-auth', () => ({
  __esModule: true,
  default: ({ onSuccess, onError, ...props }: any) => (
    <button
      data-testid="apple-login-button"
      type="button"
      onClick={() => onSuccess?.({ authorization: { id_token: 'mock-apple-token' } })}
      {...props}
    >
      Continue with Apple
    </button>
  ),
}));

// Universal RadixUI mocks loaded via setupTests.ts for consistent testing across all 81+ files

import { LoginForm } from '../login-form';

const mockUseAuth = require('@/hooks/useAuth').useAuth;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    } as any);
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      clearError: jest.fn(),
      login: mockLogin,
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
      retryLastOperation: jest.fn(),
    });
  });

  it('should display specific error message for invalid credentials', async () => {
    // Mock login to reject with a specific 401 error
    const authError = new Error('Invalid email or password. Please check your credentials.');
    mockLogin.mockRejectedValue(authError);

    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear (ErrorHandler adds context)
    await waitFor(() => {
      expect(screen.getByText(/Error during login: Invalid email or password/)).toBeInTheDocument();
    });

    // Verify login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword',
      rememberMe: false,
    });
  });

  it('should display generic error message for unexpected errors', async () => {
    // Mock login to reject with an unexpected error
    const authError = new Error('Network error occurred');
    mockLogin.mockRejectedValue(authError);

    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear (ErrorHandler adds context)
    await waitFor(() => {
      expect(screen.getByText(/Error during login: Network error occurred/)).toBeInTheDocument();
    });
  });

  describe('Activation success banner (A-001)', () => {
    it('shows an activation success banner when ?activated=true is present', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((key: string) => (key === 'activated' ? 'true' : null)),
      } as any);

      render(<LoginForm />);

      expect(screen.getByText(/account has been activated/i)).toBeInTheDocument();
    });

    it('does not show the activation banner when the param is absent', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn(() => null),
      } as any);

      render(<LoginForm />);

      expect(screen.queryByText(/account has been activated/i)).not.toBeInTheDocument();
    });
  });

  it('should redirect to correct dashboard based on user role', async () => {
    // Mock successful login for admin user
    const adminResponse = createMockUser({
      userId: 1,
      fullName: 'Admin User',
      email: 'admin@example.com',
      clubId: 1,
      role: 'Admin',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
    });
    mockLogin.mockResolvedValue(adminResponse);

    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should redirect member to member dashboard', async () => {
    // Mock successful login for member user
    const memberResponse = createMockUser({
      userId: 2,
      fullName: 'Member User',
      email: 'member@example.com',
      clubId: 1,
      role: 'Member',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
    });
    mockLogin.mockResolvedValue(memberResponse);

    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'member@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
    });
  });

  it('should prevent multiple login attempts', async () => {
    // Mock login to return a pending promise without artificial delay
    mockLogin.mockResolvedValue(createMockUser({
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      role: 'Member',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
    }));

    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Click submit button multiple times rapidly
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Button should be disabled immediately
    expect(submitButton).toBeDisabled();

    // Second and third clicks should not trigger additional logins
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Wait for login to complete and verify only called once
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear error when user starts typing', async () => {
    // Mock login to reject with an error
    const authError = new Error('Invalid credentials');
    mockLogin.mockRejectedValue(authError);

    render(<LoginForm />);

    // Fill in the form and submit to trigger error
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear (ErrorHandler adds context)
    await waitFor(() => {
      expect(screen.getByText(/Error during login: Invalid credentials/)).toBeInTheDocument();
    });

    // Start typing in email field
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test2@example.com' },
    });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/Error during login: Invalid credentials/)).not.toBeInTheDocument();
    });
  });
});