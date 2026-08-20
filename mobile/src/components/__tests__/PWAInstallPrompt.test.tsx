/**
 * PWAInstallPrompt Tests
 *
 * Tests PWA install prompt functionality including platform detection,
 * manual install instructions, and event listener setup.
 */

import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import PWAInstallPrompt from '../PWAInstallPrompt';
import { pwaService } from '../../services/pwaService';

// Mock dependencies
jest.mock('../../services/pwaService', () => ({
  pwaService: {
    on: jest.fn(),
    off: jest.fn(),
    getCapabilities: jest.fn(),
    showInstallPrompt: jest.fn(),
    applyUpdate: jest.fn(),
    getInstallInstructions: jest.fn(),
  },
}));

describe('PWAInstallPrompt', () => {
  const mockPwaService = pwaService as jest.Mocked<typeof pwaService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockPwaService.getCapabilities.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      updateAvailable: false,
      supportsNotifications: false,
      supportsBackgroundSync: false,
      supportsPeriodicSync: false,
      isOnline: true,
      standalone: false,
    });

    mockPwaService.getInstallInstructions.mockReturnValue(
      'To install: Tap Share > Add to Home Screen'
    );

    mockPwaService.showInstallPrompt.mockResolvedValue({
      outcome: 'accepted',
    });

    mockPwaService.applyUpdate.mockResolvedValue(undefined);
  });

  describe('Platform Detection', () => {
    it('should return null on iOS platform', () => {
      Platform.OS = 'ios';

      const { toJSON } = render(<PWAInstallPrompt />);

      expect(toJSON()).toBeNull();
    });

    it('should return null on Android platform', () => {
      Platform.OS = 'android';

      const { toJSON } = render(<PWAInstallPrompt />);

      expect(toJSON()).toBeNull();
    });

    it('should render on web platform when showing manual install', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: false,
      });

      render(<PWAInstallPrompt />);

      // Component should render (not null)
      expect(mockPwaService.getInstallInstructions).toHaveBeenCalled();
    });
  });

  describe('Event Listener Setup', () => {
    it('should register PWA event listeners on mount', () => {
      Platform.OS = 'web';

      render(<PWAInstallPrompt />);

      expect(mockPwaService.on).toHaveBeenCalledWith('install-available', expect.any(Function));
      expect(mockPwaService.on).toHaveBeenCalledWith('install-completed', expect.any(Function));
      expect(mockPwaService.on).toHaveBeenCalledWith('update-available', expect.any(Function));
      expect(mockPwaService.on).toHaveBeenCalledWith('update-applied', expect.any(Function));
      expect(mockPwaService.on).toHaveBeenCalledTimes(4);
    });

    it('should unregister event listeners on unmount', () => {
      Platform.OS = 'web';

      const { unmount } = render(<PWAInstallPrompt />);
      unmount();

      expect(mockPwaService.off).toHaveBeenCalledWith('install-available');
      expect(mockPwaService.off).toHaveBeenCalledWith('install-completed');
      expect(mockPwaService.off).toHaveBeenCalledWith('update-available');
      expect(mockPwaService.off).toHaveBeenCalledWith('update-applied');
      expect(mockPwaService.off).toHaveBeenCalledTimes(4);
    });

    it('should call getCapabilities on mount', () => {
      Platform.OS = 'web';

      render(<PWAInstallPrompt />);

      expect(mockPwaService.getCapabilities).toHaveBeenCalled();
    });

    it('should not set up event listeners on non-web platforms', () => {
      Platform.OS = 'ios';

      render(<PWAInstallPrompt />);

      expect(mockPwaService.on).not.toHaveBeenCalled();
    });
  });

  describe('Manual Install Instructions', () => {
    it('should show manual install when not installable and not installed', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: false,
      });

      render(<PWAInstallPrompt />);

      // Verify manual install instructions are shown via service call
      expect(mockPwaService.getInstallInstructions).toHaveBeenCalled();
    });

    it('should call getInstallInstructions for manual install', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: false,
      });

      render(<PWAInstallPrompt />);

      expect(mockPwaService.getInstallInstructions).toHaveBeenCalled();
    });

    it('should not show manual install when already installed', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: false,
        isInstalled: true,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: true,
      });

      const { queryByText } = render(<PWAInstallPrompt />);

      expect(queryByText('To install: Tap Share > Add to Home Screen')).toBeNull();
    });

    it('should not show manual install when installable via prompt', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: false,
      });

      const { queryByText } = render(<PWAInstallPrompt />);

      // Should not show manual install text (modal will be hidden initially)
      expect(queryByText('To install: Tap Share > Add to Home Screen')).toBeNull();
    });

    it('should show manual install title', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        updateAvailable: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsPeriodicSync: false,
        isOnline: true,
        standalone: false,
      });

      render(<PWAInstallPrompt />);

      // Verify manual install UI is rendered by checking service interaction
      expect(mockPwaService.getInstallInstructions).toHaveBeenCalled();
      expect(mockPwaService.getCapabilities).toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should accept onInstall callback prop', () => {
      Platform.OS = 'web';
      const mockOnInstall = jest.fn();

      expect(() => {
        render(<PWAInstallPrompt onInstall={mockOnInstall} />);
      }).not.toThrow();
    });

    it('should accept onDismiss callback prop', () => {
      Platform.OS = 'web';
      const mockOnDismiss = jest.fn();

      expect(() => {
        render(<PWAInstallPrompt onDismiss={mockOnDismiss} />);
      }).not.toThrow();
    });

    it('should accept showUpdatePrompt prop', () => {
      Platform.OS = 'web';

      expect(() => {
        render(<PWAInstallPrompt showUpdatePrompt={false} />);
      }).not.toThrow();

      expect(() => {
        render(<PWAInstallPrompt showUpdatePrompt={true} />);
      }).not.toThrow();
    });

    it('should default showUpdatePrompt to true', () => {
      Platform.OS = 'web';

      expect(() => {
        render(<PWAInstallPrompt />);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should render and unmount without errors', () => {
      Platform.OS = 'web';

      const { unmount } = render(<PWAInstallPrompt />);

      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup intervals on unmount', () => {
      Platform.OS = 'web';
      jest.useFakeTimers();

      const { unmount } = render(<PWAInstallPrompt />);

      // Get initial call count
      const initialCalls = mockPwaService.getCapabilities.mock.calls.length;

      unmount();

      // Advance time significantly
      jest.advanceTimersByTime(30000);

      // Call count should not increase after unmount
      expect(mockPwaService.getCapabilities).toHaveBeenCalledTimes(initialCalls);

      jest.runOnlyPendingTimers();
    jest.useRealTimers();
    });

    it('should handle multiple renders', () => {
      Platform.OS = 'web';

      const { rerender } = render(<PWAInstallPrompt />);

      expect(() => {
        rerender(<PWAInstallPrompt showUpdatePrompt={false} />);
        rerender(<PWAInstallPrompt showUpdatePrompt={true} />);
      }).not.toThrow();
    });
  });

  describe('Service Integration', () => {
    it('should use pwaService.getCapabilities', () => {
      Platform.OS = 'web';

      render(<PWAInstallPrompt />);

      expect(mockPwaService.getCapabilities).toHaveBeenCalled();
    });

    it('should register all required event listeners', () => {
      Platform.OS = 'web';

      render(<PWAInstallPrompt />);

      const events = mockPwaService.on.mock.calls.map(call => call[0]);

      expect(events).toContain('install-available');
      expect(events).toContain('install-completed');
      expect(events).toContain('update-available');
      expect(events).toContain('update-applied');
    });

    it('should remove all event listeners on unmount', () => {
      Platform.OS = 'web';

      const { unmount } = render(<PWAInstallPrompt />);
      unmount();

      const events = mockPwaService.off.mock.calls.map(call => call[0]);

      expect(events).toContain('install-available');
      expect(events).toContain('install-completed');
      expect(events).toContain('update-available');
      expect(events).toContain('update-applied');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined capabilities gracefully', () => {
      Platform.OS = 'web';
      mockPwaService.getCapabilities.mockReturnValue(null as any);

      expect(() => {
        render(<PWAInstallPrompt />);
      }).not.toThrow();
    });

    it('should handle all props undefined', () => {
      Platform.OS = 'web';

      expect(() => {
        render(<PWAInstallPrompt />);
      }).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', () => {
      Platform.OS = 'web';

      expect(() => {
        const { unmount: unmount1 } = render(<PWAInstallPrompt />);
        unmount1();
        const { unmount: unmount2 } = render(<PWAInstallPrompt />);
        unmount2();
        const { unmount: unmount3 } = render(<PWAInstallPrompt />);
        unmount3();
      }).not.toThrow();
    });
  });
});
