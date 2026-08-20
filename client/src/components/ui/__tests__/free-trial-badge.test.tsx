import React from 'react';
import { render, screen } from '@testing-library/react';
import { FreeTrialBadge } from '../free-trial-badge';

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} data-testid="motion-span" {...props}>
        {children}
      </span>
    ),
  },
}));

describe('FreeTrialBadge', () => {
  describe('Rendering', () => {
    it('should render "30-Day Free Trial" text', () => {
      render(<FreeTrialBadge />);

      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();
    });

    it('should render rocket emoji by default', () => {
      render(<FreeTrialBadge />);

      expect(screen.getByText('\uD83D\uDE80')).toBeInTheDocument();
    });

    it('should render without sparkle when showSparkle is false', () => {
      render(<FreeTrialBadge showSparkle={false} />);

      expect(screen.queryByText('\uD83D\uDE80')).not.toBeInTheDocument();
      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();
    });

    it('should render with motion.div wrapper', () => {
      render(<FreeTrialBadge />);

      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    it('should render sparkle as motion.span', () => {
      render(<FreeTrialBadge />);

      expect(screen.getByTestId('motion-span')).toBeInTheDocument();
      expect(screen.getByTestId('motion-span')).toHaveTextContent('\uD83D\uDE80');
    });
  });

  describe('Size Variants', () => {
    it('should render with medium size by default', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-2');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render with small size', () => {
      render(<FreeTrialBadge size="sm" />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render with large size', () => {
      render(<FreeTrialBadge size="lg" />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-6');
      expect(badge).toHaveClass('py-3');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Styling', () => {
    it('should have gradient background classes', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('bg-gradient-to-r');
      expect(badge).toHaveClass('from-primary');
      expect(badge).toHaveClass('to-primary/90');
    });

    it('should have text color white', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('text-white');
    });

    it('should have rounded-full class', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should have font-semibold class', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('font-semibold');
    });

    it('should have shadow-lg class', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('shadow-lg');
    });

    it('should have inline-flex layout', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('gap-2');
    });

    it('should apply custom className', () => {
      render(<FreeTrialBadge className="custom-badge" />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('custom-badge');
    });

    it('should merge custom className with default classes', () => {
      render(<FreeTrialBadge className="custom-badge" />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('custom-badge');
      expect(badge).toHaveClass('bg-gradient-to-r');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Sparkle Styling', () => {
    it('should have text-warning color on sparkle', () => {
      render(<FreeTrialBadge />);

      const sparkle = screen.getByTestId('motion-span');
      expect(sparkle).toHaveClass('text-warning/80');
    });

    it('should not render sparkle wrapper when showSparkle is false', () => {
      render(<FreeTrialBadge showSparkle={false} />);

      expect(screen.queryByTestId('motion-span')).not.toBeInTheDocument();
    });
  });

  describe('Props Combinations', () => {
    it('should work with all props combined', () => {
      render(
        <FreeTrialBadge
          size="lg"
          showSparkle={true}
          className="custom-class"
        />
      );

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-6', 'py-3', 'text-base', 'custom-class');
      expect(screen.getByText('\uD83D\uDE80')).toBeInTheDocument();
      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();
    });

    it('should work with minimal props', () => {
      render(<FreeTrialBadge />);

      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();
    });

    it('should work with size and showSparkle false', () => {
      render(<FreeTrialBadge size="sm" showSparkle={false} />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-3', 'text-xs');
      expect(screen.queryByText('\uD83D\uDE80')).not.toBeInTheDocument();
    });

    it('should work with className and showSparkle true', () => {
      render(<FreeTrialBadge className="test-class" showSparkle={true} />);

      expect(screen.getByTestId('motion-div')).toHaveClass('test-class');
      expect(screen.getByText('\uD83D\uDE80')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className', () => {
      render(<FreeTrialBadge className="" />);

      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    it('should handle className with multiple classes', () => {
      render(<FreeTrialBadge className="class1 class2 class3" />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('class1', 'class2', 'class3');
    });

    it('should render correctly when re-rendered with different props', () => {
      const { rerender } = render(<FreeTrialBadge size="sm" />);

      let badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-3', 'text-xs');

      rerender(<FreeTrialBadge size="lg" />);

      badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('px-6', 'text-base');
    });

    it('should toggle sparkle on re-render', () => {
      const { rerender } = render(<FreeTrialBadge showSparkle={true} />);

      expect(screen.getByText('\uD83D\uDE80')).toBeInTheDocument();

      rerender(<FreeTrialBadge showSparkle={false} />);

      expect(screen.queryByText('\uD83D\uDE80')).not.toBeInTheDocument();
    });

    it('should maintain text content through re-renders', () => {
      const { rerender } = render(<FreeTrialBadge size="sm" />);

      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();

      rerender(<FreeTrialBadge size="lg" />);

      expect(screen.getByText('30-Day Free Trial')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render readable text content', () => {
      render(<FreeTrialBadge />);

      const text = screen.getByText('30-Day Free Trial');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('SPAN');
    });

    it('should render sparkle as decorative element', () => {
      render(<FreeTrialBadge />);

      const sparkle = screen.getByText('\uD83D\uDE80');
      expect(sparkle).toBeInTheDocument();
    });

    it('should be inline element for flexible positioning', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('Layout', () => {
    it('should use flexbox layout', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
    });

    it('should have gap between sparkle and text', () => {
      render(<FreeTrialBadge />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('gap-2');
    });

    it('should maintain layout without sparkle', () => {
      render(<FreeTrialBadge showSparkle={false} />);

      const badge = screen.getByTestId('motion-div');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
    });
  });
});
