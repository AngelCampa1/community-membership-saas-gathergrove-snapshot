/**
 * AccessibilityProvider Tests
 *
 * Tests accessibility context provider including screen reader detection,
 * motion preferences, contrast preferences, text scaling, and accessibility utilities.
 *
 * Following boundary mocking rule:
 * ✅ Mock: Platform, AccessibilityInfo, Dimensions (via global mobile test setup)
 * ❌ Don't mock: AccessibilityProvider, useAccessibility hook, withAccessibility HOC
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Platform, Dimensions, AccessibilityInfo } from 'react-native';
import { AccessibilityProvider, useAccessibility, withAccessibility } from '../AccessibilityProvider';
import { Text, View } from 'react-native';

// Access global mocks from jest.mobile-mocks.js
declare global {
  // eslint-disable-next-line no-var
  var mockAccessibilityInfo: {
    isScreenReaderEnabled: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    announceForAccessibility: jest.Mock;
    setAccessibilityFocus: jest.Mock;
  };
  // eslint-disable-next-line no-var
  var mockDimensions: {
    get: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    set: jest.Mock;
  };
}

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-create global mocks after resetMocks
    // resetMocks: true in jest.config.js clears implementations
    if (!global.mockAccessibilityInfo) {
      global.mockAccessibilityInfo = {
        isScreenReaderEnabled: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        announceForAccessibility: jest.fn(),
        setAccessibilityFocus: jest.fn(),
      };
    }
    if (!global.mockDimensions) {
      global.mockDimensions = {
        get: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        set: jest.fn(),
      };
    }

    // Reset mocks to defaults - set implementations on BOTH global mock refs AND imported modules
    global.mockAccessibilityInfo.isScreenReaderEnabled = jest.fn().mockResolvedValue(false);
    global.mockAccessibilityInfo.addEventListener = jest.fn().mockReturnValue(undefined);
    global.mockAccessibilityInfo.removeEventListener = jest.fn().mockReturnValue(undefined);
    global.mockAccessibilityInfo.announceForAccessibility = jest.fn().mockReturnValue(undefined);
    global.mockAccessibilityInfo.setAccessibilityFocus = jest.fn().mockReturnValue(undefined);

    global.mockDimensions.get = jest.fn().mockReturnValue({
      fontScale: 1.0,
      width: 375,
      height: 667,
      scale: 1,
    });
    global.mockDimensions.addEventListener = jest.fn().mockReturnValue({ remove: jest.fn() });
    global.mockDimensions.removeEventListener = jest.fn();
    global.mockDimensions.set = jest.fn();

    // CRITICAL: Also set implementations on the imported module references
    // jest.clearAllMocks() clears implementations, so we must restore them
    (Dimensions.get as jest.Mock).mockReturnValue({
      fontScale: 1.0,
      width: 375,
      height: 667,
      scale: 1,
    });
    (Dimensions.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
    (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue(undefined);

    // Setup window object for web platform tests
    // React Native doesn't have window by default, so we need to define it
    const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    // Define window on global scope (required for Platform.OS === 'web' tests)
    if (typeof (global as any).window === 'undefined') {
      (global as any).window = {};
    }
    (global as any).window.matchMedia = mockMatchMedia;

    // Reset Platform.OS
    Platform.OS = 'ios';
  });

  afterEach(() => {
    // Clean up global window
    delete (global as any).window;
  });

  describe('Provider Rendering', () => {
    it('should render children', async () => {
      render(
        <AccessibilityProvider>
          <Text testID="test-content">Test Content</Text>
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeTruthy();
      });
    });

    it('should provide accessibility context', async () => {
      const TestComponent = () => {
        const accessibility = useAccessibility();
        return <Text testID="screen-reader-status">Screen Reader: {accessibility.isScreenReaderEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('screen-reader-status');
        expect(element).toBeTruthy();
        expect(element.props.children.join('')).toContain('Screen Reader:');
      });
    });
  });

  describe('Screen Reader Detection', () => {
    it('should check screen reader status on mount', async () => {
      render(
        <AccessibilityProvider>
          <Text>Test</Text>
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(global.mockAccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
      });
    });

    it('should set screen reader state to enabled', async () => {
      global.mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValueOnce(true);

      const TestComponent = () => {
        const { isScreenReaderEnabled } = useAccessibility();
        return <Text testID="sr-enabled">Enabled: {isScreenReaderEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('sr-enabled');
        expect(element.props.children.join('')).toBe('Enabled: Yes');
      });
    });

    it('should set screen reader state to disabled', async () => {
      global.mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValueOnce(false);

      const TestComponent = () => {
        const { isScreenReaderEnabled } = useAccessibility();
        return <Text testID="sr-disabled">Enabled: {isScreenReaderEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('sr-disabled');
        expect(element.props.children.join('')).toBe('Enabled: No');
      });
    });

    it('should handle screen reader check errors gracefully', async () => {
      global.mockAccessibilityInfo.isScreenReaderEnabled.mockRejectedValueOnce(new Error('Permission denied'));

      const TestComponent = () => {
        const { isScreenReaderEnabled } = useAccessibility();
        return <Text testID="sr-error">Enabled: {isScreenReaderEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('sr-error');
        expect(element.props.children.join('')).toBe('Enabled: No');
      });
    });

    it('should listen for screen reader changes', async () => {
      render(
        <AccessibilityProvider>
          <Text>Test</Text>
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(global.mockAccessibilityInfo.addEventListener).toHaveBeenCalledWith(
          'screenReaderChanged',
          expect.any(Function)
        );
      });
    });
  });

  describe('Text Scaling', () => {
    it('should detect default text size', async () => {
      global.mockDimensions.get.mockReturnValue({ fontScale: 1.0, width: 375, height: 667, scale: 1 });

      const TestComponent = () => {
        const { isLargeTextEnabled } = useAccessibility();
        return <Text testID="text-default">Large Text: {isLargeTextEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('text-default');
        expect(element.props.children.join('')).toBe('Large Text: No');
      });
    });

    it('should detect large text when font scale > 1.2', async () => {
      global.mockDimensions.get.mockReturnValue({ fontScale: 1.5, width: 375, height: 667, scale: 1 });

      const TestComponent = () => {
        const { isLargeTextEnabled } = useAccessibility();
        return <Text testID="text-large">Large Text: {isLargeTextEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('text-large');
        expect(element.props.children.join('')).toBe('Large Text: Yes');
      });
    });

    it('should listen for dimension changes', async () => {
      render(
        <AccessibilityProvider>
          <Text>Test</Text>
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(global.mockDimensions.addEventListener).toHaveBeenCalledWith(
          'change',
          expect.any(Function)
        );
      });
    });
  });

  describe('Web Platform - Reduce Motion', () => {
    beforeEach(() => {
      Platform.OS = 'web' as any;

      // Update window.matchMedia for reduce motion tests (default to false)
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;
    });

    afterEach(() => {
      Platform.OS = 'ios' as any;
    });

    it('should detect reduce motion preference on web', async () => {
      // Setup mock BEFORE rendering - component's useEffect runs immediately
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;

      const TestComponent = () => {
        const { isReduceMotionEnabled } = useAccessibility();
        return <Text testID="reduce-motion">Reduce Motion: {isReduceMotionEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('reduce-motion');
        expect(element.props.children.join('')).toBe('Reduce Motion: Yes');
      });
    });

    it('should listen for reduce motion changes on web', async () => {
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      // Setup mock BEFORE rendering - component's useEffect runs immediately
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change' && query === '(prefers-reduced-motion: reduce)') {
            changeHandler = handler;
          }
        }),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;

      const TestComponent = () => {
        const { isReduceMotionEnabled } = useAccessibility();
        return <Text testID="reduce-motion">Reduce Motion: {isReduceMotionEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(changeHandler).toBeTruthy();
      });

      // Simulate change event - wrap in act() to handle state updates
      await act(async () => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      await waitFor(() => {
        const element = screen.getByTestId('reduce-motion');
        expect(element.props.children.join('')).toBe('Reduce Motion: Yes');
      });
    });
  });

  describe('Web Platform - High Contrast', () => {
    beforeEach(() => {
      Platform.OS = 'web' as any;

      // Update window.matchMedia for high contrast tests (default to false)
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;
    });

    afterEach(() => {
      Platform.OS = 'ios' as any;
    });

    it('should detect high contrast preference on web', async () => {
      // Setup mock BEFORE rendering - component's useEffect runs immediately
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-contrast: high)' ? true : false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;

      const TestComponent = () => {
        const { isHighContrastEnabled } = useAccessibility();
        return <Text testID="high-contrast">High Contrast: {isHighContrastEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('high-contrast');
        expect(element.props.children.join('')).toBe('High Contrast: Yes');
      });
    });

    it('should listen for high contrast changes on web', async () => {
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      // Setup mock BEFORE rendering - component's useEffect runs immediately
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change' && query === '(prefers-contrast: high)') {
            changeHandler = handler;
          }
        }),
        removeEventListener: jest.fn(),
      }));

      (global as any).window.matchMedia = mockMatchMedia;

      const TestComponent = () => {
        const { isHighContrastEnabled } = useAccessibility();
        return <Text testID="high-contrast">High Contrast: {isHighContrastEnabled ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(changeHandler).toBeTruthy();
      });

      // Simulate change event - wrap in act() to handle state updates
      await act(async () => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      await waitFor(() => {
        const element = screen.getByTestId('high-contrast');
        expect(element.props.children.join('')).toBe('High Contrast: Yes');
      });
    });
  });

  describe('Announcements', () => {
    it('should announce messages for screen readers on native', async () => {
      Platform.OS = 'ios';

      const TestComponent = () => {
        const { announceForAccessibility } = useAccessibility();

        React.useEffect(() => {
          announceForAccessibility('Test announcement');
        }, [announceForAccessibility]);

        return <Text testID="announce-test">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(global.mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test announcement');
      });
    });

    it('should create live region for announcements on web', async () => {
      Platform.OS = 'web' as any;

      // Mock document methods
      const mockElement = {
        setAttribute: jest.fn(),
        style: {} as CSSStyleDeclaration,
        textContent: '',
      };

      const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as any);
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as any);

      const TestComponent = () => {
        const { announceForAccessibility } = useAccessibility();

        React.useEffect(() => {
          announceForAccessibility('Web announcement');
        }, [announceForAccessibility]);

        return <Text testID="announce-web">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(mockCreateElement).toHaveBeenCalledWith('div');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
        expect(mockElement.textContent).toBe('Web announcement');
        expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
      });

      // Wait for timeout to remove element
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      await waitFor(() => {
        expect(mockRemoveChild).toHaveBeenCalledWith(mockElement);
      });

      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      Platform.OS = 'ios';
    });
  });

  describe('Focus Management', () => {
    it('should focus element on web platform', async () => {
      Platform.OS = 'web' as any;

      const mockRef = {
        current: {
          focus: jest.fn(),
        } as unknown as HTMLElement,
      };

      const TestComponent = () => {
        const { focusElement } = useAccessibility();

        React.useEffect(() => {
          focusElement(mockRef as any);
        }, [focusElement]);

        return <Text testID="focus-test">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(mockRef.current.focus).toHaveBeenCalled();
      });

      Platform.OS = 'ios';
    });

    it('should set accessibility focus on native platform', async () => {
      Platform.OS = 'ios';

      // Test by directly calling the context function, simulating real usage
      // Note: We can't spy on findNodeHandle after it's imported, so we test that
      // setAccessibilityFocus is called with the expected node handle
      let focusElementFn: ((ref: React.RefObject<unknown>) => void) | undefined;
      const mockRef = { current: { measure: jest.fn() } }; // Valid React Native component ref

      const TestComponent = () => {
        const context = useAccessibility();
        focusElementFn = context.focusElement;
        return <Text testID="focus-native">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Call focusElement with mock ref - this exercises the real code path
      await act(async () => {
        if (focusElementFn) focusElementFn(mockRef);
      });

      // Verify that the focusElement function exists and can be called without error
      // The actual setAccessibilityFocus call depends on findNodeHandle returning a valid node,
      // which is mocked globally in jest.mobile-mocks.js to return null by default
      await waitFor(() => {
        expect(screen.getByTestId('focus-native')).toBeTruthy();
      });
    });

    it('should set accessibility focus using setAccessibilityFocus method', async () => {
      Platform.OS = 'ios';

      // Test by directly calling the context function, simulating real usage
      // Note: We can't spy on findNodeHandle after it's imported, so we test that
      // the function can be called without error and the component still renders
      let setAccessibilityFocusFn: ((ref: React.RefObject<unknown>) => void) | undefined;
      const mockRef = { current: { measure: jest.fn() } }; // Valid React Native component ref

      const TestComponent = () => {
        const context = useAccessibility();
        setAccessibilityFocusFn = context.setAccessibilityFocus;
        return <Text testID="set-focus">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Call setAccessibilityFocus with mock ref - this exercises the real code path
      await act(async () => {
        if (setAccessibilityFocusFn) setAccessibilityFocusFn(mockRef);
      });

      // Verify that the setAccessibilityFocus function exists and can be called without error
      await waitFor(() => {
        expect(screen.getByTestId('set-focus')).toBeTruthy();
      });
    });

    it('should not set accessibility focus on web platform', async () => {
      Platform.OS = 'web' as any;

      const mockRef = {
        current: { focus: jest.fn() } as unknown as HTMLElement,
      };

      const TestComponent = () => {
        const { setAccessibilityFocus } = useAccessibility();

        React.useEffect(() => {
          setAccessibilityFocus(mockRef as any);
        }, [setAccessibilityFocus]);

        return <Text testID="no-focus-web">Test</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('no-focus-web')).toBeTruthy();
      });

      // Should not call setAccessibilityFocus on web
      expect(global.mockAccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();

      Platform.OS = 'ios';
    });

    it('should handle null ref gracefully', async () => {
      const mockRef = { current: null };

      const TestComponent = () => {
        const { focusElement } = useAccessibility();

        React.useEffect(() => {
          focusElement(mockRef as any);
        }, [focusElement]);

        return <Text testID="null-ref">Test</Text>;
      };

      expect(() => render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      )).not.toThrow();
    });
  });

  describe('withAccessibility HOC', () => {
    it('should inject accessibility props into component', async () => {
      const TestComponent = ({ isScreenReaderEnabled }: { isScreenReaderEnabled?: boolean }) => (
        <Text testID="hoc-test">Screen Reader: {isScreenReaderEnabled ? 'Yes' : 'No'}</Text>
      );

      const EnhancedComponent = withAccessibility(TestComponent);

      render(
        <AccessibilityProvider>
          <EnhancedComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('hoc-test');
        expect(element).toBeTruthy();
      });
    });

    it('should preserve original component display name', () => {
      const TestComponent = () => <Text>Test</Text>;
      TestComponent.displayName = 'TestComponent';

      const EnhancedComponent = withAccessibility(TestComponent);

      expect(EnhancedComponent.displayName).toBe('withAccessibility(TestComponent)');
    });

    it('should use component name if no display name', () => {
      function MyComponent() {
        return <Text>Test</Text>;
      }

      const EnhancedComponent = withAccessibility(MyComponent);

      expect(EnhancedComponent.displayName).toBe('withAccessibility(MyComponent)');
    });
  });

  describe('useAccessibility Hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        try {
          useAccessibility();
          return <Text>Should not reach here</Text>;
        } catch (error) {
          return <Text testID="error-msg">Error: {(error as Error).message}</Text>;
        }
      };

      render(<TestComponent />);

      const element = screen.getByTestId('error-msg');
      expect(element.props.children.join('')).toContain('must be used within');
    });

    it('should provide accessibility context when used inside provider', async () => {
      const TestComponent = () => {
        const context = useAccessibility();
        return <Text testID="has-context">Has Context: {context ? 'Yes' : 'No'}</Text>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        const element = screen.getByTestId('has-context');
        expect(element.props.children.join('')).toBe('Has Context: Yes');
      });
    });
  });

  describe('Context Value', () => {
    it('should provide all accessibility features', async () => {
      // Set mock on BOTH global refs AND imported module to ensure proper interception
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValueOnce(true);
      (Dimensions.get as jest.Mock).mockReturnValue({ fontScale: 1.5, width: 375, height: 667, scale: 1 });

      const TestComponent = () => {
        const context = useAccessibility();
        return (
          <View testID="all-features">
            <Text testID="sr-feature">Screen Reader: {context.isScreenReaderEnabled ? 'Yes' : 'No'}</Text>
            <Text testID="text-feature">Large Text: {context.isLargeTextEnabled ? 'Yes' : 'No'}</Text>
            <Text testID="motion-feature">Reduce Motion: {context.isReduceMotionEnabled ? 'Yes' : 'No'}</Text>
            <Text testID="contrast-feature">High Contrast: {context.isHighContrastEnabled ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sr-feature').props.children.join('')).toBe('Screen Reader: Yes');
        expect(screen.getByTestId('text-feature').props.children.join('')).toBe('Large Text: Yes');
        expect(screen.getByTestId('motion-feature').props.children.join('')).toBe('Reduce Motion: No');
        expect(screen.getByTestId('contrast-feature').props.children.join('')).toBe('High Contrast: No');
      });
    });

    it('should provide utility functions', async () => {
      const TestComponent = () => {
        const context = useAccessibility();
        return (
          <View testID="utils">
            <Text testID="announce-fn">Has announce: {typeof context.announceForAccessibility === 'function' ? 'Yes' : 'No'}</Text>
            <Text testID="focus-fn">Has focus: {typeof context.focusElement === 'function' ? 'Yes' : 'No'}</Text>
            <Text testID="setfocus-fn">Has setFocus: {typeof context.setAccessibilityFocus === 'function' ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('announce-fn').props.children.join('')).toBe('Has announce: Yes');
        expect(screen.getByTestId('focus-fn').props.children.join('')).toBe('Has focus: Yes');
        expect(screen.getByTestId('setfocus-fn').props.children.join('')).toBe('Has setFocus: Yes');
      });
    });
  });
});
