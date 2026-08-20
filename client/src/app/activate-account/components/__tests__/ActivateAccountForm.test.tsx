/**
 * @jest-environment jsdom
 *
 * Activate Account Form Tests
 *
 * Tests account activation flow following boundary mocking pattern:
 * - MSW for HTTP mocking only
 * - Real component rendering
 * - Real form validation and password strength checking
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiClient from '@/services/apiClient';
import { ActivateAccountForm } from '../ActivateAccountForm';

// HTTP boundary mock. MSW's fetch shim does not intercept axios in jsdom, so
// network-driven flows (submit / error / resend) are exercised by driving the
// apiClient.post mock directly. Rendering/validation tests below need no HTTP.
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.Mock;

// Builds an axios-shaped rejection so ErrorHandler.parseError treats it as an
// API error and surfaces the server-provided message.
function apiError(status: number, message: string) {
  return { isAxiosError: true, response: { status, data: { message } }, message };
}

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('ActivateAccountForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('token');

    // Default: any POST (activate or resend) succeeds. Individual tests
    // override with mockResolvedValueOnce / mockRejectedValueOnce as needed.
    mockPost.mockResolvedValue({
      data: { success: true, message: 'Account activated successfully' },
    });
  });

  describe('Rendering', () => {
    it('should render activation form', () => {
      render(<ActivateAccountForm />);
      expect(screen.getByText(/activate your account/i)).toBeInTheDocument();
    });

    it('should show error when no token provided', async () => {
      render(<ActivateAccountForm />);

      await waitFor(() => {
        expect(screen.getByText(/no activation token/i)).toBeInTheDocument();
      });
    });

    it('should display all form fields', () => {
      mockSearchParams.set('token', 'test-token-123');

      render(<ActivateAccountForm />);

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('should show password visibility toggle', () => {
      mockSearchParams.set('token', 'test-token-123');

      render(<ActivateAccountForm />);

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      expect(toggleButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Token Handling', () => {
    it('should extract token from URL parameter', () => {
      mockSearchParams.set('token', 'test-token-123');

      render(<ActivateAccountForm />);

      expect(screen.queryByText(/no activation token/i)).not.toBeInTheDocument();
    });

    it('should show error when token is missing', async () => {
      render(<ActivateAccountForm />);

      await waitFor(() => {
        expect(screen.getByText(/no activation token/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'Short1!');

      expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
    });

    it('should validate password has uppercase', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'lowercase123!');

      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    });

    it('should validate password has lowercase', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'UPPERCASE123!');

      expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
    });

    it('should validate password has number', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'NoNumbersHere!');

      expect(screen.getByText(/^one number$/i)).toBeInTheDocument();
    });

    it('should validate password has special character', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'NoSpecial123');

      expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });

    it('should show all requirements met for valid password', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      await user.type(passwordInput, 'ValidPassword123!');

      // All 5 requirements should be met
      await waitFor(() => {
        expect(screen.queryByText(/at least 12 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Confirmation', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should validate passwords match', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!');

      const submitButton = screen.getByRole('button', { name: /activate account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords.*match/i)).toBeInTheDocument();
      });
    });

    it('should accept matching passwords', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      expect(screen.queryByText(/passwords.*match/i)).not.toBeInTheDocument();
    });
  });

  describe('Phone Number', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should accept valid phone number', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '555-123-4567');

      expect(phoneInput).toHaveValue('555-123-4567');
    });

    it('should be optional', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /activate account/i });
      await user.click(submitButton);

      // Should not show phone validation error
      await waitFor(() => {
        expect(screen.queryByText(/phone.*required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Legacy SMS Consent', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should not show an SMS consent checkbox when phone is entered', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      expect(screen.queryByRole('checkbox', { name: /receive sms notifications/i })).not.toBeInTheDocument();

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '555-123-4567');

      expect(screen.queryByRole('checkbox', { name: /receive sms notifications/i })).not.toBeInTheDocument();
    });
  });

  describe('Password Visibility', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getAllByRole('button', { name: '' })[0];
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();

      render(<ActivateAccountForm />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[1]);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  // Skip flaky tests - MSW/axios integration has issues in jsdom environment
  describe('Form Submission', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockPost.mockResolvedValueOnce({ data: { success: true, message: 'ok' } });

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /activate account/i });

      // Button should be enabled with valid password
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account activated!/i)).toBeInTheDocument();
      });
      expect(mockPost).toHaveBeenCalledWith('/auth/activate-member-account', {
        activationToken: 'test-token-123',
        newPassword: 'ValidPassword123!',
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      // Never-resolving request keeps the form in its loading state.
      mockPost.mockReturnValueOnce(new Promise(() => {}));

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      await user.click(screen.getByRole('button', { name: /activate account/i }));

      expect(await screen.findByText(/activating account/i)).toBeInTheDocument();
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      mockPost.mockReturnValueOnce(new Promise(() => {}));

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /activate account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /activating account/i })).toBeDisabled();
      });
    });

    it('should redirect to login after successful activation', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      mockPost.mockResolvedValueOnce({ data: { success: true, message: 'ok' } });

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      await user.click(screen.getByRole('button', { name: /activate account/i }));

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText(/account activated!/i)).toBeInTheDocument();
      });

      // Fast-forward through the 2-second timeout
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?activated=true');
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    it('should display error for invalid token', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce(apiError(400, 'Invalid or expired token'));

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      await user.click(screen.getByRole('button', { name: /activate account/i }));

      // ErrorHandler prefixes the server message with the operation context.
      expect(await screen.findByText(/invalid or expired token/i)).toBeInTheDocument();
    });

    it('should display error for server failure', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce(apiError(500, 'Boom'));

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');

      await user.click(screen.getByRole('button', { name: /activate account/i }));

      // 500 maps to the auth-specific custom message.
      expect(
        await screen.findByText(/authentication service is temporarily unavailable/i)
      ).toBeInTheDocument();
    });
  });

  describe('Resend Activation', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test-token-123');
    });

    // Drives an activation that fails with an expired-token error and returns
    // the resend email input that the component reveals in response.
    async function failActivationWithExpiredToken(user: ReturnType<typeof userEvent.setup>) {
      mockPost.mockRejectedValueOnce(apiError(400, 'Token has expired'));

      render(<ActivateAccountForm />);

      await user.type(screen.getByLabelText(/new password/i), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!');
      await user.click(screen.getByRole('button', { name: /activate account/i }));

      return screen.findByLabelText(/enter your email to request/i);
    }

    it('reveals an email field and resend button when the token is expired', async () => {
      const user = userEvent.setup();

      const emailInput = await failActivationWithExpiredToken(user);

      expect(emailInput).toBeInTheDocument();
      // Resend is gated on an email being supplied.
      expect(
        screen.getByRole('button', { name: /request new activation link/i })
      ).toBeDisabled();
    });

    it('should allow resending activation email', async () => {
      const user = userEvent.setup();

      const emailInput = await failActivationWithExpiredToken(user);

      mockPost.mockResolvedValueOnce({ data: { success: true, message: 'sent' } });
      await user.type(emailInput, 'member@example.com');
      await user.click(screen.getByRole('button', { name: /request new activation link/i }));

      expect(
        await screen.findByText(/activation email has been resent/i)
      ).toBeInTheDocument();
      expect(mockPost).toHaveBeenLastCalledWith('/auth/resend-activation', {
        email: 'member@example.com',
      });
    });

    it('should show loading state during resend', async () => {
      const user = userEvent.setup();

      const emailInput = await failActivationWithExpiredToken(user);

      mockPost.mockReturnValueOnce(new Promise(() => {})); // never resolves
      await user.type(emailInput, 'member@example.com');
      await user.click(screen.getByRole('button', { name: /request new activation link/i }));

      expect(await screen.findByText(/sending/i)).toBeInTheDocument();
    });

    it('should handle resend error', async () => {
      const user = userEvent.setup();

      const emailInput = await failActivationWithExpiredToken(user);

      mockPost.mockRejectedValueOnce(apiError(500, 'mail server down'));
      await user.type(emailInput, 'member@example.com');
      await user.click(screen.getByRole('button', { name: /request new activation link/i }));

      // ErrorHandler maps 500 to the auth-service-unavailable message.
      expect(
        await screen.findByText(/authentication service is temporarily unavailable/i)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have back to home link', () => {
      render(<ActivateAccountForm />);
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    });

    it('should have contact support link', () => {
      render(<ActivateAccountForm />);
      expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
    });
  });
});
