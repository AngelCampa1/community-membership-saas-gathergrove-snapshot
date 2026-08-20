/**
 * SSO Service for mobile authentication with Google and Apple Sign-In
 * Implements native authentication flows for iOS and Android platforms
 *
 * SETUP REQUIRED FOR GOOGLE SIGN-IN:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Download google-services.json (Android) and GoogleService-Info.plist (iOS)
 * 3. Add the files to the mobile project root
 * 4. Run `npx expo prebuild` to regenerate native projects
 * 5. Configure client IDs in app.config.ts
 */

import { Platform } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Keychain from 'react-native-keychain';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { API_CONFIG, KEYCHAIN_CONFIG, ERROR_MESSAGES } from '@/constants';
import { UserSession } from '@/types';
import { NetworkSecurity } from '@/utils/security';
import { logger } from '@/utils/logger';

// SSO Types
export interface SSOLoginRequest {
  idToken: string;
  platform: 'ios' | 'android' | 'web';
  fullName?: string;
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

export interface LinkedProvider {
  provider: string;
  linkedAt: string;
  providerEmail?: string;
}

export type SSOProvider = 'google' | 'apple';

class SSOServiceClass {
  private axiosInstance: AxiosInstance;
  private isGoogleConfigured = false;

  constructor() {
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
    this.configureGoogleSignIn();
  }

