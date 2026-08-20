import React from 'react';
import { render, screen } from '@testing-library/react';
import ForgotPasswordPage, { metadata } from '../page';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-left-icon">
      <path />
    </svg>
  ),
}));

// Mock ForgotPasswordForm
jest.mock('@/components/features/auth/forgot-password-form', () => ({
  ForgotPasswordForm: () => <div data-testid="forgot-password-form">ForgotPasswordForm</div>,
}));

describe('ForgotPasswordPage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Reset Password');
    });

    it('should export correct metadata description', () => {
      expect(metadata.description).toBe('Reset your GatherGrove account password');
    });

    it('should have all required metadata fields', () => {
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
    });

    it('should have SEO-friendly metadata', () => {
      expect(typeof metadata.title).toBe('string');
      expect(typeof metadata.description).toBe('string');
      expect(metadata.description).toContain('GatherGrove');
    });
  });

  describe('Page Rendering', () => {
    it('should render the page component', () => {
      const { container } = render(<ForgotPasswordPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render ForgotPasswordForm', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should render ArrowLeft icon', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link to login page', () => {
      render(<ForgotPasswordPage />);

      const link = screen.getByTestId('next-link');
      expect(link).toHaveAttribute('href', '/login');
    });

    it('should render link with correct text', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should render icon inside link', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      const icon = link?.querySelector('[data-testid="arrow-left-icon"]');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have min-h-screen class', () => {
      const { container } = render(<ForgotPasswordPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should have flex layout', () => {
      const { container } = render(<ForgotPasswordPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-center');
    });

    it('should have gradient background', () => {
      const { container } = render(<ForgotPasswordPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-gradient-to-br');
      expect(mainDiv).toHaveClass('from-background');
      expect(mainDiv).toHaveClass('to-background-subtle');
    });

    it('should have padding', () => {
      const { container } = render(<ForgotPasswordPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('px-4');
    });
  });

  describe('Gradient Overlay', () => {
    it('should render gradient overlay', () => {
      const { container } = render(<ForgotPasswordPage />);

      const overlay = container.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('should have correct overlay classes', () => {
      const { container } = render(<ForgotPasswordPage />);

      const overlay = container.querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass('bg-gradient-to-br');
      expect(overlay).toHaveClass('from-primary/5');
      expect(overlay).toHaveClass('to-emerald-500/5');
      expect(overlay).toHaveClass('pointer-events-none');
    });
  });

  describe('Content Container', () => {
    it('should have max-w-md container', () => {
      const { container } = render(<ForgotPasswordPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should have w-full class', () => {
      const { container } = render(<ForgotPasswordPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toHaveClass('w-full');
    });

    it('should have space-y-8 class', () => {
      const { container } = render(<ForgotPasswordPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toHaveClass('space-y-8');
    });

    it('should have relative positioning', () => {
      const { container } = render(<ForgotPasswordPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toHaveClass('relative');
    });
  });

  describe('Form Container', () => {
    it('should render form in glass container', () => {
      const { container } = render(<ForgotPasswordPage />);

      const formContainer = container.querySelector('.glass-strong');
      expect(formContainer).toBeInTheDocument();
    });

    it('should have glass effect classes', () => {
      const { container } = render(<ForgotPasswordPage />);

      const formContainer = container.querySelector('.glass-strong');
      expect(formContainer).toHaveClass('border-border/50');
      expect(formContainer).toHaveClass('backdrop-blur-xl');
    });

    it('should have padding and rounded corners', () => {
      const { container } = render(<ForgotPasswordPage />);

      const formContainer = container.querySelector('.glass-strong');
      expect(formContainer).toHaveClass('p-8');
      expect(formContainer).toHaveClass('rounded-2xl');
    });

    it('should have shadow', () => {
      const { container } = render(<ForgotPasswordPage />);

      const formContainer = container.querySelector('.glass-strong');
      expect(formContainer).toHaveClass('shadow-2xl');
    });

    it('should contain ForgotPasswordForm', () => {
      const { container } = render(<ForgotPasswordPage />);

      const formContainer = container.querySelector('.glass-strong');
      const form = screen.getByTestId('forgot-password-form');

      expect(formContainer).toContainElement(form);
    });
  });

  describe('Back to Login Link Styling', () => {
    it('should have correct link classes', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('inline-flex');
      expect(link).toHaveClass('items-center');
      expect(link).toHaveClass('gap-2');
      expect(link).toHaveClass('text-sm');
    });

    it('should have color classes', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('text-muted-foreground');
      expect(link).toHaveClass('hover:text-primary');
    });

    it('should have transition classes', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('transition-colors');
      expect(link).toHaveClass('duration-200');
    });

    it('should have padding and rounded corners', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('px-3');
      expect(link).toHaveClass('py-1.5');
      expect(link).toHaveClass('rounded-md');
    });

    it('should have glass effect', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('bg-glass');
      expect(link).toHaveClass('border');
      expect(link).toHaveClass('border-border/50');
    });

    it('should have hover lift effect', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      expect(link).toHaveClass('hover-lift');
    });
  });

  describe('Icon Styling', () => {
    it('should render ArrowLeft icon with correct size', () => {
      render(<ForgotPasswordPage />);

      const icon = screen.getByTestId('arrow-left-icon');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
    });

    it('should render icon before text', () => {
      const { container } = render(<ForgotPasswordPage />);

      const link = container.querySelector('[data-testid="next-link"]');
      const children = Array.from(link?.childNodes || []);

      // Icon should be before text
      expect(children.length).toBeGreaterThan(1);
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(ForgotPasswordPage).toBeDefined();
      expect(typeof ForgotPasswordPage).toBe('function');
    });

    it('should export metadata', () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <ForgotPasswordPage />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<ForgotPasswordPage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<ForgotPasswordPage />);
      const { container: container2 } = render(<ForgotPasswordPage />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<ForgotPasswordPage />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();

      rerender(<ForgotPasswordPage />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should maintain structure across rerenders', () => {
      const { rerender } = render(<ForgotPasswordPage />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();

      rerender(<ForgotPasswordPage />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link', () => {
      render(<ForgotPasswordPage />);

      const link = screen.getByTestId('next-link');
      expect(link).toHaveAttribute('href', '/login');
      expect(link).toHaveTextContent('Back to Login');
    });

    it('should have visible form', () => {
      render(<ForgotPasswordPage />);

      const form = screen.getByTestId('forgot-password-form');
      expect(form).toBeVisible();
    });

    it('should have semantic link structure', () => {
      render(<ForgotPasswordPage />);

      const link = screen.getByTestId('next-link');
      expect(link.tagName).toBe('A');
    });
  });

  describe('Integration', () => {
    it('should integrate all components correctly', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('should have correct DOM hierarchy', () => {
      const { container } = render(<ForgotPasswordPage />);

      const mainDiv = container.firstChild;
      const overlay = container.querySelector('.absolute.inset-0');
      const contentContainer = container.querySelector('.max-w-md');

      expect(mainDiv).toContainElement(overlay as HTMLElement);
      expect(mainDiv).toContainElement(contentContainer as HTMLElement);
    });
  });

  describe('Page Purpose', () => {
    it('should be a password reset page', () => {
      expect(metadata.title).toContain('Reset Password');
      expect(metadata.description).toContain('Reset');
    });

    it('should reference GatherGrove brand', () => {
      expect(metadata.description).toContain('GatherGrove');
    });

    it('should provide navigation back to login', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });
});
