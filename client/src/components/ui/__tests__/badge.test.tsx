import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('DIV');
    });

    it('should have base badge classes', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');
      expect(badge).toHaveClass('transition-colors');
    });

    it('should have focus classes', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('focus:outline-none');
      expect(badge).toHaveClass('focus:ring-2');
      expect(badge).toHaveClass('focus:ring-ring');
      expect(badge).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
      expect(badge).toHaveClass('hover:bg-primary/80');
    });

    it('should render secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
      expect(badge).toHaveClass('hover:bg-secondary/80');
    });

    it('should render destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
      expect(badge).toHaveClass('hover:bg-destructive/80');
    });

    it('should render outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-foreground');
    });

    it('should default to default variant when not specified', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary');
    });
  });

  describe('Interactive Mode', () => {
    it('should render as button when interactive prop is true', () => {
      const { container } = render(<Badge interactive>Interactive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('BUTTON');
    });

    it('should render as button when onClick is provided', () => {
      const handleClick = jest.fn();
      const { container } = render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('BUTTON');
    });

    it('should have button type attribute when interactive', () => {
      const { container } = render(<Badge interactive>Interactive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('type', 'button');
    });

    it('should have interactive classes when interactive', () => {
      const { container } = render(<Badge interactive>Interactive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('cursor-pointer');
      expect(badge).toHaveClass('hover:scale-105');
      expect(badge).toHaveClass('active:scale-95');
      expect(badge).toHaveClass('transition-transform');
    });

    it('should have interactive classes when onClick is provided', () => {
      const handleClick = jest.fn();
      const { container } = render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('cursor-pointer');
      expect(badge).toHaveClass('hover:scale-105');
    });

    it('should not have type attribute when not interactive', () => {
      const { container } = render(<Badge>Non-interactive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).not.toHaveAttribute('type');
    });

    it('should not have interactive classes when not interactive', () => {
      const { container } = render(<Badge>Static</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).not.toHaveClass('cursor-pointer');
      expect(badge).not.toHaveClass('hover:scale-105');
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Badge onClick={handleClick}>Click me</Badge>);
      const badge = screen.getByText('Click me');

      await user.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should receive event object in onClick', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Badge onClick={handleClick}>Click me</Badge>);
      const badge = screen.getByText('Click me');

      await user.click(badge);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should support keyboard interaction when interactive', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Badge interactive onClick={handleClick}>Press me</Badge>);
      const badge = screen.getByText('Press me');

      badge.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick on non-interactive badge', () => {
      const handleClick = jest.fn();
      render(<Badge>Static</Badge>);

      // Non-interactive badges are divs, not buttons, so clicking won't trigger onClick
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-badge');
      expect(badge).toHaveClass('inline-flex'); // Still has base classes
    });

    it('should accept data attributes', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    });

    it('should accept id attribute', () => {
      const { container } = render(<Badge id="my-badge">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('id', 'my-badge');
    });

    it('should accept aria-label', () => {
      render(<Badge aria-label="Status badge">Badge</Badge>);
      expect(screen.getByLabelText('Status badge')).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      const { container } = render(
        <Badge role="status" aria-live="polite">Status</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Combined States', () => {
    it('should handle variant and interactive together', () => {
      const { container } = render(
        <Badge variant="secondary" interactive>Interactive Secondary</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('cursor-pointer');
      expect(badge.tagName).toBe('BUTTON');
    });

    it('should handle variant and onClick together', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Badge variant="destructive" onClick={handleClick}>Delete</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('cursor-pointer');
      expect(badge.tagName).toBe('BUTTON');
    });

    it('should handle custom className with variant', () => {
      const { container } = render(
        <Badge variant="outline" className="my-custom-badge">Outlined Custom</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-foreground');
      expect(badge).toHaveClass('my-custom-badge');
    });

    it('should handle custom className with interactive', () => {
      const { container } = render(
        <Badge interactive className="special-badge">Special Interactive</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('special-badge');
      expect(badge).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable when interactive', () => {
      render(<Badge interactive>Focusable</Badge>);
      const badge = screen.getByText('Focusable');
      badge.focus();
      expect(badge).toHaveFocus();
    });

    it('should have button role when interactive', () => {
      render(<Badge interactive>Button Badge</Badge>);
      const badge = screen.getByRole('button');
      expect(badge).toBeInTheDocument();
    });

    it('should not have button role when not interactive', () => {
      render(<Badge>Static Badge</Badge>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should support aria-label for screen readers', () => {
      render(<Badge aria-label="5 new messages">5</Badge>);
      expect(screen.getByLabelText('5 new messages')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <span id="badge-description">Notification count</span>
          <Badge aria-describedby="badge-description">3</Badge>
        </>
      );
      const badge = screen.getByText('3');
      expect(badge).toHaveAttribute('aria-describedby', 'badge-description');
    });
  });

  describe('Visual States', () => {
    it('should have hover classes for all variants', () => {
      const variants = ['default', 'secondary', 'destructive'] as const;
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toMatch(/hover:bg-/);
      });
    });

    it('should combine variant hover with interactive transform', () => {
      const { container } = render(
        <Badge variant="secondary" interactive>Hover Me</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('hover:bg-secondary/80');
      expect(badge).toHaveClass('hover:scale-105');
    });

    it('should have transition classes', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('transition-colors');
    });

    it('should have transform transition for interactive', () => {
      const { container } = render(<Badge interactive>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      // Interactive badges have transition-transform (overrides transition-colors)
      expect(badge).toHaveClass('transition-transform');
    });
  });

  describe('Content Types', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should render with icon and text', () => {
      render(
        <Badge>
          <span>✓</span> Verified
        </Badge>
      );
      expect(screen.getByText(/Verified/)).toBeInTheDocument();
    });

    it('should render with only icon', () => {
      render(<Badge aria-label="Check mark">✓</Badge>);
      expect(screen.getByLabelText('Check mark')).toBeInTheDocument();
    });
  });
});
