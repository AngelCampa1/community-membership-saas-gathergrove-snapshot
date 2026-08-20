import apiClient from './apiClient';
import type { InviteValidationResponse, AcceptAdminInviteRequest, AcceptAdminInviteResponse } from '@/types/auth';
import { ErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Types for authentication
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  userId: number;
  fullName: string;
  email: string;
  clubId: number;
  role: string; // "Admin" or "Member"
  clubTier: string; // "Grow", "Expand", or legacy "Unlimited"
  isOnboardingCompleted: boolean;
  message: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  clubName: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    onboardingCompleted: boolean;
  };
  club: {
    id: number;
    name: string;
    tier: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ActivateAccountRequest {
  activationToken: string;
  newPassword: string;
}

export interface ActivateAccountResponse {
  success: boolean;
  message: string;
}

// SSO Types
export interface SSOLoginRequest {
  idToken: string;
  platform: 'web' | 'ios' | 'android';
  fullName?: string;
  nonce?: string; // For Apple Sign-In replay attack protection
}

export interface SSOLoginResponse {
  success: boolean;
  message?: string;
  userId: number;
  fullName: string;
  email: string;
  clubId: number;
  role: string;
  clubTier: string;
  isOnboardingCompleted: boolean;
  isNewUser: boolean;
  wasLinked: boolean;
  token?: string;
}

export interface LinkedProvidersResponse {
  hasPassword: boolean;
  googleLinked: boolean;
  googleLinkedAt?: string;
  appleLinked: boolean;
  appleLinkedAt?: string;
}

export interface UserSession {
  userId: number;
  fullName: string;
  email: string;
  clubId: number;
  clubName: string;
  clubTier: string;
  role: string; // "Admin" or "Member"
  isOnboardingCompleted: boolean;
  memberId?: number; // Only for Member role users
}

/**
 * Authentication service for handling user login, registration, and session management
 */
class AuthService {
  private sessionCache: UserSession | null = null;
  private sessionCacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache
  /**
   * Authenticates a user with email and password
   * @param credentials - Login credentials
   * @returns Promise with login response
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      // Clear cache on successful login to force fresh session fetch
      this.clearSessionCache();
      return response.data;
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleApiError(error, {
        context: 'login',
        customMessages: {
          401: 'The email or password you entered is incorrect. Please try again.',
          429: 'Too many login attempts. Please wait a few minutes before trying again.'
        }
      });

      throw apiError;
    }
  }

  /**
   * Registers a new user and creates their club
   * @param registrationData - Registration details
   * @returns Promise with registration response
   */
  async register(registrationData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', registrationData);
      return response.data;
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleApiError(error, {
        context: 'register',
        customMessages: {
          409: 'An account with this email already exists. Please use a different email or try logging in.',
          400: 'Please check your information and try again. Make sure all required fields are filled out correctly.'
        }
      });

      throw apiError;
    }
  }

  /**
   * Requests a password reset link for the given email
   * @param request - Email address for password reset
   * @returns Promise that resolves when request is processed
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', request);
      // Always resolves successfully for security (prevents email enumeration)
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleApiError(error, {
        context: 'forgot-password',
        customMessages: {
          500: 'We are unable to process your password reset request right now. Please try again in a few minutes.'
        }
      });

      // Even for forgot password, we should handle server errors gracefully
      if (apiError.status >= 500) {
        throw apiError;
      }

      // For other errors, we still resolve successfully for security
      // but we log the error for monitoring
      logger.error('Password reset request failed', apiError);
    }
  }

  /**
   * Resets password using a valid token
   * @param request - Token and new password
   * @returns Promise with reset response
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', request);
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'resetting password');
    }
  }

  /**
   * Activates a member account using an activation token
   * @param request - Activation token and new password
   * @returns Promise with activation response
   */
  async activateAccount(request: ActivateAccountRequest): Promise<ActivateAccountResponse> {
    try {
      const response = await apiClient.post<ActivateAccountResponse>('/auth/activate-member-account', request);
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'activating account');
    }
  }

  /**
   * Resends activation email to a member with a new activation token
   * @param email - The email address to resend activation to
   * @returns Promise with resend activation response
   */
  async resendActivation(email: string): Promise<ActivateAccountResponse> {
    try {
      const response = await apiClient.post<ActivateAccountResponse>('/auth/resend-activation', { email });
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'resending activation email');
    }
  }

  /**
   * Completes the onboarding process for the authenticated user
   * @returns Promise that resolves when onboarding is complete
   */
  async completeOnboarding(): Promise<void> {
    try {
      await apiClient.post('/auth/complete-onboarding', {});
    } catch (error: unknown) {
      throw ErrorHandler.handleApiError(error, { context: 'completing onboarding' });
    }
  }

  /**
   * Validates an admin invitation token and returns information about the invitation
   * @param token - The invitation token from the email link
   * @returns Promise with invitation validation details
   */
  async validateInviteToken(token: string): Promise<InviteValidationResponse> {
    try {
      const response = await apiClient.get<InviteValidationResponse>(`/auth/validate-invite?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'validating invitation token');
    }
  }

  /**
   * Accepts an admin invitation, creating a new user if necessary and adding them as an admin
   * @param request - The accept invitation request
   * @returns Promise with acceptance response
   */
  async acceptAdminInvite(request: AcceptAdminInviteRequest): Promise<AcceptAdminInviteResponse> {
    try {
      const response = await apiClient.post<AcceptAdminInviteResponse>('/auth/accept-admin-invite', request);
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'accepting admin invitation');
    }
  }

  /**
   * Logs out the current user by clearing the authentication cookie
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      // Clear session cache first
      this.clearSessionCache();

      // Call logout endpoint to clear HttpOnly cookie server-side
      await apiClient.post('/auth/logout', {});
    } catch (error: unknown) {
      // If logout endpoint fails, still clear local session cache
      logger.error('Logout endpoint failed, but local session cleared', error);
      // Don't throw error as user should still be logged out locally
    }
  }

  /**
   * Checks if the user is currently authenticated
   * Note: Since we're using HttpOnly cookies, we can't directly check the JWT client-side
   * This method would need to make a request to the server to validate the session
   * @returns Promise that resolves to true if authenticated, false otherwise
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // We would need a '/auth/me' or similar endpoint to check authentication status
      // For now, we'll return false and implement this when needed
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current authenticated user's session data
   * @param signal - Optional AbortSignal to cancel the in-flight request
   * @returns Promise with user session information
   */
  async getCurrentSession(signal?: AbortSignal): Promise<UserSession | null> {
    // Check if we have a valid cached session
    const now = Date.now();
    if (this.sessionCache && (now - this.sessionCacheTimestamp) < this.CACHE_DURATION) {
      return this.sessionCache;
    }

    try {
      const response = await apiClient.get<UserSession>('/auth/me', signal ? { signal } : undefined);
      // Cache the successful response
      this.sessionCache = response.data;
      this.sessionCacheTimestamp = now;
      return response.data;
    } catch (error: unknown) {
      // Don't log abort errors — they are intentional on unmount
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      // Don't log 401 errors as they're expected for unauthenticated users
      const parsed = ErrorHandler.parseError(error);
      if (parsed.status !== 401) {
        logger.error('Failed to get current session', parsed);
      }
      // Clear cache on error
      this.sessionCache = null;
      this.sessionCacheTimestamp = 0;
      return null;
    }
  }

  /**
   * Gets the authentication token for API requests
   * Since we're using HttpOnly cookies, this returns a constant value indicating
   * cookie-based authentication. The actual authentication is handled automatically
   * by the browser including the HttpOnly cookie in requests.
   * @returns string representing authentication state for API compatibility
   */
  getAuthToken(): string | null {
    // For HttpOnly cookie implementation, we return a constant value
    // since the actual authentication is handled by the cookie automatically
    // This maintains API compatibility while the real auth is cookie-based
    return 'cookie-auth';
  }

  /**
   * Clears the session cache
   */
  clearSessionCache(): void {
    this.sessionCache = null;
    this.sessionCacheTimestamp = 0;
  }

  /**
   * Authenticates a user with Google SSO
   * @param request - SSO login request with Google ID token
   * @returns Promise with SSO login response
   */
  async loginWithGoogle(request: SSOLoginRequest): Promise<SSOLoginResponse> {
    try {
      const response = await apiClient.post<SSOLoginResponse>('/auth/google', request);
      // Clear cache on successful login to force fresh session fetch
      this.clearSessionCache();
      return response.data;
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleApiError(error, {
        context: 'Google sign-in',
        customMessages: {
          401: 'Google authentication failed. Please try again.',
          400: 'Invalid Google token. Please try signing in again.'
        }
      });

      throw apiError;
    }
  }

  /**
   * Authenticates a user with Apple SSO
   * @param request - SSO login request with Apple ID token
   * @returns Promise with SSO login response
   */
  async loginWithApple(request: SSOLoginRequest): Promise<SSOLoginResponse> {
    try {
      const response = await apiClient.post<SSOLoginResponse>('/auth/apple', request);
      // Clear cache on successful login to force fresh session fetch
      this.clearSessionCache();
      return response.data;
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleApiError(error, {
        context: 'Apple sign-in',
        customMessages: {
          401: 'Apple authentication failed. Please try again.',
          400: 'Invalid Apple token. Please try signing in again.'
        }
      });

      throw apiError;
    }
  }

  /**
   * Gets the linked SSO providers for the current user
   * @returns Promise with linked providers information
   */
  async getLinkedProviders(): Promise<LinkedProvidersResponse> {
    try {
      const response = await apiClient.get<LinkedProvidersResponse>('/auth/linked-providers');
      return response.data;
    } catch (error: unknown) {
      throw ErrorHandler.handleAuthError(error, 'getting linked providers');
    }
  }

  /**
   * Links a new SSO provider to the current user's account
   * @param provider - Provider name ('Google' or 'Apple')
   * @param idToken - ID token from the provider
   * @param platform - Platform the token was obtained from
   * @returns Promise that resolves when linking is complete
   */
  async linkProvider(provider: 'Google' | 'Apple', idToken: string, platform: 'web' | 'ios' | 'android' = 'web'): Promise<void> {
    try {
      await apiClient.post('/auth/link-provider', { provider, idToken, platform });
    } catch (error: unknown) {
      throw ErrorHandler.handleApiError(error, {
        context: `linking ${provider}`,
        customMessages: {
          400: `This ${provider} account is already linked to another user.`,
          409: `You already have a ${provider} account linked.`
        }
      });
    }
  }

  /**
   * Unlinks an SSO provider from the current user's account
   * @param provider - Provider name to unlink ('Google' or 'Apple')
   * @returns Promise that resolves when unlinking is complete
   */
  async unlinkProvider(provider: 'Google' | 'Apple'): Promise<void> {
    try {
      await apiClient.delete(`/auth/unlink-provider/${provider}`);
    } catch (error: unknown) {
      throw ErrorHandler.handleApiError(error, {
        context: `unlinking ${provider}`,
        customMessages: {
          400: 'Cannot unlink the only authentication method. Please set a password first.'
        }
      });
    }
  }

  /**
   * Sets a password for an SSO-only account
   * @param newPassword - The new password to set
   * @returns Promise that resolves when password is set
   */
  async setPasswordForSSOAccount(newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/set-password', { newPassword });
    } catch (error: unknown) {
      throw ErrorHandler.handleApiError(error, {
        context: 'setting password',
        customMessages: {
          400: 'This account already has a password set.'
        }
      });
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 
