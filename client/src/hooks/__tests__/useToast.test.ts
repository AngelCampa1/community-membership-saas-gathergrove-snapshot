/**
 * useToast Tests - Full Coverage
 */

import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Toast Types', () => {
    it('should show success toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Success message');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith('Success message', undefined);
    });

    it('should show error toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.error('Error message');
      });

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Error message', undefined);
    });

    it('should show warning toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.warning('Warning message');
      });

      // Assert
      expect(toast.warning).toHaveBeenCalledWith('Warning message', undefined);
    });

    it('should show info toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.info('Info message');
      });

      // Assert
      expect(toast.info).toHaveBeenCalledWith('Info message', undefined);
    });
  });

  describe('Toast Options', () => {
    it('should pass options to success toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const options = { duration: 5000, action: { label: 'Undo', onClick: jest.fn() } };

      // Act
      act(() => {
        result.current.success('Success with options', options);
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith('Success with options', options);
    });

    it('should pass options to error toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const options = { duration: 10000 };

      // Act
      act(() => {
        result.current.error('Error with options', options);
      });

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Error with options', options);
    });

    it('should pass options to warning toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const options = { position: 'top-right' };

      // Act
      act(() => {
        result.current.warning('Warning with options', options);
      });

      // Assert
      expect(toast.warning).toHaveBeenCalledWith('Warning with options', options);
    });

    it('should pass options to info toast', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const options = { description: 'More details' };

      // Act
      act(() => {
        result.current.info('Info with options', options);
      });

      // Assert
      expect(toast.info).toHaveBeenCalledWith('Info with options', options);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate success toasts within threshold', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Duplicate test');
        result.current.success('Duplicate test');
      });

      // Assert - should only show once
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate error toasts within threshold', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.error('Duplicate error');
        result.current.error('Duplicate error');
      });

      // Assert
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate warning toasts within threshold', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.warning('Duplicate warning');
        result.current.warning('Duplicate warning');
      });

      // Assert
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate info toasts within threshold', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.info('Duplicate info');
        result.current.info('Duplicate info');
      });

      // Assert
      expect(toast.info).toHaveBeenCalledTimes(1);
    });

    it('should allow same toast after threshold expires', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Repeat message');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Advance time past threshold (2000ms)
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      act(() => {
        result.current.success('Repeat message');
      });

      // Assert - should show twice
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should treat different messages as separate toasts', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Message 1');
        result.current.success('Message 2');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should treat different types with same message as separate toasts', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Same message');
        result.current.error('Same message');
        result.current.warning('Same message');
        result.current.info('Same message');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should clean up timeouts on unmount', () => {
      // Arrange
      const { result, unmount } = renderHook(() => useToast());
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Act
      act(() => {
        result.current.success('Test message');
      });

      unmount();

      // Assert - should have cleared the timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clean up multiple timeouts on unmount', () => {
      // Arrange
      const { result, unmount } = renderHook(() => useToast());
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Act
      act(() => {
        result.current.success('Message 1');
        result.current.error('Message 2');
        result.current.warning('Message 3');
      });

      unmount();

      // Assert - should have cleared all timeouts
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
      clearTimeoutSpy.mockRestore();
    });

    it('should remove toast from tracking after timeout', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act - show toast
      act(() => {
        result.current.success('Will expire');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Advance time past cleanup threshold (2000ms)
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      // Try to show same toast again - should be allowed after cleanup
      act(() => {
        result.current.success('Will expire');
      });

      // Assert - should show twice (once before and once after cleanup)
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid successive toasts with cleanup', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act - show same toast 3 times rapidly
      act(() => {
        result.current.success('Rapid message');
        result.current.success('Rapid message');
        result.current.success('Rapid message');
      });

      // Should only show once due to deduplication
      expect(toast.success).toHaveBeenCalledTimes(1);

      // Advance time
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      // Try again
      act(() => {
        result.current.success('Rapid message');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith('', undefined);
    });

    it('should handle very long message', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const longMessage = 'A'.repeat(1000);

      // Act
      act(() => {
        result.current.success(longMessage);
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith(longMessage, undefined);
    });

    it('should handle special characters in message', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const specialMessage = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      // Act
      act(() => {
        result.current.success(specialMessage);
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith(specialMessage, undefined);
    });

    it('should handle unicode characters in message', () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const unicodeMessage = '你好世界 🎉 مرحبا';

      // Act
      act(() => {
        result.current.info(unicodeMessage);
      });

      // Assert
      expect(toast.info).toHaveBeenCalledWith(unicodeMessage, undefined);
    });

    it('should handle multiple hook instances independently', () => {
      // Arrange
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      // Act
      act(() => {
        result1.current.success('Instance 1');
        result2.current.success('Instance 2');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should handle unmount and remount cycle', () => {
      // Arrange
      const { result, unmount } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Before unmount');
      });

      unmount();

      const { result: newResult } = renderHook(() => useToast());

      act(() => {
        newResult.current.success('After remount');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle mixed toast types in sequence', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Step 1');
        result.current.info('Step 2');
        result.current.warning('Step 3');
        result.current.error('Step 4');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('should handle alternating duplicate and unique messages', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success('Unique 1');
        result.current.success('Duplicate');
        result.current.success('Duplicate'); // Should be blocked
        result.current.success('Unique 2');
      });

      // Assert
      expect(toast.success).toHaveBeenCalledTimes(3);
    });

    it('should allow toast after exact threshold time', () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.error('Threshold test');
      });

      expect(toast.error).toHaveBeenCalledTimes(1);

      // Advance time to just before threshold (1999ms)
      act(() => {
        jest.advanceTimersByTime(1999);
      });

      act(() => {
        result.current.error('Threshold test');
      });

      // Assert - just before threshold, should still be blocked
      expect(toast.error).toHaveBeenCalledTimes(1);

      // Advance to exactly threshold (total 2000ms)
      act(() => {
        jest.advanceTimersByTime(1);
      });

      act(() => {
        result.current.error('Threshold test');
      });

      // Assert - at exactly threshold, should be allowed (>= 2000)
      expect(toast.error).toHaveBeenCalledTimes(2);
    });
  });
});
