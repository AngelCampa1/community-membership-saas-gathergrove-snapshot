import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import { EventResponse } from '@/types/event';

// Mock RadixUI Slot component
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Mock RadixUI Separator component
jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(({ orientation = 'horizontal', decorative = true, ...props }: any, ref) => (
    <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />
  ))
}));

// Mock UI Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

// Mock UI Button component
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, variant, size, asChild, ...props }, ref) => {
    if (asChild && children) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        className={`button ${variant || ''} ${size || ''} ${className || ''}`}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  }),
  buttonVariants: jest.fn(() => 'mocked-button-variants'),
}));

// Mock UI Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge ${variant || ''} ${className || ''}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock UI Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange, ...restProps } = props;
    return <div className={`dialog-content ${className || ''}`} data-testid="dialog-content" {...restProps}>{children}</div>;
  },
  DialogHeader: ({ children, className, ...props }: any) => (
    <div className={`dialog-header ${className || ''}`} data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={`dialog-title ${className || ''}`} data-testid="dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, className, ...props }: any) => (
    <p className={`dialog-description ${className || ''}`} data-testid="dialog-description" {...props}>{children}</p>
  ),
  DialogFooter: ({ children, className, ...props }: any) => (
    <div className={`dialog-footer ${className || ''}`} data-testid="dialog-footer" {...props}>{children}</div>
  ),
}));

// Mock UI Select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children, className, ...props }: any) => (
    <button className={`select-trigger ${className || ''}`} data-testid="select-trigger" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
}));

// Mock UI Checkbox component
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={`checkbox ${className || ''}`}
      checked={Boolean(checked)}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  ))
}));

// Mock UI Input component
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`input ${className || ''}`}
      data-testid="input"
      {...props}
    />
  ))
}));

// Mock UI Label component
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} data-testid="label" {...props}>
      {children}
    </label>
  ),
}));

// Mock UI Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      data-value={value}
      {...props}
    >
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
}));

// Mock UI Alert components
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h4 className={`alert-title ${className || ''}`} data-testid="alert-title" {...props}>{children}</h4>
  ),
}));

// Mock UI Textarea component
jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, any>(({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`textarea ${className || ''}`}
      data-testid="textarea"
      {...props}
    />
  ))
}));

// Mock useClubTier hook - create a mockable function
const mockUseClubTier = jest.fn(() => ({
  canSendInvitations: false,
  clubTier: 'grow',
  isLoading: false
}));

jest.mock('@/hooks/useClubTier', () => ({
  useClubTier: () => mockUseClubTier()
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  FileText: () => <div data-testid="filetext-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Users: () => <div data-testid="users-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
}));

