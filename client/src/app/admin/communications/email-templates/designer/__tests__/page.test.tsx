import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailTemplateDesignerPage from '../page';

// Mock dependencies
const mockRouter = {
  push: jest.fn(),
};

const mockUser = {
  id: 1,
  clubId: 1,
  email: 'admin@test.com',
  name: 'Admin User',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

jest.mock('@/hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasUnlimitedTier: jest.fn(() => true),
  }),
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    getTemplate: jest.fn(),
  },
}));

jest.mock('@/utils/security', () => ({
  SecurityUtils: {
    sanitizeHtml: jest.fn((html) => html),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Skip entire suite due to Jest memory issues with large HTML template rendering
describe.skip('EmailTemplateDesignerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockRouter.push.mockClear();
  });

  describe('Page Rendering', () => {
    it('should render page title', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByText(/email template designer/i)).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
    });

    it('should render template name input', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByRole('button', { name: /save template/i })).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should render Code view button', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument();
    });

    it('should render Preview button', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });

    it('should start in code view by default', () => {
      render(<EmailTemplateDesignerPage />);

      const codeView = screen.getByRole('textbox', { name: /html content/i });
      expect(codeView).toBeInTheDocument();
    });

    it('should switch to preview view', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateDesignerPage />);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByTitle(/email preview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Inputs', () => {
    it('should allow typing template name', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateDesignerPage />);

      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, 'Welcome Email');

      expect(nameInput).toHaveValue('Welcome Email');
    });

    it('should allow typing description', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateDesignerPage />);

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Welcome email for new members');

      expect(descInput).toHaveValue('Welcome email for new members');
    });

    it('should allow editing HTML content', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateDesignerPage />);

      const htmlInput = screen.getByRole('textbox', { name: /html content/i });
      await user.clear(htmlInput);
      await user.type(htmlInput, '<h1>Test</h1>');

      expect(htmlInput).toHaveValue('<h1>Test</h1>');
    });
  });

  describe('Personalization Tokens', () => {
    it('should render personalization tokens section', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByText(/personalization tokens/i)).toBeInTheDocument();
    });

    it('should render available tokens', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByText(/member_name/i)).toBeInTheDocument();
      expect(screen.getByText(/club_name/i)).toBeInTheDocument();
      expect(screen.getByText(/current_year/i)).toBeInTheDocument();
    });

    it('should show token categories', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByText(/member/i)).toBeInTheDocument();
      expect(screen.getByText(/club/i)).toBeInTheDocument();
      expect(screen.getByText(/system/i)).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should disable save button when template name is empty', () => {
      render(<EmailTemplateDesignerPage />);

      const saveButton = screen.getByRole('button', { name: /save template/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when template name is filled', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateDesignerPage />);

      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, 'Test Template');

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save template/i });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Authorization', () => {
    it('should redirect when user does not have unlimited tier', () => {
      const mockHasUnlimitedTier = jest.fn(() => false);
      jest.spyOn(require('@/hooks/useAuthorization'), 'useAuthorization').mockReturnValue({
        hasUnlimitedTier: mockHasUnlimitedTier,
      });

      render(<EmailTemplateDesignerPage />);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/communications');
    });
  });

  describe('Default Content', () => {
    it('should have default HTML template', () => {
      render(<EmailTemplateDesignerPage />);

      const htmlInput = screen.getByRole('textbox', { name: /html content/i });
      expect(htmlInput.value).toContain('<!DOCTYPE html>');
      expect(htmlInput.value).toContain('{{club_name}}');
      expect(htmlInput.value).toContain('{{member_first_name}}');
    });

    it('should include default styling', () => {
      render(<EmailTemplateDesignerPage />);

      const htmlInput = screen.getByRole('textbox', { name: /html content/i });
      expect(htmlInput.value).toContain('<style>');
      expect(htmlInput.value).toContain('font-family');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<EmailTemplateDesignerPage />);

      const heading = screen.getByRole('heading', { name: /email template designer/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have labeled form inputs', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/html content/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<EmailTemplateDesignerPage />);

      expect(screen.getByRole('button', { name: /save template/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });
  });
});
