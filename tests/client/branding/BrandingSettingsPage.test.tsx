import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandingSettingsPage } from '../../../client/src/app/admin/settings/branding/page';
import { useAuthStore } from '../../../client/src/stores/authStore';

// Mock dependencies
jest.mock('../../../client/src/stores/authStore');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/admin/settings/branding'
  })
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock fetch for file upload
global.fetch = jest.fn();

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('BrandingSettingsPage', () => {
  const mockUser = {
    id: '1',
    email: 'admin@test.com',
    fullName: 'Test Admin',
    isAuthenticated: true,
    clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    } as any);
    
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Structure and Navigation', () => {
    it('displays the main heading and description', () => {
      render(<BrandingSettingsPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: /white.label branding/i })).toBeInTheDocument();
      expect(screen.getByText(/customize your club.s visual identity/i)).toBeInTheDocument();
    });

    it('renders all branding sections', () => {
      render(<BrandingSettingsPage />);
      
      expect(screen.getByText(/logo & branding/i)).toBeInTheDocument();
      expect(screen.getByText(/color scheme/i)).toBeInTheDocument();
      expect(screen.getByText(/brand assets/i)).toBeInTheDocument();
      expect(screen.getByText(/live preview/i)).toBeInTheDocument();
    });

    it('provides navigation back to settings', () => {
      render(<BrandingSettingsPage />);
      
      const backLink = screen.getByRole('link', { name: /back to settings/i });
      expect(backLink).toHaveAttribute('href', '/admin/settings');
    });
  });

  describe('Form Validation', () => {
    it('validates primary color format', async () => {
      render(<BrandingSettingsPage />);
      
      const primaryColorInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryColorInput);
      await userEvent.type(primaryColorInput, 'invalid-color');
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid color format/i)).toBeInTheDocument();
      });
    });

    it('validates secondary color format', async () => {
      render(<BrandingSettingsPage />);
      
      const secondaryColorInput = screen.getByLabelText(/secondary color/i);
      await userEvent.clear(secondaryColorInput);
      await userEvent.type(secondaryColorInput, '#ZZZZZZ');
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid color format/i)).toBeInTheDocument();
      });
    });

    it('validates logo file size limit', async () => {
      render(<BrandingSettingsPage />);
      
      const logoInput = screen.getByLabelText(/upload logo/i);
      const oversizedFile = new File(['x'.repeat(3 * 1024 * 1024)], 'logo.png', { type: 'image/png' });
      
      await userEvent.upload(logoInput, oversizedFile);
      
      await waitFor(() => {
        expect(screen.getByText(/file size must be less than 2mb/i)).toBeInTheDocument();
      });
    });

    it('validates logo file type', async () => {
      render(<BrandingSettingsPage />);
      
      const logoInput = screen.getByLabelText(/upload logo/i);
      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      
      await userEvent.upload(logoInput, invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/only image files are allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('redirects to login when user is not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false
      } as any);
      
      render(<BrandingSettingsPage />);
      
      expect(screen.getByText(/please log in to access branding settings/i)).toBeInTheDocument();
    });

    it('shows upgrade prompt for non-unlimited tier clubs', () => {
      mockUseAuthStore.mockReturnValue({
        user: { ...mockUser, clubs: [{ id: '1', name: 'Test Club', tier: 'Grow' }] },
        isAuthenticated: true
      } as any);
      
      render(<BrandingSettingsPage />);
      
      expect(screen.getByText(/upgrade to unlimited/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument();
    });

    it('allows access for unlimited tier clubs', () => {
      render(<BrandingSettingsPage />);
      
      expect(screen.queryByText(/upgrade to unlimited/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<BrandingSettingsPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(sectionHeadings.length).toBeGreaterThanOrEqual(3);
    });

    it('has proper form labels and descriptions', () => {
      render(<BrandingSettingsPage />);
      
      const primaryColorInput = screen.getByLabelText(/primary color/i);
      const secondaryColorInput = screen.getByLabelText(/secondary color/i);
      const logoInput = screen.getByLabelText(/upload logo/i);
      
      expect(primaryColorInput).toBeInTheDocument();
      expect(secondaryColorInput).toBeInTheDocument();
      expect(logoInput).toBeInTheDocument();
    });

    it('provides keyboard navigation for color picker', async () => {
      render(<BrandingSettingsPage />);
      
      const primaryColorInput = screen.getByLabelText(/primary color/i);
      primaryColorInput.focus();
      
      expect(primaryColorInput).toHaveFocus();
      
      // Test Tab navigation
      await userEvent.tab();
      const nextElement = document.activeElement;
      expect(nextElement).not.toBe(primaryColorInput);
    });

    it('has appropriate ARIA labels and roles', () => {
      render(<BrandingSettingsPage />);
      
      const colorSection = screen.getByRole('region', { name: /color scheme/i });
      const logoSection = screen.getByRole('region', { name: /logo & branding/i });
      
      expect(colorSection).toBeInTheDocument();
      expect(logoSection).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays network error when save fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<BrandingSettingsPage />);
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to save branding settings/i)).toBeInTheDocument();
      });
    });

    it('displays server error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid branding configuration' })
      });
      
      render(<BrandingSettingsPage />);
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid branding configuration/i)).toBeInTheDocument();
      });
    });

    it('handles file upload errors gracefully', async () => {
      render(<BrandingSettingsPage />);
      
      const logoInput = screen.getByLabelText(/upload logo/i);
      const corruptFile = new File(['corrupt'], 'corrupt.png', { type: 'image/png' });
      
      // Mock file reader to simulate corruption
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(),
        onerror: null,
        onload: null,
        error: new Error('File corrupted')
      })) as any;
      
      await userEvent.upload(logoInput, corruptFile);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to process image file/i)).toBeInTheDocument();
      });
      
      global.FileReader = originalFileReader;
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner during save operation', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<BrandingSettingsPage />);
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('shows loading state during initial data fetch', () => {
      // Mock loading state
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true
      } as any);
      
      render(<BrandingSettingsPage />);
      
      expect(screen.getByText(/loading branding settings/i)).toBeInTheDocument();
    });
  });
});
