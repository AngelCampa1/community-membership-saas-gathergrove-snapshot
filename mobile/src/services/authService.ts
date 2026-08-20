/* eslint-disable @typescript-eslint/no-explicit-any */
// Auth service uses any for error handling and JWT parsing

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as Keychain from 'react-native-keychain';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, KEYCHAIN_CONFIG, ERROR_MESSAGES } from '@/constants';
import { LoginRequest, LoginResponse, UserSession, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse } from '@/types';
import { ErrorHandler } from '@/utils/errorHandler';
import { NetworkSecurity, InputValidator } from '@/utils/security';
import { logger } from '@/utils/logger';
import * as Sentry from '@sentry/react-native';

// ============================================================================
// Storage Adapter Interfaces for Dependency Injection (Testing)
// ============================================================================

/**
 * Interface for Keychain storage operations
 * Matches react-native-keychain API subset used by AuthService
 */
export interface KeychainAdapter {
  setInternetCredentials: (
    server: string,
    username: string,
    password: string,
    options?: { accessControl?: Keychain.ACCESS_CONTROL }
  ) => Promise<false | Keychain.Result>;
  getInternetCredentials: (
    server: string
  ) => Promise<false | Keychain.UserCredentials>;
  hasInternetCredentials: (server: string) => Promise<boolean | Keychain.Result>;
  resetInternetCredentials: (server: string) => Promise<void>;
}

/**
 * Interface for SecureStore operations
 * Matches expo-secure-store API subset used by AuthService
 */
export interface SecureStoreAdapter {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
}

// Default adapters using real implementations
const defaultKeychainAdapter: KeychainAdapter = {
  setInternetCredentials: Keychain.setInternetCredentials,
  getInternetCredentials: Keychain.getInternetCredentials,
  hasInternetCredentials: Keychain.hasInternetCredentials,
  resetInternetCredentials: Keychain.resetInternetCredentials,
};

const defaultSecureStoreAdapter: SecureStoreAdapter = {
  setItemAsync: SecureStore.setItemAsync,
  getItemAsync: SecureStore.getItemAsync,
  deleteItemAsync: SecureStore.deleteItemAsync,
};

// Secure storage key for fallback (expo-secure-store)
const SECURE_STORE_TOKEN_KEY = 'gathergrove_auth_token';
// AUTH-06 fix: Storage key for persisting failed login attempts
const FAILED_ATTEMPTS_KEY = 'gathergrove_failed_login_attempts';

class AuthServiceClass {
  private axiosInstance: AxiosInstance;
  private failedLoginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes
  private readonly sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
  private sessionTimer: NodeJS.Timeout | null = null;
  // MEM-03 fix: Add warning timer before session expiry
  private sessionWarningTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: number = 0;
  private onSessionExpired?: () => void;
  // MEM-03 fix: Callback for warning before session expires
  private onSessionExpiring?: () => void;

  // Dependency injection for storage adapters (for testing)
  private keychain: KeychainAdapter;
  private secureStore: SecureStoreAdapter;

