import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateLibrary from '../page';

// Mock services at HTTP boundary
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    captureExitIntentLead: jest.fn(() => Promise.resolve({ success: true, message: 'ok' })),
    downloadTemplate: jest.fn(),
    trackEvent: jest.fn(),
    getLeadMagnet: jest.fn(),
  },
}));

// Mock the modal so page tests focus on page-level behavior
jest.mock('@/components/marketing/TemplateDownloadModal', () => ({
  TemplateDownloadModal: ({ isOpen, template, onClose }: any) =>
    isOpen && template ? (
      <div data-testid="template-download-modal">
        <span data-testid="modal-template-title">{template.title}</span>
        <span data-testid="modal-template-slug">{template.slug}</span>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  );
});

jest.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => <svg className={className} data-testid="arrow-left-icon" />,
  Download: ({ className }: { className?: string }) => <svg className={className} data-testid="download-icon" />,
  FileText: ({ className }: { className?: string }) => <svg className={className} data-testid="file-text-icon" />,
  Mail: ({ className }: { className?: string }) => <svg className={className} data-testid="mail-icon" />,
  Calendar: ({ className }: { className?: string }) => <svg className={className} data-testid="calendar-icon" />,
  CreditCard: ({ className }: { className?: string }) => <svg className={className} data-testid="credit-card-icon" />,
  Users: ({ className }: { className?: string }) => <svg className={className} data-testid="users-icon" />,
  ClipboardList: ({ className }: { className?: string }) => <svg className={className} data-testid="clipboard-list-icon" />,
  Lightbulb: ({ className }: { className?: string }) => <svg className={className} data-testid="lightbulb-icon" />,
  ArrowRight: ({ className }: { className?: string }) => <svg className={className} data-testid="arrow-right-icon" />,
}));

jest.mock('@/lib/data/resources', () => ({
  RESOURCES: [],
  getResourceBySlug: (slug: string) => ({
    slug,
    title: `Resource: ${slug}`,
    description: 'Test description',
    category: 'Test',
    dateModified: '2025-12-01',
    readTime: '15 min read',
    datePublished: '2024-01-01',
    keywords: ['test'],
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, size, className }: any) => (
    <button onClick={onClick} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

const { marketingService } = require('@/services/marketingService');

describe('TemplateLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Navigation', () => {
    it('should render back to resources link', () => {
      render(<TemplateLibrary />);
      const links = screen.getAllByTestId('next-link');
      const resourcesLink = links.find(link => link.textContent?.includes('Resources'));
      expect(resourcesLink).toBeInTheDocument();
      expect(resourcesLink).toHaveAttribute('href', '/resources');
    });

    it('should render GatherGrove home link', () => {
      render(<TemplateLibrary />);
      const homeLinks = screen.getAllByRole('link', { name: /^Home$/i });
      expect(homeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Header', () => {
    it('should render main heading', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Club Management Template Library')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText(/Professional, ready-to-use templates/i)).toBeInTheDocument();
    });

    it('should render statistics', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('8+')).toBeInTheDocument();
      expect(screen.getByText('Email Templates')).toBeInTheDocument();
    });
  });

  describe('Template Categories', () => {
    it('should render all five category headings', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Communication Templates')).toBeInTheDocument();
      expect(screen.getByText('Event Planning Resources')).toBeInTheDocument();
      expect(screen.getByText('Financial Management Tools')).toBeInTheDocument();
      expect(screen.getByText('Member Management Resources')).toBeInTheDocument();
      expect(screen.getByText('Administrative Templates')).toBeInTheDocument();
    });

    it('should render category icons', () => {
      render(<TemplateLibrary />);
      expect(screen.getAllByTestId('mail-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('credit-card-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('clipboard-list-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Individual Templates', () => {
    it('should render Welcome Email template', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Welcome Email for New Members')).toBeInTheDocument();
    });

    it('should render Master Event Planning Checklist', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Master Event Planning Checklist')).toBeInTheDocument();
    });

    it('should render download buttons', () => {
      render(<TemplateLibrary />);
      const downloadButtons = screen.getAllByText('Download Template');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Download — modal gate (no session email)', () => {
    it('should open modal when download clicked and no session email', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      expect(screen.queryByTestId('template-download-modal')).not.toBeInTheDocument();

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      expect(screen.getByTestId('template-download-modal')).toBeInTheDocument();
    });

    it('should pass the correct template title to modal', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      // First template in list is "Welcome Email for New Members"
      expect(screen.getByTestId('modal-template-title').textContent).toBe(
        'Welcome Email for New Members',
      );
    });

    it('should pass the correct template slug to modal', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      expect(screen.getByTestId('modal-template-slug').textContent).toBe(
        'welcome-email-new-members',
      );
    });

    it('should close modal when onClose is called', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);
      expect(screen.getByTestId('template-download-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('modal-close'));
      expect(screen.queryByTestId('template-download-modal')).not.toBeInTheDocument();
    });

    it('should not call downloadTemplate when no session email', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      expect(marketingService.downloadTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Download — direct download (session email present)', () => {
    let getItemSpy: jest.SpyInstance;

    beforeEach(() => {
      getItemSpy = jest
        .spyOn(window.sessionStorage, 'getItem')
        .mockImplementation((key: string) =>
          key === 'gathergrove-template-email' ? 'returning@user.com' : null,
        );
    });

    afterEach(() => {
      getItemSpy.mockRestore();
    });

    it('should not open modal when session email exists', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      expect(screen.queryByTestId('template-download-modal')).not.toBeInTheDocument();
    });

    it('should call downloadTemplate directly with the correct slug', async () => {
      const user = userEvent.setup();
      render(<TemplateLibrary />);

      const downloadButtons = screen.getAllByText('Download Template');
      await user.click(downloadButtons[0]);

      expect(marketingService.downloadTemplate).toHaveBeenCalledWith('welcome-email-new-members');
    });
  });

  describe('Usage Instructions', () => {
    it('should render three-step process', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Download and Customize')).toBeInTheDocument();
      expect(screen.getByText('Implement and Test')).toBeInTheDocument();
      expect(screen.getByText('Refine and Scale')).toBeInTheDocument();
    });
  });

  describe('GatherGrove Integration Section', () => {
    it('should render automation section heading', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText('Automate These Templates with GatherGrove')).toBeInTheDocument();
    });

    it('should render Start Free Trial button', () => {
      render(<TemplateLibrary />);
      expect(screen.getAllByText('Start Free Trial').length).toBeGreaterThan(0);
    });

    it('should have link to register page', () => {
      render(<TemplateLibrary />);
      const links = screen.getAllByTestId('next-link');
      const registerLink = links.find(link => link.getAttribute('href') === '/register');
      expect(registerLink).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should render free templates message', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText(/How to Use These Templates/i)).toBeInTheDocument();
    });

    it('should render support contact link', () => {
      render(<TemplateLibrary />);
      expect(screen.getByText(/Ready to put these strategies into practice/i)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should render without crashing', () => {
      expect(() => render(<TemplateLibrary />)).not.toThrow();
    });

    it('should have sticky navigation', () => {
      const { container } = render(<TemplateLibrary />);
      expect(container.querySelector('.sticky')).toBeInTheDocument();
    });
  });
});
