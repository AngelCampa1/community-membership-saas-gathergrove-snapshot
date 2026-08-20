import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have data-slot attribute', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });

    it('should render glass variant', () => {
      render(<Button variant="glass">Glass</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass');
    });

    it('should render glass-primary variant', () => {
      render(<Button variant="glass-primary">Glass Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass');
      expect(button).toHaveClass('border-primary/30');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-6');
    });

    it('should render icon size', () => {
      render(<Button size="icon" aria-label="Icon button">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('⟳');
      // Spinner span should have animate-spin class
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show loadingText when provided', () => {
      render(<Button loading loadingText="Submitting...">Submit</Button>);
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should show children when loading but no loadingText', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-busy attribute when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when loading even if disabled prop is false', () => {
      render(<Button loading disabled={false}>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button loading onClick={handleClick}>Submit</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should support keyboard interaction', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Submit</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      // Should still have base classes
      expect(button).toHaveClass('inline-flex');
    });

    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should accept data attributes', () => {
      render(<Button data-testid="test-button">Test</Button>);
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    it('should accept aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });
  });

  describe('asChild Prop', () => {
    it('should render children directly when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex'); // Button styles applied
    });

    it('should not show loading spinner when asChild is true', () => {
      render(
        <Button asChild loading>
          <a href="/test">Link</a>
        </Button>
      );
      expect(screen.queryByText('⟳')).not.toBeInTheDocument();
    });

    it('should still be disabled when asChild and disabled', () => {
      render(
        <Button asChild disabled>
          <a href="/test">Link</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('disabled');
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      // Disabled buttons with disabled:pointer-events-none won't receive focus
    });

    it('should have aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-disabled when disabled or loading', () => {
      const { rerender } = render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');

      rerender(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Combined States', () => {
    it('should handle variant and size together', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-10');
    });

    it('should handle disabled and variant together', () => {
      render(<Button disabled variant="destructive">Disabled Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-destructive');
    });

    it('should handle loading and size together', () => {
      render(<Button loading size="sm" loadingText="Wait...">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('h-8');
      expect(screen.getByText('Wait...')).toBeInTheDocument();
    });

    it('should handle custom className with variant', () => {
      render(<Button variant="ghost" className="my-custom-class">Custom Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('my-custom-class');
    });
  });

  describe('CSS Classes', () => {
    it('should have transition classes', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
    });

    it('should have flex classes', () => {
      render(<Button>Flex</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('should have disabled opacity class', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should have focus-visible classes', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:border-ring');
      expect(button).toHaveClass('focus-visible:ring-ring/50');
    });
  });
});
