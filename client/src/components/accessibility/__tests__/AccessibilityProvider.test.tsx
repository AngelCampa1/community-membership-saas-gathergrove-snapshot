import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import AccessibilityProvider, { useAccessibility } from '../AccessibilityProvider';

describe('AccessibilityProvider', () => {
  let mockMatchMedia: jest.Mock;
  let mockAddEventListener: jest.SpyInstance;
  let mockRemoveEventListener: jest.SpyInstance;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock matchMedia
    mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    // Mock document methods
    mockAddEventListener = jest.spyOn(document, 'addEventListener');
    mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

    // Mock document.documentElement methods
    jest.spyOn(document.documentElement.classList, 'toggle').mockImplementation();
    jest.spyOn(document.documentElement, 'setAttribute').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Provider Rendering', () => {
    it('should render children', () => {
      render(
        <AccessibilityProvider>
          <div>Test Child</div>
        </AccessibilityProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should render screen reader announcements region', () => {
      const { container } = render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      const srRegion = container.querySelector('[aria-live="polite"]');
      expect(srRegion).toBeInTheDocument();
      expect(srRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Media Query Detection', () => {
    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const TestComponent = () => {
        const { reducedMotion } = useAccessibility();
        return <div>Reduced Motion: {String(reducedMotion)}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Reduced Motion: true')).toBeInTheDocument();
    });

    it('should detect high contrast preference', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const TestComponent = () => {
        const { highContrast } = useAccessibility();
        return <div>High Contrast: {String(highContrast)}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('High Contrast: true')).toBeInTheDocument();
    });

    it('should default to false when no preferences detected', () => {
      const TestComponent = () => {
        const { reducedMotion, highContrast } = useAccessibility();
        return (
          <div>
            <div>Reduced: {String(reducedMotion)}</div>
            <div>Contrast: {String(highContrast)}</div>
          </div>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Reduced: false')).toBeInTheDocument();
      expect(screen.getByText('Contrast: false')).toBeInTheDocument();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should load saved font size from localStorage', () => {
      mockLocalStorage['accessibility-font-size'] = 'large';

      const TestComponent = () => {
        const { fontSize } = useAccessibility();
        return <div>Font Size: {fontSize}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Font Size: large')).toBeInTheDocument();
    });

    it('should default to medium font size when nothing saved', () => {
      const TestComponent = () => {
        const { fontSize } = useAccessibility();
        return <div>Font Size: {fontSize}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Font Size: medium')).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage blocked');
      });

      const TestComponent = () => {
        const { fontSize } = useAccessibility();
        return <div>Font Size: {fontSize}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Font Size: medium')).toBeInTheDocument();
    });
  });

  describe('Document CSS Classes', () => {
    it('should apply reduced motion class when enabled', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'reduce-motion',
        true
      );
    });

    it('should apply high contrast class when enabled', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'high-contrast',
        true
      );
    });

    it('should set font size data attribute', () => {
      render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-font-size',
        'medium'
      );
    });
  });

  describe('Focus Management', () => {
    it('should set up focus event listeners', () => {
      render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('focusin', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('focusout', expect.any(Function));
    });

    it('should clean up focus event listeners on unmount', () => {
      const { unmount } = render(
        <AccessibilityProvider>
          <div>Test</div>
        </AccessibilityProvider>
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('focusin', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('focusout', expect.any(Function));
    });

    it('should update focusVisible state on focus events', () => {
      const TestComponent = () => {
        const { focusVisible } = useAccessibility();
        return <div>Focus Visible: {String(focusVisible)}</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Initially false
      expect(screen.getByText('Focus Visible: false')).toBeInTheDocument();

      // Simulate focus in
      act(() => {
        const focusInHandler = mockAddEventListener.mock.calls.find(
          (call) => call[0] === 'focusin'
        )?.[1];
        if (focusInHandler) focusInHandler();
      });

      expect(screen.getByText('Focus Visible: true')).toBeInTheDocument();
    });
  });

  describe('Announcements', () => {
    it('should add announcements', async () => {
      const TestComponent = () => {
        const { announcements, announce } = useAccessibility();
        return (
          <div>
            <button onClick={() => announce('Test announcement')}>Announce</button>
            <div>Count: {announcements.length}</div>
          </div>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      act(() => {
        screen.getByRole('button', { name: /announce/i }).click();
      });

      expect(screen.getByText('Count: 1')).toBeInTheDocument();
      expect(screen.getByText('Test announcement')).toBeInTheDocument();
    });

    it('should remove announcements after 1 second', async () => {
      jest.useFakeTimers();

      const TestComponent = () => {
        const { announcements, announce } = useAccessibility();
        return (
          <div>
            <button onClick={() => announce('Temporary message')}>Announce</button>
            <div>Count: {announcements.length}</div>
          </div>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      act(() => {
        screen.getByRole('button', { name: /announce/i }).click();
      });

      expect(screen.getByText('Count: 1')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Count: 0')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle multiple announcements', () => {
      const TestComponent = () => {
        const { announcements, announce } = useAccessibility();
        return (
          <div>
            <button onClick={() => announce('First')}>First</button>
            <button onClick={() => announce('Second')}>Second</button>
            <div>Count: {announcements.length}</div>
          </div>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      act(() => {
        screen.getByRole('button', { name: /first/i }).click();
      });

      expect(screen.getByText('Count: 1')).toBeInTheDocument();

      act(() => {
        screen.getByRole('button', { name: /second/i }).click();
      });

      expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });

    it('should clean up announcement timeouts on unmount', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const TestComponent = () => {
        const { announce } = useAccessibility();
        return <button onClick={() => announce('Test')}>Announce</button>;
      };

      const { unmount } = render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      act(() => {
        screen.getByRole('button').click();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      jest.useRealTimers();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('useAccessibility Hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useAccessibility();
        return <div>Test</div>;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAccessibility must be used within AccessibilityProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide all accessibility features', () => {
      const TestComponent = () => {
        const accessibility = useAccessibility();
        return (
          <div>
            <div>Has reducedMotion: {String(typeof accessibility.reducedMotion === 'boolean')}</div>
            <div>Has highContrast: {String(typeof accessibility.highContrast === 'boolean')}</div>
            <div>Has fontSize: {String(typeof accessibility.fontSize === 'string')}</div>
            <div>Has focusVisible: {String(typeof accessibility.focusVisible === 'boolean')}</div>
            <div>Has announcements: {String(Array.isArray(accessibility.announcements))}</div>
            <div>Has announce: {String(typeof accessibility.announce === 'function')}</div>
          </div>
        );
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Has reducedMotion: true')).toBeInTheDocument();
      expect(screen.getByText('Has highContrast: true')).toBeInTheDocument();
      expect(screen.getByText('Has fontSize: true')).toBeInTheDocument();
      expect(screen.getByText('Has focusVisible: true')).toBeInTheDocument();
      expect(screen.getByText('Has announcements: true')).toBeInTheDocument();
      expect(screen.getByText('Has announce: true')).toBeInTheDocument();
    });
  });

  describe('SSR Safety', () => {
    it.skip('should handle missing window object gracefully', () => {
      // Skipped: Cannot truly delete window in jsdom environment
      // The component checks for typeof window === 'undefined' which works in real SSR
    });
  });

  describe('Multiple Consumers', () => {
    it('should provide same context to multiple consumers', () => {
      const Consumer1 = () => {
        const { fontSize } = useAccessibility();
        return <div>Consumer1 Font: {fontSize}</div>;
      };

      const Consumer2 = () => {
        const { reducedMotion } = useAccessibility();
        return <div>Consumer2 Motion: {String(reducedMotion)}</div>;
      };

      render(
        <AccessibilityProvider>
          <Consumer1 />
          <Consumer2 />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Consumer1 Font: medium')).toBeInTheDocument();
      expect(screen.getByText('Consumer2 Motion: false')).toBeInTheDocument();
    });
  });
});
