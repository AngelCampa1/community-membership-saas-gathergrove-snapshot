/**
 * Test the Dialog mock in isolation to verify it works correctly
 */
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '../dialog';

describe('Dialog Mock', () => {
  it('should render trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('should not show content when dialog is closed', () => {
    render(
      <Dialog>
        <DialogTrigger>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog Content</p>
        </DialogContent>
      </Dialog>
    );

    // Trigger should be visible
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();

    // Content should NOT be visible when closed
    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
  });

  it('should show content when dialog is opened', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog Content</p>
        </DialogContent>
      </Dialog>
    );

    // Click trigger to open
    await user.click(screen.getByText('Open Dialog'));

    // Content should now be visible
    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  it('should close dialog when DialogClose is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog Content</p>
          <DialogClose>
            <button>Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    // Open dialog
    await user.click(screen.getByText('Open Dialog'));
    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    // Close dialog
    await user.click(screen.getByText('Close'));

    // Content should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
  });

  it('should work with controlled open prop', () => {
    const TestComponent = () => {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button onClick={() => setOpen(true)}>External Open</button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Controlled Dialog</DialogTitle>
              <p>Content</p>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    render(<TestComponent />);

    // Content should not be visible initially
    expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when opened via trigger', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open Dialog'));

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('should work with asChild prop on trigger', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <button className="custom-button">Custom Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Custom Trigger');
    expect(trigger).toHaveClass('custom-button');

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });
  });
});
