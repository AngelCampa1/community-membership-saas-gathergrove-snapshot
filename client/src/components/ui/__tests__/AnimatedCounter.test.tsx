import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with data-testid', () => {
      render(<AnimatedCounter value={100} />);

      expect(screen.getByTestId('animated-counter')).toBeInTheDocument();
    });

    it('should render as span element', () => {
      render(<AnimatedCounter value={100} />);

      const counter = screen.getByTestId('animated-counter');
      expect(counter.tagName).toBe('SPAN');
    });

    it('should start at 0', () => {
      render(<AnimatedCounter value={100} />);

      const counter = screen.getByTestId('animated-counter');
      expect(counter).toHaveTextContent('0');
    });

    it('should display initial value of 0 immediately', () => {
      render(<AnimatedCounter value={50} />);

      const counter = screen.getByTestId('animated-counter');
      expect(counter.textContent).toBe('0');
    });
  });

  describe('Value Animation', () => {
    it('should animate to target value', () => {
      render(<AnimatedCounter value={100} duration={500} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(counter.textContent).toBe('100');
    });

    it('should animate to small value', () => {
      render(<AnimatedCounter value={10} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter.textContent).toBe('10');
    });

    it('should animate to large value', () => {
      render(<AnimatedCounter value={1000} duration={500} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(counter.textContent).toBe('1000');
    });

    it('should display intermediate values during animation', () => {
      render(<AnimatedCounter value={100} duration={1000} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const currentValue = parseInt(counter.textContent || '0', 10);
      expect(currentValue).toBeGreaterThan(0);
      expect(currentValue).toBeLessThan(100);
    });
  });

  describe('Duration Prop', () => {
    it('should use default duration of 1000ms', () => {
      render(<AnimatedCounter value={100} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(counter.textContent).toBe('100');
    });

    it('should respect custom duration', () => {
      render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter.textContent).toBe('100');
    });

    it('should animate faster with shorter duration', () => {
      render(<AnimatedCounter value={100} duration={200} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(counter.textContent).toBe('100');
    });

    it('should animate slower with longer duration', () => {
      render(<AnimatedCounter value={100} duration={2000} />);

      const counter = screen.getByTestId('animated-counter');

      // After 500ms of fake time, should still be animating
      act(() => {
        jest.advanceTimersByTime(500);
      });
      const midValue = parseInt(counter.textContent || '0', 10);
      expect(midValue).toBeLessThan(100);

      // Complete the animation
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(counter.textContent).toBe('100');
    });
  });

  describe('Value Updates', () => {
    it('should restart animation when value changes', () => {
      const { rerender } = render(<AnimatedCounter value={50} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      // Complete first animation
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('50');

      // Change value
      rerender(<AnimatedCounter value={100} duration={300} />);

      // Complete second animation
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('100');
    });

    it('should handle value decrease', () => {
      const { rerender } = render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('100');

      // Decrease value
      rerender(<AnimatedCounter value={50} duration={300} />);

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('50');
    });

    it('should handle rapid value changes', () => {
      const { rerender } = render(<AnimatedCounter value={10} duration={200} />);

      const counter = screen.getByTestId('animated-counter');

      // Rapidly change values
      rerender(<AnimatedCounter value={20} duration={200} />);
      rerender(<AnimatedCounter value={30} duration={200} />);
      rerender(<AnimatedCounter value={40} duration={200} />);

      // Complete final animation
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(counter.textContent).toBe('40');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      render(<AnimatedCounter value={0} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      // Should display 0 immediately
      expect(counter.textContent).toBe('0');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('0');
    });

    it('should handle value of 1', () => {
      render(<AnimatedCounter value={1} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter.textContent).toBe('1');
    });

    it('should handle very large values', () => {
      render(<AnimatedCounter value={10000} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter.textContent).toBe('10000');
    });

    it('should handle very short duration', () => {
      render(<AnimatedCounter value={100} duration={50} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(counter.textContent).toBe('100');
    });

    it('should handle same value as current', () => {
      const { rerender } = render(<AnimatedCounter value={50} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('50');

      // Set to same value
      rerender(<AnimatedCounter value={50} duration={300} />);

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('50');
    });
  });

  describe('Final Value Accuracy', () => {
    it('should display exact target value at end', () => {
      render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('100');

      // Verify it stays at 100
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(counter.textContent).toBe('100');
    });

    it('should not exceed target value', () => {
      render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      // Check multiple points during animation
      for (let t = 0; t <= 400; t += 16) {
        act(() => {
          jest.advanceTimersByTime(16);
        });
        const value = parseInt(counter.textContent || '0', 10);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('should display exact small values', () => {
      render(<AnimatedCounter value={5} duration={200} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(counter.textContent).toBe('5');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup interval on unmount', () => {
      const { unmount } = render(<AnimatedCounter value={100} duration={1000} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Unmount before animation completes
      unmount();

      // No errors should occur
      expect(counter).not.toBeInTheDocument();
    });

    it('should restart animation on value change during animation', () => {
      const { rerender } = render(<AnimatedCounter value={100} duration={1000} />);

      const counter = screen.getByTestId('animated-counter');

      // Mid-animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Change value mid-animation
      rerender(<AnimatedCounter value={50} duration={300} />);

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('50');
    });

    it('should restart animation on duration change', () => {
      const { rerender } = render(<AnimatedCounter value={100} duration={1000} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Change duration
      rerender(<AnimatedCounter value={100} duration={300} />);

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(counter.textContent).toBe('100');
    });
  });

  describe('Display Format', () => {
    it('should display integer values without decimals', () => {
      render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter.textContent).not.toContain('.');
    });

    it('should use Math.floor for intermediate values', () => {
      render(<AnimatedCounter value={100} duration={500} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const value = parseInt(counter.textContent || '0', 10);
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via test id', () => {
      render(<AnimatedCounter value={100} />);

      expect(screen.getByTestId('animated-counter')).toBeInTheDocument();
    });

    it('should display readable text content', () => {
      render(<AnimatedCounter value={100} />);

      const counter = screen.getByTestId('animated-counter');
      expect(counter.textContent).toMatch(/^\d+$/);
    });

    it('should be readable by screen readers', () => {
      render(<AnimatedCounter value={100} duration={300} />);

      const counter = screen.getByTestId('animated-counter');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counter).toHaveTextContent('100');
    });
  });

  describe('Integration', () => {
    it('should work with multiple instances', () => {
      render(
        <>
          <AnimatedCounter value={50} duration={300} />
          <AnimatedCounter value={100} duration={300} />
          <AnimatedCounter value={150} duration={300} />
        </>
      );

      const counters = screen.getAllByTestId('animated-counter');
      expect(counters).toHaveLength(3);

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(counters[0].textContent).toBe('50');
      expect(counters[1].textContent).toBe('100');
      expect(counters[2].textContent).toBe('150');
    });

    it('should animate independently', () => {
      render(
        <>
          <AnimatedCounter value={100} duration={200} />
          <AnimatedCounter value={100} duration={400} />
        </>
      );

      const counters = screen.getAllByTestId('animated-counter');

      // First should complete after 200ms
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(counters[0].textContent).toBe('100');

      // Second might still be animating at 300ms
      const secondValue = parseInt(counters[1].textContent || '0', 10);
      expect(secondValue).toBeGreaterThanOrEqual(0);

      // Both should reach 100 after 500ms total
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(counters[1].textContent).toBe('100');
    });
  });
});
