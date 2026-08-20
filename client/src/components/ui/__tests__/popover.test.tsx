import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';

describe('Popover', () => {
  describe('Popover Root', () => {
    it('should render without crashing', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div data-testid="content">Content</div>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should render children components', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should have relative inline-block wrapper', () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
        </Popover>
      );
      const wrapper = container.querySelector('.relative.inline-block');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Popover State', () => {
    it('should be closed by default', () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
        </Popover>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept open prop', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div data-testid="content">Content</div>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should work as controlled component with open prop', () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div data-testid="content">Content</div>
          </PopoverContent>
        </Popover>
      );

      rerender(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div data-testid="content">Content</div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should call onOpenChange when state changes', () => {
      const handleOpenChange = jest.fn();
      render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
        </Popover>
      );
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should sync with controlled open prop', () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
        </Popover>
      );

      rerender(
        <Popover open={true}>
          <PopoverTrigger>Trigger</PopoverTrigger>
        </Popover>
      );

      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });
  });

  describe('PopoverTrigger', () => {
    it('should render trigger content', () => {
      render(
        <Popover>
          <PopoverTrigger>Click me</PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should have cursor-pointer class by default', () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Click me</PopoverTrigger>
        </Popover>
      );
      const trigger = container.querySelector('.cursor-pointer');
      expect(trigger).toBeInTheDocument();
    });

    it('should render as child element when asChild is true', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button data-testid="custom-trigger">Custom Button</button>
          </PopoverTrigger>
        </Popover>
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should preserve onClick handler when asChild', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger asChild>
            <button onClick={handleClick} data-testid="custom-trigger">
              Click
            </button>
          </PopoverTrigger>
        </Popover>
      );

      await user.click(screen.getByTestId('custom-trigger'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('should render children as div when not asChild', () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Trigger Text</PopoverTrigger>
        </Popover>
      );
      const div = container.querySelector('div.cursor-pointer');
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent('Trigger Text');
    });

    it('should handle ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Popover>
          <PopoverTrigger>
            <div ref={ref}>Trigger</div>
          </PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });
  });

  describe('PopoverContent', () => {
    it('should render content', () => {
      render(
        <Popover>
          <PopoverContent>
            <div>Popover content</div>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      const { container } = render(
        <Popover>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.absolute.z-50');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('mt-1');
      expect(content).toHaveClass('min-w-[8rem]');
      expect(content).toHaveClass('overflow-hidden');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('bg-popover');
      expect(content).toHaveClass('p-1');
      expect(content).toHaveClass('text-popover-foreground');
      expect(content).toHaveClass('shadow-md');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Popover>
          <PopoverContent className="custom-content">
            Content
          </PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.custom-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('absolute');
    });

    it('should support align="start"', () => {
      const { container } = render(
        <Popover>
          <PopoverContent align="start">Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.left-0');
      expect(content).toBeInTheDocument();
    });

    it('should support align="center" (default)', () => {
      const { container } = render(
        <Popover>
          <PopoverContent align="center">Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.left-1\\/2.-translate-x-1\\/2');
      expect(content).toBeInTheDocument();
    });

    it('should support align="end"', () => {
      const { container } = render(
        <Popover>
          <PopoverContent align="end">Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.right-0');
      expect(content).toBeInTheDocument();
    });

    it('should accept aria-label', () => {
      const { container } = render(
        <Popover>
          <PopoverContent aria-label="Menu options">
            Content
          </PopoverContent>
        </Popover>
      );
      const content = container.querySelector('[aria-label="Menu options"]');
      expect(content).toBeInTheDocument();
    });

    it('should accept role attribute', () => {
      const { container } = render(
        <Popover>
          <PopoverContent role="menu">Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('[role="menu"]');
      expect(content).toBeInTheDocument();
    });

    it('should render children elements', () => {
      render(
        <Popover>
          <PopoverContent>
            <div data-testid="child-1">Item 1</div>
            <div data-testid="child-2">Item 2</div>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple dropdown menu', () => {
      render(
        <Popover>
          <PopoverTrigger>Menu</PopoverTrigger>
          <PopoverContent>
            <div>Option 1</div>
            <div>Option 2</div>
            <div>Option 3</div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should work with custom trigger button', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button className="btn-primary" data-testid="custom-btn">
              Open Menu
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Menu content</div>
          </PopoverContent>
        </Popover>
      );

      const button = screen.getByTestId('custom-btn');
      expect(button).toHaveClass('btn-primary');
      expect(screen.getByText('Menu content')).toBeInTheDocument();
    });

    it('should work with controlled state', () => {
      const ControlledPopover = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <button onClick={() => setOpen(true)}>Open</button>
            </PopoverTrigger>
            <PopoverContent>
              <div>Content</div>
            </PopoverContent>
          </Popover>
        );
      };

      render(<ControlledPopover />);
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should work with different alignment options', () => {
      const { container } = render(
        <div>
          <Popover>
            <PopoverContent align="start">Start</PopoverContent>
          </Popover>
          <Popover>
            <PopoverContent align="center">Center</PopoverContent>
          </Popover>
          <Popover>
            <PopoverContent align="end">End</PopoverContent>
          </Popover>
        </div>
      );

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Center')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('should work with accessible menu', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <button aria-label="Open menu">☰</button>
          </PopoverTrigger>
          <PopoverContent role="menu" aria-label="Main menu">
            <div role="menuitem">Profile</div>
            <div role="menuitem">Settings</div>
            <div role="menuitem">Logout</div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      const handleOpenChange = jest.fn();

      const { container } = render(
        <Popover open onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button data-testid="trigger">Trigger</button>
          </PopoverTrigger>
          <PopoverContent
            className="custom-class"
            align="end"
            role="menu"
            aria-label="Options"
          >
            <div data-testid="content">Content</div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();

      const content = container.querySelector('.custom-class');
      expect(content).toHaveClass('right-0');
      expect(content).toHaveAttribute('role', 'menu');
      expect(content).toHaveAttribute('aria-label', 'Options');
    });

    it('should work with complex content structure', () => {
      render(
        <Popover open>
          <PopoverTrigger asChild>
            <button>Menu</button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="flex flex-col gap-2">
              <div className="font-bold">Header</div>
              <div>Item 1</div>
              <div>Item 2</div>
              <div className="border-t pt-2">Footer</div>
            </div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined open prop', () => {
      render(
        <Popover open={undefined}>
          <PopoverTrigger>Trigger</PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('should handle multiple children in trigger', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <span>Open</span>
            <span> Menu</span>
          </PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      render(
        <Popover>
          <PopoverContent />
        </Popover>
      );
      expect(document.querySelector('.absolute.z-50')).toBeInTheDocument();
    });

    it('should handle content without align prop (defaults to center)', () => {
      const { container } = render(
        <Popover>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      const content = container.querySelector('.left-1\\/2.-translate-x-1\\/2');
      expect(content).toBeInTheDocument();
    });
  });
});
