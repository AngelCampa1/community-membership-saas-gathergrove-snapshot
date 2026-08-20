import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import { CreateEventRequest, EventResponse } from '@/types/event';

// Ensure cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock the useClubTier hook
jest.mock('@/hooks/useClubTier', () => ({
  useClubTier: () => ({ canSendInvitations: false })
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
}));

// Mock RadixUI components
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: any) => (open ? <div data-testid="dialog-root">{children}</div> : null),
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children, ...props }: any) => <div data-testid="dialog-overlay" {...props}>{children}</div>,
  Content: React.forwardRef(({ children, ...props }: any, ref) => (
    <div ref={ref} data-testid="dialog-content" {...props}>{children}</div>
  )),
  Title: ({ children, ...props }: any) => <h2 data-testid="dialog-title" {...props}>{children}</h2>,
  Description: ({ children, ...props }: any) => <p data-testid="dialog-description" {...props}>{children}</p>,
  Close: ({ children, ...props }: any) => <button data-testid="dialog-close" {...props}>{children}</button>,
}));

jest.mock('@radix-ui/react-checkbox', () => ({
  Root: React.forwardRef(({ checked, onCheckedChange, ...props }: any, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  )),
  Indicator: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null
  ),
  DialogContent: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div data-testid="dialog-header" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  DialogFooter: ({ children, ...props }: any) => <div data-testid="dialog-footer" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, ...props }: any) => (
    <button onClick={onClick} type={type || 'button'} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input onChange={onChange} value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, ...props }: any) => (
    <textarea onChange={onChange} value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef(({ checked, onCheckedChange, ...props }: any, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )),
}));

