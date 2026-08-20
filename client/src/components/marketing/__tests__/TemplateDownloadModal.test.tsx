import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateDownloadModal } from '../TemplateDownloadModal';
import { marketingService } from '@/services/marketingService';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';

// Mock HTTP boundary only
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    captureExitIntentLead: jest.fn(() => Promise.resolve({ success: true, message: 'ok' })),
    downloadTemplate: jest.fn(),
  },
}));

jest.mock('@/services/ctaAnalyticsService', () => ({
  ctaAnalyticsService: {
    recordConversion: jest.fn(),
    trackView: jest.fn(),
    trackClick: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Use minimal mocks for UI primitives (not mocking business logic)
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Download: () => <span>Download</span>,
  CheckCircle: () => <span>CheckCircle</span>,
}));

const mockTemplate = {
  title: 'Welcome Email for New Members',
  slug: 'welcome-email-new-members',
  format: 'Email Template',
};

const mockCaptureExitIntentLead = marketingService.captureExitIntentLead as jest.Mock;
const mockDownloadTemplate = marketingService.downloadTemplate as jest.Mock;
const mockRecordConversion = ctaAnalyticsService.recordConversion as jest.Mock;

describe('TemplateDownloadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('renders nothing when template is null', () => {
      const { container } = render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={null} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when isOpen is false', () => {
      render(
        <TemplateDownloadModal isOpen={false} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders the modal when open with a template', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('shows the template title in the preview', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByText(mockTemplate.title)).toBeInTheDocument();
    });

    it('shows the template format in the preview', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByText(mockTemplate.format)).toBeInTheDocument();
    });

    it('renders email input field', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders name input field', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it('renders submit button disabled when email is empty', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      const submitButton = screen.getByRole('button', { name: /get free template/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button once email is entered', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      expect(screen.getByRole('button', { name: /get free template/i })).not.toBeDisabled();
    });

    it('renders privacy disclaimer', () => {
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      expect(screen.getByText(/respect your privacy/i)).toBeInTheDocument();
    });
  });

  describe('Form submission — success path', () => {
    it('calls captureExitIntentLead with correct source and slug', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(mockCaptureExitIntentLead).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'jane@example.com',
            source: 'template-download',
            variant: mockTemplate.slug,
          }),
        );
      });
    });

    it('includes optional name in lead capture when provided', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(mockCaptureExitIntentLead).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Jane' }),
        );
      });
    });

    it('transitions to success state after successful submission', async () => {
      // sessionStorage persistence is covered by the page-level spy tests
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await screen.findByRole('button', { name: /download template/i });
      expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
    });

    it('records conversion via ctaAnalyticsService', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(mockRecordConversion).toHaveBeenCalledWith(
          `template-download-${mockTemplate.slug}`,
          'download',
          1,
        );
      });
    });

    it('transitions to success state showing download button', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
      });
    });

    it('shows Ready to download heading in success state', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(screen.getByText(/ready to download/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success state — download button', () => {
    const enterEmailAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));
      await waitFor(() => screen.getByRole('button', { name: /download template/i }));
    };

    it('calls downloadTemplate with the correct slug', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      await enterEmailAndSubmit(user);
      await user.click(screen.getByRole('button', { name: /download template/i }));
      expect(mockDownloadTemplate).toHaveBeenCalledWith(mockTemplate.slug);
    });

    it('records a download-complete conversion', async () => {
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );
      await enterEmailAndSubmit(user);
      await user.click(screen.getByRole('button', { name: /download template/i }));
      expect(mockRecordConversion).toHaveBeenCalledWith(
        `template-download-complete-${mockTemplate.slug}`,
        'download',
        1,
      );
    });

    it('calls onClose after the auto-close timer fires', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TemplateDownloadModal isOpen={true} onClose={onClose} template={mockTemplate} />,
      );
      await enterEmailAndSubmit(user);
      await user.click(screen.getByRole('button', { name: /download template/i }));

      expect(onClose).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1500);
      expect(onClose).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('Error handling', () => {
    it('still transitions to success even if lead capture throws', async () => {
      mockCaptureExitIntentLead.mockRejectedValueOnce(new Error('Network error'));
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
      });
    });

    it('still transitions to success even on lead capture failure', async () => {
      // sessionStorage persistence on error is covered by the page-level spy tests
      mockCaptureExitIntentLead.mockRejectedValueOnce(new Error('Network error'));
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={mockTemplate} />,
      );

      await user.type(screen.getByLabelText(/email address/i), 'error@example.com');
      await user.click(screen.getByRole('button', { name: /get free template/i }));

      await screen.findByRole('button', { name: /download template/i });
      expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
    });
  });

  describe('Dismissal', () => {
    it('calls onClose when the X button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup({});
      render(
        <TemplateDownloadModal isOpen={true} onClose={onClose} template={mockTemplate} />,
      );
      await user.click(screen.getByRole('button', { name: /^x$/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different templates', () => {
    const templates = [
      { title: 'Master Event Planning Checklist', slug: 'master-event-planning-checklist', format: 'PDF Checklist' },
      { title: 'Annual Budget Planning Template', slug: 'annual-budget-planning-template', format: 'PDF Template' },
      { title: 'Club Bylaws Template', slug: 'club-bylaws-template', format: 'PDF Template' },
    ];

    templates.forEach(t => {
      it(`renders correctly for "${t.title}"`, () => {
        render(<TemplateDownloadModal isOpen={true} onClose={jest.fn()} template={t} />);
        expect(screen.getByText(t.title)).toBeInTheDocument();
        expect(screen.getByText(t.format)).toBeInTheDocument();
      });
    });
  });
});
