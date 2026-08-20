/**
 * Integration Tests for Toast Notification Refactor
 * Tests the custom useToast hook integration across components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/useToast';
import { act } from 'react-dom/test-utils';
import { jest } from '@jest/globals';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Test component using useToast hook
function TestToastComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Success</button>
      <button onClick={() => toast.error('Error message')}>Error</button>
      <button onClick={() => toast.warning('Warning message')}>Warning</button>
      <button onClick={() => toast.info('Info message')}>Info</button>
      <button onClick={() => toast.success('Success message')}>Duplicate Success</button>
    </div>
  );
}

describe('Toast Notification Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the internal state of useToast
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Toast Hook Functionality', () => {
    it('should show success toast when success method is called', () => {
      render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Success'));
      
      expect(toast.success).toHaveBeenCalledWith('Success message', undefined);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should show error toast when error method is called', () => {
      render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Error'));
      
      expect(toast.error).toHaveBeenCalledWith('Error message', undefined);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('should show warning toast when warning method is called', () => {
      render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Warning'));
      
      expect(toast.warning).toHaveBeenCalledWith('Warning message', undefined);
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('should show info toast when info method is called', () => {
      render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Info'));
      
      expect(toast.info).toHaveBeenCalledWith('Info message', undefined);
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate toasts within threshold period', () => {
      render(<TestToastComponent />);
      
      // Click success button twice quickly
      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Duplicate Success'));
      
      // Should only call toast.success once due to duplicate prevention
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Success message', undefined);
    });

    it('should allow duplicate toasts after threshold period', async () => {
      render(<TestToastComponent />);
      
      // First toast
      fireEvent.click(screen.getByText('Success'));
      expect(toast.success).toHaveBeenCalledTimes(1);
      
      // Fast forward past the threshold (2000ms)
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Second toast after threshold
      fireEvent.click(screen.getByText('Duplicate Success'));
      expect(toast.success).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    it('should clean up timeout references', () => {
      const component = render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Success'));
      
      // Fast forward to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Component should unmount without memory leaks
      component.unmount();
      
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should handle multiple different toast types without interference', () => {
      render(<TestToastComponent />);
      
      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      fireEvent.click(screen.getByText('Warning'));
      fireEvent.click(screen.getByText('Info'));
      
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('Options Support', () => {
    it('should pass options to underlying toast function', () => {
      const TestWithOptions = () => {
        const toast = useToast();
        return (
          <button 
            onClick={() => toast.success('Message', { duration: 5000, position: 'top-center' })}
          >
            Success with options
          </button>
        );
      };

      render(<TestWithOptions />);
      fireEvent.click(screen.getByText('Success with options'));
      
      expect(toast.success).toHaveBeenCalledWith('Message', { duration: 5000, position: 'top-center' });
    });
  });

  describe('Error Handling', () => {
    it('should handle toast function throwing errors gracefully', () => {
      (toast.success as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Toast failed');
      });

      render(<TestToastComponent />);
      
      // Should not throw when toast function fails
      expect(() => {
        fireEvent.click(screen.getByText('Success'));
      }).not.toThrow();
    });
  });
});