  constructor(
    keychain: KeychainAdapter = defaultKeychainAdapter,
    secureStore: SecureStoreAdapter = defaultSecureStoreAdapter
  ) {
    this.keychain = keychain;
    this.secureStore = secureStore;
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-Client': 'true',
        'User-Agent': 'GatherGrove-Mobile/1.0.0',
        ...NetworkSecurity.getSecureHeaders(),
      },
    });

    this.setupRequestInterceptor();
    this.setupAPITrackingInterceptors();
    // AUTH-06 fix: Restore persisted failed login attempts
    this.restoreFailedAttempts().catch(() => {
      // Silent fail - will use in-memory only if restore fails
    });
  }

  /**
   * Set up request interceptor to add JWT token to requests
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Always add mobile client headers
        config.headers['X-Mobile-Client'] = 'true';
        config.headers['User-Agent'] = 'GatherGrove-Mobile/1.0.0';

        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          logger.debug('auth', 'Request interceptor: Added Authorization header');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set up API tracking interceptors for Application Insights
   * Tracks request/response times and errors
   */
  private setupAPITrackingInterceptors(): void {
    // Request interceptor: Mark start time
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        // Add metadata to track request start time
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Track successful requests
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (!__DEV__) {
          try {
            const config = response.config as any;
            const endTime = Date.now();
            const startTime = config.metadata?.startTime || endTime;
            const duration = endTime - startTime;
            Sentry.addBreadcrumb({
              category: 'http',
              message: `${(config.method || 'GET').toUpperCase()} ${config.url || 'unknown'}`,
              data: { status: response.status, duration },
              level: 'info',
            });
          } catch {
            // Never let telemetry crash the app
          }
        }

        return response;
      },
      (error: AxiosError) => {
        if (!__DEV__) {
          try {
            const config = error.config as any;
            Sentry.addBreadcrumb({
              category: 'http',
              message: `${(config?.method || 'GET').toUpperCase()} ${config?.url || 'unknown'}`,
              data: { status: error.response?.status },
              level: 'error',
            });
          } catch {
            // Never let telemetry crash the app
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate user with email and password
   * Implements M01 story requirements for mobile login with enhanced security
   */
  async login(credentials: LoginRequest): Promise<UserSession> {
    // Validate input credentials
    this.validateLoginCredentials(credentials);
    
    // Check if user is locked out
    const userKey = credentials.email.toLowerCase();
    if (this.isUserLockedOut(userKey)) {
      throw new Error(`Account temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(this.lockoutDuration / 60000)} minutes.`);
    }

    try {
      // FORM-01 fix: Only trim and lowercase email - don't sanitize as it may break valid email characters
      // (e.g., + signs in Gmail addresses, dots in unusual positions)
      const sanitizedCredentials = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password, // Don't sanitize passwords as it might affect valid special characters
      };

      const response = await this.axiosInstance.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        sanitizedCredentials,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
            ...NetworkSecurity.getSecureHeaders(),
          },
        }
      );

      // Backend returns user data directly (not nested in 'user' object)
      const { token, userId, fullName, email, clubId, role, clubTier } = response.data;

      logger.debug('auth', 'Login response received', {
        hasToken: !!token,
        tokenLength: token?.length,
        userId: String(userId),
        fullName,
        clubId: String(clubId),
        role,
        clubTier,
      });

      // Store token securely (token might be undefined for web clients)
      if (token) {
        await this.storeToken(token);
        logger.debug('auth', 'Token stored successfully');
      } else {
        // Warning: ('[AuthService] Token not returned by backend - cookie-based authentication may be in use');
      }

      // Clear failed attempts on successful login
      this.failedLoginAttempts.delete(userKey);
      // AUTH-06 fix: Persist the cleared state
      this.persistFailedAttempts().catch(() => {});

      // Start session timeout management
      this.startSessionTimer();
      
      // Return user session object with standardized structure
      const userSession: UserSession = {
        token: token || '',
        user: {
          userId,
          fullName,
          email,
          role,
          clubId,
          clubTier,
        },
        isAuthenticated: true,
      };

      // Log successful login (without sensitive data)
      logger.info('auth', 'Login successful', {
        userId: String(userId),
        email: email?.replace(/(.{2}).+(@.+)/, '$1***$2'),
        role,
        clubId: String(clubId),
      });

      return userSession;
    } catch (error) {
      // Record failed login attempt
      this.recordFailedLoginAttempt(userKey);
      
      // Enhanced error logging for debugging admin login issues (without sensitive data)
      logger.error('auth', 'Login failed', error, {
        errorType: (error as Error)?.constructor?.name,
        hasResponse: !!(error && typeof error === 'object' && 'response' in error),
        status: error && typeof error === 'object' && 'response' in error ? (error as AxiosError)?.response?.status : undefined,
        email: credentials.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
        failedAttempts: this.failedLoginAttempts.get(userKey)?.count || 0,
      });
      
      // Only handle API/network errors here, not storage errors
      // Check if it's an axios error by looking for response or request properties
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleAuthError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Store JWT token securely using React Native Keychain
   * Falls back to AsyncStorage when keychain is not available (Expo Go)
   */
  private async storeToken(token: string): Promise<void> {
    // Update cache immediately
    this._cachedToken = token;
    this._tokenCacheTime = Date.now();

    try {
      await this.keychain.setInternetCredentials(
        KEYCHAIN_CONFIG.SERVICE_NAME,
        KEYCHAIN_CONFIG.TOKEN_KEY,
        token
      );
    } catch (error) {
      // Only log in debug mode to reduce noise
      logger.warn('auth', 'Keychain storage failed, falling back to SecureStore', { error });

      // Fallback to SecureStore for Expo Go (encrypted storage on both iOS and Android)
      try {
        await this.secureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, token);
        if (__DEV__) {
          logger.debug('auth', 'Fallback to SecureStore successful');
        }
      } catch (fallbackError) {
        // Provide specific error message for storage failure
        if (fallbackError instanceof Error) {
          throw new Error(`Authentication token storage failed: ${fallbackError.message}`);
        }
        throw new Error('Failed to store authentication token. Please try logging in again.');
      }
    }
  }

  private _cachedToken: string | null = null;
  private _tokenCacheTime: number = 0;
  // AUTH-09 fix: Increased token cache from 5s to 30s to reduce token retrieval overhead
  private readonly TOKEN_CACHE_DURATION = 30000; // 30 seconds cache
  private _tokenPromise: Promise<string | null> | null = null; // Prevent race conditions

  /**
   * Retrieve stored JWT token from Keychain with caching
   * Falls back to AsyncStorage when keychain is not available (Expo Go)
   * Prevents race conditions with promise-based caching
   */
  async getStoredToken(): Promise<string | null> {
    // Return cached token if still valid (prevents repeated keychain access)
    const now = Date.now();
    if (this._cachedToken && (now - this._tokenCacheTime) < this.TOKEN_CACHE_DURATION) {
      return this._cachedToken;
    }

    // If token retrieval is already in progress, return the same promise
    // AUTH-04 fix: Add error handling to prevent all concurrent requests failing together
    if (this._tokenPromise) {
      try {
        return await this._tokenPromise;
      } catch (error) {
        // If the cached promise failed, clear it and retry individually
        this._tokenPromise = null;
        return this._retrieveTokenFromStorage();
      }
    }

    // Create new promise for token retrieval IMMEDIATELY to prevent race conditions
    // (concurrent calls between this line and the await will see _tokenPromise is set)
    const promise = this._retrieveTokenFromStorage();
    this._tokenPromise = promise;

    try {
      const token = await promise;
      return token;
    } finally {
      // Only clear if this is still our promise (prevents clearing a newer request's promise)
      if (this._tokenPromise === promise) {
        this._tokenPromise = null;
      }
    }
  }

  /**
   * Internal method to retrieve token from storage
   * Separated to avoid race conditions
   */
  private async _retrieveTokenFromStorage(): Promise<string | null> {
    const now = Date.now();
    
    try {
      // First try keychain (works in development builds and production)
      const credentials = await this.keychain.getInternetCredentials(
        KEYCHAIN_CONFIG.SERVICE_NAME
      );

      if (credentials && credentials.password) {
        this._cachedToken = credentials.password;
        this._tokenCacheTime = now;
        return credentials.password;
      }

      this._cachedToken = null;
      this._tokenCacheTime = now;
      return null;
    } catch (error) {
      // Only log keychain errors in debug mode to reduce noise
      if (__DEV__) {
        // Error: ('[AuthService] Keychain token retrieval failed, trying SecureStore fallback:', error);
      }

      // AUTH-02 fix: Fallback to SecureStore for Expo Go (encrypted storage on both iOS and Android)
      try {
        const token = await this.secureStore.getItemAsync(SECURE_STORE_TOKEN_KEY);
        this._cachedToken = token;
        this._tokenCacheTime = now;
        return token;
      } catch (fallbackError) {
        if (__DEV__) {
          logger.warn('auth', 'SecureStore token retrieval also failed', { error: fallbackError });
        }
        this._cachedToken = null;
        this._tokenCacheTime = now;
        return null;
      }
    }
  }

  /**
   * Check if user has a stored authentication token
   * Falls back to AsyncStorage when keychain is not available (Expo Go)
   */
  async hasStoredToken(): Promise<boolean> {
    try {
      const hasCredentials = await this.keychain.hasInternetCredentials(
        KEYCHAIN_CONFIG.SERVICE_NAME
      );
      return hasCredentials !== false;
    } catch (error) {
      // Fallback to SecureStore for Expo Go (encrypted storage)
      try {
        const token = await this.secureStore.getItemAsync(SECURE_STORE_TOKEN_KEY);
        return !!token;
      } catch (fallbackError) {
        if (__DEV__) {
          logger.warn('auth', 'SecureStore fallback check failed', { error: fallbackError });
        }
        return false;
      }
    }
  }

  /**
   * Remove stored authentication token (logout)
   * Clears from both keychain and AsyncStorage fallback
   * AUTH-13 fix: Also reset sessionStartTime
   */
  async removeStoredToken(): Promise<void> {
    // Clear cache and any pending promises immediately
    this._cachedToken = null;
    this._tokenCacheTime = 0;
    this._tokenPromise = null;

    // AUTH-13 fix: Reset session start time
    this.sessionStartTime = 0;

    // Clear session timer
    this.clearSessionTimer();

    const errors: string[] = [];
    
    // Try to clear from keychain
    try {
      await this.keychain.resetInternetCredentials(KEYCHAIN_CONFIG.SERVICE_NAME);
    } catch (error) {
      if (__DEV__) {
        // Error: ('[AuthService] Keychain token removal failed:', error);
      }
      errors.push('keychain');
    }

    // Also clear from SecureStore fallback (encrypted storage)
    try {
      await this.secureStore.deleteItemAsync(SECURE_STORE_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) {
        logger.warn('auth', 'SecureStore token removal failed', { error });
      }
      errors.push('SecureStore');
    }
    
    // Only throw error if both methods failed
    if (errors.length === 2) {
      throw new Error('Failed to clear authentication token');
    }


    if (__DEV__) {
      // Log: ('[AuthService] Authentication token cleared successfully');
    }
  }

  /**
   * Validate stored token by checking session with backend
   */
  async validateStoredSession(): Promise<UserSession | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        logger.debug('auth', 'No stored token found');
        return null;
      }

      logger.debug('auth', 'Token retrieved from storage', { hasToken: !!token });

      // Enhanced JWT validation with security checks
      const jwtValidation = this.validateJWTSecurity(token);
      if (!jwtValidation.isValid) {
        logger.warn('auth', 'JWT security validation failed', { reason: jwtValidation.reason });
        await this.removeStoredToken();
        return null;
      }

      // Decode JWT payload to get user info
      const userInfo = this.decodeJWTPayload(token);
      if (!userInfo) {
        logger.warn('auth', 'Failed to decode JWT payload');
        await this.removeStoredToken();
        return null;
      }

      logger.debug('auth', 'JWT decoded successfully', {
        nameid: userInfo.nameid,
        email: userInfo.email?.replace(/(.{2}).+(@.+)/, '$1***$2'),
        role: userInfo.role,
        clubId: userInfo.ClubId,
        exp: userInfo.exp ? new Date(userInfo.exp * 1000).toISOString() : undefined,
      });

      // Check if token is expired
      if (userInfo.exp && userInfo.exp < Math.floor(Date.now() / 1000)) {
        logger.warn('auth', 'Token expired', {
          expiredAt: new Date(userInfo.exp * 1000).toISOString(),
        });
        await this.removeStoredToken();
        return null;
      }

      // Map JWT claims to user session structure
      // Backend uses standard claim names: nameid, email, role, ClubId
      const userSession: UserSession = {
        token,
        user: {
          userId: parseInt(userInfo.nameid || userInfo.sub || '0'),
          fullName: userInfo.fullName || userInfo.name || '', // JWT might not contain fullName
          email: userInfo.email || '',
          role: userInfo.role || 'Member',
          clubId: parseInt(userInfo.ClubId || '0'), // Note: Capital C in ClubId
          clubTier: userInfo.clubTier || 'Member', // Default to Member if not in JWT
        },
        isAuthenticated: true,
      };

      logger.debug('auth', 'User session created from JWT', {
        userId: String(userSession.user.userId),
        role: userSession.user.role,
        clubId: String(userSession.user.clubId),
      });

      // AUTH-05 fix: Consolidated duplicate backend calls into one
      // Track if we have essential info from JWT (for error handling decision)
      const hasEssentialInfo = !!(userSession.user.userId && userSession.user.clubId);

      // Try to get complete user data from backend
      try {
        logger.debug('auth', 'Fetching complete user data from backend');
        const response = await this.axiosInstance.get(API_CONFIG.ENDPOINTS.CURRENT_SESSION);
        const sessionData = response.data;

        logger.debug('auth', 'User data fetched successfully from backend');

        // Update with complete user data if successful
        userSession.user.userId = sessionData.userId || userSession.user.userId;
        userSession.user.fullName = sessionData.fullName || userSession.user.fullName;
        userSession.user.email = sessionData.email || userSession.user.email;
        userSession.user.clubId = sessionData.clubId || userSession.user.clubId;
        userSession.user.role = sessionData.role || userSession.user.role;
      } catch (error) {
        // If backend call fails and we didn't have essential info, token is likely invalid
        if (!hasEssentialInfo) {
          logger.warn('auth', 'Backend call failed and no essential info in JWT, clearing token', { error });
          await this.removeStoredToken();
          return null;
        }
        // If we had essential info from JWT, continue with that data
        logger.debug('auth', 'Backend call failed but continuing with JWT data');
      }

      return userSession;
    } catch (error) {
      // Token is invalid or session expired, remove it
      logger.error('auth', 'Session validation failed', error);
      await this.removeStoredToken();
      return null;
    }
  }

  /**
   * Validate JWT token format - FIXED VERSION
   * Returns false for invalid tokens as required
   */
  private isValidJWT(token: string): boolean {
    try {
      // Check if token exists and is a string
      if (!token || typeof token !== 'string') {
        return false;
      }

      // Remove Bearer prefix if present
      const cleanToken = token.startsWith('Bearer ') 
        ? token.substring(7) 
        : token;

      // Check if token is empty after cleaning
      if (!cleanToken || cleanToken.trim() === '') {
        return false;
      }

      // JWT should have exactly 3 parts separated by dots
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Check if each part is base64url encoded (basic validation)
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }
        
        // Base64url should not contain invalid characters
        if (!/^[A-Za-z0-9_-]*$/.test(part)) {
          return false;
        }
      }

      // Try to decode all three parts to validate structure
      try {
        // Validate header
        const header = this.decodeBase64UrlSafe(parts[0]);
        if (!header) {
          return false;
        }
        
        // Validate payload
        const payload = this.decodeBase64UrlSafe(parts[1]);
        if (!payload) {
          return false;
        }
        
        // Validate signature part can be decoded (even if we don't verify it)
        // This ensures it's properly formatted base64url
        const signature = this.decodeBase64UrlSafe(parts[2]);
        if (signature === null) {
          return false;
        }
        
        const headerObj = JSON.parse(header);
        const payloadObj = JSON.parse(payload);
        
        // Basic structure validation
        if (!headerObj.alg || !headerObj.typ) {
          return false;
        }
        
        if (typeof payloadObj !== 'object' || payloadObj === null) {
          return false;
        }
        
        return true;
      } catch (decodeError) {
        // Error: ('[AuthService] JWT decode error:', decodeError);
        return false;
      }
    } catch (error) {
      // Error: ('[AuthService] JWT validation failed:', error);
      return false;
    }
  }

  /**
   * Safely decode base64url string
   */
  private decodeBase64UrlSafe(input: string): string | null {
    try {
      // Handle padding for base64url
      const padded = input + '='.repeat((4 - input.length % 4) % 4);
      const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      
      // Try browser/React Native atob first
      if (typeof atob !== 'undefined') {
        return atob(base64);
      }
      
      // Fallback for Node.js environment (tests)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      // Error: ('[AuthService] Base64 decode failed:', error);
      return null;
    }
  }

  /**
   * Decode JWT payload (without signature verification)
   * Note: In production, signature verification should be done server-side
   */
  private decodeJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Handle padding for base64
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      let decodedPayload: string;
      try {
        // Try browser/React Native atob first
        decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        // Fallback for Node.js environment (tests)
        if (typeof Buffer !== 'undefined') {
          decodedPayload = Buffer.from(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        } else {
          return null;
        }
      }
      
      let parsed: any;
      try {
        parsed = JSON.parse(decodedPayload);
      } catch (jsonError) {
        logger.warn('auth', 'Failed to parse JWT payload JSON');
        return null;
      }

      // Validate that parsed result is an object
      if (!parsed || typeof parsed !== 'object') {
        logger.warn('auth', 'JWT payload is not a valid object');
        return null;
      }
      
      // Normalize claim names - backend may use different formats
      // Handle both short claim names and full URIs
      const normalizedPayload = {
        nameid: parsed.nameid || parsed.sub || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        email: parsed.email || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        role: parsed.role || parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        ClubId: parsed.ClubId || parsed.clubId,
        fullName: parsed.fullName || parsed.name || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        exp: parsed.exp,
        iat: parsed.iat,
        jti: parsed.jti
      };

      // Validate essential claims exist
      if (!normalizedPayload.nameid && !normalizedPayload.email) {
        logger.warn('auth', 'JWT missing essential claims (nameid and email)');
        return null;
      }

      return normalizedPayload;
    } catch (error) {
      logger.error('auth', 'Failed to decode JWT payload', error);
      return null;
    }
  }

  /**
   * Logout user by removing stored token
   */
  async logout(): Promise<void> {
    await this.removeStoredToken();
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await this.axiosInstance.post<ForgotPasswordResponse>(
        API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
        }
      );

      logger.info('auth', 'Password reset email requested');

      return response.data;
    } catch (error) {
      logger.error('auth', 'Forgot password request failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await this.axiosInstance.post<ResetPasswordResponse>(
        API_CONFIG.ENDPOINTS.RESET_PASSWORD,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
        }
      );

      logger.info('auth', 'Password reset successful');

      return response.data;
    } catch (error) {
      logger.error('auth', 'Password reset failed', error);
      throw this.handleAuthError(error);
    }
  }


  /**
   * Clean up all cached data and pending promises
   * Should be called on app cleanup or when switching users
   */
  cleanup(): void {
    this._cachedToken = null;
    this._tokenCacheTime = 0;
    this._tokenPromise = null;
  }

  /**
   * Public method to validate JWT format for testing
   * Returns false for invalid tokens as required
   */
  validateJWTFormat(token: string): boolean {
    return this.isValidJWT(token);
  }

  /**
   * Validate login credentials format and security
   * FORM-03/04 fix: Added max length and complexity requirements
   */
  private validateLoginCredentials(credentials: LoginRequest): void {
    if (!credentials.email || !credentials.password) {
      throw new Error(ERROR_MESSAGES.EMAIL_REQUIRED);
    }

    if (!InputValidator.isValidEmail(credentials.email)) {
      throw new Error(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    // FORM-03/04 fix: Enforce password length limits
    if (credentials.password.length < 8) {
      throw new Error(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }

    if (credentials.password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }
  }

  /**
   * Check if user is locked out due to failed login attempts
   */
  private isUserLockedOut(userKey: string): boolean {
    const attempts = this.failedLoginAttempts.get(userKey);
    if (!attempts) return false;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
    
    // Clear lockout if enough time has passed
    if (timeSinceLastAttempt > this.lockoutDuration) {
      this.failedLoginAttempts.delete(userKey);
      // AUTH-06 fix: Persist the cleared state
      this.persistFailedAttempts().catch(() => {});
      return false;
    }

    return attempts.count >= this.maxFailedAttempts;
  }

  /**
   * Record failed login attempt
   */
  private recordFailedLoginAttempt(userKey: string): void {
    const existing = this.failedLoginAttempts.get(userKey);
    const now = new Date();
    
    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.failedLoginAttempts.set(userKey, {
        count: 1,
        lastAttempt: now,
      });
    }

    // AUTH-06 fix: Persist failed attempts to storage
    this.persistFailedAttempts().catch(() => {
      // Silent fail - persistence is best-effort
    });

    const attempts = this.failedLoginAttempts.get(userKey);
    logger.debug('auth', 'Failed login attempt recorded', {
      userKey,
      attemptCount: attempts?.count,
    });
  }

  /**
   * AUTH-06 fix: Persist failed login attempts to secure storage
   */
  private async persistFailedAttempts(): Promise<void> {
    try {
      const data: { [key: string]: { count: number; lastAttempt: string } } = {};
      this.failedLoginAttempts.forEach((value, key) => {
        data[key] = {
          count: value.count,
          lastAttempt: value.lastAttempt.toISOString(),
        };
      });
      await this.secureStore.setItemAsync(FAILED_ATTEMPTS_KEY, JSON.stringify(data));
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthService] Failed to persist login attempts:', error);
      }
    }
  }

  /**
   * AUTH-06 fix: Restore failed login attempts from secure storage
   */
  private async restoreFailedAttempts(): Promise<void> {
    try {
      const stored = await this.secureStore.getItemAsync(FAILED_ATTEMPTS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { [key: string]: { count: number; lastAttempt: string } };
        const now = Date.now();

        Object.entries(data).forEach(([key, value]) => {
          const lastAttempt = new Date(value.lastAttempt);
          // Only restore if still within lockout window
          if (now - lastAttempt.getTime() < this.lockoutDuration) {
            this.failedLoginAttempts.set(key, {
              count: value.count,
              lastAttempt,
            });
          }
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthService] Failed to restore login attempts:', error);
      }
    }
  }

  /**
   * Start session timeout timer
   * MEM-03 fix: Added warning timer 5 minutes before expiry
   */
  private startSessionTimer(): void {
    this.sessionStartTime = Date.now();
    this.clearSessionTimer(); // Clear any existing timers

    // MEM-03 fix: Warning at 5 minutes before expiry
    const warningTime = this.sessionTimeout - (5 * 60 * 1000); // 5 minutes before expiry
    if (warningTime > 0) {
      this.sessionWarningTimer = setTimeout(() => {
        if (this.onSessionExpiring) {
          this.onSessionExpiring();
        }
        if (__DEV__) {
          console.log('[AuthService] Session expiring in 5 minutes');
        }
      }, warningTime);
    }

    // Actual session timeout
    this.sessionTimer = setTimeout(() => {
      logger.info('auth', 'Session timed out');
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  /**
   * Clear session timer
   * MEM-03 fix: Also clear warning timer
   */
  private clearSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    // MEM-03 fix: Clear warning timer
    if (this.sessionWarningTimer) {
      clearTimeout(this.sessionWarningTimer);
      this.sessionWarningTimer = null;
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    try {
      // Disconnect SignalR before removing token to prevent reconnection with expired auth
      try {
        const { SignalRService } = await import('./signalRService');
        await SignalRService.disconnect();
      } catch {
        // SignalR disconnect is best-effort during session timeout
      }

      await this.removeStoredToken();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    } catch (error) {
      // Error: ('[AuthService] Session timeout handling failed:', error);
    }
  }

  /**
   * Set session timeout callback
   */
  setSessionTimeoutCallback(callback: () => void): void {
    this.onSessionExpired = callback;
  }

  /**
   * AUTH-14 fix: Set session expiring warning callback
   * This is called 5 minutes before the session expires
   */
  setSessionExpiringCallback(callback: () => void): void {
    this.onSessionExpiring = callback;
  }

  /**
   * Refresh session timer on user activity
   */
  refreshSession(): void {
    if (this.sessionTimer) {
      this.startSessionTimer(); // Restart the timer
    }
  }

  /**
   * Check if session is about to expire
   */
  getSessionTimeRemaining(): number {
    if (!this.sessionStartTime) return 0;
    const elapsed = Date.now() - this.sessionStartTime;
    return Math.max(0, this.sessionTimeout - elapsed);
  }

  /**
   * Enhanced JWT validation with security checks
   */
  private validateJWTSecurity(token: string): { isValid: boolean; reason?: string } {
    try {
      // Check basic format
      if (!this.isValidJWT(token)) {
        return { isValid: false, reason: 'Invalid JWT format' };
      }

      // Decode and validate payload
      const payload = this.decodeJWTPayload(token);
      if (!payload) {
        return { isValid: false, reason: 'Invalid JWT payload' };
      }

      // Check expiration with buffer
      // AUTH-03 fix: Reduced buffer from 60s to 15s - balances security with usability
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 15; // 15 second buffer to account for network latency
      
      if (payload.exp && payload.exp < (now + bufferTime)) {
        return { isValid: false, reason: 'Token expired or expiring soon' };
      }

      // Check issued time (not too far in future)
      if (payload.iat && payload.iat > (now + 60)) {
        return { isValid: false, reason: 'Token issued in future' };
      }

      // Validate essential claims
      if (!payload.nameid && !payload.sub) {
        return { isValid: false, reason: 'Missing user identifier' };
      }

      if (!payload.email) {
        return { isValid: false, reason: 'Missing email claim' };
      }

      return { isValid: true };
    } catch (error) {
      // Error: ('[AuthService] JWT security validation failed:', error);
      return { isValid: false, reason: 'JWT validation error' };
    }
  }

  /**
   * Handle authentication-related errors
   * Maps backend error responses to user-friendly messages
   */
  private handleAuthError(error: unknown): Error {
    const appError = ErrorHandler.handleAuthError(error, 'User Login');
    return new Error(appError.message);
  }
}

// Type definition for the authService proxy object
type AuthServiceInterface = {
  readonly instance: AuthServiceClass;
  login: (credentials: LoginRequest) => Promise<UserSession>;
  getStoredToken: () => Promise<string | null>;
  hasStoredToken: () => Promise<boolean>;
  removeStoredToken: () => Promise<void>;
  validateStoredSession: () => Promise<UserSession | null>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (request: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
  refreshSession: () => void;
  setSessionTimeoutCallback: (callback: () => void) => void;
  // AUTH-14 fix: Added setter for session expiring callback
  setSessionExpiringCallback: (callback: () => void) => void;
  cleanup: () => void;
  validateJWTFormat: (token: string) => boolean;
  getCurrentUser: () => Promise<UserSession | null>;
  onSessionExpired?: () => void;
  // AUTH-14 fix: Added onSessionExpiring callback
  onSessionExpiring?: () => void;
};

// Lazy initialization to avoid constructor issues in tests
let authServiceInstance: AuthServiceClass | null = null;

// Create the service object first without methods to avoid circular reference
const authServiceObj: AuthServiceInterface = {
  get instance(): AuthServiceClass {
    if (!authServiceInstance) {
      authServiceInstance = new AuthServiceClass();
    }
    return authServiceInstance;
  },
  // Delegate all methods
  login: (credentials: LoginRequest) => authServiceObj.instance.login(credentials),
  getStoredToken: () => authServiceObj.instance.getStoredToken(),
  hasStoredToken: () => authServiceObj.instance.hasStoredToken(),
  removeStoredToken: () => authServiceObj.instance.removeStoredToken(),
  validateStoredSession: () => authServiceObj.instance.validateStoredSession(),
  logout: () => authServiceObj.instance.logout(),
  forgotPassword: (email: string) => authServiceObj.instance.forgotPassword(email),
  resetPassword: (request: ResetPasswordRequest) => authServiceObj.instance.resetPassword(request),
  refreshSession: () => authServiceObj.instance.refreshSession(),
  setSessionTimeoutCallback: (callback: () => void) => authServiceObj.instance.setSessionTimeoutCallback(callback),
  // AUTH-14 fix: Delegate to instance method
  setSessionExpiringCallback: (callback: () => void) => authServiceObj.instance.setSessionExpiringCallback(callback),
  cleanup: () => authServiceObj.instance.cleanup(),
  validateJWTFormat: (token: string) => authServiceObj.instance.validateJWTFormat(token),
  getCurrentUser: () => authServiceObj.instance.validateStoredSession(),
  
  // Property access
  get onSessionExpired() {
    return (authServiceObj.instance as any).onSessionExpired;
  },
  set onSessionExpired(callback: (() => void) | undefined) {
    (authServiceObj.instance as any).onSessionExpired = callback;
  },
  // AUTH-14 fix: Property accessor for onSessionExpiring
  get onSessionExpiring() {
    return (authServiceObj.instance as any).onSessionExpiring;
  },
  set onSessionExpiring(callback: (() => void) | undefined) {
    (authServiceObj.instance as any).onSessionExpiring = callback;
  },
};

export const authService = authServiceObj;

export default AuthServiceClass;
export type { AuthServiceInterface }; 