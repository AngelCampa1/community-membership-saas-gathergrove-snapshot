import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogClose,
} from '../dialog';

describe('Dialog', () => {
  describe('Dialog Root', () => {
    it('should render without crashing', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <Dialog open defaultOpen>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <div data-testid="content">Content</div>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should accept open prop to show content', () => {
      render(
        <Dialog open={true}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('DialogTrigger', () => {
    it('should render trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );
      const trigger = screen.getByText('Open').closest('[data-slot="dialog-trigger"]');
      expect(trigger).toBeInTheDocument();
    });

    it('should open dialog when clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open'));
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });
  });

  describe('DialogContent', () => {
    it('should render content when dialog is open', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Dialog Content</div>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div data-testid="content">Content</div>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="dialog-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Dialog open>
          <DialogContent className="custom-class">
            <div data-testid="content">Content</div>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="dialog-content"]');
      expect(content).toHaveClass('custom-class');
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div data-testid="content">Content</div>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="dialog-content"]');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('rounded-xl');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('shadow-xl');
      expect(content).toHaveClass('glass-strong');
    });

    it('should render overlay automatically', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should render close button automatically', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render XIcon in close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      const svgIcon = closeButton.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('should have sr-only text for close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Close')).toHaveClass('sr-only');
    });

    it('should have max height constraint', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div data-testid="content">Content</div>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="dialog-content"]');
      expect(content).toHaveClass('max-h-[90vh]');
      expect(content).toHaveClass('overflow-y-auto');
    });
  });

  describe('DialogOverlay', () => {
    it('should render when content is rendered', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toHaveAttribute('data-slot', 'dialog-overlay');
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('bg-black/60');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should apply custom className when passed', () => {
      render(
        <Dialog open>
          <DialogPortal>
            <DialogOverlay className="custom-overlay" />
            <DialogContent>
              <div>Content</div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toHaveClass('custom-overlay');
    });
  });

  describe('DialogPortal', () => {
    it('should render content in portal', () => {
      render(
        <Dialog open>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent>
              <div data-testid="portal-content">Content</div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      );
      expect(screen.getByTestId('portal-content')).toBeInTheDocument();
    });
  });

  describe('DialogHeader', () => {
    it('should render header content', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <div>Header Content</div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <div data-testid="header">Header</div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="dialog-header"]');
      expect(header).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <div data-testid="header">Header</div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="dialog-header"]');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('gap-2');
      expect(header).toHaveClass('text-center');
      expect(header).toHaveClass('sm:text-left');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader className="custom-header">
              <div data-testid="header">Header</div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="dialog-header"]');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('should render footer content', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <div>Footer Content</div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <div data-testid="footer">Footer</div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="dialog-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <div data-testid="footer">Footer</div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
      expect(footer).toHaveClass('gap-2');
      expect(footer).toHaveClass('sm:flex-row');
      expect(footer).toHaveClass('sm:justify-end');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter className="custom-footer">
              <div data-testid="footer">Footer</div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('DialogTitle', () => {
    it('should render title text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="dialog-title"]');
      expect(title).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="dialog-title"]');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="dialog-title"]');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('should render description text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription>This is a description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="dialog-description"]');
      expect(description).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="dialog-description"]');
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('text-sm');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription className="custom-description">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="dialog-description"]');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('DialogClose', () => {
    it('should render close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      );
      // There are two close buttons now: the automatic X and the custom one
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should have data-slot attribute', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogClose>Close Dialog</DialogClose>
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByText('Close Dialog').closest('[data-slot="dialog-close"]');
      expect(closeButton).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Dialog open>
          <DialogContent>
            <DialogClose onClick={handleClick}>Close Dialog</DialogClose>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Close Dialog'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Full Dialog Integration', () => {
    it('should render complete dialog structure', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should handle close and action clicks', async () => {
      const handleClose = jest.fn();
      const handleAction = jest.fn();
      const user = userEvent.setup();

      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Confirm</DialogTitle>
            <DialogFooter>
              <DialogClose onClick={handleClose}>Cancel</DialogClose>
              <button onClick={handleAction}>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Cancel'));
      expect(handleClose).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should support controlled open state', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should handle X button click', async () => {
      const user = userEvent.setup();

      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));
      expect(xButton).toBeInTheDocument();

      // Click should work (though dialog won't close without onOpenChange handler)
      if (xButton) {
        await user.click(xButton);
        // Just verify it's clickable without errors
        expect(xButton).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      // Dialog uses role="dialog" from Radix
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render title for accessibility', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Important Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const title = screen.getByText('Important Dialog');

      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });

    it('should render description for accessibility', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription>Important information</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const description = screen.getByText('Important information');

      expect(dialog).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAccessibleName();
    });
  });
});