describe('EventForm - Pricing Functionality', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    // Mocks are cleared in global afterEach
  });

  describe('Free Event Functionality', () => {
    it('should show pricing fields by default', () => {
      render(<EventForm {...defaultProps} />);

      expect(screen.getByTestId('input-memberPrice')).toBeInTheDocument();
      expect(screen.getByTestId('input-nonMemberPrice')).toBeInTheDocument();
      expect(screen.getByLabelText(/This is a free event/)).toBeInTheDocument();
    });

    it('should hide pricing fields when marked as free', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      const freeCheckbox = screen.getByLabelText(/This is a free event/);
      await user.click(freeCheckbox);

      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-nonMemberPrice')).not.toBeInTheDocument();
      expect(screen.getByText(/Free events don't require pricing information/)).toBeInTheDocument();
    });

    it('should show pricing fields when unchecking free event', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      const freeCheckbox = screen.getByLabelText(/This is a free event/);
      await user.click(freeCheckbox);
      await user.click(freeCheckbox);

      expect(screen.getByTestId('input-memberPrice')).toBeInTheDocument();
      expect(screen.getByTestId('input-nonMemberPrice')).toBeInTheDocument();
    });

    it('should clear prices when marking as free', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      let memberPriceInput = screen.getByTestId('input-memberPrice');
      let nonMemberPriceInput = screen.getByTestId('input-nonMemberPrice');

      await user.type(memberPriceInput, '10.00');
      await user.type(nonMemberPriceInput, '15.00');

      const freeCheckbox = screen.getByLabelText(/This is a free event/);
      await user.click(freeCheckbox);

      // When marked as free, pricing fields should be hidden
      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-nonMemberPrice')).not.toBeInTheDocument();

      // Uncheck to show fields again - prices should remain cleared
      await user.click(freeCheckbox);

      // Re-query the inputs after they're visible again
      memberPriceInput = screen.getByTestId('input-memberPrice');
      nonMemberPriceInput = screen.getByTestId('input-nonMemberPrice');

      expect(memberPriceInput).toHaveValue(null);
      expect(nonMemberPriceInput).toHaveValue(null);
    });
  });

  describe('Price Input Validation', () => {
    it('should accept valid member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      const memberPriceInput = screen.getByTestId('input-memberPrice');
      await user.type(memberPriceInput, '25.50');

      expect(memberPriceInput).toHaveValue(25.5);
    });

    it('should accept valid non-member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      const nonMemberPriceInput = screen.getByTestId('input-nonMemberPrice');
      await user.type(nonMemberPriceInput, '35.99');

      expect(nonMemberPriceInput).toHaveValue(35.99);
    });

    it('should show error for negative member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '-10');

      // Get the form element and submit it directly
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      // Should show error after form submission
      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-memberPrice')).toHaveTextContent(/Member price cannot be negative/);

      // onSubmit should not have been called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for negative non-member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const nonMemberPriceInput = screen.getByTestId("input-nonMemberPrice");
      await user.clear(nonMemberPriceInput);
      await user.type(nonMemberPriceInput, '-5');

      // Get the form element and submit it directly
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByTestId('error-nonMemberPrice')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-nonMemberPrice')).toHaveTextContent(/Non-member price cannot be negative/);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when member price exceeds maximum', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '10000.01');

      // Get the form element and submit it directly
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-memberPrice')).toHaveTextContent(/Price cannot exceed \$10,000/);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when member price is greater than non-member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      const nonMemberPriceInput = screen.getByTestId("input-nonMemberPrice");

      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '25.00');
      await user.clear(nonMemberPriceInput);
      await user.type(nonMemberPriceInput, '15.00');

      // Get the form element and submit it directly
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-memberPrice')).toHaveTextContent(/Member price cannot be greater than non-member price/);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should allow equal member and non-member prices', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      const nonMemberPriceInput = screen.getByTestId("input-nonMemberPrice");

      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '20.00');
      await user.clear(nonMemberPriceInput);
      await user.type(nonMemberPriceInput, '20.00');

      // Get the form element and submit it directly
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      // Should not show any error
      expect(screen.queryByTestId('error-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-nonMemberPrice')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission with Pricing', () => {
    it('should submit free event correctly', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Free Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');
      
      const freeCheckbox = screen.getByLabelText(/This is a free event/);
      await user.click(freeCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /Create Event/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Free Test Event',
            location: 'Test Location',
            description: 'Test Description',
            isFree: true,
            memberPrice: null,
            nonMemberPrice: null,
          })
        );
      });
    });

    it('should submit paid event correctly', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Event Name/), 'Paid Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');
      
      const memberPriceInput = screen.getByTestId("input-memberPrice");
      const nonMemberPriceInput = screen.getByTestId("input-nonMemberPrice");
      
      await user.type(memberPriceInput, '10.00');
      await user.type(nonMemberPriceInput, '15.00');
      
      const submitButton = screen.getByRole('button', { name: /Create Event/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Paid Test Event',
            location: 'Test Location',
            description: 'Test Description',
            isFree: false,
            memberPrice: 10,
            nonMemberPrice: 15,
          })
        );
      });
    });
  });

  describe('Edit Mode with Pricing', () => {
    const mockEvent: EventResponse = {
      id: 1,
      name: 'Existing Event',
      eventDateTime: '2030-12-25T15:30:00Z',
      location: 'Existing Location',
      description: 'Existing Description',
      memberPrice: 12.50,
      nonMemberPrice: 18.00,
      isFree: false,
      clubId: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      attendeeCount: 0,
      totalRsvpCount: 0
    };

    it('should pre-populate pricing fields when editing', () => {
      render(<EventForm {...defaultProps} event={mockEvent} isEditing={true} />);
      
      expect(screen.getByDisplayValue('12.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
      expect(screen.getByLabelText(/This is a free event/)).not.toBeChecked();
    });

    it('should pre-populate free event correctly', () => {
      const freeEvent: EventResponse = {
        ...mockEvent,
        memberPrice: null,
        nonMemberPrice: null,
        isFree: true,
      };

      render(<EventForm {...defaultProps} event={freeEvent} isEditing={true} />);
      
      expect(screen.getByLabelText(/This is a free event/)).toBeChecked();
      expect(screen.queryByLabelText(/Member Price/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Non-Member Price/)).not.toBeInTheDocument();
    });
  });

  describe('Error Clearing', () => {
    it('should clear price errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields and create an error
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '-10');

      // Submit form to trigger validation
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      // Clear the input and type a valid value - this should clear the error
      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '10');

      // Error should be cleared after typing
      await waitFor(() => {
        expect(screen.queryByTestId('error-memberPrice')).not.toBeInTheDocument();
      });
    });

    it('should clear price errors when marking as free', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill required fields and create an error
      await user.type(screen.getByLabelText(/Event Name/), 'Test Event');
      await user.type(screen.getByLabelText(/Event Date/), '2030-12-25');
      await user.type(screen.getByLabelText(/Event Time/), '15:30');
      await user.type(screen.getByLabelText(/Location/), 'Test Location');
      await user.type(screen.getByLabelText(/Description/), 'Test Description');

      const memberPriceInput = screen.getByTestId("input-memberPrice");
      await user.clear(memberPriceInput);
      await user.type(memberPriceInput, '-10');

      // Submit form to trigger validation
      const form = screen.getByTestId('dialog-content').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      // Mark as free - this should clear the error and hide pricing fields
      const freeCheckbox = screen.getByLabelText(/This is a free event/);
      await user.click(freeCheckbox);

      // Pricing fields should be hidden now
      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-nonMemberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-memberPrice')).not.toBeInTheDocument();

      // Submit again - should work now
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });
});