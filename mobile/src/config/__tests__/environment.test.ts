/**
 * Environment Configuration Tests
 *
 * Tests environment variable management, validation, and platform-specific behavior.
 */

import { Platform } from 'react-native';

// Mock Platform before importing environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.native || obj.default,
  },
}));

describe('environment', () => {
  const originalEnv = process.env;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    // Reset modules to get fresh environment instance
    jest.resetModules();

    // Reset environment
    process.env = { ...originalEnv };
    (global as any).__DEV__ = false;

    // Set default test environment
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://test-api.example.com';
    process.env.WS_BASE_URL = 'ws://test-ws.example.com';
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  describe('Environment Initialization', () => {
    it('should initialize with valid environment variables', () => {
      const { env } = require('../environment');

      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBe('test');
      expect(env.API_BASE_URL).toBe('http://test-api.example.com');
      expect(env.WS_BASE_URL).toBe('ws://test-ws.example.com');
    });

    it('should use default values when optional vars are missing', () => {
      delete process.env.SENTRY_DSN;
      delete process.env.ANALYTICS_TRACKING_ID;

      const { env } = require('../environment');

      expect(env.SENTRY_DSN).toBeUndefined();
      expect(env.ANALYTICS_TRACKING_ID).toBeUndefined();
    });

    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development';

      const { env, isDevelopment, isProduction, isTest } = require('../environment');

      expect(env.NODE_ENV).toBe('development');
      expect(isDevelopment).toBe(true);
      expect(isProduction).toBe(false);
      expect(isTest).toBe(false);
    });

    it('should handle production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';

      const { env, isDevelopment, isProduction, isTest } = require('../environment');

      expect(env.NODE_ENV).toBe('production');
      expect(isDevelopment).toBe(false);
      expect(isProduction).toBe(true);
      expect(isTest).toBe(false);
    });
  });

  describe('Environment Validation', () => {
    it('should use default NODE_ENV if not set', () => {
      delete process.env.NODE_ENV;

      const { env } = require('../environment');

      expect(env.NODE_ENV).toBe('development');
    });

    it('should throw error for invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'invalid';

      expect(() => {
        require('../environment');
      }).toThrow('Invalid NODE_ENV: invalid');
    });

    it('should use default API_BASE_URL if not set', () => {
      delete process.env.API_BASE_URL;

      const { env } = require('../environment');

      expect(env.API_BASE_URL).toBe('http://localhost:8050');
    });

    it('should use default WS_BASE_URL if not set', () => {
      delete process.env.WS_BASE_URL;

      const { env } = require('../environment');

      expect(env.WS_BASE_URL).toBe('ws://localhost:8050/hub');
    });
  });

  describe('Production Environment Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
    });

    it('should validate URLs in production', () => {
      const { env } = require('../environment');

      expect(env.API_BASE_URL).toBe('https://api.example.com');
      expect(env.WS_BASE_URL).toBe('wss://ws.example.com');
    });

    it('should throw error for invalid API_BASE_URL in production', () => {
      process.env.API_BASE_URL = 'not-a-valid-url';

      expect(() => {
        require('../environment');
      }).toThrow('Invalid URL format');
    });

    it('should throw error for invalid WS_BASE_URL in production', () => {
      process.env.WS_BASE_URL = 'not-a-valid-ws-url';

      expect(() => {
        require('../environment');
      }).toThrow('Invalid URL format');
    });

    it('should handle ws:// protocol in URL validation', () => {
      process.env.WS_BASE_URL = 'ws://valid-ws.example.com';

      const { env } = require('../environment');

      expect(env.WS_BASE_URL).toBe('ws://valid-ws.example.com');
    });

    it('should handle wss:// protocol in URL validation', () => {
      process.env.WS_BASE_URL = 'wss://valid-wss.example.com';

      const { env } = require('../environment');

      expect(env.WS_BASE_URL).toBe('wss://valid-wss.example.com');
    });
  });

  describe('Optional Environment Variables', () => {
    it('should handle optional SENTRY_DSN', () => {
      process.env.SENTRY_DSN = 'https://sentry.io/project';

      const { env } = require('../environment');

      expect(env.SENTRY_DSN).toBe('https://sentry.io/project');
    });

    it('should handle optional ANALYTICS_TRACKING_ID', () => {
      process.env.ANALYTICS_TRACKING_ID = 'GA-12345';

      const { env } = require('../environment');

      expect(env.ANALYTICS_TRACKING_ID).toBe('GA-12345');
    });

    it('should handle optional PUSH_NOTIFICATION_SENDER_ID', () => {
      process.env.PUSH_NOTIFICATION_SENDER_ID = 'sender-123';

      const { env } = require('../environment');

      expect(env.PUSH_NOTIFICATION_SENDER_ID).toBe('sender-123');
    });

    it('should handle optional STRIPE_PUBLISHABLE_KEY', () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      const { env } = require('../environment');

      expect(env.STRIPE_PUBLISHABLE_KEY).toBe('pk_test_123');
    });

    it('should handle optional AZURE_AD_CLIENT_ID', () => {
      process.env.AZURE_AD_CLIENT_ID = 'azure-client-123';

      const { env } = require('../environment');

      expect(env.AZURE_AD_CLIENT_ID).toBe('azure-client-123');
    });

    it('should handle optional AZURE_AD_TENANT_ID', () => {
      process.env.AZURE_AD_TENANT_ID = 'azure-tenant-123';

      const { env } = require('../environment');

      expect(env.AZURE_AD_TENANT_ID).toBe('azure-tenant-123');
    });
  });

  describe('Feature Flags', () => {
    it('should enable analytics in production with tracking ID', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
      process.env.ANALYTICS_TRACKING_ID = 'GA-12345';

      const { features } = require('../environment');

      expect(features.enableAnalytics).toBe(true);
    });

    it('should disable analytics in production without tracking ID', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
      delete process.env.ANALYTICS_TRACKING_ID;

      const { features } = require('../environment');

      expect(features.enableAnalytics).toBe(false);
    });

    it('should disable analytics in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.ANALYTICS_TRACKING_ID = 'GA-12345';

      const { features } = require('../environment');

      expect(features.enableAnalytics).toBe(false);
    });

    it('should enable Sentry in production with DSN', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
      process.env.SENTRY_DSN = 'https://sentry.io/project';

      const { features } = require('../environment');

      expect(features.enableSentry).toBe(true);
    });

    it('should disable Sentry in production without DSN', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
      delete process.env.SENTRY_DSN;

      const { features } = require('../environment');

      expect(features.enableSentry).toBe(false);
    });

    it('should enable debug logs in development', () => {
      process.env.NODE_ENV = 'development';

      const { features } = require('../environment');

      expect(features.enableDebugLogs).toBe(true);
    });

    it('should enable debug logs in test', () => {
      process.env.NODE_ENV = 'test';

      const { features } = require('../environment');

      expect(features.enableDebugLogs).toBe(true);
    });

    it('should disable debug logs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';

      const { features } = require('../environment');

      expect(features.enableDebugLogs).toBe(false);
    });

    it('should enable dev tools in development', () => {
      process.env.NODE_ENV = 'development';

      const { features } = require('../environment');

      expect(features.enableDevTools).toBe(true);
    });

    it('should disable dev tools in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';

      const { features } = require('../environment');

      expect(features.enableDevTools).toBe(false);
    });

    it('should enable strict mode in development', () => {
      process.env.NODE_ENV = 'development';

      const { features } = require('../environment');

      expect(features.enableStrictMode).toBe(true);
    });

    it('should disable strict mode in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';

      const { features } = require('../environment');

      expect(features.enableStrictMode).toBe(false);
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should handle web platform', () => {
      (Platform as any).OS = 'web';

      const { env } = require('../environment');

      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBe('test');
    });

    it('should handle iOS platform', () => {
      (Platform as any).OS = 'ios';

      const { env } = require('../environment');

      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBe('test');
    });

    it('should handle Android platform', () => {
      (Platform as any).OS = 'android';

      const { env } = require('../environment');

      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBe('test');
    });
  });

  describe('Helper Exports', () => {
    it('should export isDevelopment correctly', () => {
      process.env.NODE_ENV = 'development';

      const { isDevelopment } = require('../environment');

      expect(isDevelopment).toBe(true);
    });

    it('should export isProduction correctly', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';

      const { isProduction } = require('../environment');

      expect(isProduction).toBe(true);
    });

    it('should export isTest correctly', () => {
      process.env.NODE_ENV = 'test';

      const { isTest } = require('../environment');

      expect(isTest).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all environment variables set', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.WS_BASE_URL = 'wss://ws.example.com';
      process.env.SENTRY_DSN = 'https://sentry.io/project';
      process.env.ANALYTICS_TRACKING_ID = 'GA-12345';
      process.env.PUSH_NOTIFICATION_SENDER_ID = 'sender-123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_123';
      process.env.AZURE_AD_CLIENT_ID = 'azure-client-123';
      process.env.AZURE_AD_TENANT_ID = 'azure-tenant-123';

      const { env } = require('../environment');

      expect(env.NODE_ENV).toBe('production');
      expect(env.API_BASE_URL).toBe('https://api.example.com');
      expect(env.WS_BASE_URL).toBe('wss://ws.example.com');
      expect(env.SENTRY_DSN).toBe('https://sentry.io/project');
      expect(env.ANALYTICS_TRACKING_ID).toBe('GA-12345');
      expect(env.PUSH_NOTIFICATION_SENDER_ID).toBe('sender-123');
      expect(env.STRIPE_PUBLISHABLE_KEY).toBe('pk_live_123');
      expect(env.AZURE_AD_CLIENT_ID).toBe('azure-client-123');
      expect(env.AZURE_AD_TENANT_ID).toBe('azure-tenant-123');
    });

    it('should handle minimal environment variables', () => {
      delete process.env.SENTRY_DSN;
      delete process.env.ANALYTICS_TRACKING_ID;
      delete process.env.PUSH_NOTIFICATION_SENDER_ID;
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      delete process.env.AZURE_AD_CLIENT_ID;
      delete process.env.AZURE_AD_TENANT_ID;

      const { env } = require('../environment');

      expect(env.NODE_ENV).toBe('test');
      expect(env.API_BASE_URL).toBeDefined();
      expect(env.WS_BASE_URL).toBeDefined();
      expect(env.SENTRY_DSN).toBeUndefined();
      expect(env.ANALYTICS_TRACKING_ID).toBeUndefined();
    });
  });
});
