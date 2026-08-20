import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolLeadCapture from '../ToolLeadCapture';
import { marketingService } from '@/services/marketingService';

// Mock marketingService — it is an external boundary service that calls an API
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    captureToolLead: jest.fn(),
  },
}));

const mockCaptureToolLead = marketingService.captureToolLead as jest.MockedFunction<
  typeof marketingService.captureToolLead
>;

describe('ToolLeadCapture', () => {
  const defaultProps = {
    source: 'tool-dues-calculator' as const,
    ctaText: 'Get your PDF breakdown + dues proposal template',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the CTA text', () => {
    render(<ToolLeadCapture {...defaultProps} />);
    expect(screen.getByText('Get your PDF breakdown + dues proposal template')).toBeInTheDocument();
  });

  it('renders the email input and submit button', () => {
    render(<ToolLeadCapture {...defaultProps} />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('submits email successfully and shows default success message', async () => {
    mockCaptureToolLead.mockResolvedValueOnce({
      success: true,
      message: 'Lead captured',
      leadId: 'lead-123',
    });

    render(<ToolLeadCapture {...defaultProps} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });

    expect(mockCaptureToolLead).toHaveBeenCalledWith({
      email: 'test@example.com',
      source: 'tool-dues-calculator',
      metadata: { toolData: undefined },
      companyWebsite: '',
      turnstileToken: '',
    });
  });

  it('shows custom success message when provided', async () => {
    mockCaptureToolLead.mockResolvedValueOnce({
      success: true,
      message: 'Lead captured',
    });

    render(
      <ToolLeadCapture
        {...defaultProps}
        successMessage="Your template is on its way!"
      />
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Your template is on its way!')).toBeInTheDocument();
    });
  });

  it('shows error for invalid email (no @)', async () => {
    render(<ToolLeadCapture {...defaultProps} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'invalidemail');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(mockCaptureToolLead).not.toHaveBeenCalled();
  });

  it('shows error message when API call fails', async () => {
    mockCaptureToolLead.mockResolvedValueOnce({
      success: false,
      message: 'Server error',
    });

    render(<ToolLeadCapture {...defaultProps} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API throws', async () => {
    mockCaptureToolLead.mockRejectedValueOnce(new Error('Network error'));

    render(<ToolLeadCapture {...defaultProps} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveCapture!: (value: { success: boolean; message: string }) => void;
    const capturePromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      resolveCapture = resolve;
    });
    mockCaptureToolLead.mockReturnValueOnce(capturePromise);

    render(<ToolLeadCapture {...defaultProps} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    // During loading, button should be disabled
    expect(screen.getByRole('button')).toBeDisabled();

    resolveCapture({ success: true, message: 'ok' });

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('passes toolData as metadata to the service', async () => {
    mockCaptureToolLead.mockResolvedValueOnce({
      success: true,
      message: 'Lead captured',
    });

    const toolData = { memberCount: 50, annualFee: 120 };

    render(<ToolLeadCapture {...defaultProps} toolData={toolData} />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockCaptureToolLead).toHaveBeenCalledWith({
        email: 'test@example.com',
        source: 'tool-dues-calculator',
        metadata: { toolData },
        companyWebsite: '',
        turnstileToken: '',
      });
    });
  });
});
