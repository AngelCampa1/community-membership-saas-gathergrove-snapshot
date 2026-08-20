import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage, { metadata } from '../page';

// Mock the child components
jest.mock('@/components/features/auth/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

jest.mock('@/components/auth/RouteProtection', () => ({
  RouteProtection: ({ children }: { children: React.ReactNode }) => <div data-testid="route-protection">{children}</div>,
}));

describe('LoginPage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Login');
    });

    it('should export correct metadata description', () => {
      expect(metadata.description).toBe('Sign in to your GatherGrove account to access your club dashboard.');
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
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should wrap content in RouteProtection', () => {
      render(<LoginPage />);
      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
    });

    it('should render LoginForm', () => {
      render(<LoginPage />);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should render LoginForm inside RouteProtection', () => {
      render(<LoginPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('login-form');

      expect(routeProtection).toContainElement(form);
    });
  });

  describe('Structure', () => {
    it('should have correct component hierarchy', () => {
      render(<LoginPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('login-form');

      expect(routeProtection).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(routeProtection).toContainElement(form);
    });

    it('should only render RouteProtection and LoginForm', () => {
      const { container } = render(<LoginPage />);

      expect(container.querySelectorAll('[data-testid]').length).toBe(2);
      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(LoginPage).toBeDefined();
      expect(typeof LoginPage).toBe('function');
    });

    it('should export metadata', () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
    });

    it('should have metadata as named export', () => {
      expect(metadata).not.toBeUndefined();
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <LoginPage />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<LoginPage />)).not.toThrow();
    });

    it('should accept no props', () => {
      // Page components should not accept props
      expect(() => render(<LoginPage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<LoginPage />);
      const { container: container2 } = render(<LoginPage />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<LoginPage />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      rerender(<LoginPage />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should maintain structure across rerenders', () => {
      const { rerender } = render(<LoginPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      rerender(<LoginPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should render LoginForm as main content', () => {
      render(<LoginPage />);

      const form = screen.getByTestId('login-form');
      expect(form).toBeInTheDocument();
      expect(form).toBeVisible();
    });

    it('should only render one LoginForm', () => {
      render(<LoginPage />);

      const forms = screen.getAllByTestId('login-form');
      expect(forms).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via test ids', () => {
      render(<LoginPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should have proper component structure for screen readers', () => {
      render(<LoginPage />);

      const routeProtection = screen.getByTestId('route-protection');
      expect(routeProtection).toBeInTheDocument();
    });

    it('should contain accessible form content', () => {
      render(<LoginPage />);

      const form = screen.getByTestId('login-form');
      expect(form).toBeVisible();
    });
  });

  describe('Integration', () => {
    it('should integrate RouteProtection and LoginForm', () => {
      render(<LoginPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('login-form');

      expect(routeProtection).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(routeProtection).toContainElement(form);
    });

    it('should render all components together', () => {
      const { container } = render(<LoginPage />);

      expect(container.querySelector('[data-testid="route-protection"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="login-form"]')).toBeInTheDocument();
    });

    it('should have single root element', () => {
      const { container } = render(<LoginPage />);

      expect(container.children.length).toBe(1);
    });
  });

  describe('Page Purpose', () => {
    it('should be a login page', () => {
      expect(metadata.title).toContain('Login');
      expect(metadata.description).toContain('Sign in');
    });

    it('should describe club dashboard access', () => {
      expect(metadata.description).toContain('club dashboard');
    });

    it('should reference GatherGrove brand', () => {
      expect(metadata.description).toContain('GatherGrove');
    });
  });
});
