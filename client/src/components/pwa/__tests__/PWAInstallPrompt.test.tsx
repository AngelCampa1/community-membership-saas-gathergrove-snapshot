/**
 * Tests for PWAInstallPrompt.tsx - PWA installation prompt (smoke tests)
 * Note: This component uses pwaManager, timers, and sessionStorage
 * Full integration testing deferred due to PWA API mocking complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

// Mock pwaManager
jest.mock('@/lib/pwa', () => ({
  pwaManager: {
    getInstallationStatus: jest.fn(() => 'available'),
    isStandalone: jest.fn(() => false),
    canInstall: jest.fn(() => true),
    promptInstall: jest.fn(() => Promise.resolve({ outcome: 'accepted' })),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() =>
        render(<PWAInstallPrompt onInstall={jest.fn()} onDismiss={jest.fn()} />)
      ).not.toThrow();
    });

    it('accepts onInstall prop', () => {
      const onInstall = jest.fn();
      expect(() =>
        render(<PWAInstallPrompt onInstall={onInstall} onDismiss={jest.fn()} />)
      ).not.toThrow();
    });

    it('accepts onDismiss prop', () => {
      const onDismiss = jest.fn();
      expect(() =>
        render(<PWAInstallPrompt onInstall={jest.fn()} onDismiss={onDismiss} />)
      ).not.toThrow();
    });

    it('accepts autoShow prop', () => {
      expect(() =>
        render(<PWAInstallPrompt autoShow={false} onInstall={jest.fn()} onDismiss={jest.fn()} />)
      ).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() =>
        render(<PWAInstallPrompt className="custom-class" onInstall={jest.fn()} onDismiss={jest.fn()} />)
      ).not.toThrow();
    });
  });
});
