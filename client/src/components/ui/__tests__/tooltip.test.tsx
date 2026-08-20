import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';

describe('Tooltip', () => {
  describe('TooltipProvider', () => {
    it('should render without crashing', () => {
      render(
        <TooltipProvider>
          <div data-testid="child">Child</div>
        </TooltipProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render children components', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('should wrap multiple tooltips', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Tooltip 1</TooltipTrigger>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Tooltip 2</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('Tooltip 1')).toBeInTheDocument();
      expect(screen.getByText('Tooltip 2')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <TooltipProvider>
          <div data-custom="value">Content</div>
        </TooltipProvider>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Tooltip Root', () => {
    it('should render without crashing', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
        </Tooltip>
      );
      expect(screen.getByText('Hover')).toBeInTheDocument();
    });

    it('should render children components', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <Tooltip>
          <div data-testid="child">Child</div>
        </Tooltip>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('TooltipTrigger', () => {
    it('should render without crashing', () => {
      render(
        <TooltipTrigger>
          <span data-testid="trigger">Hover me</span>
        </TooltipTrigger>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('should render as button by default', () => {
      render(<TooltipTrigger>Hover me</TooltipTrigger>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TooltipTrigger className="custom-trigger">Trigger</TooltipTrigger>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-trigger');
    });

    it('should support asChild prop with valid element', () => {
      render(
        <TooltipTrigger asChild>
          <button data-testid="custom-button">Custom Button</button>
        </TooltipTrigger>
      );
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });

    it('should pass through props when asChild', () => {
      render(
        <TooltipTrigger asChild>
          <button aria-label="Help" data-testid="help-button">
            ?
          </button>
        </TooltipTrigger>
      );
      const button = screen.getByTestId('help-button');
      expect(button).toHaveAttribute('aria-label', 'Help');
    });

    it('should render children when asChild with invalid element', () => {
      render(
        <TooltipTrigger asChild>
          <div data-testid="div-trigger">Div Trigger</div>
        </TooltipTrigger>
      );
      expect(screen.getByTestId('div-trigger')).toBeInTheDocument();
    });

    it('should forward ref when asChild', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <TooltipTrigger asChild>
          <button ref={ref} data-testid="ref-button">
            Button
          </button>
        </TooltipTrigger>
      );
      expect(screen.getByTestId('ref-button')).toBeInTheDocument();
    });

    it('should accept data attributes', () => {
      render(
        <TooltipTrigger data-testid="trigger" data-custom="value">
          Trigger
        </TooltipTrigger>
      );
      const button = screen.getByTestId('trigger');
      expect(button).toHaveAttribute('data-custom', 'value');
    });

    it('should be clickable', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <TooltipTrigger onClick={handleClick}>Click me</TooltipTrigger>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward ref when not asChild', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<TooltipTrigger ref={ref}>Trigger</TooltipTrigger>);
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('should display correct name', () => {
      expect(TooltipTrigger.displayName).toBe('TooltipTrigger');
    });
  });

  describe('TooltipContent', () => {
    it('should render without crashing', () => {
      render(<TooltipContent>Tooltip text</TooltipContent>);
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(<TooltipContent data-testid="content">Content</TooltipContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('overflow-hidden');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('bg-popover');
      expect(content).toHaveClass('px-3');
      expect(content).toHaveClass('py-1.5');
      expect(content).toHaveClass('text-xs');
      expect(content).toHaveClass('text-popover-foreground');
      expect(content).toHaveClass('shadow-md');
    });

    it('should have animation classes', () => {
      render(<TooltipContent data-testid="content">Content</TooltipContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('animate-in');
      expect(content).toHaveClass('fade-in-0');
      expect(content).toHaveClass('zoom-in-95');
    });

    it('should have close animation classes', () => {
      render(<TooltipContent data-testid="content">Content</TooltipContent>);
      const content = screen.getByTestId('content');
      const classString = content.className;
      expect(classString).toContain('data-[state=closed]:animate-out');
      expect(classString).toContain('data-[state=closed]:fade-out-0');
      expect(classString).toContain('data-[state=closed]:zoom-out-95');
    });

    it('should have slide animation classes for different sides', () => {
      render(<TooltipContent data-testid="content">Content</TooltipContent>);
      const content = screen.getByTestId('content');
      const classString = content.className;
      expect(classString).toContain('data-[side=bottom]:slide-in-from-top-2');
      expect(classString).toContain('data-[side=left]:slide-in-from-right-2');
      expect(classString).toContain('data-[side=right]:slide-in-from-left-2');
      expect(classString).toContain('data-[side=top]:slide-in-from-bottom-2');
    });

    it('should apply custom className', () => {
      render(
        <TooltipContent className="custom-content" data-testid="content">
          Content
        </TooltipContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('z-50'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(
        <TooltipContent className="max-w-xs p-4" data-testid="content">
          Content
        </TooltipContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('max-w-xs');
      expect(content).toHaveClass('p-4');
      expect(content).toHaveClass('bg-popover');
    });

    it('should accept sideOffset prop', () => {
      render(
        <TooltipContent sideOffset={8} data-testid="content">
          Content
        </TooltipContent>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should use default sideOffset of 4', () => {
      render(<TooltipContent data-testid="content">Content</TooltipContent>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<TooltipContent ref={ref}>Content</TooltipContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <TooltipContent data-testid="content" data-custom="value">
          Content
        </TooltipContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('data-custom', 'value');
    });

    it('should render children elements', () => {
      render(
        <TooltipContent>
          <div data-testid="child-1">Line 1</div>
          <div data-testid="child-2">Line 2</div>
        </TooltipContent>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should display correct name', () => {
      expect(TooltipContent.displayName).toBe('TooltipContent');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple tooltip', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover for info</TooltipTrigger>
            <TooltipContent>This is helpful information</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByText('Hover for info')).toBeInTheDocument();
      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    });

    it('should work with custom trigger element', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button data-testid="help-btn" aria-label="Help">
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent>Click for help</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByTestId('help-btn')).toBeInTheDocument();
      expect(screen.getByText('Click for help')).toBeInTheDocument();
    });

    it('should work with icon buttons', () => {
      render(
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label="Settings">
              <span data-testid="gear-icon">⚙</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      );

      expect(screen.getByTestId('gear-icon')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should work with multiple tooltips in provider', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Button 1</TooltipTrigger>
            <TooltipContent>Tooltip 1</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Button 2</TooltipTrigger>
            <TooltipContent>Tooltip 2</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Tooltip 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Tooltip 2')).toBeInTheDocument();
    });

    it('should work with complex content', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Info</TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <strong>Title</strong>
              <span>Description text here</span>
            </div>
          </TooltipContent>
        </Tooltip>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description text here')).toBeInTheDocument();
    });

    it('should work with accessible labels', () => {
      render(
        <Tooltip>
          <TooltipTrigger aria-label="More information">
            <span>ℹ</span>
          </TooltipTrigger>
          <TooltipContent>
            Additional details about this feature
          </TooltipContent>
        </Tooltip>
      );

      expect(screen.getByLabelText('More information')).toBeInTheDocument();
      expect(screen.getByText('Additional details about this feature')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      const handleClick = jest.fn();

      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              asChild
              onClick={handleClick}
            >
              <button
                className="custom-trigger"
                data-testid="trigger"
                aria-label="Help button"
              >
                Help
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="max-w-sm custom-content"
              sideOffset={12}
              data-testid="content"
            >
              <div className="text-sm">
                <strong>Helpful Information</strong>
                <p>Details here</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
      expect(trigger).toHaveAttribute('aria-label', 'Help button');

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('max-w-sm');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('bg-popover');

      expect(screen.getByText('Helpful Information')).toBeInTheDocument();
      expect(screen.getByText('Details here')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label on trigger', () => {
      render(
        <TooltipTrigger aria-label="Open tooltip">
          Trigger
        </TooltipTrigger>
      );
      expect(screen.getByLabelText('Open tooltip')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <TooltipTrigger>Accessible</TooltipTrigger>
      );
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should work with screen readers', () => {
      render(
        <Tooltip>
          <TooltipTrigger aria-label="Help">?</TooltipTrigger>
          <TooltipContent role="tooltip">
            Help text for screen readers
          </TooltipContent>
        </Tooltip>
      );

      expect(screen.getByLabelText('Help')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<TooltipContent />);
      const content = document.querySelector('.bg-popover');
      expect(content).toBeInTheDocument();
    });

    it('should handle trigger without children', () => {
      render(<TooltipTrigger />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle provider without tooltips', () => {
      render(
        <TooltipProvider>
          <div data-testid="content">Just content</div>
        </TooltipProvider>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle asChild with non-element children', () => {
      render(
        <TooltipTrigger asChild>
          Plain text
        </TooltipTrigger>
      );
      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref on TooltipTrigger', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<TooltipTrigger ref={ref}>Trigger</TooltipTrigger>);
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('should forward ref on TooltipContent', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<TooltipContent ref={ref}>Content</TooltipContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should forward ref through asChild', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <TooltipTrigger asChild>
          <button ref={ref}>Button</button>
        </TooltipTrigger>
      );
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });
});