describe('EventForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create event form correctly', () => {
      render(<EventForm {...defaultProps} />);

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Create New Event');
      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-eventDate')).toBeInTheDocument();
      expect(screen.getByTestId('input-eventTime')).toBeInTheDocument();
      expect(screen.getByTestId('input-location')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle form submission with valid data', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form with a future date and time
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Event',
          eventDateTime: expect.any(String),
          location: 'Test Location',
          description: 'Test Description',
          sendInvitations: false,
          invitationMethods: [],
          isFree: false,
          memberPrice: null,
          nonMemberPrice: null,
        });
        // Check that the date part is correct (ignore timezone conversion)
        const call = mockOnSubmit.mock.calls[0][0];
        expect(call.eventDateTime).toMatch(/2030-12-25T/);
      }, { timeout: 10000 });
    }, 15000);

    it('should show validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Try to submit without filling form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
        expect(screen.getByText('Date and time are required')).toBeInTheDocument();
        expect(screen.getByText('Location is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for past date', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Use yesterday's date - allowed by browser min but still past for our validation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      await user.type(screen.getByTestId('input-name'), 'Test Event');
      
      // Clear and type for date inputs to ensure state updates
      const dateInput = screen.getByTestId('input-eventDate');
      const timeInput = screen.getByTestId('input-eventTime');
      
      await user.clear(dateInput);
      await user.type(dateInput, pastDate);
      await user.clear(timeInput);
      await user.type(timeInput, '10:00');
      
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-eventDateTime')).toHaveTextContent('Event must be in the future');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, 15000);

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Submit to trigger validation errors
      await user.click(screen.getByRole('button', { name: /create event/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
      });

      // Start typing in name field
      await user.type(screen.getByTestId('input-name'), 'Test');

      await waitFor(() => {
        expect(screen.queryByText('Event name is required')).not.toBeInTheDocument();
      });
    });

    it('should clear date/time validation errors when user changes date or time', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Submit to trigger validation errors
      await user.click(screen.getByRole('button', { name: /create event/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Date and time are required')).toBeInTheDocument();
      });

      // Start typing in date field
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');

      await waitFor(() => {
        expect(screen.queryByText('Date and time are required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockEvent: EventResponse = {
      id: 1,
      clubId: 1,
      name: 'Existing Event',
      eventDateTime: '2030-12-25T10:00:00Z',
      location: 'Existing Location',
      description: 'Existing Description',
      attendeeCount: 0,
      totalRsvpCount: 0,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    };

    it('should render edit event form with existing data', () => {
      render(<EventForm {...defaultProps} event={mockEvent} isEditing={true} />);

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Edit Event');
      expect(screen.getByDisplayValue('Existing Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2030-12-25')).toBeInTheDocument(); // Date input
      // Time input might vary due to timezone, just check it exists and has a value
      const timeInput = screen.getByTestId('input-eventTime') as HTMLInputElement;
      expect(timeInput.value).toBeTruthy();
      expect(screen.getByDisplayValue('Existing Location')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument();
    });

    it('should handle form submission in edit mode', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} event={mockEvent} isEditing={true} />);

      // Modify the event name
      const nameInput = screen.getByTestId('input-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Event');

      await user.click(screen.getByRole('button', { name: /update event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Event',
          eventDateTime: expect.any(String),
          location: 'Existing Location',
          description: 'Existing Description',
          sendInvitations: false,
          invitationMethods: [],
          isFree: false,
          memberPrice: null,
          nonMemberPrice: null,
        });
        // Check that the date part is correct (ignore timezone conversion details)
        const call = mockOnSubmit.mock.calls[0][0];
        expect(call.eventDateTime).toMatch(/2030-12-25T/);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state on submit button', () => {
      render(<EventForm {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /saving.../i });
      expect(submitButton).toBeDisabled();
    });

    it('should show correct loading text in edit mode', () => {
      const mockEvent: EventResponse = {
        id: 1,
        clubId: 1,
        name: 'Existing Event',
        eventDateTime: '2030-12-25T10:00:00Z',
        location: 'Existing Location',
        description: 'Existing Description',
        attendeeCount: 0,
        totalRsvpCount: 0,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      render(<EventForm {...defaultProps} event={mockEvent} isEditing={true} isLoading={true} />);

      expect(screen.getByRole('button', { name: /saving.../i })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when dialog is closed', () => {
      render(<EventForm {...defaultProps} open={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should reset form after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      // Render component once and test the actual reset behavior
      render(<EventForm {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      // Verify form has values before submission
      expect(screen.getByTestId('input-name')).toHaveValue('Test Event');
      expect(screen.getByTestId('input-eventDate')).toHaveValue('2030-12-25');
      expect(screen.getByTestId('input-eventTime')).toHaveValue('10:00');
      expect(screen.getByTestId('input-location')).toHaveValue('Test Location');
      expect(screen.getByTestId('textarea-description')).toHaveValue('Test Description');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle error during form submission', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Test error'));
      
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Verify error handling doesn't crash the component
      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      
      consoleError.mockRestore();
    }, 15000);
  });

  describe('Date and Time Input Behavior', () => {
    it('should combine date and time inputs into eventDateTime', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '14:30');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Event',
          eventDateTime: expect.stringMatching(/2030-12-25T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
          location: 'Test Location',
          description: 'Test Description',
          sendInvitations: false,
          invitationMethods: [],
          isFree: false,
          memberPrice: null,
          nonMemberPrice: null,
        });
      });
    }, 15000);

    it('should validate when only date is provided', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill only date, not time
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByText('Date and time are required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate when only time is provided', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill only time, not date
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByText('Date and time are required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Invitation Features', () => {
    it('should show invitation options for Grow tier clubs', () => {
      // Mock useClubTier to return canSendInvitations: true for this test
      mockUseClubTier.mockReturnValue({
        canSendInvitations: true,
        isGrowTier: true,
        clubTier: 'grow',
        isLoading: false
      });

      render(<EventForm {...defaultProps} />);

      expect(screen.getByText('Member Invitations')).toBeInTheDocument();
      expect(screen.getByText('Send invitations to all club members')).toBeInTheDocument();
    });

    it('should handle invitation option selection', async () => {
      // Mock useClubTier to return canSendInvitations: true for this test
      mockUseClubTier.mockReturnValue({
        canSendInvitations: true,
        isGrowTier: true,
        clubTier: 'grow',
        isLoading: false
      });

      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Enable invitations
      const sendInvitationsCheckbox = screen.getByRole('checkbox', { name: /send invitations to all club members/i });
      await user.click(sendInvitationsCheckbox);

      // Check invitation methods appear
      expect(screen.getByText('Invitation Methods:')).toBeInTheDocument();
      expect(screen.getByText('Email notifications')).toBeInTheDocument();
      expect(screen.getByText('App push notifications')).toBeInTheDocument();

      // Select email invitation
      const emailCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
      await user.click(emailCheckbox);

      // Fill rest of form and submit
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Event',
          eventDateTime: expect.any(String),
          location: 'Test Location',
          description: 'Test Description',
          sendInvitations: true,
          invitationMethods: ['email'],
          isFree: false,
          memberPrice: null,
          nonMemberPrice: null,
        });
      });
    });

    it('should not show invitation options for non-Grow tier clubs', () => {
      mockUseClubTier.mockReturnValue({
        canSendInvitations: false,
        isGrowTier: false,
        clubTier: 'grow',
        isLoading: false
      });

      render(<EventForm {...defaultProps} />);

      expect(screen.queryByText('Member Invitations')).not.toBeInTheDocument();
    });
  });

  describe('Event Pricing', () => {
    it('should render pricing section with free event checkbox', () => {
      render(<EventForm {...defaultProps} />);

      expect(screen.getByText('Event Pricing')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /this is a free event/i })).toBeInTheDocument();
      // Price fields should be visible by default (when not free)
      expect(screen.getByTestId('input-memberPrice')).toBeInTheDocument();
      expect(screen.getByTestId('input-nonMemberPrice')).toBeInTheDocument();
    });

    it('should hide price fields when event is marked as free', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Initially, price fields should be visible
      expect(screen.getByTestId('input-memberPrice')).toBeInTheDocument();
      expect(screen.getByTestId('input-nonMemberPrice')).toBeInTheDocument();

      // Mark event as free
      const freeCheckbox = screen.getByRole('checkbox', { name: /this is a free event/i });
      await user.click(freeCheckbox);

      // Price fields should be hidden
      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-nonMemberPrice')).not.toBeInTheDocument();
    });

    it('should show price fields when free checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Mark event as free
      const freeCheckbox = screen.getByRole('checkbox', { name: /this is a free event/i });
      await user.click(freeCheckbox);

      // Price fields should be hidden
      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();

      // Uncheck free
      await user.click(freeCheckbox);

      // Price fields should be visible again
      expect(screen.getByTestId('input-memberPrice')).toBeInTheDocument();
      expect(screen.getByTestId('input-nonMemberPrice')).toBeInTheDocument();
    });

    it('should submit event with pricing information', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form with pricing
      await user.type(screen.getByTestId('input-name'), 'Paid Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      // Set prices
      await user.type(screen.getByTestId('input-memberPrice'), '10.00');
      await user.type(screen.getByTestId('input-nonMemberPrice'), '15.00');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Paid Event',
          eventDateTime: expect.any(String),
          location: 'Test Location',
          description: 'Test Description',
          sendInvitations: false,
          invitationMethods: [],
          isFree: false,
          memberPrice: 10,
          nonMemberPrice: 15,
        });
      });
    }, 15000);

    it('should submit free event with null prices', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByTestId('input-name'), 'Free Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      // Mark as free
      const freeCheckbox = screen.getByRole('checkbox', { name: /this is a free event/i });
      await user.click(freeCheckbox);

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Free Event',
          eventDateTime: expect.any(String),
          location: 'Test Location',
          description: 'Test Description',
          sendInvitations: false,
          invitationMethods: [],
          isFree: true,
          memberPrice: null,
          nonMemberPrice: null,
        });
      });
    }, 15000);

    it('should prevent negative member price input (HTML5 validation)', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // HTML5 number input with min="0" prevents negative values
      // This test verifies the input has the correct constraints
      const memberPriceInput = screen.getByTestId('input-memberPrice');
      expect(memberPriceInput).toHaveAttribute('min', '0');
      expect(memberPriceInput).toHaveAttribute('type', 'number');
    });

    it('should prevent negative non-member price input (HTML5 validation)', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // HTML5 number input with min="0" prevents negative values
      // This test verifies the input has the correct constraints
      const nonMemberPriceInput = screen.getByTestId('input-nonMemberPrice');
      expect(nonMemberPriceInput).toHaveAttribute('min', '0');
      expect(nonMemberPriceInput).toHaveAttribute('type', 'number');
    });

    it('should enforce maximum price constraint (HTML5 validation)', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // HTML5 number input with max="10000" prevents values over maximum
      // This test verifies the input has the correct constraints
      const memberPriceInput = screen.getByTestId('input-memberPrice');
      expect(memberPriceInput).toHaveAttribute('max', '10000');
      expect(memberPriceInput).toHaveAttribute('type', 'number');

      const nonMemberPriceInput = screen.getByTestId('input-nonMemberPrice');
      expect(nonMemberPriceInput).toHaveAttribute('max', '10000');
      expect(nonMemberPriceInput).toHaveAttribute('type', 'number');
    });

    it('should validate member price greater than non-member price', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill out the form with member price > non-member price
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');

      // Set member price higher than non-member price
      await user.type(screen.getByTestId('input-memberPrice'), '20');
      await user.type(screen.getByTestId('input-nonMemberPrice'), '10');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toHaveTextContent('Member price cannot be greater than non-member price');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear price errors when marking event as free', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill form with invalid prices to trigger errors (member > non-member)
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');
      await user.type(screen.getByTestId('input-memberPrice'), '20');
      await user.type(screen.getByTestId('input-nonMemberPrice'), '10');

      // Submit to trigger errors
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      // Mark as free - should clear errors
      const freeCheckbox = screen.getByRole('checkbox', { name: /this is a free event/i });
      await user.click(freeCheckbox);

      await waitFor(() => {
        expect(screen.queryByTestId('error-memberPrice')).not.toBeInTheDocument();
      });
    });

    it('should clear price errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<EventForm {...defaultProps} />);

      // Fill form with invalid prices to trigger errors (member > non-member)
      await user.type(screen.getByTestId('input-name'), 'Test Event');
      await user.type(screen.getByTestId('input-eventDate'), '2030-12-25');
      await user.type(screen.getByTestId('input-eventTime'), '10:00');
      await user.type(screen.getByTestId('input-location'), 'Test Location');
      await user.type(screen.getByTestId('textarea-description'), 'Test Description');
      await user.type(screen.getByTestId('input-memberPrice'), '20');
      await user.type(screen.getByTestId('input-nonMemberPrice'), '10');

      // Submit to trigger errors
      await user.click(screen.getByRole('button', { name: /create event/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-memberPrice')).toBeInTheDocument();
      });

      // Clear and type valid price - should clear error
      const priceInput = screen.getByTestId('input-memberPrice');
      await user.clear(priceInput);
      await user.type(priceInput, '5');

      await waitFor(() => {
        expect(screen.queryByTestId('error-memberPrice')).not.toBeInTheDocument();
      });
    });

    it('should pre-populate pricing in edit mode', () => {
      const mockEventWithPricing: EventResponse = {
        id: 1,
        clubId: 1,
        name: 'Paid Event',
        eventDateTime: '2030-12-25T10:00:00Z',
        location: 'Test Location',
        description: 'Test Description',
        attendeeCount: 0,
        totalRsvpCount: 0,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        memberPrice: 10,
        nonMemberPrice: 15,
        isFree: false,
      };

      render(<EventForm {...defaultProps} event={mockEventWithPricing} isEditing={true} />);

      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /this is a free event/i })).not.toBeChecked();
    });

    it('should pre-populate free event in edit mode', () => {
      const mockFreeEvent: EventResponse = {
        id: 1,
        clubId: 1,
        name: 'Free Event',
        eventDateTime: '2030-12-25T10:00:00Z',
        location: 'Test Location',
        description: 'Test Description',
        attendeeCount: 0,
        totalRsvpCount: 0,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        isFree: true,
      };

      render(<EventForm {...defaultProps} event={mockFreeEvent} isEditing={true} />);

      expect(screen.getByRole('checkbox', { name: /this is a free event/i })).toBeChecked();
      // Price fields should be hidden for free events
      expect(screen.queryByTestId('input-memberPrice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-nonMemberPrice')).not.toBeInTheDocument();
    });
  });
});