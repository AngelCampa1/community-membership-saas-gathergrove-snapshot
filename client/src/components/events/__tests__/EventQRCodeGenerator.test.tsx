import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventQRCodeGenerator } from '../EventQRCodeGenerator';
import { eventService } from '@/services/eventService';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/services/eventService', () => ({
  eventService: {
    getEventQRCodes: jest.fn().mockResolvedValue([]),
    generateEventQRCode: jest.fn(),
    downloadQRCode: jest.fn(),
    updateQRCode: jest.fn(),
    updateQRCodeStatus: jest.fn(),
    deleteQRCode: jest.fn(),
    getQRCodeShareUrl: jest.fn(),
    bulkDownloadQRCodes: jest.fn(),
  },
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

// Stable toast mocks so error-path assertions survive across re-renders
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const mockEventService = eventService as jest.Mocked<typeof eventService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const mockQRCode = {
  id: 'qr1',
  eventId: 1,
  type: 'check_in' as const,
  data: {},
  customization: {
    size: 200,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  analytics: {
    scans: 25,
    uniqueScans: 20,
    conversionRate: 80,
    lastScanned: '2024-02-15T11:30:00Z',
  },
  createdAt: '2024-02-10T10:00:00Z',
  isActive: true,
};

describe('EventQRCodeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock that returns immediately
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);
  });

  test('renders QR code generator with basic elements', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for the component to finish loading and render the header
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Generate and manage QR codes for your event')).toBeInTheDocument();
    expect(mockEventService.getEventQRCodes).toHaveBeenCalledWith(1);
  });

  test('generates QR code for event check-in', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);
    (mockEventService.generateEventQRCode as jest.Mock).mockResolvedValue(mockQRCode);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const generateButton = screen.getByTestId('generate-qr-button');
    expect(generateButton).toBeInTheDocument();

    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockEventService.generateEventQRCode).toHaveBeenCalledWith(1, expect.objectContaining({
        type: 'check_in',
        customization: expect.any(Object),
      }));
    });
  });

  test('shows QR code customization options', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load with all customization options
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      expect(screen.getByLabelText('Size (px)')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByLabelText('Margin')).toBeInTheDocument();
    expect(screen.getByLabelText('Foreground Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
  });

  test('displays existing QR codes in manager tab', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([mockQRCode]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Switch to manager tab
    const managerTab = screen.getByRole('tab', { name: /manager/i });
    fireEvent.click(managerTab);

    // Wait for tab content to load and look for QR code data
    await waitFor(() => {
      // Check for the type badge or other unique identifier instead of the label text
      const badges = screen.queryAllByText('Event Check-In');
      expect(badges.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  test('shows analytics for QR codes', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([mockQRCode]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    // Switch to analytics tab
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText('Total QR Codes')).toBeInTheDocument();
      expect(screen.getByText('Total Scans')).toBeInTheDocument();
    });
  });

  test('handles QR code type selection', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const qrTypeSelect = screen.getByLabelText('QR Code Type') as HTMLSelectElement;
    expect(qrTypeSelect).toBeInTheDocument();

    fireEvent.change(qrTypeSelect, { target: { value: 'registration' } });
    expect(qrTypeSelect.value).toBe('registration');

    fireEvent.change(qrTypeSelect, { target: { value: 'feedback' } });
    expect(qrTypeSelect.value).toBe('feedback');
  });

  test('handles QR code customization', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for the Generator tab and form elements to be present
    let sizeInput: HTMLInputElement;
    let marginInput: HTMLInputElement;
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /generator/i })).toBeInTheDocument();
      sizeInput = screen.getByLabelText('Size (px)') as HTMLInputElement;
      marginInput = screen.getByLabelText('Margin') as HTMLInputElement;
      expect(sizeInput).toBeInTheDocument();
      expect(marginInput).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.change(sizeInput!, { target: { value: '300' } });
    expect(sizeInput!.value).toBe('300');

    fireEvent.change(marginInput!, { target: { value: '8' } });
    expect(marginInput!.value).toBe('8');
  });

  test('shows search functionality in manager', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([mockQRCode]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const managerTab = screen.getByRole('tab', { name: /manager/i });
    fireEvent.click(managerTab);

    await waitFor(() => {
      const searchInput = screen.getByTestId('qr-search') as HTMLInputElement;
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'check' } });
      expect(searchInput.value).toBe('check');
    });
  });

  test('handles missing eventId gracefully', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator clubId={1} />);

    // Component should render immediately when no eventId (doesn't call API)
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    // Verify API was not called without eventId
    expect(mockEventService.getEventQRCodes).not.toHaveBeenCalled();
  });

  test('displays empty state when no QR codes exist', async () => {
    (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);

    render(<EventQRCodeGenerator eventId={1} clubId={1} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const managerTab = screen.getByRole('tab', { name: /manager/i });
    fireEvent.click(managerTab);

    await waitFor(() => {
      expect(screen.getByText('No QR Codes Found')).toBeInTheDocument();
    });
  });

  // Regression guards (M-002): each catch block previously referenced
  // undefined identifiers (qrType/formData, qrCodeId, activeQRs), which threw a
  // ReferenceError BEFORE logger.error/toast.error ran — so a failure surfaced
  // nothing to the user. These tests prove the catch blocks complete cleanly.
  describe('error handling (M-002)', () => {
    test('generate failure logs and toasts instead of throwing in catch', async () => {
      (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([]);
      (mockEventService.generateEventQRCode as jest.Mock).mockRejectedValueOnce(
        new Error('boom')
      );

      render(<EventQRCodeGenerator eventId={1} clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('generate-qr-button'));

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'events',
          'Failed to generate QR code',
          expect.objectContaining({ qrType: 'check_in' })
        );
      });
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to generate QR code. Please try again.'
      );
    });

    test('delete failure logs and toasts instead of throwing in catch', async () => {
      (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([mockQRCode]);
      (mockEventService.deleteQRCode as jest.Mock).mockRejectedValueOnce(
        new Error('boom')
      );

      render(<EventQRCodeGenerator eventId={1} clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /manager/i }));

      // Open the detail dialog (the only place the Delete button lives)
      await waitFor(() => {
        expect(screen.getByTestId(`view-qr-${mockQRCode.id}`)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId(`view-qr-${mockQRCode.id}`));

      const deleteButton = await screen.findByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'events',
          'Failed to delete QR code',
          expect.objectContaining({ qrCodeId: mockQRCode.id })
        );
      });
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete QR code');
    });

    test('bulk download failure logs and toasts instead of throwing in catch', async () => {
      (mockEventService.getEventQRCodes as jest.Mock).mockResolvedValue([mockQRCode]);
      (mockEventService.bulkDownloadQRCodes as jest.Mock).mockRejectedValueOnce(
        new Error('boom')
      );

      render(<EventQRCodeGenerator eventId={1} clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /manager/i }));

      const bulkButton = await screen.findByRole('button', { name: /bulk download/i });
      fireEvent.click(bulkButton);

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'events',
          'Failed to bulk download QR codes',
          expect.objectContaining({ count: 1 })
        );
      });
      expect(mockToast.error).toHaveBeenCalledWith('Failed to download QR codes');
    });
  });
});
