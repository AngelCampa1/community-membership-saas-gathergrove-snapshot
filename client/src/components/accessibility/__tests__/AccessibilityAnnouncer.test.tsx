/**
 * Tests for AccessibilityAnnouncer.tsx - Route and state change announcements
 * Following boundary mocking pattern: mock only external dependencies
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AccessibilityAnnouncer from '../AccessibilityAnnouncer';
import { useAccessibility } from '../AccessibilityProvider';

// Mock AccessibilityProvider
jest.mock('../AccessibilityProvider', () => ({
  useAccessibility: jest.fn(),
}));

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;

describe('AccessibilityAnnouncer', () => {
  let mockAnnounce: jest.Mock;
  let originalLocation: Location;
  let mockAccessibilityContext: ReturnType<typeof useAccessibility>;

  beforeEach(() => {
    mockAnnounce = jest.fn();
    mockAccessibilityContext = {
      announce: mockAnnounce,
      isHighContrast: false,
      isFocusIndicatorVisible: false,
      setHighContrast: jest.fn(),
      setFocusIndicatorVisible: jest.fn(),
      isReducedMotion: false,
      fontSize: 16,
      increaseFontSize: jest.fn(),
      decreaseFontSize: jest.fn(),
      resetFontSize: jest.fn(),
    };
    mockUseAccessibility.mockReturnValue(mockAccessibilityContext);

    // Store original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, pathname: '/test' } as Location;

    // Clear body for clean slate
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('Route change announcements', () => {
    it('renders children without error', () => {
      const { getByText } = render(
        <AccessibilityAnnouncer>
          <div>Test Content</div>
        </AccessibilityAnnouncer>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('does not announce on initial mount', () => {
      render(
        <AccessibilityAnnouncer>
          <div>Test</div>
        </AccessibilityAnnouncer>
      );

      expect(mockAnnounce).not.toHaveBeenCalled();
    });

    it('announces known route names', async () => {
      const TestWrapper = ({ renderKey }: { renderKey: number }) => (
        <AccessibilityAnnouncer>
          <div>Test {renderKey}</div>
        </AccessibilityAnnouncer>
      );

      const { rerender } = render(<TestWrapper renderKey={1} />);

      // Change location to home page and update mock with new function to trigger effect
      window.location.pathname = '/';
      mockAccessibilityContext.announce = jest.fn();
      mockUseAccessibility.mockReturnValue(mockAccessibilityContext);
      rerender(<TestWrapper renderKey={2} />);

      await waitFor(() => {
        expect(mockAccessibilityContext.announce).toHaveBeenCalledWith('Navigated to Home page');
      });
    });

    it('announces admin dashboard route', async () => {
      window.location.pathname = '/test';

      const TestWrapper = ({ renderKey }: { renderKey: number }) => (
        <AccessibilityAnnouncer>
          <div>Test {renderKey}</div>
        </AccessibilityAnnouncer>
      );

      const { rerender } = render(<TestWrapper renderKey={1} />);

      window.location.pathname = '/admin';
      mockAccessibilityContext.announce = jest.fn();
      mockUseAccessibility.mockReturnValue(mockAccessibilityContext);
      rerender(<TestWrapper renderKey={2} />);

      await waitFor(() => {
        expect(mockAccessibilityContext.announce).toHaveBeenCalledWith('Navigated to Admin dashboard');
      });
    });

    it('announces member management route', async () => {
      window.location.pathname = '/test';

      const TestWrapper = ({ renderKey }: { renderKey: number }) => (
        <AccessibilityAnnouncer>
          <div>Test {renderKey}</div>
        </AccessibilityAnnouncer>
      );

      const { rerender } = render(<TestWrapper renderKey={1} />);

      window.location.pathname = '/admin/members';
      mockAccessibilityContext.announce = jest.fn();
      mockUseAccessibility.mockReturnValue(mockAccessibilityContext);
      rerender(<TestWrapper renderKey={2} />);

      await waitFor(() => {
        expect(mockAccessibilityContext.announce).toHaveBeenCalledWith('Navigated to Members management');
      });
    });

    it('announces unknown routes with page name', async () => {
      window.location.pathname = '/test';

      const TestWrapper = ({ renderKey }: { renderKey: number }) => (
        <AccessibilityAnnouncer>
          <div>Test {renderKey}</div>
        </AccessibilityAnnouncer>
      );

      const { rerender } = render(<TestWrapper renderKey={1} />);

      window.location.pathname = '/unknown/custom/route';
      mockAccessibilityContext.announce = jest.fn();
      mockUseAccessibility.mockReturnValue(mockAccessibilityContext);
      rerender(<TestWrapper renderKey={2} />);

      await waitFor(() => {
        expect(mockAccessibilityContext.announce).toHaveBeenCalledWith('Navigated to Page: route');
      });
    });
  });

  describe('Loading state announcements', () => {
    it('announces when aria-busy element is added', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      // Add an element with aria-busy="true"
      const container = document.getElementById('container');
      const loadingDiv = document.createElement('div');
      loadingDiv.setAttribute('aria-busy', 'true');
      container?.appendChild(loadingDiv);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Content is loading');
      });
    });

    it('does not announce if aria-busy is false', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const loadingDiv = document.createElement('div');
      loadingDiv.setAttribute('aria-busy', 'false');
      container?.appendChild(loadingDiv);

      // Wait a bit to ensure no announcement
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('Alert announcements', () => {
    it('announces alert messages', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const alertDiv = document.createElement('div');
      alertDiv.setAttribute('role', 'alert');
      alertDiv.textContent = 'This is an error message';
      container?.appendChild(alertDiv);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('This is an error message');
      });
    });

    it('does not announce empty alerts', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const alertDiv = document.createElement('div');
      alertDiv.setAttribute('role', 'alert');
      container?.appendChild(alertDiv);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('Success message announcements', () => {
    it('announces success messages with success class', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const successDiv = document.createElement('div');
      successDiv.classList.add('success');
      successDiv.textContent = 'Operation completed';
      container?.appendChild(successDiv);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Success: Operation completed');
      });
    });

    it('announces success messages with data-type attribute', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const successDiv = document.createElement('div');
      successDiv.setAttribute('data-type', 'success');
      successDiv.textContent = 'Saved successfully';
      container?.appendChild(successDiv);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Success: Saved successfully');
      });
    });

    it('does not announce empty success messages', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="container"></div>
        </AccessibilityAnnouncer>
      );

      const container = document.getElementById('container');
      const successDiv = document.createElement('div');
      successDiv.classList.add('success');
      container?.appendChild(successDiv);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('MutationObserver cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { unmount } = render(
        <AccessibilityAnnouncer>
          <div>Test</div>
        </AccessibilityAnnouncer>
      );

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('observes document.body for changes', async () => {
      render(
        <AccessibilityAnnouncer>
          <div id="test"></div>
        </AccessibilityAnnouncer>
      );

      // Add element directly to body
      const alertDiv = document.createElement('div');
      alertDiv.setAttribute('role', 'alert');
      alertDiv.textContent = 'Body alert';
      document.body.appendChild(alertDiv);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Body alert');
      });

      // Cleanup
      document.body.removeChild(alertDiv);
    });
  });

  describe('Route name mapping', () => {
    const routeTests = [
      { path: '/login', expected: 'Login page' },
      { path: '/register', expected: 'Registration page' },
      { path: '/forgot-password', expected: 'Password reset' },
      { path: '/app', expected: 'Member dashboard' },
      { path: '/app/profile', expected: 'Member profile' },
      { path: '/app/events', expected: 'Member events' },
      { path: '/app/directory', expected: 'Member directory' },
      { path: '/admin/events', expected: 'Events management' },
      { path: '/admin/communications', expected: 'Communications' },
      { path: '/admin/settings', expected: 'Settings' },
      { path: '/resources', expected: 'Resources page' },
      { path: '/support', expected: 'Support page' },
      { path: '/privacy-policy', expected: 'Privacy policy' },
      { path: '/terms-of-service', expected: 'Terms of service' },
    ];

    routeTests.forEach(({ path, expected }) => {
      it(`announces "${expected}" for ${path}`, async () => {
        // Set initial path
        window.location.pathname = '/initial';

        // Create wrapper component to force rerender
        const TestWrapper = ({ renderKey }: { renderKey: number }) => (
          <AccessibilityAnnouncer>
            <div>Test {renderKey}</div>
          </AccessibilityAnnouncer>
        );

        const { rerender } = render(<TestWrapper renderKey={1} />);

        // Change path, update mock with new function, and force rerender
        window.location.pathname = path;
        mockAccessibilityContext.announce = jest.fn();
        mockUseAccessibility.mockReturnValue(mockAccessibilityContext);
        rerender(<TestWrapper renderKey={2} />);

        await waitFor(() => {
          expect(mockAccessibilityContext.announce).toHaveBeenCalledWith(`Navigated to ${expected}`);
        });
      });
    });
  });
});
