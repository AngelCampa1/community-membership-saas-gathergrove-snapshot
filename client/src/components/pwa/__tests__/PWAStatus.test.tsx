/**
 * Tests for PWAStatus.tsx - PWA connection and update status (smoke tests)
 * Note: This component uses pwaManager, service worker API, timers, and subscriptions
 * Full integration testing deferred due to PWA API and subscription mocking complexity
 */

import { PWAStatus } from '../PWAStatus';

// Mock pwaManager
jest.mock('@/lib/pwa', () => ({
  pwaManager: {
    getOnlineStatus: jest.fn(() => true),
    canInstall: jest.fn(() => false),
    isStandalone: jest.fn(() => false),
    onlineStatusSubscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    promptInstall: jest.fn(() => Promise.resolve()),
    activateServiceWorker: jest.fn(() => Promise.resolve()),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('PWAStatus', () => {
  describe('Smoke tests', () => {
    it('exports PWAStatus component', () => {
      expect(PWAStatus).toBeDefined();
      expect(typeof PWAStatus).toBe('function');
    });

    it('is a React component', () => {
      expect(PWAStatus.prototype).toBeUndefined(); // Functional component
    });
  });
});
