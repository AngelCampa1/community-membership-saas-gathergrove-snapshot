/**
 * useExitIntent Tests - Full Coverage
 */

import { renderHook, act } from '@testing-library/react';
import { useExitIntent } from '../useExitIntent';
import { SESSION_STORAGE_KEYS } from '@/config/engagement-timing';

describe('useExitIntent', () => {
  let sessionStorageMock: Record<string, string>;

  const mockWindowScroll = (scrollY: number, scrollHeight: number = 2000, innerHeight: number = 800) => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: scrollY,
    });
    Object.defineProperty(document.body, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: scrollHeight,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: innerHeight,
    });
  };

  const mockUserAgent = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: userAgent,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock sessionStorage
    sessionStorageMock = {};
    const getItemMock = jest.fn((key: string) => sessionStorageMock[key] || null);
    const setItemMock = jest.fn((key: string, value: string) => {
      sessionStorageMock[key] = value;
    });
    const removeItemMock = jest.fn((key: string) => {
      delete sessionStorageMock[key];
    });

    Object.defineProperty(window, 'sessionStorage', {
      writable: true,
      value: {
        getItem: getItemMock,
        setItem: setItemMock,
        removeItem: removeItemMock,
        clear: jest.fn(() => { sessionStorageMock = {}; }),
        key: jest.fn(),
        length: 0,
      },
    });

    // Default to desktop
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    mockWindowScroll(0, 2000, 800);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      // Arrange & Act
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent }));

      // Assert
      expect(result.current.hasTriggered).toBe(false);
      expect(result.current.timeOnPage).toBe(0);
    });

    it('should accept custom sensitivity parameter', () => {
      // Arrange & Act
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, sensitivity: 100 }));

      // Assert - no error, hook initialized
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should accept custom delay parameter', () => {
      // Arrange & Act
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 10000 }));

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should respect enabled=false', () => {
      // Arrange & Act
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, enabled: false }));

      // Assert - should not set up any listeners
      expect(onExitIntent).not.toHaveBeenCalled();
    });
  });

  describe('Desktop Exit Intent - Mouse Leave', () => {
    it('should trigger on mouse leave after delay', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Simulate mouse leaving viewport upward
      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalledTimes(1);
    });

    it('should not trigger before delay', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 5000 }));

      // Act - simulate mouse leave before delay
      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should respect sensitivity threshold', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000, sensitivity: 50 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Mouse leaving but not within sensitivity threshold
      const mouseEvent = new MouseEvent('mouseleave', { clientY: 60 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should trigger only once', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // First trigger
      const mouseEvent1 = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent1);
      });

      expect(result.current.hasTriggered).toBe(true);

      // Try to trigger again
      const mouseEvent2 = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent2);
      });

      // Assert - should only trigger once
      expect(onExitIntent).toHaveBeenCalledTimes(1);
    });

    it('should not trigger if shown in session storage', () => {
      // Arrange
      sessionStorageMock[SESSION_STORAGE_KEYS.exitIntentShown] = 'true';
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should mark as shown in session storage after trigger', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(sessionStorageMock[SESSION_STORAGE_KEYS.exitIntentShown]).toBe('true');
    });
  });

  describe('Desktop Exit Intent - Rapid Scroll', () => {
    it('should trigger on rapid scroll to top', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Simulate rapid scroll: start high, then jump to low
      mockWindowScroll(500);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Rapid jump to near top
      mockWindowScroll(50);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalled();
    });

    it('should not trigger rapid scroll before delay', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 5000 }));

      // Act - rapid scroll before delay
      mockWindowScroll(500);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      mockWindowScroll(50);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should track scroll position correctly', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Multiple scroll events
      mockWindowScroll(100);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      mockWindowScroll(200);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      mockWindowScroll(300);
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Assert - no trigger because not scrolling to top rapidly
      expect(onExitIntent).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Exit Intent', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    });

    it('should detect mobile device', () => {
      // Arrange & Act
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent }));

      // Assert - hook should initialize for mobile
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should trigger on mobile after delay and scroll threshold', () => {
      // Arrange
      const onExitIntent = jest.fn();
      mockWindowScroll(900, 2000, 800); // Scrolled 75% (900 / (2000-800))

      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - advance past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalled();
    });

    it('should not trigger on mobile without sufficient scroll', () => {
      // Arrange
      const onExitIntent = jest.fn();
      mockWindowScroll(100, 2000, 800); // Scrolled only ~8%

      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - advance past delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should check mobile exit intent periodically', () => {
      // Arrange
      const onExitIntent = jest.fn();
      mockWindowScroll(100, 2000, 800); // Not scrolled enough initially

      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act - advance to first check (delay time)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(onExitIntent).not.toHaveBeenCalled();

      // Scroll more
      mockWindowScroll(900, 2000, 800); // Now scrolled 75%

      // Advance to next periodic check (default 10s interval)
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalled();
    });

    it('should clean up mobile timers on unmount', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { unmount } = renderHook(() => useExitIntent({ onExitIntent }));

      // Act
      unmount();

      // Advance time to verify no callbacks execute
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });
  });

  describe('Time Tracking', () => {
    it('should update time on page periodically', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent }));

      // Act - advance time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Assert - time should be updated (approximately 3000ms)
      expect(result.current.timeOnPage).toBeGreaterThan(2500);
      expect(result.current.timeOnPage).toBeLessThan(3500);
    });

    it('should track time when triggered', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, delay: 2000 }));

      // Act - wait past delay
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(result.current.hasTriggered).toBe(true);
      expect(result.current.timeOnPage).toBeGreaterThan(2000);
    });

    it('should not update time when disabled', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, enabled: false }));

      // Act
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Assert
      expect(result.current.timeOnPage).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset triggered state', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Trigger exit intent
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      expect(result.current.hasTriggered).toBe(true);

      // Act - reset
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.hasTriggered).toBe(false);
      expect(result.current.timeOnPage).toBe(0);
    });

    it('should clear session storage on reset', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Trigger
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      expect(sessionStorageMock[SESSION_STORAGE_KEYS.exitIntentShown]).toBe('true');

      // Act - reset
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(sessionStorageMock[SESSION_STORAGE_KEYS.exitIntentShown]).toBeUndefined();
    });

    it('should allow triggering again after reset', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { result } = renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // First trigger
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent1 = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent1);
      });

      expect(onExitIntent).toHaveBeenCalledTimes(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Advance time again
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Try to trigger again
      const mouseEvent2 = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent2);
      });

      // Assert - should trigger again
      expect(onExitIntent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove desktop event listeners on unmount', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const windowRemoveListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useExitIntent({ onExitIntent }));

      // Act
      unmount();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(windowRemoveListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

      removeEventListenerSpy.mockRestore();
      windowRemoveListenerSpy.mockRestore();
    });

    it('should not trigger after unmount', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { unmount } = renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      unmount();

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero scrollHeight gracefully', () => {
      // Arrange
      mockUserAgent('Mozilla/5.0 (iPhone)');
      mockWindowScroll(0, 0, 800);
      const onExitIntent = jest.fn();

      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Assert - should not crash
      expect(onExitIntent).not.toHaveBeenCalled();
    });

    it('should handle negative clientY in mouse event', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 1000 }));

      // Act
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: -10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalled();
    });

    it('should handle very short delay (0ms)', () => {
      // Arrange
      const onExitIntent = jest.fn();
      renderHook(() => useExitIntent({ onExitIntent, delay: 0 }));

      // Act - immediate trigger
      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert
      expect(onExitIntent).toHaveBeenCalled();
    });

    it('should handle disabled state change during lifecycle', () => {
      // Arrange
      const onExitIntent = jest.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useExitIntent({ onExitIntent, enabled }),
        { initialProps: { enabled: true } }
      );

      // Act - disable after initialization
      rerender({ enabled: false });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const mouseEvent = new MouseEvent('mouseleave', { clientY: 10 });
      act(() => {
        document.dispatchEvent(mouseEvent);
      });

      // Assert - should not trigger when disabled
      expect(onExitIntent).not.toHaveBeenCalled();
    });
  });
});
