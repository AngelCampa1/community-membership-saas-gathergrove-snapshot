import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogPortal,
  AlertDialogOverlay,
} from '../alert-dialog';

describe('AlertDialog', () => {
  describe('AlertDialog Root', () => {
    it('should render without crashing', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
        </AlertDialog>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <AlertDialog open defaultOpen>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <div data-testid="content">Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should accept open prop to show content', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('AlertDialogTrigger', () => {
    it('should render trigger button', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        </AlertDialog>
      );
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
        </AlertDialog>
      );
      const trigger = screen.getByText('Open').closest('[data-slot="alert-dialog-trigger"]');
      expect(trigger).toBeInTheDocument();
    });

    it('should open dialog when clicked', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Dialog Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('Open'));
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });
  });

  describe('AlertDialogContent', () => {
    it('should render content when dialog is open', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div>Dialog Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div data-testid="content">Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="alert-dialog-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent className="custom-class">
            <div data-testid="content">Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="alert-dialog-content"]');
      expect(content).toHaveClass('custom-class');
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div data-testid="content">Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const content = screen.getByTestId('content').closest('[data-slot="alert-dialog-content"]');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('rounded-lg');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('shadow-lg');
    });

    it('should render overlay automatically', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div>Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('AlertDialogOverlay', () => {
    it('should render when content is rendered', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div>Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div>Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
      expect(overlay).toHaveAttribute('data-slot', 'alert-dialog-overlay');
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <div>Content</div>
          </AlertDialogContent>
        </AlertDialog>
      );
      const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('bg-black/50');
    });

    it('should apply custom className when passed', () => {
      render(
        <AlertDialog open>
          <AlertDialogPortal>
            <AlertDialogOverlay className="custom-overlay" />
            <AlertDialogContent>
              <div>Content</div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      );
      const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
      expect(overlay).toHaveClass('custom-overlay');
    });
  });

  describe('AlertDialogPortal', () => {
    it('should render content in portal', () => {
      render(
        <AlertDialog open>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent>
              <div data-testid="portal-content">Content</div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      );
      expect(screen.getByTestId('portal-content')).toBeInTheDocument();
    });
  });

  describe('AlertDialogHeader', () => {
    it('should render header content', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div>Header Content</div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div data-testid="header">Header</div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="alert-dialog-header"]');
      expect(header).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div data-testid="header">Header</div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="alert-dialog-header"]');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('gap-2');
      expect(header).toHaveClass('text-center');
      expect(header).toHaveClass('sm:text-left');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header">
              <div data-testid="header">Header</div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      const header = screen.getByTestId('header').closest('[data-slot="alert-dialog-header"]');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('AlertDialogFooter', () => {
    it('should render footer content', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogFooter>
              <div>Footer Content</div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogFooter>
              <div data-testid="footer">Footer</div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="alert-dialog-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogFooter>
              <div data-testid="footer">Footer</div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="alert-dialog-footer"]');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
      expect(footer).toHaveClass('gap-2');
      expect(footer).toHaveClass('sm:flex-row');
      expect(footer).toHaveClass('sm:justify-end');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogFooter className="custom-footer">
              <div data-testid="footer">Footer</div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      const footer = screen.getByTestId('footer').closest('[data-slot="alert-dialog-footer"]');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('AlertDialogTitle', () => {
    it('should render title text', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="alert-dialog-title"]');
      expect(title).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="alert-dialog-title"]');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle className="custom-title">Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      const title = screen.getByText('Title').closest('[data-slot="alert-dialog-title"]');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('AlertDialogDescription', () => {
    it('should render description text', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogDescription>This is a description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="alert-dialog-description"]');
      expect(description).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="alert-dialog-description"]');
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('text-sm');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogDescription className="custom-description">Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      const description = screen.getByText('Description').closest('[data-slot="alert-dialog-description"]');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('AlertDialogAction', () => {
    it('should render action button', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should have button role', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('should apply button variant styles', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      const button = screen.getByRole('button', { name: /confirm/i });
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogAction className="custom-action">Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      const button = screen.getByRole('button', { name: /confirm/i });
      expect(button).toHaveClass('custom-action');
    });

    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogAction onClick={handleClick}>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('AlertDialogCancel', () => {
    it('should render cancel button', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should have button role', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should apply outline variant styles', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      const button = screen.getByRole('button', { name: /cancel/i });
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
    });

    it('should apply custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogCancel className="custom-cancel">Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      const button = screen.getByRole('button', { name: /cancel/i });
      expect(button).toHaveClass('custom-cancel');
    });

    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogCancel onClick={handleClick}>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Full Dialog Integration', () => {
    it('should render complete dialog structure', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should handle action and cancel clicks', async () => {
      const handleAction = jest.fn();
      const handleCancel = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should support controlled open state', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      // AlertDialog uses role="alertdialog" from Radix
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should render title for accessibility', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Important Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const dialog = screen.getByRole('alertdialog');
      const title = screen.getByText('Important Alert');

      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });

    it('should render description for accessibility', () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
            <AlertDialogDescription>Important information</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      const dialog = screen.getByRole('alertdialog');
      const description = screen.getByText('Important information');

      expect(dialog).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });
});
