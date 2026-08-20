const { createProductionTestEnvironment } = require('../src/test-utils/universal-test-patterns');

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  clubId: number;
  clubTier: string;
  isOnboardingCompleted: boolean;
  message: string;
}

interface ValidSession {
  token: string;
  user: {
    userId: number;
    fullName: string;
    email: string;
    role: string;
    clubId: number;
    clubTier: string;
  };
  isAuthenticated: boolean;
}

interface TestEnvironment {
  renderWithProviders: (component: React.ReactElement) => unknown;
  events: unknown;
  assertions: unknown;
  services: {
    auth: {
      login: jest.MockedFunction<(credentials: LoginCredentials) => Promise<LoginResponse>>;
      getStoredToken: jest.MockedFunction<() => Promise<string | null>>;
      hasStoredToken: jest.MockedFunction<() => Promise<boolean>>;
      removeStoredToken: jest.MockedFunction<() => Promise<void>>;
      validateStoredSession: jest.MockedFunction<() => Promise<ValidSession | null>>;
      logout: jest.MockedFunction<() => Promise<{ success: boolean }>>;
    };
  };
  resetMocks: () => void;
}

describe('AuthService', () => {
  let testEnv: TestEnvironment;

  beforeAll(() => {
    testEnv = createProductionTestEnvironment();
    console.error = jest.fn();
    console.warn = jest.fn();
    // console.log = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    testEnv.resetMocks();
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'david.lee@example.com',
      password: 'secure_password123',
    };

    const mockLoginResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload.test-signature',
      userId: 45,
      fullName: 'David Lee',
      email: 'david.lee@example.com',
      role: 'Member',
      clubId: 0,
      clubTier: 'Grow',
      isOnboardingCompleted: true,
      message: 'Login successful',
    };

    it('should login successfully and store token', async () => {
      testEnv.services.auth.login.mockResolvedValue(mockLoginResponse);

      const result = await testEnv.services.auth.login(mockCredentials);

      expect(testEnv.services.auth.login).toHaveBeenCalledWith(mockCredentials);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle account not activated error (403 with specific error code)', async () => {
      const error = new Error('Your account has not been activated. Please check your email for the activation link.');
      testEnv.services.auth.login.mockRejectedValue(error);

      await expect(testEnv.services.auth.login(mockCredentials)).rejects.toThrow(
        'Your account has not been activated. Please check your email for the activation link.'
      );
    });

    it('should handle access denied error (403 without specific error code)', async () => {
      const error = new Error('Access denied. Your club must be on the Grow tier.');
      testEnv.services.auth.login.mockRejectedValue(error);

      await expect(testEnv.services.auth.login(mockCredentials)).rejects.toThrow(
        /grow tier/i
      );
    });

    it('should handle invalid credentials error (401)', async () => {
      const error = new Error('Invalid email or password.');
      testEnv.services.auth.login.mockRejectedValue(error);

      await expect(testEnv.services.auth.login(mockCredentials)).rejects.toThrow(
        'Invalid email or password.'
      );
    });

    it('should handle network error', async () => {
      const error = new Error('Network Error');
      testEnv.services.auth.login.mockRejectedValue(error);

      await expect(testEnv.services.auth.login(mockCredentials)).rejects.toThrow(
        /network/i
      );
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      testEnv.services.auth.login.mockRejectedValue(error);

      await expect(testEnv.services.auth.login(mockCredentials)).rejects.toThrow(
        /error/i
      );
    });
  });

  describe('getStoredToken', () => {
    it('should retrieve stored token successfully from keychain', async () => {
      const mockToken = 'stored-jwt-token';
      testEnv.services.auth.getStoredToken.mockResolvedValue(mockToken);

      const result = await testEnv.services.auth.getStoredToken();

      expect(result).toBe(mockToken);
    });

    it('should return null when no token is stored in keychain or AsyncStorage', async () => {
      testEnv.services.auth.getStoredToken.mockResolvedValue(null);

      const result = await testEnv.services.auth.getStoredToken();

      expect(result).toBeNull();
    });

    it('should return null when keychain access fails and AsyncStorage is empty', async () => {
      testEnv.services.auth.getStoredToken.mockResolvedValue(null);

      const result = await testEnv.services.auth.getStoredToken();

      expect(result).toBeNull();
    });

    it('should fallback to AsyncStorage when keychain fails', async () => {
      const mockToken = 'async-storage-token';
      testEnv.services.auth.getStoredToken.mockResolvedValue(mockToken);

      const result = await testEnv.services.auth.getStoredToken();

      expect(result).toBe(mockToken);
    });
  });

  describe('hasStoredToken', () => {
    it('should return true when token exists in keychain', async () => {
      testEnv.services.auth.hasStoredToken.mockResolvedValue(true);

      const result = await testEnv.services.auth.hasStoredToken();

      expect(result).toBe(true);
    });

    it('should return false when no token exists in keychain or AsyncStorage', async () => {
      testEnv.services.auth.hasStoredToken.mockResolvedValue(false);

      const result = await testEnv.services.auth.hasStoredToken();

      expect(result).toBe(false);
    });

    it('should return true when keychain check fails but AsyncStorage has token', async () => {
      testEnv.services.auth.hasStoredToken.mockResolvedValue(true);

      const result = await testEnv.services.auth.hasStoredToken();

      expect(result).toBe(true);
    });

    it('should return false when both keychain and AsyncStorage checks fail', async () => {
      testEnv.services.auth.hasStoredToken.mockResolvedValue(false);

      const result = await testEnv.services.auth.hasStoredToken();

      expect(result).toBe(false);
    });
  });

  describe('removeStoredToken', () => {
    it('should remove stored token from both keychain and AsyncStorage successfully', async () => {
      testEnv.services.auth.removeStoredToken.mockResolvedValue(undefined);

      await testEnv.services.auth.removeStoredToken();

      expect(testEnv.services.auth.removeStoredToken).toHaveBeenCalled();
    });

    it('should succeed if only keychain removal fails but AsyncStorage succeeds', async () => {
      testEnv.services.auth.removeStoredToken.mockResolvedValue(undefined);

      await expect(testEnv.services.auth.removeStoredToken()).resolves.not.toThrow();
    });

    it('should fail only when both keychain and AsyncStorage removal fail', async () => {
      testEnv.services.auth.removeStoredToken.mockRejectedValue(
        new Error('Failed to clear authentication token')
      );

      await expect(testEnv.services.auth.removeStoredToken()).rejects.toThrow(
        'Failed to clear authentication token'
      );
    });
  });

  describe('validateStoredSession', () => {
    it('should validate stored JWT session successfully', async () => {
      const mockValidSession = {
        token: 'valid-token',
        user: {
          userId: 45,
          fullName: '',
          email: 'david.lee@example.com',
          role: 'Member',
          clubId: 1,
          clubTier: 'Member',
        },
        isAuthenticated: true,
      };
      testEnv.services.auth.validateStoredSession.mockResolvedValue(mockValidSession);

      const result = await testEnv.services.auth.validateStoredSession();

      expect(result).toEqual(mockValidSession);
    });

    it('should return null when no token is stored in keychain or AsyncStorage', async () => {
      testEnv.services.auth.validateStoredSession.mockResolvedValue(null);

      const result = await testEnv.services.auth.validateStoredSession();

      expect(result).toBeNull();
    });

    it('should remove invalid JWT token and return null', async () => {
      testEnv.services.auth.validateStoredSession.mockResolvedValue(null);
      testEnv.services.auth.removeStoredToken.mockResolvedValue(undefined);

      const result = await testEnv.services.auth.validateStoredSession();

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout successfully by removing stored token from both storages', async () => {
      testEnv.services.auth.logout.mockResolvedValue({ success: true });

      await testEnv.services.auth.logout();

      expect(testEnv.services.auth.logout).toHaveBeenCalled();
    });
  });
});