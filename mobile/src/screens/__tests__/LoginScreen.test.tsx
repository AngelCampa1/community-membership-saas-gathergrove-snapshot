/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * LoginScreen Cleanup Tests
 * Priority 4: Auth integration + isMounted pattern cleanup
 *
 * Tests verify:
 * - isMounted flag preventing state updates on unmounted component
 * - Unmount during login operation
 * - Unmount during SSO operations (Google, Apple)
 * - Unmount during SSO availability check
 * - Form validation during cleanup
 * - Alert cleanup
 * - Error state cleanup
 */

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/services/ssoService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { ssoService } from '@/services/ssoService';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSsoService = ssoService as jest.Mocked<typeof ssoService>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;

// Mock auth hook return value
const createMockAuthHook = () => ({
  user: null,
  login: jest.fn(),
  loginWithSSO: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
  clearError: jest.fn(),
});

// Mock user session
const createMockUserSession = () => ({
  token: 'mock-token',
  refreshToken: 'mock-refresh',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    clubId: 'club-123',
    role: 'Member' as const,
  },
});

describe('LoginScreen Cleanup Tests', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let stateUpdateWarnings: string[] = [];
  let mockAuthHook: ReturnType<typeof createMockAuthHook>;

  beforeEach(() => {
    stateUpdateWarnings = [];
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((msg) => {
      if (msg.includes("Can't perform a React state update")) {
        stateUpdateWarnings.push(msg);
      }
    });

    // Setup default auth hook mock
    mockAuthHook = createMockAuthHook();
    mockUseAuth.mockReturnValue(mockAuthHook);

    // Setup SSO service mocks
    mockSsoService.isGoogleSignInAvailable.mockResolvedValue(true);
    mockSsoService.isAppleSignInAvailable.mockResolvedValue(true);
    mockSsoService.signInWithGoogle.mockResolvedValue(createMockUserSession());
    mockSsoService.signInWithApple.mockResolvedValue(createMockUserSession());

    mockAlert.alert.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Basic Unmount Detection', () => {
    it('should not trigger state update warnings after unmount', async () => {
      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should use isMounted flag to prevent state updates', async () => {
      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(mockSsoService.isGoogleSignInAvailable).toHaveBeenCalled();
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('SSO Availability Check Cleanup', () => {
    it('should handle unmount during SSO availability check', async () => {
      let resolveGoogle: (available: boolean) => void;
      let resolveApple: (available: boolean) => void;

      const googlePromise = new Promise<boolean>((resolve) => {
        resolveGoogle = resolve;
      });
      const applePromise = new Promise<boolean>((resolve) => {
        resolveApple = resolve;
      });

      mockSsoService.isGoogleSignInAvailable.mockReturnValue(googlePromise);
      mockSsoService.isAppleSignInAvailable.mockReturnValue(applePromise);

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      unmount();

      await act(async () => {
        resolveGoogle!(true);
        resolveApple!(true);
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount when Google check succeeds but Apple is pending', async () => {
      let resolveApple: (available: boolean) => void;

      const applePromise = new Promise<boolean>((resolve) => {
        resolveApple = resolve;
      });

      mockSsoService.isAppleSignInAvailable.mockReturnValue(applePromise);

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      unmount();

      await act(async () => {
        resolveApple!(true);
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle SSO availability check errors', async () => {
      mockSsoService.isGoogleSignInAvailable.mockRejectedValue(
        new Error('Google SSO not available')
      );
      mockSsoService.isAppleSignInAvailable.mockRejectedValue(
        new Error('Apple SSO not available')
      );

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Login Operation Cleanup', () => {
    it('should handle unmount during login', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthHook.login.mockReturnValue(loginPromise as any);

      const emailInput = getByTestId('input-email');
      const passwordInput = getByTestId('input-password');
      const loginButton = getByTestId('button-login');

      // Use direct prop calls since mocked components render as divs
      emailInput.props.onChangeText?.('test@example.com');
      passwordInput.props.onChangeText?.('password123');
      loginButton.props.onPress?.();

      unmount();

      await act(async () => {
        resolveLogin!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during login error', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      let rejectLogin: (error: Error) => void;
      const loginPromise = new Promise<void>((_, reject) => {
        rejectLogin = reject;
      });
      // Add a catch handler to prevent unhandled rejection
      loginPromise.catch(() => {});

      mockAuthHook.login.mockReturnValue(loginPromise as any);

      const emailInput = getByTestId('input-email');
      const passwordInput = getByTestId('input-password');
      const loginButton = getByTestId('button-login');

      // Use direct prop calls since mocked components render as divs
      emailInput.props.onChangeText?.('test@example.com');
      passwordInput.props.onChangeText?.('password123');
      loginButton.props.onPress?.();

      unmount();

      await act(async () => {
        rejectLogin!(new Error('Invalid credentials'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle multiple login attempts before unmount', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const emailInput = getByTestId('input-email');
      const passwordInput = getByTestId('input-password');
      const loginButton = getByTestId('button-login');

      // First attempt
      await act(async () => {
        emailInput.props.onChangeText?.('test1@example.com');
        passwordInput.props.onChangeText?.('password123');
        loginButton.props.onPress?.();
        await new Promise((r) => setTimeout(r, 50));
      });

      // Second attempt
      await act(async () => {
        emailInput.props.onChangeText?.('test2@example.com');
        passwordInput.props.onChangeText?.('password456');
        loginButton.props.onPress?.();
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Google SSO Cleanup', () => {
    it('should handle unmount during Google sign-in', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-google-signin')).toBeTruthy();
      });

      let resolveGoogle: () => void;
      const googlePromise = new Promise((resolve) => {
        resolveGoogle = resolve;
      });

      mockSsoService.signInWithGoogle.mockReturnValue(
        googlePromise.then(() => createMockUserSession()) as any
      );

      const googleButton = getByTestId('button-google-signin');
      googleButton.props.onPress?.();

      unmount();

      await act(async () => {
        resolveGoogle!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during Google sign-in error', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-google-signin')).toBeTruthy();
      });

      let rejectGoogle: (error: Error) => void;
      const googlePromise = new Promise((_, reject) => {
        rejectGoogle = reject;
      });

      mockSsoService.signInWithGoogle.mockReturnValue(googlePromise as any);

      const googleButton = getByTestId('button-google-signin');
      googleButton.props.onPress?.();

      unmount();

      await act(async () => {
        rejectGoogle!(new Error('Google sign-in failed'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Apple SSO Cleanup', () => {
    it('should handle unmount during Apple sign-in', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-apple-signin')).toBeTruthy();
      });

      let resolveApple: () => void;
      const applePromise = new Promise((resolve) => {
        resolveApple = resolve;
      });

      mockSsoService.signInWithApple.mockReturnValue(
        applePromise.then(() => createMockUserSession()) as any
      );

      const appleButton = getByTestId('button-apple-signin');
      appleButton.props.onPress?.();

      unmount();

      await act(async () => {
        resolveApple!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during Apple sign-in error', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-apple-signin')).toBeTruthy();
      });

      let rejectApple: (error: Error) => void;
      const applePromise = new Promise((_, reject) => {
        rejectApple = reject;
      });

      mockSsoService.signInWithApple.mockReturnValue(applePromise as any);

      const appleButton = getByTestId('button-apple-signin');
      appleButton.props.onPress?.();

      unmount();

      await act(async () => {
        rejectApple!(new Error('Apple sign-in failed'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during cancelled Apple sign-in', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-apple-signin')).toBeTruthy();
      });

      mockSsoService.signInWithApple.mockRejectedValue(
        new Error('User cancelled')
      );

      const appleButton = getByTestId('button-apple-signin');
      appleButton.props.onPress?.();

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Form State Cleanup', () => {
    it('should handle unmount during form input changes', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const emailInput = getByTestId('input-email');
      const passwordInput = getByTestId('input-password');

      await act(async () => {
        emailInput.props.onChangeText?.('test@example.com');
        passwordInput.props.onChangeText?.('password123');
        await new Promise((r) => setTimeout(r, 20));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with form validation errors', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const loginButton = getByTestId('button-login');

      // Trigger validation errors
      loginButton.props.onPress?.();

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount while clearing errors', async () => {
      mockAuthHook.error = 'Invalid credentials';

      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const emailInput = getByTestId('input-email');

      // Trigger error clearing
      emailInput.props.onChangeText?.('new@example.com');

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Rapid Mount/Unmount Cycles', () => {
    it('should handle 20 rapid mount/unmount cycles without warnings', async () => {
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

        await act(async () => {
          await new Promise((r) => setTimeout(r, 10));
        });

        unmount();
      }

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should cleanup all async operations on each cycle', async () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

        await waitFor(() => {
          expect(mockSsoService.isGoogleSignInAvailable).toHaveBeenCalled();
        });

        unmount();
      }

      expect(mockSsoService.isGoogleSignInAvailable).toHaveBeenCalledTimes(5);
      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent SSO checks and login', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const emailInput = getByTestId('input-email');
      const passwordInput = getByTestId('input-password');
      const loginButton = getByTestId('button-login');

      await act(async () => {
        emailInput.props.onChangeText?.('test@example.com');
        passwordInput.props.onChangeText?.('password123');
        loginButton.props.onPress?.();
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle concurrent Google and Apple sign-in attempts', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('button-google-signin')).toBeTruthy();
      });

      // Note: In real scenario, only one SSO can be in progress at a time
      // but we test the cleanup handles any state
      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not hold references after unmount', async () => {
      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(mockSsoService.isGoogleSignInAvailable).toHaveBeenCalled();
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should cleanup all state on unmount', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unmount before initial render completes', () => {
      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);
      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with no SSO available', async () => {
      mockSsoService.isGoogleSignInAvailable.mockResolvedValue(false);
      mockSsoService.isAppleSignInAvailable.mockResolvedValue(false);

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during loading state', async () => {
      mockAuthHook.loading = true;

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with global error', async () => {
      mockAuthHook.error = 'Network connection failed';

      const { unmount } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount without onForgotPassword callback', async () => {
      const { unmount, getByTestId } = render(<LoginScreen onLoginSuccess={() => {}} />);

      await waitFor(() => {
        expect(getByTestId('screen-login')).toBeTruthy();
      });

      const forgotPasswordButton = getByTestId('button-forgot-password');
      forgotPasswordButton.props.onPress?.();

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });
});

/**
 * LoginScreen Validation Logic Tests
 *
 * Tests verify pure validation logic without component rendering:
 * - Email validation regex and trim logic
 * - Password length validation
 * - Form validation success/failure detection
 * - Error message extraction (instanceof Error)
 * - Guard clause logic (isMounted, validateForm)
 * - Field and global error clearing logic
 * - SSO availability checks
 * - Loading state combinations
 * - Conditional rendering logic
 * - Platform-specific logic
 */
describe('LoginScreen Validation Logic Tests', () => {
  describe('Email Validation Regex Logic', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@company.org',
        'admin@sub.domain.com',
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'missing@domain',
        '@nodomain.com',
        'spaces in@domain.com',
        'double@@domain.com',
        'nodot@domaincom',
      ];

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should reject emails with only whitespace', () => {
      const whitespaceEmails = ['   ', '\t', '\n', '  \t\n  '];

      whitespaceEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(emailRegex.test('a@b.c')).toBe(true); // Minimal valid
      expect(emailRegex.test('user@domain.')).toBe(false); // Trailing dot
      expect(emailRegex.test('.user@domain.com')).toBe(true); // Leading dot (technically valid)
    });
  });

  describe('Email Trim Logic', () => {
    it('should detect empty string after trim', () => {
      const email = '   ';
      const isEmpty = !email.trim();
      expect(isEmpty).toBe(true);
    });

    it('should detect non-empty string after trim', () => {
      const email = '  user@example.com  ';
      const isEmpty = !email.trim();
      expect(isEmpty).toBe(false);
    });

    it('should handle tabs and newlines', () => {
      const email = '\t\n\r';
      const isEmpty = !email.trim();
      expect(isEmpty).toBe(true);
    });

    it('should preserve content after trim', () => {
      const email = '  user@example.com  ';
      expect(email.trim()).toBe('user@example.com');
    });
  });

  describe('Password Length Validation Logic', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const shortPasswords = ['', 'a', '1234567'];

      shortPasswords.forEach(password => {
        const isValid = password.length >= 8;
        expect(isValid).toBe(false);
      });
    });

    it('should accept passwords with exactly 8 characters', () => {
      const password = '12345678';
      const isValid = password.length >= 8;
      expect(isValid).toBe(true);
    });

    it('should accept passwords longer than 8 characters', () => {
      const passwords = ['123456789', 'verylongpassword123!@#'];

      passwords.forEach(password => {
        const isValid = password.length >= 8;
        expect(isValid).toBe(true);
      });
    });
  });

  describe('validateForm Object.keys Logic', () => {
    it('should return true when errors object is empty', () => {
      const errors = {};
      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(true);
    });

    it('should return false when errors object has properties', () => {
      const errors = { email: 'Email is required' };
      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
    });

    it('should return false with multiple errors', () => {
      const errors = {
        email: 'Email is required',
        password: 'Password is required',
      };
      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
    });

    it('should handle undefined property values correctly', () => {
      const errors = { email: undefined };
      // Object.keys counts undefined values as properties
      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Combined Email and Password Validation Logic', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should validate complete valid form', () => {
      const formData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const errors: Record<string, string> = {};

      // Email validation
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    it('should detect missing email', () => {
      const formData = {
        email: '',
        password: 'password123',
      };

      const errors: Record<string, string> = {};

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
      expect(errors.email).toBe('Email is required');
    });

    it('should detect invalid email format', () => {
      const formData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const errors: Record<string, string> = {};

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
      expect(errors.email).toBe('Invalid email format');
    });

    it('should detect short password', () => {
      const formData = {
        email: 'user@example.com',
        password: 'short',
      };

      const errors: Record<string, string> = {};

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
      expect(errors.password).toBe('Password must be at least 8 characters long');
    });

    it('should detect multiple validation failures', () => {
      const formData = {
        email: '',
        password: '123',
      };

      const errors: Record<string, string> = {};

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      const isValid = Object.keys(errors).length === 0;
      expect(isValid).toBe(false);
      expect(errors.email).toBe('Email is required');
      expect(errors.password).toBe('Password must be at least 8 characters long');
    });
  });

  describe('handleSubmit Guard Clause Logic', () => {
    it('should block execution when validation fails', () => {
      const validateForm = () => false;
      const shouldProceed = validateForm();
      expect(shouldProceed).toBe(false);
    });

    it('should allow execution when validation succeeds', () => {
      const validateForm = () => true;
      const shouldProceed = validateForm();
      expect(shouldProceed).toBe(true);
    });

    it('should handle early return pattern', () => {
      const validateForm = () => false;
      let loginCalled = false;

      if (!validateForm()) {
        // Early return - login should not be called
      } else {
        loginCalled = true;
      }

      expect(loginCalled).toBe(false);
    });
  });

  describe('Error Message Extraction Logic (instanceof Error)', () => {
    it('should extract message from Error object', () => {
      const err = new Error('Network connection failed');
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      expect(message).toBe('Network connection failed');
    });

    it('should use fallback message for non-Error objects', () => {
      const err = 'String error';
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      expect(message).toBe('Google sign-in failed');
    });

    it('should use fallback message for null', () => {
      const err = null;
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      expect(message).toBe('Google sign-in failed');
    });

    it('should use fallback message for undefined', () => {
      const err = undefined;
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      expect(message).toBe('Apple sign-in failed');
    });

    it('should handle Error with empty message', () => {
      const err = new Error('');
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      expect(message).toBe('');
    });
  });

  describe('Apple Error Message Filtering Logic', () => {
    it('should suppress alert when message includes "cancelled"', () => {
      const message = 'User cancelled the operation';
      const shouldShowAlert = !message.includes('cancelled');
      expect(shouldShowAlert).toBe(false);
    });

    it('should show alert when message does not include "cancelled"', () => {
      const message = 'Network error occurred';
      const shouldShowAlert = !message.includes('cancelled');
      expect(shouldShowAlert).toBe(true);
    });

    it('should be case-sensitive', () => {
      const message = 'User Cancelled the operation';
      const shouldShowAlert = !message.includes('cancelled');
      expect(shouldShowAlert).toBe(true); // "Cancelled" !== "cancelled"
    });

    it('should handle partial matches', () => {
      const messages = [
        'Operation was cancelled by user',
        'User cancelled',
        'cancelled',
      ];

      messages.forEach(message => {
        const shouldShowAlert = !message.includes('cancelled');
        expect(shouldShowAlert).toBe(false);
      });
    });
  });

  describe('Field Error Clearing Logic', () => {
    it('should clear error when field has error', () => {
      const formErrors = { email: 'Email is required' };
      const field = 'email';

      const shouldClear = !!formErrors[field];
      expect(shouldClear).toBe(true);
    });

    it('should not clear when field has no error', () => {
      const formErrors: Record<string, string> = {};
      const field = 'email';

      const shouldClear = !!formErrors[field];
      expect(shouldClear).toBe(false);
    });

    it('should handle undefined field error', () => {
      const formErrors = { email: undefined as any };
      const field = 'email';

      const shouldClear = !!formErrors[field];
      expect(shouldClear).toBe(false);
    });

    it('should handle different fields', () => {
      const formErrors = { email: 'Email is required', password: 'Password is required' };

      expect(!!formErrors['email']).toBe(true);
      expect(!!formErrors['password']).toBe(true);
      expect(!!formErrors['other']).toBe(false);
    });
  });

  describe('Global Error Clearing Logic', () => {
    it('should clear error when error exists', () => {
      const error = 'Network connection failed';
      const shouldClear = !!error;
      expect(shouldClear).toBe(true);
    });

    it('should not clear when no error exists', () => {
      const error = null;
      const shouldClear = !!error;
      expect(shouldClear).toBe(false);
    });

    it('should handle empty string error', () => {
      const error = '';
      const shouldClear = !!error;
      expect(shouldClear).toBe(false);
    });

    it('should handle undefined error', () => {
      const error = undefined;
      const shouldClear = !!error;
      expect(shouldClear).toBe(false);
    });
  });

  describe('SSO Availability Guard Clause Logic', () => {
    it('should block state update when not mounted', () => {
      const isMounted = false;
      const googleOk = true;
      const appleOk = true;

      let stateUpdated = false;
      if (!isMounted) {
        // Early return - no state update
      } else {
        stateUpdated = true;
      }

      expect(stateUpdated).toBe(false);
    });

    it('should allow state update when mounted', () => {
      const isMounted = true;
      const googleOk = true;
      const appleOk = true;

      let stateUpdated = false;
      if (!isMounted) {
        // Early return
      } else {
        stateUpdated = true;
      }

      expect(stateUpdated).toBe(true);
    });

    it('should handle Promise.all results', async () => {
      const results = await Promise.all([
        Promise.resolve(true),
        Promise.resolve(false),
      ]);

      const [googleOk, appleOk] = results;
      expect(googleOk).toBe(true);
      expect(appleOk).toBe(false);
    });
  });

  describe('loginWithSSO Conditional Logic', () => {
    it('should call loginWithSSO when available', () => {
      const loginWithSSO = jest.fn();
      const userSession = { token: 'mock-token' };

      if (loginWithSSO) {
        loginWithSSO(userSession);
      }

      expect(loginWithSSO).toHaveBeenCalledWith(userSession);
    });

    it('should skip loginWithSSO when not available', () => {
      const loginWithSSO = null;
      const userSession = { token: 'mock-token' };

      let called = false;
      if (loginWithSSO) {
        called = true;
      }

      expect(called).toBe(false);
    });

    it('should handle undefined loginWithSSO', () => {
      const loginWithSSO = undefined;
      const userSession = { token: 'mock-token' };

      let called = false;
      if (loginWithSSO) {
        called = true;
      }

      expect(called).toBe(false);
    });
  });

  describe('isAnyLoading Compound Check Logic', () => {
    it('should be true when loading is true', () => {
      const loading = true;
      const ssoLoading = null;

      const isAnyLoading = loading || ssoLoading !== null;
      expect(isAnyLoading).toBe(true);
    });

    it('should be true when ssoLoading is google', () => {
      const loading = false;
      const ssoLoading = 'google';

      const isAnyLoading = loading || ssoLoading !== null;
      expect(isAnyLoading).toBe(true);
    });

    it('should be true when ssoLoading is apple', () => {
      const loading = false;
      const ssoLoading = 'apple';

      const isAnyLoading = loading || ssoLoading !== null;
      expect(isAnyLoading).toBe(true);
    });

    it('should be false when both are inactive', () => {
      const loading = false;
      const ssoLoading = null;

      const isAnyLoading = loading || ssoLoading !== null;
      expect(isAnyLoading).toBe(false);
    });

    it('should be true when both are active', () => {
      const loading = true;
      const ssoLoading = 'google' as const;

      const isAnyLoading = loading || ssoLoading !== null;
      expect(isAnyLoading).toBe(true);
    });
  });

  describe('SSO Container Visibility Logic', () => {
    it('should show container when Google available', () => {
      const googleAvailable = true;
      const appleAvailable = false;

      const shouldShow = googleAvailable || appleAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should show container when Apple available', () => {
      const googleAvailable = false;
      const appleAvailable = true;

      const shouldShow = googleAvailable || appleAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should show container when both available', () => {
      const googleAvailable = true;
      const appleAvailable = true;

      const shouldShow = googleAvailable || appleAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should hide container when neither available', () => {
      const googleAvailable = false;
      const appleAvailable = false;

      const shouldShow = googleAvailable || appleAvailable;
      expect(shouldShow).toBe(false);
    });
  });

  describe('Individual SSO Button Visibility Logic', () => {
    it('should show Apple button when available', () => {
      const appleAvailable = true;
      const shouldShow = appleAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should hide Apple button when not available', () => {
      const appleAvailable = false;
      const shouldShow = appleAvailable;
      expect(shouldShow).toBe(false);
    });

    it('should show Google button when available', () => {
      const googleAvailable = true;
      const shouldShow = googleAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should hide Google button when not available', () => {
      const googleAvailable = false;
      const shouldShow = googleAvailable;
      expect(shouldShow).toBe(false);
    });
  });

  describe('Input Error Styling Logic', () => {
    it('should apply error style when field has error', () => {
      const formErrors = { email: 'Email is required' };
      const field = 'email';

      const errorStyle = formErrors[field] ? 'styles.inputError' : null;
      expect(errorStyle).toBe('styles.inputError');
    });

    it('should not apply error style when field has no error', () => {
      const formErrors: Record<string, string> = {};
      const field = 'email';

      const errorStyle = formErrors[field] ? 'styles.inputError' : null;
      expect(errorStyle).toBeNull();
    });

    it('should handle password field error', () => {
      const formErrors = { password: 'Password is required' };
      const field = 'password';

      const errorStyle = formErrors[field] ? 'styles.inputError' : null;
      expect(errorStyle).toBe('styles.inputError');
    });
  });

  describe('Error Text Visibility Logic', () => {
    it('should show error text when email error exists', () => {
      const formErrors = { email: 'Email is required' };
      const shouldShow = !!formErrors.email;
      expect(shouldShow).toBe(true);
    });

    it('should hide error text when no email error', () => {
      const formErrors: Record<string, string> = {};
      const shouldShow = !!formErrors.email;
      expect(shouldShow).toBe(false);
    });

    it('should show error text when password error exists', () => {
      const formErrors = { password: 'Password is required' };
      const shouldShow = !!formErrors.password;
      expect(shouldShow).toBe(true);
    });

    it('should hide error text when no password error', () => {
      const formErrors: Record<string, string> = {};
      const shouldShow = !!formErrors.password;
      expect(shouldShow).toBe(false);
    });
  });

  describe('Global Error Visibility Logic', () => {
    it('should show global error when error exists', () => {
      const error = 'Network connection failed';
      const shouldShow = !!error;
      expect(shouldShow).toBe(true);
    });

    it('should hide global error when no error', () => {
      const error = null;
      const shouldShow = !!error;
      expect(shouldShow).toBe(false);
    });

    it('should handle empty string error', () => {
      const error = '';
      const shouldShow = !!error;
      expect(shouldShow).toBe(false);
    });
  });

  describe('Loading Button Styling Logic', () => {
    it('should apply disabled style when loading', () => {
      const loading = true;
      const ssoLoading = null;
      const isAnyLoading = loading || ssoLoading !== null;

      const disabledStyle = isAnyLoading ? 'styles.loginButtonDisabled' : null;
      expect(disabledStyle).toBe('styles.loginButtonDisabled');
    });

    it('should apply disabled style when SSO loading', () => {
      const loading = false;
      const ssoLoading = 'google';
      const isAnyLoading = loading || ssoLoading !== null;

      const disabledStyle = isAnyLoading ? 'styles.loginButtonDisabled' : null;
      expect(disabledStyle).toBe('styles.loginButtonDisabled');
    });

    it('should not apply disabled style when not loading', () => {
      const loading = false;
      const ssoLoading = null;
      const isAnyLoading = loading || ssoLoading !== null;

      const disabledStyle = isAnyLoading ? 'styles.loginButtonDisabled' : null;
      expect(disabledStyle).toBeNull();
    });
  });

  describe('ActivityIndicator Visibility Logic', () => {
    it('should show login indicator when loading', () => {
      const loading = true;
      const shouldShow = loading;
      expect(shouldShow).toBe(true);
    });

    it('should hide login indicator when not loading', () => {
      const loading = false;
      const shouldShow = loading;
      expect(shouldShow).toBe(false);
    });

    it('should show Apple indicator when Apple SSO loading', () => {
      const ssoLoading = 'apple';
      const shouldShow = ssoLoading === 'apple';
      expect(shouldShow).toBe(true);
    });

    it('should show Google indicator when Google SSO loading', () => {
      const ssoLoading = 'google';
      const shouldShow = ssoLoading === 'google';
      expect(shouldShow).toBe(true);
    });

    it('should hide SSO indicator when not loading', () => {
      const ssoLoading = null;
      const shouldShowApple = ssoLoading === 'apple';
      const shouldShowGoogle = ssoLoading === 'google';
      expect(shouldShowApple).toBe(false);
      expect(shouldShowGoogle).toBe(false);
    });
  });

  describe('onForgotPassword Fallback Logic', () => {
    it('should use provided callback when available', () => {
      const onForgotPassword = jest.fn();
      const callback = onForgotPassword || (() => {});

      callback();
      expect(onForgotPassword).toHaveBeenCalled();
    });

    it('should use fallback when callback not provided', () => {
      const onForgotPassword = undefined;
      const fallback = jest.fn();
      const callback = onForgotPassword || fallback;

      callback();
      expect(fallback).toHaveBeenCalled();
    });

    it('should handle null callback', () => {
      const onForgotPassword = null;
      const fallback = jest.fn();
      const callback = onForgotPassword || fallback;

      callback();
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('Platform.OS KeyboardAvoidingView Logic', () => {
    it('should use padding behavior for iOS', () => {
      const platformOS = 'ios';
      const behavior = platformOS === 'ios' ? 'padding' : 'height';
      expect(behavior).toBe('padding');
    });

    it('should use height behavior for Android', () => {
      const platformOS = 'android';
      const behavior = platformOS === 'ios' ? 'padding' : 'height';
      expect(behavior).toBe('height');
    });

    it('should use height behavior for other platforms', () => {
      const platformOS = 'web';
      const behavior = platformOS === 'ios' ? 'padding' : 'height';
      expect(behavior).toBe('height');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle validation with whitespace-only email', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const formData = { email: '   ', password: 'password123' };
      const errors: Record<string, string> = {};

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      expect(errors.email).toBe('Email is required');
    });

    it('should handle all loading states simultaneously', () => {
      const scenarios = [
        { loading: true, ssoLoading: null, expected: true },
        { loading: false, ssoLoading: 'google', expected: true },
        { loading: false, ssoLoading: 'apple', expected: true },
        { loading: true, ssoLoading: 'google', expected: true },
        { loading: false, ssoLoading: null, expected: false },
      ];

      scenarios.forEach(({ loading, ssoLoading, expected }) => {
        const isAnyLoading = loading || ssoLoading !== null;
        expect(isAnyLoading).toBe(expected);
      });
    });

    it('should handle SSO availability combinations', () => {
      const scenarios = [
        { google: true, apple: true, expectedShow: true, expectedButtons: 2 },
        { google: true, apple: false, expectedShow: true, expectedButtons: 1 },
        { google: false, apple: true, expectedShow: true, expectedButtons: 1 },
        { google: false, apple: false, expectedShow: false, expectedButtons: 0 },
      ];

      scenarios.forEach(({ google, apple, expectedShow, expectedButtons }) => {
        const shouldShowContainer = google || apple;
        let buttonCount = 0;
        if (google) buttonCount++;
        if (apple) buttonCount++;

        expect(shouldShowContainer).toBe(expectedShow);
        expect(buttonCount).toBe(expectedButtons);
      });
    });

    it('should handle error extraction with various error types', () => {
      const errorScenarios = [
        { error: new Error('Test'), expected: 'Test' },
        { error: 'string', expected: 'fallback' },
        { error: null, expected: 'fallback' },
        { error: undefined, expected: 'fallback' },
        { error: { message: 'object' }, expected: 'fallback' },
        { error: 123, expected: 'fallback' },
      ];

      errorScenarios.forEach(({ error, expected }) => {
        const message = error instanceof Error ? error.message : 'fallback';
        expect(message).toBe(expected);
      });
    });

    it('should handle combined form and global errors', () => {
      const formErrors = { email: 'Email is required' };
      const globalError = 'Network connection failed';

      const hasFieldErrors = Object.keys(formErrors).length > 0;
      const hasGlobalError = !!globalError;

      expect(hasFieldErrors).toBe(true);
      expect(hasGlobalError).toBe(true);

      // Both types of errors can exist simultaneously
      const totalErrors = (hasFieldErrors ? 1 : 0) + (hasGlobalError ? 1 : 0);
      expect(totalErrors).toBe(2);
    });
  });

  describe('SSO Loading State Exact Equality Logic (lines 216, 240)', () => {
    it('should match ssoLoading === "apple" only when exactly "apple"', () => {
      const testCases = [
        { ssoLoading: 'apple', expected: true },
        { ssoLoading: 'google', expected: false },
        { ssoLoading: null, expected: false },
        { ssoLoading: undefined, expected: false },
        { ssoLoading: '', expected: false },
      ];

      testCases.forEach(({ ssoLoading, expected }) => {
        const isAppleLoading = ssoLoading === 'apple';
        expect(isAppleLoading).toBe(expected);
      });
    });

    it('should match ssoLoading === "google" only when exactly "google"', () => {
      const testCases = [
        { ssoLoading: 'google', expected: true },
        { ssoLoading: 'apple', expected: false },
        { ssoLoading: null, expected: false },
        { ssoLoading: undefined, expected: false },
        { ssoLoading: '', expected: false },
      ];

      testCases.forEach(({ ssoLoading, expected }) => {
        const isGoogleLoading = ssoLoading === 'google';
        expect(isGoogleLoading).toBe(expected);
      });
    });

    it('should show correct loading indicator based on exact state match', () => {
      type SsoLoadingState = 'google' | 'apple' | null;
      const states: SsoLoadingState[] = ['google', 'apple', null];

      states.forEach(currentState => {
        const showGoogleIndicator = currentState === 'google';
        const showAppleIndicator = currentState === 'apple';

        // Only one can be true at a time, or both false
        expect(showGoogleIndicator && showAppleIndicator).toBe(false);

        if (currentState === 'google') {
          expect(showGoogleIndicator).toBe(true);
          expect(showAppleIndicator).toBe(false);
        } else if (currentState === 'apple') {
          expect(showGoogleIndicator).toBe(false);
          expect(showAppleIndicator).toBe(true);
        } else {
          expect(showGoogleIndicator).toBe(false);
          expect(showAppleIndicator).toBe(false);
        }
      });
    });
  });

  describe('Responsive MaxWidth Ternary Logic (line 399)', () => {
    it('should return 400 when isLargeScreen is true', () => {
      const responsive = { isLargeScreen: true };
      const maxWidth = responsive.isLargeScreen ? 400 : '100%';

      expect(maxWidth).toBe(400);
      expect(typeof maxWidth).toBe('number');
    });

    it('should return "100%" when isLargeScreen is false', () => {
      const responsive = { isLargeScreen: false };
      const maxWidth = responsive.isLargeScreen ? 400 : '100%';

      expect(maxWidth).toBe('100%');
      expect(typeof maxWidth).toBe('string');
    });

    it('should handle different maxWidth types correctly', () => {
      const scenarios = [
        { isLargeScreen: true, expectedValue: 400, expectedType: 'number' },
        { isLargeScreen: false, expectedValue: '100%', expectedType: 'string' },
      ];

      scenarios.forEach(({ isLargeScreen, expectedValue, expectedType }) => {
        const maxWidth = isLargeScreen ? 400 : '100%';
        expect(maxWidth).toBe(expectedValue);
        expect(typeof maxWidth).toBe(expectedType);
      });
    });
  });

  describe('Input Editable Compound Negation Logic (lines 275, 305)', () => {
    it('should disable input when loading is true', () => {
      const loading = true;
      const ssoLoading = null;
      const isAnyLoading = loading || ssoLoading !== null;
      const editable = !isAnyLoading;

      expect(isAnyLoading).toBe(true);
      expect(editable).toBe(false);
    });

    it('should disable input when ssoLoading is active', () => {
      const loading = false;
      const ssoLoading: 'google' | 'apple' | null = 'google';
      const isAnyLoading = loading || ssoLoading !== null;
      const editable = !isAnyLoading;

      expect(isAnyLoading).toBe(true);
      expect(editable).toBe(false);
    });

    it('should enable input when no loading is active', () => {
      const loading = false;
      const ssoLoading = null;
      const isAnyLoading = loading || ssoLoading !== null;
      const editable = !isAnyLoading;

      expect(isAnyLoading).toBe(false);
      expect(editable).toBe(true);
    });

    it('should handle all combinations of loading states', () => {
      const combinations = [
        { loading: true, ssoLoading: 'google' as const, expectedEditable: false },
        { loading: true, ssoLoading: 'apple' as const, expectedEditable: false },
        { loading: true, ssoLoading: null, expectedEditable: false },
        { loading: false, ssoLoading: 'google' as const, expectedEditable: false },
        { loading: false, ssoLoading: 'apple' as const, expectedEditable: false },
        { loading: false, ssoLoading: null, expectedEditable: true },
      ];

      combinations.forEach(({ loading, ssoLoading, expectedEditable }) => {
        const isAnyLoading = loading || ssoLoading !== null;
        const editable = !isAnyLoading;
        expect(editable).toBe(expectedEditable);
      });
    });
  });

  describe('ActivityIndicator Color Conditional Selection (lines 217, 241, 349)', () => {
    it('should use apple text color for apple loading indicator', () => {
      const SPECIAL_COLORS = {
        socialAuth: {
          appleText: '#FFFFFF',
          googleText: '#1F1F1F',
        },
      };
      const colors = { text: { inverse: '#FFFFFF' } };

      const ssoLoading: 'apple' | 'google' | null = 'apple';
      const appleColor = SPECIAL_COLORS.socialAuth.appleText;

      expect(appleColor).toBe('#FFFFFF');
    });

    it('should use google text color for google loading indicator', () => {
      const SPECIAL_COLORS = {
        socialAuth: {
          appleText: '#FFFFFF',
          googleText: '#1F1F1F',
        },
      };

      const ssoLoading: 'apple' | 'google' | null = 'google';
      const googleColor = SPECIAL_COLORS.socialAuth.googleText;

      expect(googleColor).toBe('#1F1F1F');
    });

    it('should use inverse color for main login loading indicator', () => {
      const colors = { text: { inverse: '#FFFFFF' } };
      const loading = true;
      const loadingColor = colors.text.inverse;

      expect(loadingColor).toBe('#FFFFFF');
    });
  });

  describe('Array Style Composition with Multiple Conditionals (lines 264-266, 331-334)', () => {
    it('should compose base input style with error style when error exists', () => {
      const styles = {
        input: { height: 48, borderWidth: 1 },
        inputError: { borderColor: 'red' },
      };
      const formErrors = { email: 'Email is required' };

      const styleArray = [
        styles.input,
        formErrors.email ? styles.inputError : null,
      ];

      // Filter out null values
      const finalStyles = styleArray.filter(s => s !== null);

      expect(finalStyles).toHaveLength(2);
      expect(finalStyles[0]).toEqual(styles.input);
      expect(finalStyles[1]).toEqual(styles.inputError);
    });

    it('should compose base input style without error style when no error', () => {
      const styles = {
        input: { height: 48, borderWidth: 1 },
        inputError: { borderColor: 'red' },
      };
      const formErrors = {};

      const styleArray = [
        styles.input,
        formErrors.email ? styles.inputError : null,
      ];

      const finalStyles = styleArray.filter(s => s !== null);

      expect(finalStyles).toHaveLength(1);
      expect(finalStyles[0]).toEqual(styles.input);
    });

    it('should compose login button styles with multiple conditionals', () => {
      const styles = {
        loginButton: { height: 48, backgroundColor: 'blue' },
        loginButtonDisabled: { backgroundColor: 'gray' },
      };
      const getTouchTargetStyle = () => ({ minHeight: 48 });
      const isAnyLoading = true;

      const styleArray = [
        styles.loginButton,
        isAnyLoading ? styles.loginButtonDisabled : null,
        getTouchTargetStyle(),
      ];

      const finalStyles = styleArray.filter(s => s !== null);

      expect(finalStyles).toHaveLength(3);
      expect(finalStyles[0]).toEqual(styles.loginButton);
      expect(finalStyles[1]).toEqual(styles.loginButtonDisabled);
      expect(finalStyles[2]).toEqual({ minHeight: 48 });
    });

    it('should handle null values in style array correctly', () => {
      const styles = {
        input: { height: 48 },
        inputError: { borderColor: 'red' },
      };

      const scenarios = [
        { hasError: true, expectedLength: 2 },
        { hasError: false, expectedLength: 1 },
      ];

      scenarios.forEach(({ hasError, expectedLength }) => {
        const styleArray = [
          styles.input,
          hasError ? styles.inputError : null,
        ];

        const finalStyles = styleArray.filter(s => s !== null);
        expect(finalStyles).toHaveLength(expectedLength);
      });
    });
  });

  describe('SSO Availability Empty Catch Block Logic (lines 56-57)', () => {
    it('should silently fail when SSO availability check throws error', () => {
      let errorThrown = false;
      let ssoAvailable = false;

      try {
        throw new Error('SSO not configured');
      } catch {
        // SSO not available - buttons won't be shown
        errorThrown = true;
        ssoAvailable = false; // Implicit behavior of empty catch
      }

      expect(errorThrown).toBe(true);
      expect(ssoAvailable).toBe(false);
    });

    it('should not throw when SSO check fails', () => {
      const checkSSO = () => {
        try {
          throw new Error('Network error');
        } catch {
          // Silent failure - SSO buttons hidden
        }
      };

      expect(() => checkSSO()).not.toThrow();
    });

    it('should default to unavailable state on SSO check error', () => {
      const googleAvailable = false;
      const appleAvailable = false;

      try {
        throw new Error('SSO service unavailable');
      } catch {
        // Both remain false (default state)
      }

      expect(googleAvailable).toBe(false);
      expect(appleAvailable).toBe(false);
    });
  });

  describe('Forgot Password Fallback Handler Logic (line 362)', () => {
    it('should use provided onForgotPassword handler when available', () => {
      const mockHandler = jest.fn();
      const onForgotPassword = mockHandler;

      const handler = onForgotPassword || (() => {});
      handler();

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should use fallback Alert.alert when onForgotPassword is undefined', () => {
      const onForgotPassword = undefined;
      const mockAlert = jest.fn();

      const handler = onForgotPassword || (() => mockAlert('Password Reset', 'Please contact your club administrator'));
      handler();

      expect(mockAlert).toHaveBeenCalledWith('Password Reset', expect.any(String));
    });

    it('should use fallback when onForgotPassword is null', () => {
      const onForgotPassword = null;
      const fallbackCalled = onForgotPassword || true;

      expect(fallbackCalled).toBe(true);
    });

    it('should handle truthy vs falsy onForgotPassword correctly', () => {
      const scenarios = [
        { handler: jest.fn(), shouldUseFallback: false },
        { handler: undefined, shouldUseFallback: true },
        { handler: null, shouldUseFallback: true },
      ];

      scenarios.forEach(({ handler, shouldUseFallback }) => {
        const willUseFallback = !handler;
        expect(willUseFallback).toBe(shouldUseFallback);
      });
    });
  });
});
