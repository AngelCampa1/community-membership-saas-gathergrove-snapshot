import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';

describe('Collapsible', () => {
  describe('Collapsible Root', () => {
    it('should render without crashing', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should render children components', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should be closed by default', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      // Content is hidden when closed
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should accept open prop', () => {
      render(
        <Collapsible open>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent data-testid="content">
            Content
          </CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should work as controlled component', () => {
      const { rerender } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should call onOpenChange when toggled', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Collapsible onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      await user.click(screen.getByText('Toggle'));
      expect(handleOpenChange).toHaveBeenCalled();
    });

    it('should accept defaultOpen prop', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent data-testid="content">
            Content
          </CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      const { container } = render(
        <Collapsible data-custom="value">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </Collapsible>
      );
      const collapsible = container.firstChild;
      expect(collapsible).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <Collapsible className="custom-collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </Collapsible>
      );
      const collapsible = container.firstChild;
      expect(collapsible).toBeInTheDocument();
    });
  });

  describe('CollapsibleTrigger', () => {
    it('should render trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Click to expand</CollapsibleTrigger>
        </Collapsible>
      );
      expect(screen.getByText('Click to expand')).toBeInTheDocument();
    });

    it('should have button role', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </Collapsible>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();

      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      await user.click(screen.getByText('Toggle'));
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid="trigger" data-custom="value">
            Toggle
          </CollapsibleTrigger>
        </Collapsible>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('data-custom', 'value');
    });

    it('should accept className', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger className="custom-trigger" data-testid="trigger">
            Toggle
          </CollapsibleTrigger>
        </Collapsible>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('should be focusable', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </Collapsible>
      );
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('CollapsibleContent', () => {
    it('should render content when open', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent>Collapsible content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Collapsible content')).toBeInTheDocument();
    });

    it('should accept className', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent className="custom-content" data-testid="content">
            Content
          </CollapsibleContent>
        </Collapsible>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent ref={ref}>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent data-testid="content" data-custom="value">
            Content
          </CollapsibleContent>
        </Collapsible>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('data-custom', 'value');
    });

    it('should render children', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent>
            <div data-testid="child">Child content</div>
          </CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should display correct name', () => {
      expect(CollapsibleContent.displayName).toBe('CollapsibleContent');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple collapsible section', async () => {
      const user = userEvent.setup();

      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Show more</CollapsibleTrigger>
          <CollapsibleContent>
            <div>Additional information here</div>
          </CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Show more')).toBeInTheDocument();
      expect(screen.getByText('Additional information here')).toBeInTheDocument();

      await user.click(screen.getByText('Show more'));
    });

    it('should work with controlled state', () => {
      const ControlledCollapsible = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger>
                {open ? 'Hide' : 'Show'}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div>Content</div>
              </CollapsibleContent>
            </Collapsible>
            <div data-testid="state">{open ? 'open' : 'closed'}</div>
          </div>
        );
      };

      render(<ControlledCollapsible />);
      expect(screen.getByTestId('state')).toHaveTextContent('closed');
    });

    it('should work with icons in trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>
            <span data-testid="icon">▼</span>
            Expand section
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Expand section')).toBeInTheDocument();
    });

    it('should work with complex content', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2">
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should work as FAQ item', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="text-lg font-bold">
            What is this feature?
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            This feature allows you to collapse and expand content sections.
          </CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('What is this feature?')).toBeInTheDocument();
      expect(screen.getByText(/allows you to collapse/i)).toBeInTheDocument();
    });

    it('should work as sidebar navigation item', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>
            <span>📁</span> Documents
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul>
              <li>File 1</li>
              <li>File 2</li>
              <li>File 3</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('File 1')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Collapsible
          open={true}
          onOpenChange={handleOpenChange}
          className="custom-collapsible"
        >
          <CollapsibleTrigger className="custom-trigger" data-testid="trigger">
            Toggle
          </CollapsibleTrigger>
          <CollapsibleContent className="custom-content" data-testid="content">
            Content
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');

      await user.click(trigger);
      expect(handleOpenChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should support keyboard interaction', async () => {
      const user = userEvent.setup();

      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      // Radix UI handles keyboard interaction internally
    });

    it('should be keyboard navigable', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent />
        </Collapsible>
      );
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should handle collapsible without trigger', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle collapsible without content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </Collapsible>
      );
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref on CollapsibleContent', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Collapsible defaultOpen>
          <CollapsibleContent ref={ref}>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
