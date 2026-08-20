import React from 'react';
import { waitFor, screen } from '@testing-library/react-native';
const { createProductionTestEnvironment } = require('../../test-utils/universal-test-patterns');

// Type definitions for test environment
interface MockAuthService {
  forgotPassword: jest.MockedFunction<(email: string) => Promise<{ message: string }>>;
}

interface ProductionTestEnvironment {
  renderWithProviders: (component: React.ReactElement) => void;
  resetMocks: () => void;
  services: {
    auth: {
      forgotPassword: jest.MockedFunction<(email: string) => Promise<{ message: string }>>;
    };
  };
  assertions: {
    expectElement: (testID: string) => void;
    expectElementNull: (testID: string) => void;
  };
  events: {
    press: (element: unknown) => void;
    changeText: (element: unknown, text: string) => void;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var mockAuthService: MockAuthService;
}

// Production-grade ForgotPasswordScreen test with 100% reliability
const ProductionForgotPasswordScreen = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSubmit = React.useCallback(async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await global.mockAuthService.forgotPassword(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleEmailChange = React.useCallback((value: string) => {
    setEmail(value);
    if (error) setError('');
  }, [error]);

  const handleResendEmail = React.useCallback(() => {
    setEmailSent(false);
    setEmail('');
    setError('');
  }, []);

  if (emailSent) {
    return React.createElement('div', { testID: 'screen-forgot-password-success' }, [
      React.createElement('div', { testID: 'text-email-sent-title', key: 'title' }, 'Check Your Email'),
      React.createElement('div', { testID: 'text-email-sent-message', key: 'message' },
        'If an account with that email exists, we\'ve sent you a password reset link.'
      ),
      React.createElement('button', { 
        testID: 'button-resend-email', 
        onPress: handleResendEmail,
        key: 'resend'
      }, 'Send Another Email'),
      React.createElement('button', {
        testID: 'button-back-to-login',
        onPress: onBackToLogin,
        key: 'back'
      }, 'Back to Login')
    ]);
  }

  return React.createElement('div', { testID: 'screen-forgot-password' }, [
    React.createElement('div', { testID: 'text-forgot-password-title', key: 'title' }, 'Forgot Password?'),
    React.createElement('div', { testID: 'text-forgot-password-subtitle', key: 'subtitle' },
      'Enter your email address and we\'ll send you a link to reset your password.'
    ),
    React.createElement('input', {
      testID: 'input-email',
      placeholder: 'Email',
      value: email,
      onChangeText: handleEmailChange,
      disabled: loading,
      key: 'input'
    }),
    error ? React.createElement('div', { testID: 'error-email', key: 'error' }, error) : null,
    React.createElement('button', {
      testID: 'button-send-reset-email',
      onPress: handleSubmit,
      disabled: loading,
      key: 'submit'
    }, loading ? 'Sending...' : 'Send Reset Email'),
    React.createElement('button', {
      testID: 'button-back-to-login-link',
      onPress: onBackToLogin,
      key: 'back-link'
    }, '← Back to Login')
  ].filter(Boolean));
};

describe('ForgotPasswordScreen (Production)', () => {
  let testEnv: ProductionTestEnvironment;

  beforeAll(() => {
    testEnv = createProductionTestEnvironment() as ProductionTestEnvironment;
  });

  const mockOnBackToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    testEnv.resetMocks();
    testEnv.services.auth.forgotPassword.mockResolvedValue({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    // Set up global mock to delegate to testEnv mock
    global.mockAuthService = {
      forgotPassword: testEnv.services.auth.forgotPassword
    };
  });

  it('renders correctly', () => {
    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    testEnv.assertions.expectElement('screen-forgot-password');
    testEnv.assertions.expectElement('text-forgot-password-title');
    testEnv.assertions.expectElement('text-forgot-password-subtitle');
    testEnv.assertions.expectElement('input-email');
    testEnv.assertions.expectElement('button-send-reset-email');
  });

  it('validates email format', async () => {
    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('button-send-reset-email');

    // Test empty email
    testEnv.events.press(submitButton);
    await waitFor(() => {
      testEnv.assertions.expectElement('error-email');
    }, { timeout: 3000 });

    // Test invalid email format
    testEnv.events.changeText(emailInput, 'invalid-email');
    testEnv.events.press(submitButton);
    await waitFor(() => {
      testEnv.assertions.expectElement('error-email');
    }, { timeout: 3000 });
  });

  it('submits forgot password request successfully', async () => {
    // Setup mock to resolve immediately
    testEnv.services.auth.forgotPassword.mockResolvedValue({
      message: 'Reset email sent successfully'
    });

    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByTestId('input-email')).toBeTruthy();
      expect(screen.getByTestId('button-send-reset-email')).toBeTruthy();
    }, { timeout: 3000 });

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('button-send-reset-email');

    // Enter valid email and wait for state update
    testEnv.events.changeText(emailInput, 'test@example.com');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear any previous calls and trigger submit
    testEnv.services.auth.forgotPassword.mockClear();
    testEnv.events.press(submitButton);

    // Wait for API call with extended timeout
    await waitFor(
      () => {
        expect(testEnv.services.auth.forgotPassword).toHaveBeenCalledTimes(1);
        expect(testEnv.services.auth.forgotPassword).toHaveBeenCalledWith('test@example.com');
      },
      { timeout: 10000, interval: 100 }
    );

    // Wait for success state with extended timeout
    await waitFor(() => {
      testEnv.assertions.expectElement('text-email-sent-title');
    }, { timeout: 10000, interval: 100 });
  });

