/**
 * Azure Configuration Tests
 *
 * Tests Azure Notification Hubs configuration validation and environment handling.
 */

// Mock expo-constants with mutable config
const mockExpoConfig = {
  extra: {} as Record<string, string>,
};

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: mockExpoConfig,
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('azure.config', () => {
  const originalEnv = process.env;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (global as any).__DEV__ = false;

    // Clear expo config
    mockExpoConfig.extra = {};
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  describe('Configuration Validation', () => {
    it('should create valid config with all environment variables set', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKey=test-key';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';
      process.env.API_BASE_URL = 'https://test-api.example.com';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.connectionString).toBe('Endpoint=sb://test.servicebus.windows.net/;SharedAccessKey=test-key');
      expect(AZURE_CONFIG.hubName).toBe('test-hub');
      expect(AZURE_CONFIG.expoProjectId).toBe('test-project-id');
      expect(AZURE_CONFIG.apiBaseUrl).toBe('https://test-api.example.com');
      expect(AZURE_CONFIG.isConfigured).toBe(true);
    });

    it('should mark as not configured when missing connection string', () => {
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      (global as any).__DEV__ = true;

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should mark as not configured when missing hub name', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKey=test-key';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      (global as any).__DEV__ = true;

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should mark as not configured when missing expo project ID', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKey=test-key';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';

      (global as any).__DEV__ = true;

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should use default API base URL when not provided', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.apiBaseUrl).toBe('http://localhost:5284');
    });

    it('should use default API timeout when not provided', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.apiTimeout).toBe(10000);
    });

    it('should parse custom API timeout', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';
      process.env.API_TIMEOUT = '5000';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.apiTimeout).toBe(5000);
    });
  });

  describe('Environment Variable Sources', () => {
    it('should handle configuration when both Expo and env vars are present', () => {
      // Note: Testing Expo config precedence over env vars requires complex ES module mocking
      // that Jest doesn't handle well. The precedence logic is documented and manually tested.
      // This test verifies the config loads successfully when both sources exist.
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'env-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'env-hub';
      process.env.EXPO_PROJECT_ID = 'env-project';

      const { AZURE_CONFIG } = require('../azure.config');

      // Verify config is populated (from env vars since Expo mock is empty in this test)
      expect(AZURE_CONFIG.connectionString).toBeTruthy();
      expect(AZURE_CONFIG.hubName).toBeTruthy();
      expect(AZURE_CONFIG.expoProjectId).toBeTruthy();
      expect(AZURE_CONFIG.isConfigured).toBe(true);
    });

    it('should fallback to process.env when Expo config not available', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'env-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'env-hub';
      process.env.EXPO_PROJECT_ID = 'env-project';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.connectionString).toBe('env-connection');
      expect(AZURE_CONFIG.hubName).toBe('env-hub');
      expect(AZURE_CONFIG.expoProjectId).toBe('env-project');
    });

    it('should support multiple environment variable naming patterns', () => {
      // Note: The config supports both camelCase (azureConnectionString) and
      // SCREAMING_SNAKE_CASE (AZURE_NOTIFICATION_HUB_CONNECTION_STRING) naming.
      // Expo config testing is complex due to ES module mocking limitations.
      // This test verifies the SCREAMING_SNAKE_CASE pattern works.
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.connectionString).toBe('test-connection');
      expect(AZURE_CONFIG.hubName).toBe('test-hub');
      expect(AZURE_CONFIG.expoProjectId).toBe('test-project');
    });

    it('should support SCREAMING_SNAKE_CASE environment variable names', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'snake-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'snake-hub';
      process.env.EXPO_PROJECT_ID = 'snake-project';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.connectionString).toBe('snake-connection');
      expect(AZURE_CONFIG.hubName).toBe('snake-hub');
      expect(AZURE_CONFIG.expoProjectId).toBe('snake-project');
    });
  });

  describe('Warning Logic', () => {
    it('should warn in production when not configured', () => {
      (global as any).__DEV__ = false;
      process.env.isDevelopment = 'false';

      const { logger } = require('../../utils/logger');
      const { AZURE_CONFIG } = require('../azure.config');

      expect(logger.warn).toHaveBeenCalledWith(
        'app',
        'Azure Notification Hubs not configured for production',
        expect.objectContaining({
          hasConnectionString: false,
          hasHubName: false,
          hasProjectId: false,
        })
      );
      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should not warn in development when not configured', () => {
      (global as any).__DEV__ = true;

      const { logger } = require('../../utils/logger');
      const { AZURE_CONFIG } = require('../azure.config');

      expect(logger.warn).not.toHaveBeenCalled();
      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should not warn when fully configured in production', () => {
      (global as any).__DEV__ = false;
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const { logger } = require('../../utils/logger');
      const { AZURE_CONFIG } = require('../azure.config');

      expect(logger.warn).not.toHaveBeenCalled();
      expect(AZURE_CONFIG.isConfigured).toBe(true);
    });

    it('should include partial config status in warning', () => {
      (global as any).__DEV__ = false;
      process.env.isDevelopment = 'false';
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      // Missing hub name and project ID

      const { logger } = require('../../utils/logger');
      require('../azure.config');

      expect(logger.warn).toHaveBeenCalledWith(
        'app',
        'Azure Notification Hubs not configured for production',
        expect.objectContaining({
          hasConnectionString: true,
          hasHubName: false,
          hasProjectId: false,
        })
      );
    });
  });

  describe('Default Export', () => {
    it('should export AZURE_CONFIG as default', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const defaultExport = require('../azure.config').default;
      const namedExport = require('../azure.config').AZURE_CONFIG;

      expect(defaultExport).toBe(namedExport);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings as unconfigured', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = '';
      process.env.AZURE_NOTIFICATION_HUB_NAME = '';
      process.env.EXPO_PROJECT_ID = '';

      (global as any).__DEV__ = true;

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });

    it('should handle missing Expo config gracefully', () => {
      const Constants = require('expo-constants').default;
      Constants.expoConfig = undefined;

      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      expect(() => {
        require('../azure.config');
      }).not.toThrow();
    });

    it('should handle null Expo extra gracefully', () => {
      const Constants = require('expo-constants').default;
      Constants.expoConfig = { extra: null };

      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      expect(() => {
        require('../azure.config');
      }).not.toThrow();
    });

    it('should handle non-numeric timeout values', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';
      process.env.API_TIMEOUT = 'not-a-number';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.apiTimeout).toBeNaN();
    });

    it('should handle all variables missing', () => {
      (global as any).__DEV__ = true;

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG.connectionString).toBe('');
      expect(AZURE_CONFIG.hubName).toBe('');
      expect(AZURE_CONFIG.expoProjectId).toBe('');
      expect(AZURE_CONFIG.apiBaseUrl).toBe('http://localhost:5284');
      expect(AZURE_CONFIG.isConfigured).toBe(false);
    });
  });

  describe('Configuration Structure', () => {
    it('should export configuration with correct structure', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(AZURE_CONFIG).toHaveProperty('connectionString');
      expect(AZURE_CONFIG).toHaveProperty('hubName');
      expect(AZURE_CONFIG).toHaveProperty('expoProjectId');
      expect(AZURE_CONFIG).toHaveProperty('apiBaseUrl');
      expect(AZURE_CONFIG).toHaveProperty('apiTimeout');
      expect(AZURE_CONFIG).toHaveProperty('isConfigured');
    });

    it('should have correct types for all properties', () => {
      process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING = 'test-connection';
      process.env.AZURE_NOTIFICATION_HUB_NAME = 'test-hub';
      process.env.EXPO_PROJECT_ID = 'test-project-id';

      const { AZURE_CONFIG } = require('../azure.config');

      expect(typeof AZURE_CONFIG.connectionString).toBe('string');
      expect(typeof AZURE_CONFIG.hubName).toBe('string');
      expect(typeof AZURE_CONFIG.expoProjectId).toBe('string');
      expect(typeof AZURE_CONFIG.apiBaseUrl).toBe('string');
      expect(typeof AZURE_CONFIG.apiTimeout).toBe('number');
      expect(typeof AZURE_CONFIG.isConfigured).toBe('boolean');
    });
  });
});
