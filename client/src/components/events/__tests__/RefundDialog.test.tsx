import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefundDialog } from '../RefundDialog';
import { eventPaymentAdminService } from '@/services/eventPaymentAdminService';
import type { EventAttendeePaymentInfo } from '@/types/eventPayment';

// Mock the service
jest.mock('@/services/eventPaymentAdminService');
const mockEventPaymentAdminService = eventPaymentAdminService as jest.Mocked<typeof eventPaymentAdminService>;

// Mock useToast
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    success: jest.fn(),
    error: jest.fn(),
  })),
}));

import { useToast } from '@/hooks/useToast';
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('RefundDialog', () => {
  const mockAttendee: EventAttendeePaymentInfo = {
    rsvpId: 1,
    memberId: 10,
    name: 'John Doe',
    email: 'john@example.com',
    memberStatus: 'member',
    paymentStatus: 'Succeeded',
    amountPaid: 50.00,
    paymentDate: '2025-01-10T10:30:00Z',
    paymentMethod: 'stripe',
    canRefund: true,
    stripePaymentIntentId: 'pi_1234567890',
  };

  const mockOnSuccess = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast as any);
  });

  it('should render attendee information', () => {
    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
  });

  it('should pre-fill refund amount with original payment', () => {
    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i) as HTMLInputElement;
    expect(amountInput.value).toBe('50');
  });

  it('should validate refund amount cannot exceed original payment', async () => {
    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i);
    const reasonInput = screen.getByLabelText(/Reason for Refund/i);
    const submitButton = screen.getByRole('button', { name: /Issue Refund/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
    
    // Submit the form
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed the original payment/i)).toBeInTheDocument();
    });

    expect(mockEventPaymentAdminService.issueRefund).not.toHaveBeenCalled();
  });

  it('should require refund reason', async () => {
    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i);
    const submitButton = screen.getByRole('button', { name: /Issue Refund/i });

    fireEvent.change(amountInput, { target: { value: '50' } });
    
    // Submit the form
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/provide a reason/i)).toBeInTheDocument();
    });

    expect(mockEventPaymentAdminService.issueRefund).not.toHaveBeenCalled();
  });

  it('should submit refund successfully', async () => {
    mockEventPaymentAdminService.issueRefund.mockResolvedValue({
      success: true,
      refundId: 're_1234567890',
      message: 'Refund processed successfully',
    });

    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i);
    const reasonInput = screen.getByLabelText(/Reason for Refund/i);
    const submitButton = screen.getByRole('button', { name: /Issue Refund/i });

    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.change(reasonInput, { target: { value: 'Event cancelled' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockEventPaymentAdminService.issueRefund).toHaveBeenCalledWith(1, 10, {
        eventId: 10,
        rsvpId: 1,
        amount: 50,
        reason: 'Event cancelled',
      });
    });

    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Refund'));
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should handle refund errors', async () => {
    const errorMessage = 'Refund failed';
    mockEventPaymentAdminService.issueRefund.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i);
    const reasonInput = screen.getByLabelText(/Reason for Refund/i);
    const submitButton = screen.getByRole('button', { name: /Issue Refund/i });

    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.change(reasonInput, { target: { value: 'Test' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should disable submit button during submission', async () => {
    mockEventPaymentAdminService.issueRefund.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Refund Amount/i);
    const reasonInput = screen.getByLabelText(/Reason for Refund/i);
    const submitButton = screen.getByRole('button', { name: /Issue Refund/i });

    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.change(reasonInput, { target: { value: 'Test' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/Processing\.\.\./i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should call onOpenChange when cancel is clicked', () => {
    render(
      <RefundDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        attendee={mockAttendee}
        clubId={1}
        eventId={10}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

