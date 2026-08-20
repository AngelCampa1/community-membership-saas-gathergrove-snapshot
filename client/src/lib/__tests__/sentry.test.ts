/**
 * Tests for sentry.ts - Sentry telemetry wrapper
 *
 * Mocks @sentry/nextjs (external boundary) and verifies wrapper behaviour.
 */

import * as Sentry from '@sentry/nextjs';
import {
  setUserContext,
  clearUserContext,
  trackEvent,
  trackError,
  trackApiCall,
} from '../sentry';

// Mock external boundary
jest.mock('@sentry/nextjs', () => ({
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((cb: (scope: unknown) => void) =>
    cb({ setContext: jest.fn(), setTag: jest.fn() })
  ),
}));

const mockSetUser = Sentry.setUser as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;
const mockWithScope = Sentry.withScope as jest.Mock;

describe('sentry wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore withScope implementation (reset by jest config's resetMocks: true)
    mockWithScope.mockImplementation((cb: (scope: unknown) => void) =>
      cb({ setContext: jest.fn(), setTag: jest.fn() })
    );
  });

  describe('setUserContext', () => {
    it('calls Sentry.setUser with id and username', () => {
      setUserContext('42', '100', { email: 'a@b.com' });

      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({ id: '42', username: '100', email: 'a@b.com' })
      );
    });

    it('does not throw if Sentry.setUser throws', () => {
      mockSetUser.mockImplementationOnce(() => { throw new Error('Sentry error'); });
      expect(() => setUserContext('1')).not.toThrow();
    });
  });

  describe('clearUserContext', () => {
    it('calls Sentry.setUser(null)', () => {
      clearUserContext();
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });

    it('does not throw if Sentry.setUser throws', () => {
      mockSetUser.mockImplementationOnce(() => { throw new Error('Sentry error'); });
      expect(() => clearUserContext()).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('calls Sentry.addBreadcrumb with event category', () => {
      trackEvent('user_login', { method: 'email' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'event',
          message: 'user_login',
          data: { method: 'email' },
          level: 'info',
        })
      );
    });

    it('does not throw if Sentry.addBreadcrumb throws', () => {
      mockAddBreadcrumb.mockImplementationOnce(() => { throw new Error('Sentry error'); });
      expect(() => trackEvent('test')).not.toThrow();
    });
  });

  describe('trackError', () => {
    it('calls Sentry.captureException via withScope', () => {
      const error = new Error('test');
      trackError(error, { context: 'login' });

      expect(mockWithScope).toHaveBeenCalled();
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it('does not throw if withScope throws', () => {
      mockWithScope.mockImplementationOnce(() => { throw new Error('Sentry error'); });
      expect(() => trackError(new Error('test'))).not.toThrow();
    });
  });

  describe('trackApiCall', () => {
    it('calls Sentry.addBreadcrumb with http category', () => {
      trackApiCall('/api/events', 'GET', 200, 150, { success: true });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'http',
          data: expect.objectContaining({
            url: '/api/events',
            method: 'GET',
            status_code: 200,
            success: true,
          }),
          level: 'info',
        })
      );
    });

    it('uses error level for 4xx/5xx responses', () => {
      trackApiCall('/api/events', 'POST', 500, 200);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });
  });
});