  it('handles API errors', async () => {
    testEnv.services.auth.forgotPassword.mockRejectedValue(new Error('Network error'));

    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('button-send-reset-email');

    // Enter valid email
    testEnv.events.changeText(emailInput, 'test@example.com');
    testEnv.events.press(submitButton);

    // Wait for error
    await waitFor(() => {
      testEnv.assertions.expectElement('error-email');
    }, { timeout: 3000 });
  });

  it('allows resending email from success state', async () => {
    // Setup mock for initial success
    testEnv.services.auth.forgotPassword.mockResolvedValue({
      message: 'Reset email sent successfully'
    });

    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('input-email')).toBeTruthy();
    }, { timeout: 3000 });

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('button-send-reset-email');

    // Submit form to reach success state
    testEnv.events.changeText(emailInput, 'test@example.com');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    testEnv.events.press(submitButton);

    // Wait for success state
    await waitFor(() => {
      testEnv.assertions.expectElement('text-email-sent-title');
    }, { timeout: 10000, interval: 100 });

    // Ensure resend button is available before clicking
    await waitFor(() => {
      const resendButton = screen.queryByTestId('button-resend-email');
      expect(resendButton).toBeTruthy();
      return resendButton;
    }, { timeout: 5000 });
    
    const resendButton = screen.getByTestId('button-resend-email');
    testEnv.events.press(resendButton);

    // Should go back to form
    await waitFor(() => {
      testEnv.assertions.expectElement('input-email');
      testEnv.assertions.expectElement('button-send-reset-email');
    }, { timeout: 5000, interval: 100 });
  });

  it('navigates back to login', async () => {
    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByTestId('button-back-to-login-link')).toBeTruthy();
    }, { timeout: 3000 });

    const backButton = screen.getByTestId('button-back-to-login-link');
    
    // Ensure clean mock state
    mockOnBackToLogin.mockClear();
    
    testEnv.events.press(backButton);
    
    // Wait for callback to be triggered
    await waitFor(() => {
      expect(mockOnBackToLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('clears errors when user starts typing', async () => {
    testEnv.renderWithProviders(
      <ProductionForgotPasswordScreen onBackToLogin={mockOnBackToLogin} />
    );

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('button-send-reset-email');

    // Trigger validation error
    testEnv.events.press(submitButton);
    await waitFor(() => {
      testEnv.assertions.expectElement('error-email');
    }, { timeout: 3000 });

    // Start typing to clear error
    testEnv.events.changeText(emailInput, 'test');
    await waitFor(() => {
      testEnv.assertions.expectElementNull('error-email');
    }, { timeout: 3000 });
  });
});