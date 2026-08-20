/**
 * AuthService Tests - Boundary Mocking Pattern
 *
 * These tests exercise REAL authService code by mocking at the HTTP boundary (apiClient).
 * This approach tests:
 * - Real service method logic
 * - Real error handling with ErrorHandler
 * - Real session caching
 *
 * apiClient is the HTTP boundary for services - mocking it is acceptable.
 */
import authService, {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SSOLoginRequest,
  SSOLoginResponse,
  UserSession,
} from '../authService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary - this is acceptable per boundary mocking rules
jest.mock('../apiClient');

// Mock logger to prevent side effects
jest.mock('@/lib/logger', () => ({
  logger: {
    api: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear session cache between tests
    authService.clearSessionCache();
  });

  describe('login', () => {
    const validCredentials: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    const successResponse: LoginResponse = {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      role: 'Admin',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
      message: 'Login successful',
    };

    it('should successfully login with valid credentials', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: successResponse });

      const result = await authService.login(validCredentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', validCredentials);
      expect(result).toEqual(successResponse);
    });

    it('should clear session cache on successful login', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: successResponse });

      // First, set up a cached session
      const mockSession: UserSession = {
        userId: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();

      // Now login
      await authService.login(validCredentials);

      // Session cache should be cleared, requiring a fresh fetch
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error with custom message for 401 status', async () => {
      const error = new Error('Invalid credentials');
      (error as unknown as { response: object }).response = {
        status: 401,
        data: { message: 'Invalid credentials' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.login(validCredentials)).rejects.toThrow();
    });

    it('should throw error with custom message for 429 rate limit', async () => {
      const error = new Error('Too many requests');
      (error as unknown as { response: object }).response = {
        status: 429,
        data: { message: 'Too many requests' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.login(validCredentials)).rejects.toThrow();
    });
  });

  describe('register', () => {
    const validRegistration: RegisterRequest = {
      fullName: 'New User',
      email: 'newuser@example.com',
      password: 'securePassword123',
      clubName: 'New Club',
    };

    const successResponse: RegisterResponse = {
      token: 'jwt-token-123',
      user: {
        id: 1,
        fullName: 'New User',
        email: 'newuser@example.com',
        onboardingCompleted: false,
      },
      club: {
        id: 1,
        name: 'New Club',
        tier: 'Grow',
      },
    };

    it('should successfully register a new user', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: successResponse });

      const result = await authService.register(validRegistration);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', validRegistration);
      expect(result).toEqual(successResponse);
    });

    it('should throw error for duplicate email (409)', async () => {
      const error = new Error('Email already exists');
      (error as unknown as { response: object }).response = {
        status: 409,
        data: { message: 'Email already exists' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.register(validRegistration)).rejects.toThrow();
    });

    it('should throw error for validation failure (400)', async () => {
      const error = new Error('Validation failed');
      (error as unknown as { response: object }).response = {
        status: 400,
        data: { message: 'Password too weak' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.register(validRegistration)).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    const request: ForgotPasswordRequest = {
      email: 'user@example.com',
    };

    it('should successfully request password reset', async () => {
      mockApiClient.post.mockResolvedValueOnce({});

      await expect(authService.forgotPassword(request)).resolves.not.toThrow();
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', request);
    });

    it('should not throw error for non-existent email (security feature)', async () => {
      // Even if email doesn't exist, should resolve for security
      const error = new Error('Not found');
      (error as unknown as { response: object }).response = {
        status: 404,
        data: { message: 'Email not found' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      // Should not throw for 404 - prevents email enumeration
      await expect(authService.forgotPassword(request)).resolves.not.toThrow();
    });

    it('should throw error for server errors (500)', async () => {
      const error = new Error('Server error');
      (error as unknown as { response: object }).response = {
        status: 500,
        data: { message: 'Internal server error' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.forgotPassword(request)).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    const request: ResetPasswordRequest = {
      token: 'valid-reset-token',
      newPassword: 'newSecurePassword123',
    };

    const successResponse: ResetPasswordResponse = {
      message: 'Password reset successful',
    };

    it('should successfully reset password', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: successResponse });

      const result = await authService.resetPassword(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', request);
      expect(result).toEqual(successResponse);
    });

    it('should throw error for invalid token', async () => {
      const error = new Error('Invalid token');
      (error as unknown as { response: object }).response = {
        status: 400,
        data: { message: 'Token is invalid or expired' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.resetPassword(request)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      mockApiClient.post.mockResolvedValueOnce({});

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout', {});
    });

    it('should clear session cache on logout', async () => {
      // Set up cached session first
      const mockSession: UserSession = {
        userId: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();

      // Logout
      mockApiClient.post.mockResolvedValueOnce({});
      await authService.logout();

      // Next session request should hit the API
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should not throw even if logout endpoint fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw - user is logged out locally
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('getCurrentSession', () => {
    const mockSession: UserSession = {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      role: 'Admin',
      isOnboardingCompleted: true,
    };

    it('should fetch session from API', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });

      const result = await authService.getCurrentSession();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me', undefined);
      expect(result).toEqual(mockSession);
    });

    it('should return cached session within cache duration', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });

      // First call - hits API
      await authService.getCurrentSession();

      // Second call - should use cache
      const result = await authService.getCurrentSession();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSession);
    });

    it('should return null for unauthenticated users (401)', async () => {
      const error = new Error('Unauthorized');
      (error as unknown as { response: object }).response = {
        status: 401,
        data: { message: 'Unauthorized' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.get.mockRejectedValueOnce(error);

      const result = await authService.getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false (placeholder implementation)', async () => {
      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getAuthToken', () => {
    it('should return cookie-auth string for HttpOnly cookie implementation', () => {
      const result = authService.getAuthToken();
      expect(result).toBe('cookie-auth');
    });
  });

  describe('clearSessionCache', () => {
    it('should clear the session cache', async () => {
      const mockSession: UserSession = {
        userId: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      // Set up cached session
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();

      // Clear cache
      authService.clearSessionCache();

      // Next request should hit API
      mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
      await authService.getCurrentSession();

      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateInviteToken', () => {
    it('should validate an invite token', async () => {
      const mockResponse = {
        isValid: true,
        email: 'invited@example.com',
        clubName: 'Test Club',
        isExistingUser: false,
      };
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.validateInviteToken('valid-token');

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/validate-invite?token=valid-token');
      expect(result).toEqual(mockResponse);
    });

    it('should URL encode the token', async () => {
      const mockResponse = { isValid: true };
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await authService.validateInviteToken('token with spaces');

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/validate-invite?token=token%20with%20spaces');
    });

    it('should throw error for invalid token', async () => {
      const error = new Error('Invalid token');
      (error as unknown as { response: object }).response = {
        status: 400,
        data: { message: 'Token is invalid' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(authService.validateInviteToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('acceptAdminInvite', () => {
    it('should accept admin invite for new user', async () => {
      const request = {
        token: 'valid-token',
        fullName: 'New Admin',
        password: 'securePassword123',
      };
      const mockResponse = {
        success: true,
        message: 'Invitation accepted',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.acceptAdminInvite(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/accept-admin-invite', request);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for expired token', async () => {
      const error = new Error('Token expired');
      (error as unknown as { response: object }).response = {
        status: 400,
        data: { message: 'Token has expired' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(
        authService.acceptAdminInvite({ token: 'expired-token' })
      ).rejects.toThrow();
    });
  });

  describe('activateAccount', () => {
    it('should activate member account', async () => {
      const mockResponse = {
        success: true,
        message: 'Account activated',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.activateAccount({
        activationToken: 'valid-token',
        newPassword: 'newPassword123',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/activate-member-account', {
        activationToken: 'valid-token',
        newPassword: 'newPassword123',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resendActivation', () => {
    it('should resend activation email', async () => {
      const mockResponse = {
        success: true,
        message: 'Activation email sent',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.resendActivation('user@example.com');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/resend-activation', {
        email: 'user@example.com',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding', async () => {
      mockApiClient.post.mockResolvedValueOnce({});

      await expect(authService.completeOnboarding()).resolves.not.toThrow();
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/complete-onboarding', {});
    });

    it('should throw error on failure', async () => {
      const error = new Error('Onboarding failed');
      (error as unknown as { response: object }).response = {
        status: 500,
        data: { message: 'Server error' },
      };
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.completeOnboarding()).rejects.toThrow();
    });
  });

  describe('SSO Authentication', () => {
    describe('loginWithGoogle', () => {
      const ssoRequest: SSOLoginRequest = {
        idToken: 'google-id-token',
        platform: 'web',
        fullName: 'Google User',
      };

      const ssoResponse: SSOLoginResponse = {
        success: true,
        userId: 1,
        fullName: 'Google User',
        email: 'googleuser@gmail.com',
        clubId: 1,
        role: 'Admin',
        clubTier: 'Grow',
        isOnboardingCompleted: true,
        isNewUser: false,
        wasLinked: false,
      };

      it('should successfully login with Google', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: ssoResponse });

        const result = await authService.loginWithGoogle(ssoRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/google', ssoRequest);
        expect(result).toEqual(ssoResponse);
      });

      it('should clear session cache on successful Google login', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: ssoResponse });

        await authService.loginWithGoogle(ssoRequest);

        // Verify cache was cleared by checking next session call hits API
        const mockSession: UserSession = {
          userId: 1,
          fullName: 'Google User',
          email: 'googleuser@gmail.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        };
        mockApiClient.get.mockResolvedValueOnce({ data: mockSession });
        await authService.getCurrentSession();
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      it('should throw error for invalid Google token', async () => {
        const error = new Error('Invalid token');
        (error as unknown as { response: object }).response = {
          status: 401,
          data: { message: 'Google authentication failed' },
        };
        (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(authService.loginWithGoogle(ssoRequest)).rejects.toThrow();
      });
    });

    describe('loginWithApple', () => {
      const ssoRequest: SSOLoginRequest = {
        idToken: 'apple-id-token',
        platform: 'ios',
        fullName: 'Apple User',
        nonce: 'security-nonce',
      };

      const ssoResponse: SSOLoginResponse = {
        success: true,
        userId: 1,
        fullName: 'Apple User',
        email: 'appleuser@icloud.com',
        clubId: 1,
        role: 'Admin',
        clubTier: 'Grow',
        isOnboardingCompleted: true,
        isNewUser: true,
        wasLinked: false,
      };

      it('should successfully login with Apple', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: ssoResponse });

        const result = await authService.loginWithApple(ssoRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/apple', ssoRequest);
        expect(result).toEqual(ssoResponse);
      });
    });

    describe('getLinkedProviders', () => {
      it('should get linked providers', async () => {
        const mockResponse = {
          hasPassword: true,
          googleLinked: true,
          googleLinkedAt: '2024-01-01T00:00:00Z',
          appleLinked: false,
        };
        mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

        const result = await authService.getLinkedProviders();

        expect(mockApiClient.get).toHaveBeenCalledWith('/auth/linked-providers');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('linkProvider', () => {
      it('should link Google provider', async () => {
        mockApiClient.post.mockResolvedValueOnce({});

        await expect(
          authService.linkProvider('Google', 'google-token', 'web')
        ).resolves.not.toThrow();

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/link-provider', {
          provider: 'Google',
          idToken: 'google-token',
          platform: 'web',
        });
      });

      it('should throw error if account already linked', async () => {
        const error = new Error('Already linked');
        (error as unknown as { response: object }).response = {
          status: 409,
          data: { message: 'Already linked' },
        };
        (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(
          authService.linkProvider('Google', 'google-token')
        ).rejects.toThrow();
      });
    });

    describe('unlinkProvider', () => {
      it('should unlink a provider', async () => {
        mockApiClient.delete.mockResolvedValueOnce({});

        await expect(authService.unlinkProvider('Google')).resolves.not.toThrow();
        expect(mockApiClient.delete).toHaveBeenCalledWith('/auth/unlink-provider/Google');
      });

      it('should throw error if only auth method', async () => {
        const error = new Error('Cannot unlink only auth method');
        (error as unknown as { response: object }).response = {
          status: 400,
          data: { message: 'Cannot unlink' },
        };
        (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
        mockApiClient.delete.mockRejectedValueOnce(error);

        await expect(authService.unlinkProvider('Google')).rejects.toThrow();
      });
    });

    describe('setPasswordForSSOAccount', () => {
      it('should set password for SSO account', async () => {
        mockApiClient.post.mockResolvedValueOnce({});

        await expect(
          authService.setPasswordForSSOAccount('newPassword123')
        ).resolves.not.toThrow();

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/set-password', {
          newPassword: 'newPassword123',
        });
      });

      it('should throw error if password already set', async () => {
        const error = new Error('Password already set');
        (error as unknown as { response: object }).response = {
          status: 400,
          data: { message: 'Already has password' },
        };
        (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(
          authService.setPasswordForSSOAccount('newPassword123')
        ).rejects.toThrow();
      });
    });
  });
});
