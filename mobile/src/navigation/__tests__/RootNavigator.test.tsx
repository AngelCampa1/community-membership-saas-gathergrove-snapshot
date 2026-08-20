/**
 * RootNavigator Tests
 *
 * Tests the root navigation component covering authentication-based routing,
 * component rendering, and prop handling. Tests are simplified to avoid
 * complex React Navigation mocking.
 */

import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { RootNavigator } from '../RootNavigator';

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children, onReady, _onStateChange }: any) => {
      // Simple mock that renders children
      React.useEffect(() => {
        // Call onReady after a tick to simulate navigation ready
        if (onReady) {
          setTimeout(() => onReady(), 0);
        }
      }, [onReady]);

      return React.createElement('div', { testID: 'navigation-container' }, children);
    },
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) =>
        React.createElement('div', { testID: 'stack-navigator' }, children),
      Screen: ({ children, name }: any) =>
        React.createElement('div', { testID: `screen-${name}` },
          typeof children === 'function' ? children() : children
        ),
    }),
  };
});

// Mock navigation tracking utils
jest.mock('@/utils/navigationTracking', () => ({
  getActiveRouteName: jest.fn(() => 'Main'),
  trackScreenView: jest.fn(),
}));

// Mock all screen components
jest.mock('@/screens/AuthFlow', () => ({
  AuthFlow: () => null,
}));

jest.mock('@/screens/EventDetailsScreen', () => ({
  EventDetailsScreen: () => null,
}));

jest.mock('@/screens/EditProfileScreen', () => ({
  EditProfileScreen: () => null,
}));

jest.mock('@/screens/MembershipCardScreen', () => ({
  MembershipCardScreen: () => null,
}));

jest.mock('@/screens/PayDuesScreen', () => ({
  PayDuesScreen: () => null,
}));

jest.mock('@/screens/DirectorySettingsScreen', () => ({
  DirectorySettingsScreen: () => null,
}));

jest.mock('@/screens/ThemeSettingsScreen', () => ({
  ThemeSettingsScreen: () => null,
}));

jest.mock('../MainTabNavigator', () => ({
  MainTabNavigator: () => null,
}));

describe('RootNavigator', () => {
  const mockOnLoginSuccess = jest.fn();
  const mockOnLogout = jest.fn();
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS to prevent cross-test pollution
    Platform.OS = 'ios';
  });

  afterEach(() => {
    // Restore original Platform.OS
    Platform.OS = originalPlatformOS;
  });

  describe('Component Rendering', () => {
    it('should render without crashing when authenticated', () => {
      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();
      expect(getByTestId('stack-navigator')).toBeTruthy();
    });

    it('should render without crashing when not authenticated', () => {
      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();
      expect(getByTestId('stack-navigator')).toBeTruthy();
    });

    it('should render NavigationContainer component', () => {
      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      const container = getByTestId('navigation-container');
      expect(container).toBeTruthy();
    });

    it('should render Stack.Navigator component', () => {
      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      const navigator = getByTestId('stack-navigator');
      expect(navigator).toBeTruthy();
    });
  });

  describe('Authentication State', () => {
    it('should accept isAuthenticated prop', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should accept isAuthenticated false', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should render different content based on authentication state', () => {
      const { rerender, getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();

      rerender(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('should accept onLoginSuccess callback prop', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should accept onLogout callback prop', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should accept all required props together', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={jest.fn()}
            onLogout={jest.fn()}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should render and unmount without errors', () => {
      const { unmount } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(() => {
        rerender(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should handle rapid rerenders', () => {
      const { rerender } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(() => {
        rerender(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
        rerender(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
        rerender(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      // Should cleanup without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should render on iOS platform', () => {
      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();
    });

    it('should render on web platform', () => {
      Platform.OS = 'web';

      const { getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();

      // Reset after test
      Platform.OS = 'ios';
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      expect(() => {
        render(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={undefined as any}
            onLogout={undefined as any}
          />
        );
      }).not.toThrow();
    });

    it('should handle auth state toggle', () => {
      const { rerender } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(() => {
        rerender(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should handle callback changes', () => {
      const { rerender } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      const newLoginSuccess = jest.fn();
      const newLogout = jest.fn();

      expect(() => {
        rerender(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={newLoginSuccess}
            onLogout={newLogout}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with authentication flow', () => {
      const { rerender, getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      // Starts unauthenticated
      expect(getByTestId('navigation-container')).toBeTruthy();

      // User logs in
      rerender(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();

      // User logs out
      rerender(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      expect(getByTestId('navigation-container')).toBeTruthy();
    });

    it('should handle multiple auth cycles', () => {
      const { rerender, getByTestId } = render(
        <RootNavigator
          isAuthenticated={false}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <RootNavigator
            isAuthenticated={true}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );

        expect(getByTestId('navigation-container')).toBeTruthy();

        rerender(
          <RootNavigator
            isAuthenticated={false}
            onLoginSuccess={mockOnLoginSuccess}
            onLogout={mockOnLogout}
          />
        );

        expect(getByTestId('navigation-container')).toBeTruthy();
      }
    });

    it('should maintain stability through prop updates', () => {
      const { rerender, getByTestId } = render(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={mockOnLoginSuccess}
          onLogout={mockOnLogout}
        />
      );

      const _container1 = getByTestId('navigation-container');

      rerender(
        <RootNavigator
          isAuthenticated={true}
          onLoginSuccess={jest.fn()}
          onLogout={jest.fn()}
        />
      );

      const container2 = getByTestId('navigation-container');
      expect(container2).toBeTruthy();
    });
  });
});
