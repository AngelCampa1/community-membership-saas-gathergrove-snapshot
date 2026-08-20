import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Store the mock google login handler so tests can trigger it
let mockGoogleLoginHandler: (() => void) | null = null;
let mockGoogleSuccessCallback: ((response: any) => void) | null = null;
let mockGoogleErrorCallback: (() => void) | null = null;

// Mock dependencies
jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: ({ onSuccess, onError }: any) => {
    mockGoogleSuccessCallback = onSuccess;
    mockGoogleErrorCallback = onError;
    const loginFn = () => {
      // Simulate Google OAuth returning an access token
      onSuccess?.({ access_token: 'mock-google-access-token' });
    };
    mockGoogleLoginHandler = loginFn;
    return loginFn;
  },
}));

// Mock fetch for Google userinfo endpoint
const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});
afterAll(() => {
  // Restore original fetch if needed
});

jest.mock('react-apple-signin-auth', () => ({
  __esModule: true,
  default: ({ onSuccess, onError, render: renderProp }: any) => {
    const handleClick = () => {
      onSuccess?.({
        authorization: { id_token: 'mock-apple-token' },
        user: { name: { firstName: 'John', lastName: 'Doe' } },
      });
    };
    if (renderProp) {
      return renderProp({ onClick: handleClick });
    }
    return (
      <button data-testid="apple-login-button" onClick={handleClick}>
        Sign in with Apple
      </button>
    );
  },
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button(
    { children, className, onClick, disabled, type = 'button', ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={className}
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

// Mock Alert components
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

// Mock authService
const mockLoginWithGoogle = jest.fn();
const mockLoginWithApple = jest.fn();

jest.mock('@/services/authService', () => ({
  __esModule: true,
  default: {
    loginWithGoogle: (...args: any[]) => mockLoginWithGoogle(...args),
    loginWithApple: (...args: any[]) => mockLoginWithApple(...args),
  },
}));

import { SSOButtons, SSODivider } from '../sso-buttons';

describe('SSOButtons', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set the Google Client ID so the Google login button renders
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-google-client-id',
      NEXT_PUBLIC_APPLE_CLIENT_ID: 'test-apple-client-id',
    };
    // Reset mock handlers
    mockGoogleLoginHandler = null;
    mockGoogleSuccessCallback = null;
    mockGoogleErrorCallback = null;
    // Reset and configure fetch mock for Google userinfo endpoint
    mockFetch.mockReset();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sub: 'google-user-id-123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render Google and Apple sign-in buttons', () => {
    render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Apple')).toBeInTheDocument();
  });

  describe('Google Sign-In', () => {
    it('should call onSuccess when Google login succeeds', async () => {
      const successResponse = {
        success: true,
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'member',
      };
      mockLoginWithGoogle.mockResolvedValue(successResponse);

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Google'));

      await waitFor(() => {
        // Backend ExternalAuthRequest only accepts IdToken, Platform, FullName, Nonce.
        // The access token is re-validated server-side; email/googleId are derived there.
        expect(mockLoginWithGoogle).toHaveBeenCalledWith({
          idToken: 'mock-google-access-token',
          platform: 'web',
          fullName: 'Test User',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(successResponse);
      });
    });

    it('should call onError when Google login fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid Google token',
      };
      mockLoginWithGoogle.mockResolvedValue(errorResponse);

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Google'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid Google token');
      });
    });

    it('should call onError when Google login throws an exception', async () => {
      mockLoginWithGoogle.mockRejectedValue(new Error('Network error'));

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Google'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should call onError when Google userinfo fetch fails', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Google'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to get user info from Google');
      });
    });
  });

  describe('Apple Sign-In', () => {
    it('should call onSuccess when Apple login succeeds', async () => {
      const successResponse = {
        success: true,
        userId: 1,
        email: 'test@apple.com',
        fullName: 'John Doe',
        role: 'member',
      };
      mockLoginWithApple.mockResolvedValue(successResponse);

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Apple'));

      await waitFor(() => {
        expect(mockLoginWithApple).toHaveBeenCalledWith({
          idToken: 'mock-apple-token',
          platform: 'web',
          fullName: 'John Doe',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(successResponse);
      });
    });

    it('should call onError when Apple login fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid Apple token',
      };
      mockLoginWithApple.mockResolvedValue(errorResponse);

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Apple'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid Apple token');
      });
    });

    it('should call onError when Apple login throws an exception', async () => {
      mockLoginWithApple.mockRejectedValue(new Error('Apple auth failed'));

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Apple'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Apple auth failed');
      });
    });
  });

  describe('Error display', () => {
    it('should display error alert when SSO fails', async () => {
      mockLoginWithGoogle.mockResolvedValue({
        success: false,
        message: 'Authentication failed',
      });

      render(<SSOButtons onSuccess={mockOnSuccess} onError={mockOnError} />);

      fireEvent.click(screen.getByText('Sign in with Google'));

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled state', () => {
    it('should pass disabled prop to buttons', () => {
      render(
        <SSOButtons
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          disabled={true}
        />
      );

      // Both buttons should be disabled through the Button component
      const buttons = screen.getAllByTestId('button');
      const googleButton = buttons.find(btn => btn.textContent?.includes('Google'));
      const appleButton = buttons.find(btn => btn.textContent?.includes('Apple'));
      expect(googleButton).toBeDisabled();
      expect(appleButton).toBeDisabled();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SSOButtons
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('SSODivider', () => {
  it('should render the divider with text', () => {
    render(<SSODivider />);

    expect(screen.getByText('Or continue with')).toBeInTheDocument();
  });
});
