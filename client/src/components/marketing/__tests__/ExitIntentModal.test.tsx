/**
 * Tests for ExitIntentModal.tsx
 * Covers: 2-step lead magnet selection flow, consultation/newsletter variants,
 * form validation, success state, and callbacks.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExitIntentModal } from '../ExitIntentModal';

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, role, 'aria-modal': ariaModal, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby }: any) => (
      <div onClick={onClick} className={className} role={role} aria-modal={ariaModal} aria-labelledby={ariaLabelledby} aria-describedby={ariaDescribedby}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Download: () => <span data-testid="icon-download">Download</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Mail: () => <span data-testid="icon-mail">Mail</span>,
  CheckCircle: () => <span data-testid="icon-check">Check</span>,
  BookOpen: () => <span data-testid="icon-book">Book</span>,
  ListChecks: () => <span data-testid="icon-list">List</span>,
  FileText: () => <span data-testid="icon-file">File</span>,
  ArrowLeft: () => <span data-testid="icon-arrow-left">Back</span>,
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ExitIntentModal', () => {
  describe('component definition', () => {
    it('exports the ExitIntentModal component', () => {
      expect(ExitIntentModal).toBeDefined();
      expect(typeof ExitIntentModal).toBe('function');
    });
  });

  describe('when closed', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ExitIntentModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('lead-magnet variant — selection step', () => {
    it('shows the magnet selection prompt on initial open', () => {
      render(<ExitIntentModal {...defaultProps} variant="lead-magnet" />);
      expect(screen.getByText(/grab a free resource/i)).toBeInTheDocument();
      expect(screen.getByText(/which one would help your club most/i)).toBeInTheDocument();
    });

    it('renders all 3 magnet option buttons', () => {
      render(<ExitIntentModal {...defaultProps} variant="lead-magnet" />);
      expect(screen.getByText('Membership Management Guide')).toBeInTheDocument();
      expect(screen.getByText('Organization Management Checklist')).toBeInTheDocument();
      expect(screen.getByText('Templates Bundle')).toBeInTheDocument();
    });

    it('does NOT show email form on selection step', () => {
      render(<ExitIntentModal {...defaultProps} variant="lead-magnet" />);
      expect(screen.queryByPlaceholderText(/enter your email/i)).not.toBeInTheDocument();
    });

    it('calls onAnalytics with magnet_selected when a card is clicked', () => {
      const onAnalytics = jest.fn();
      render(<ExitIntentModal {...defaultProps} variant="lead-magnet" onAnalytics={onAnalytics} />);

      fireEvent.click(screen.getByText('Membership Management Guide'));

      expect(onAnalytics).toHaveBeenCalledWith('exit_intent_magnet_selected', {
        variant: 'lead-magnet',
        magnetType: 'guide',
      });
    });
  });

  describe('lead-magnet variant — email form step', () => {
    const renderAndSelectGuide = () => {
      const result = render(<ExitIntentModal {...defaultProps} variant="lead-magnet" />);
      fireEvent.click(screen.getByText('Membership Management Guide'));
      return result;
    };

    it('shows email form after selecting a magnet', () => {
      renderAndSelectGuide();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('shows the selected magnet title in the form heading', () => {
      renderAndSelectGuide();
      expect(screen.getByText(/Get Your Free Membership Management Guide/i)).toBeInTheDocument();
    });

    it('shows the correct button text for the selected magnet', () => {
      renderAndSelectGuide();
      expect(screen.getByRole('button', { name: /get free guide/i })).toBeInTheDocument();
    });

    it('shows a Back button that returns to selection step', () => {
      renderAndSelectGuide();
      const backBtn = screen.getByRole('button', { name: /back to resource selection/i });
      fireEvent.click(backBtn);
      expect(screen.getByText(/grab a free resource/i)).toBeInTheDocument();
    });

    it('shows validation error when submitting without email', async () => {
      const { container } = renderAndSelectGuide();
      // Use fireEvent.submit to bypass HTML5 required constraint validation in JSDOM
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
      });
    });

    it('shows validation error for invalid email', async () => {
      const { container } = renderAndSelectGuide();
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'notanemail' },
      });
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
      });
    });

    it('calls onEmailCapture with email, name, and magnetType on valid submit', async () => {
      const onEmailCapture = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <ExitIntentModal
          {...defaultProps}
          variant="lead-magnet"
          onEmailCapture={onEmailCapture}
        />
      );
      fireEvent.click(screen.getByText('Organization Management Checklist'));

      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/first name/i), {
        target: { value: 'Alice' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(onEmailCapture).toHaveBeenCalledWith('test@example.com', 'Alice', 'checklist', '', '');
      });
    });

    it('calls onDownload with the selected magnetType after successful capture', async () => {
      const onEmailCapture = jest.fn().mockResolvedValue(undefined);
      const onDownload = jest.fn();
      const { container } = render(
        <ExitIntentModal
          {...defaultProps}
          variant="lead-magnet"
          onEmailCapture={onEmailCapture}
          onDownload={onDownload}
        />
      );
      fireEvent.click(screen.getByText('Templates Bundle'));
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(onDownload).toHaveBeenCalledWith('template');
      });
    });

    it('shows success state after submission', async () => {
      const onEmailCapture = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <ExitIntentModal
          {...defaultProps}
          variant="lead-magnet"
          onEmailCapture={onEmailCapture}
        />
      );
      fireEvent.click(screen.getByText('Membership Management Guide'));
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('shows error message when onEmailCapture throws', async () => {
      const onEmailCapture = jest.fn().mockRejectedValue(new Error('Network error'));
      const { container } = render(
        <ExitIntentModal
          {...defaultProps}
          variant="lead-magnet"
          onEmailCapture={onEmailCapture}
        />
      );
      fireEvent.click(screen.getByText('Membership Management Guide'));
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
      });
    });
  });

  describe('consultation variant', () => {
    it('skips selection step and goes straight to email form', () => {
      render(<ExitIntentModal {...defaultProps} variant="consultation" />);
      expect(screen.queryByText(/grab a free resource/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Before You Go/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('shows name field for consultation variant', () => {
      render(<ExitIntentModal {...defaultProps} variant="consultation" />);
      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    });

    it('shows Schedule Free Call button', () => {
      render(<ExitIntentModal {...defaultProps} variant="consultation" />);
      expect(screen.getByRole('button', { name: /schedule free call/i })).toBeInTheDocument();
    });
  });

  describe('newsletter variant', () => {
    it('skips selection step and goes straight to email form', () => {
      render(<ExitIntentModal {...defaultProps} variant="newsletter" />);
      expect(screen.queryByText(/grab a free resource/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Don't Miss Club Management Tips/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('shows Subscribe Now button', () => {
      render(<ExitIntentModal {...defaultProps} variant="newsletter" />);
      expect(screen.getByRole('button', { name: /subscribe now/i })).toBeInTheDocument();
    });
  });

  describe('close and dismiss behavior', () => {
    it('calls onClose when X button is clicked', () => {
      const onClose = jest.fn();
      render(<ExitIntentModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText(/close modal/i));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onAnalytics with dismissed event on X click', () => {
      const onAnalytics = jest.fn();
      render(<ExitIntentModal {...defaultProps} onAnalytics={onAnalytics} />);
      fireEvent.click(screen.getByLabelText(/close modal/i));
      expect(onAnalytics).toHaveBeenCalledWith(
        'exit_intent_modal_dismissed',
        expect.objectContaining({ method: 'close_button' })
      );
    });

    it('tracks modal shown event on open', () => {
      const onAnalytics = jest.fn();
      render(<ExitIntentModal {...defaultProps} onAnalytics={onAnalytics} variant="newsletter" />);
      expect(onAnalytics).toHaveBeenCalledWith('exit_intent_modal_shown', { variant: 'newsletter' });
    });
  });
});