  /**
   * Set up request interceptor to add JWT token to requests
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get stored token from keychain
   */
  private async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(KEYCHAIN_CONFIG.SERVICE_NAME);
      return credentials ? credentials.password : null;
    } catch {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem('auth_token');
      } catch {
        return null;
      }
    }
  }

  /**
   * Store JWT token securely
   */
  private async storeToken(token: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        KEYCHAIN_CONFIG.SERVICE_NAME,
        KEYCHAIN_CONFIG.TOKEN_KEY,
        token
      );
    } catch {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('auth_token', token);
    }
  }

  /**
   * Configure Google Sign-In with client IDs from app config
   */
  private configureGoogleSignIn(): void {
    try {
      const extraConfig = Constants.expoConfig?.extra;
      const ssoConfig = extraConfig?.sso || {};

      const iosClientId = ssoConfig.googleIosClientId || extraConfig?.googleIosClientId;
      const webClientId = ssoConfig.googleWebClientId || extraConfig?.googleWebClientId;

      // Web client ID is required for backend token validation
      if (!webClientId) {
        logger.warn('sso', 'Google Sign-In webClientId not configured. Set it in app.config.ts extra.sso.googleWebClientId');
        this.isGoogleConfigured = false;
        return;
      }

      // Configure Google Sign-In SDK
      GoogleSignin.configure({
        webClientId, // Required for backend ID token validation
        iosClientId: iosClientId || undefined, // Optional: iOS-specific client ID
        offlineAccess: false, // We only need the ID token, not refresh tokens
        scopes: ['email', 'profile'], // Request email and profile scopes
      });

      this.isGoogleConfigured = true;
      logger.info('sso', 'Google Sign-In configured successfully');
    } catch (error) {
      logger.error('sso', 'Failed to configure Google Sign-In', { error });
      this.isGoogleConfigured = false;
    }
  }

  /**
   * Check if Google Sign-In is available
   * Returns true if SDK is configured and Google Play Services are available
   */
  async isGoogleSignInAvailable(): Promise<boolean> {
    if (!this.isGoogleConfigured) {
      return false;
    }

    try {
      // On Android, check if Google Play Services are available
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if Apple Sign-In is available (iOS 13+ only)
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /**
   * Sign in with Google
   * Uses native Google Sign-In SDK to authenticate and get ID token
   */
  async signInWithGoogle(): Promise<UserSession> {
    const isAvailable = await this.isGoogleSignInAvailable();
    if (!isAvailable) {
      throw new Error('Google Sign-In is not available. Please ensure the app is properly configured with Firebase.');
    }

    try {
      // Check for Google Play Services on Android
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Perform the sign-in
      const signInResult = await GoogleSignin.signIn();

      // Get the ID token for backend validation
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      // Get user's name from the sign-in result
      const user = signInResult.data?.user;
      const fullName = user?.name || undefined;

      // Send token to backend for validation and session creation
      const userSession = await this.authenticateWithBackend(
        'google',
        idToken,
        fullName
      );

      return userSession;
    } catch (error: unknown) {
      throw this.handleGoogleError(error);
    }
  }

  /**
   * Handle Google Sign-In errors with user-friendly messages
   */
  private handleGoogleError(error: unknown): Error {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return new Error('Google sign-in was cancelled');
        case statusCodes.IN_PROGRESS:
          return new Error('Google sign-in is already in progress');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return new Error('Google Play Services are not available. Please update or install Google Play Services.');
        default:
          return new Error(error.message || 'Google sign-in failed');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Google sign-in failed');
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(): Promise<UserSession> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS devices.');
    }

    const isAvailable = await this.isAppleSignInAvailable();
    if (!isAvailable) {
      throw new Error('Apple Sign-In is not available on this device.');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Apple only provides name on first sign-in
      let fullName: string | undefined;
      if (credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        fullName = [givenName, familyName].filter(Boolean).join(' ') || undefined;
      }

      // Send token to backend for validation
      const userSession = await this.authenticateWithBackend(
        'apple',
        credential.identityToken,
        fullName
      );

      return userSession;
    } catch (error: unknown) {
      throw this.handleAppleError(error);
    }
  }

  /**
   * Authenticate with backend using SSO token
   */
  private async authenticateWithBackend(
    provider: SSOProvider,
    idToken: string,
    fullName?: string
  ): Promise<UserSession> {
    const endpoint = provider === 'google'
      ? API_CONFIG.ENDPOINTS.SSO_GOOGLE
      : API_CONFIG.ENDPOINTS.SSO_APPLE;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const request: SSOLoginRequest = {
      idToken,
      platform,
      fullName,
    };

    try {
      const response = await this.axiosInstance.post<SSOLoginResponse>(endpoint, request);

      const {
        token,
        userId,
        fullName: userName,
        email,
        clubId,
        role,
        clubTier,
        success,
        message
      } = response.data;

      if (!success) {
        throw new Error(message || `${provider} sign-in failed`);
      }

      // Store token securely
      if (token) {
        await this.storeToken(token);
      }

      // Return user session
      const userSession: UserSession = {
        token: token || '',
        user: {
          userId,
          fullName: userName,
          email,
          role,
          clubId,
          clubTier,
        },
        isAuthenticated: true,
      };

      // SEC-03 fix: Mask sensitive data in logs
      const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown';
      logger.info('sso', `${provider} sign-in successful`, { userId: String(userId), email: maskedEmail });

      return userSession;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`${provider} sign-in failed: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Sign out from Google
   * Clears the cached Google Sign-In session
   */
  async signOutGoogle(): Promise<void> {
    if (!this.isGoogleConfigured) {
      return;
    }

    try {
      await GoogleSignin.signOut();
      logger.info('sso', 'Google sign out successful');
    } catch (error) {
      logger.error('sso', 'Failed to sign out from Google', { error });
    }
  }

  /**
   * Get linked SSO providers for current user
   */
  async getLinkedProviders(): Promise<LinkedProvider[]> {
    try {
      const response = await this.axiosInstance.get<LinkedProvider[]>(
        API_CONFIG.ENDPOINTS.SSO_LINKED_PROVIDERS
      );
      return response.data;
    } catch (error) {
      logger.error('sso', 'Failed to get linked providers', { error });
      return [];
    }
  }

  /**
   * Link a new SSO provider to existing account
   */
  async linkProvider(provider: SSOProvider): Promise<void> {
    let idToken: string;
    let fullName: string | undefined;

    if (provider === 'google') {
      const isAvailable = await this.isGoogleSignInAvailable();
      if (!isAvailable) {
        throw new Error('Google Sign-In is not available. Please ensure the app is properly configured with Firebase.');
      }

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const signInResult = await GoogleSignin.signIn();
      if (!signInResult.data?.idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      idToken = signInResult.data.idToken;
      fullName = signInResult.data.user?.name || undefined;
    } else {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      idToken = credential.identityToken;
      if (credential.fullName) {
        fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ') || undefined;
      }
    }

    await this.axiosInstance.post(API_CONFIG.ENDPOINTS.SSO_LINK_PROVIDER, {
      provider,
      idToken,
      fullName,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    logger.info('sso', `Successfully linked ${provider} provider`);
  }

  /**
   * Unlink an SSO provider from account
   */
  async unlinkProvider(provider: SSOProvider): Promise<void> {
    await this.axiosInstance.delete(
      API_CONFIG.ENDPOINTS.SSO_UNLINK_PROVIDER(provider)
    );
    logger.info('sso', `Successfully unlinked ${provider} provider`);
  }

  /**
   * Set password for SSO-only account
   */
  async setPassword(newPassword: string, confirmPassword: string): Promise<void> {
    await this.axiosInstance.post(API_CONFIG.ENDPOINTS.SSO_SET_PASSWORD, {
      newPassword,
      confirmPassword,
    });
    logger.info('sso', 'Successfully set password for SSO account');
  }

  /**
   * Handle Apple Sign-In errors
   */
  private handleAppleError(error: unknown): Error {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const appleError = error as { code: string; message?: string };

      switch (appleError.code) {
        case 'ERR_REQUEST_CANCELED':
          return new Error('Apple sign-in was cancelled');
        case 'ERR_INVALID_RESPONSE':
          return new Error('Invalid response from Apple');
        case 'ERR_REQUEST_FAILED':
          return new Error('Apple sign-in request failed');
        default:
          return new Error(appleError.message || 'Apple sign-in failed');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

// Singleton instance
let ssoServiceInstance: SSOServiceClass | null = null;

const ssoService = {
  get instance(): SSOServiceClass {
    if (!ssoServiceInstance) {
      ssoServiceInstance = new SSOServiceClass();
    }
    return ssoServiceInstance;
  },

  isGoogleSignInAvailable: () => ssoService.instance.isGoogleSignInAvailable(),
  isAppleSignInAvailable: () => ssoService.instance.isAppleSignInAvailable(),
  signInWithGoogle: () => ssoService.instance.signInWithGoogle(),
  signInWithApple: () => ssoService.instance.signInWithApple(),
  signOutGoogle: () => ssoService.instance.signOutGoogle(),
  getLinkedProviders: () => ssoService.instance.getLinkedProviders(),
  linkProvider: (provider: SSOProvider) => ssoService.instance.linkProvider(provider),
  unlinkProvider: (provider: SSOProvider) => ssoService.instance.unlinkProvider(provider),
  setPassword: (newPassword: string, confirmPassword: string) =>
    ssoService.instance.setPassword(newPassword, confirmPassword),
};

export { ssoService };
export default SSOServiceClass;
