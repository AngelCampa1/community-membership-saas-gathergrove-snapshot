/**
 * Navigation Tracking Tests
 * TDD Approach: Tests written FIRST before implementation
 */

import { getActiveRouteName, trackScreenView } from '../navigationTracking';

// Mock Sentry
jest.mock('@sentry/react-native');

import * as Sentry from '@sentry/react-native';
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;

describe('navigationTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveRouteName', () => {
    it('should extract route name from simple navigation state', () => {
      const state = {
        routes: [{ name: 'Home' }],
        index: 0,
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Home');
    });

    it('should extract route name from nested navigation state', () => {
      const state = {
        routes: [
          {
            name: 'MainStack',
            state: {
              routes: [{ name: 'Dashboard' }],
              index: 0,
            },
          },
        ],
        index: 0,
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Dashboard');
    });

    it('should extract route name from deeply nested navigation state', () => {
      const state = {
        routes: [
          {
            name: 'RootStack',
            state: {
              routes: [
                {
                  name: 'MainTabs',
                  state: {
                    routes: [{ name: 'Profile' }],
                    index: 0,
                  },
                },
              ],
              index: 0,
            },
          },
        ],
        index: 0,
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Profile');
    });

    it('should handle undefined state', () => {
      const routeName = getActiveRouteName(undefined);
      expect(routeName).toBe('Unknown');
    });

    it('should handle empty routes array', () => {
      const state = {
        routes: [],
        index: 0,
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Unknown');
    });

    it('should handle state without routes', () => {
      const state = {
        index: 0,
      } as any;

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Unknown');
    });

    it('should use index to get correct route from multiple routes', () => {
      const state = {
        routes: [
          { name: 'Home' },
          { name: 'Settings' },
          { name: 'Profile' },
        ],
        index: 1,
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Settings');
    });

    it('should handle invalid index (out of bounds)', () => {
      const state = {
        routes: [
          { name: 'Home' },
          { name: 'Settings' },
        ],
        index: 5, // Out of bounds
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Unknown');
    });

    it('should handle negative index', () => {
      const state = {
        routes: [
          { name: 'Home' },
          { name: 'Settings' },
        ],
        index: -1, // Negative index
      };

      const routeName = getActiveRouteName(state);
      expect(routeName).toBe('Unknown');
    });
  });

  describe('trackScreenView', () => {
    it('should call Sentry addBreadcrumb with screen name', () => {
      trackScreenView('HomeScreen');

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'navigation',
          message: 'HomeScreen',
          data: expect.objectContaining({
            screenName: 'HomeScreen',
          }),
        })
      );
    });

    it('should include timestamp in tracking data', () => {
      const beforeTimestamp = Date.now();
      trackScreenView('ProfileScreen');
      const afterTimestamp = Date.now();

      expect(mockAddBreadcrumb).toHaveBeenCalled();
      const callArgs = mockAddBreadcrumb.mock.calls[0][0];
      const timestamp = callArgs.data?.timestamp;

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include platform in tracking data', () => {
      trackScreenView('SettingsScreen');

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            platform: expect.any(String),
          }),
        })
      );
    });

    it('should not crash if Sentry addBreadcrumb throws', () => {
      mockAddBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      expect(() => {
        trackScreenView('ErrorScreen');
      }).not.toThrow();
    });

    it('should track multiple screen views with different names', () => {
      trackScreenView('Screen1');
      trackScreenView('Screen2');
      trackScreenView('Screen3');

      expect(mockAddBreadcrumb).toHaveBeenCalledTimes(3);
      expect(mockAddBreadcrumb).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ message: 'Screen1', data: expect.objectContaining({ screenName: 'Screen1' }) })
      );
      expect(mockAddBreadcrumb).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ message: 'Screen2', data: expect.objectContaining({ screenName: 'Screen2' }) })
      );
      expect(mockAddBreadcrumb).toHaveBeenNthCalledWith(3,
        expect.objectContaining({ message: 'Screen3', data: expect.objectContaining({ screenName: 'Screen3' }) })
      );
    });
  });

  describe('Integration', () => {
    it('should work together to track navigation state changes', () => {
      const state = {
        routes: [
          {
            name: 'MainStack',
            state: {
              routes: [{ name: 'Dashboard' }],
              index: 0,
            },
          },
        ],
        index: 0,
      };

      const routeName = getActiveRouteName(state);
      trackScreenView(routeName);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'navigation',
          message: 'Dashboard',
          data: expect.objectContaining({
            screenName: 'Dashboard',
          }),
        })
      );
    });
  });
});
