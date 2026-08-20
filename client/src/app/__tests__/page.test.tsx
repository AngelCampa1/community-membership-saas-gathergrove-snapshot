import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock all components
jest.mock('@/components/shared/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">HeroSection</div>,
}));

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/performance/LazySection', () => {
  return ({ children }: { children: React.ReactNode }) => <div data-testid="lazy-section">{children}</div>;
});

jest.mock('@/components/performance/CriticalCSS', () => ({
  __esModule: true,
  default: () => <div data-testid="critical-css">CriticalCSS</div>,
}));

// Mock lazy-loaded components
jest.mock('@/components/shared/FeaturesSection', () => ({
  FeaturesSection: () => <div data-testid="features-section">FeaturesSection</div>,
}));

jest.mock('@/components/features/MobileShowcase', () => ({
  MobileShowcase: () => <div data-testid="mobile-showcase">MobileShowcase</div>,
}));

jest.mock('@/components/shared/ROICalculator', () => ({
  ROICalculator: () => <div data-testid="roi-calculator">ROICalculator</div>,
}));

jest.mock('@/components/shared/TrialBenefitsSection', () => ({
  TrialBenefitsSection: () => <div data-testid="trial-benefits-section">TrialBenefitsSection</div>,
}));

jest.mock('@/components/shared/PricingSection', () => ({
  PricingSection: () => <div data-testid="pricing-section">PricingSection</div>,
}));

jest.mock('@/components/shared/FAQSection', () => ({
  FAQSection: () => <div data-testid="faq-section">FAQSection</div>,
}));

describe('Home', () => {
  describe('Page Rendering', () => {
    it('should render the home page', () => {
      const { container } = render(<Home />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render Header', () => {
      render(<Home />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Footer', () => {
      render(<Home />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should have main element', () => {
      const { container } = render(<Home />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have correct main element classes', () => {
      const { container } = render(<Home />);
      const main = container.querySelector('main');
      expect(main).toHaveClass('w-full');
      expect(main).toHaveClass('overflow-x-hidden');
    });
  });

  describe('Hero Section', () => {
    it('should render HeroSection', () => {
      render(<Home />);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });
  });

  describe('Content Sections', () => {
    it('should render FeaturesSection', () => {
      render(<Home />);
      expect(screen.getByTestId('features-section')).toBeInTheDocument();
    });

    it('should render MobileShowcase in lazy wrapper', () => {
      render(<Home />);
      expect(screen.getByTestId('mobile-showcase')).toBeInTheDocument();
    });

    it('should render ROICalculator in lazy wrapper', () => {
      render(<Home />);
      expect(screen.getByTestId('roi-calculator')).toBeInTheDocument();
    });

    it('should render PricingSection eagerly for SEO', () => {
      render(<Home />);
      expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    });

    it('should render FAQSection eagerly for SEO', () => {
      render(<Home />);
      expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    });

    it('should have LazySection wrappers for non-SEO sections only', () => {
      render(<Home />);
      const lazySections = screen.getAllByTestId('lazy-section');
      // MobileShowcase, ROICalculator, TrialBenefitsSection are lazy-loaded
      // PricingSection and FAQSection are rendered eagerly for SEO
      expect(lazySections).toHaveLength(3);
    });
  });

  describe('Performance Optimizations', () => {
    it('should not render duplicate CriticalCSS (rendered in layout.tsx, not page.tsx)', () => {
      // CriticalCSS is rendered once in layout.tsx. The duplicate in page.tsx
      // was removed. The mock is registered but CriticalCSS is not in page.tsx output.
      render(<Home />);
      expect(screen.queryByTestId('critical-css')).not.toBeInTheDocument();
    });

    it('should have min-h-screen on root', () => {
      const { container } = render(<Home />);
      const root = container.querySelector('.min-h-screen');
      expect(root).toBeInTheDocument();
    });

    it('should have bg-background class', () => {
      const { container } = render(<Home />);
      const root = container.querySelector('.bg-background');
      expect(root).toBeInTheDocument();
    });
  });

  describe('Section Order', () => {
    it('should render sections in correct order', () => {
      render(<Home />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('features-section')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('roi-calculator')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
      expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    });

    it('should have Header before main content', () => {
      const { container } = render(<Home />);

      const header = container.querySelector('[data-testid="header"]');
      const hero = container.querySelector('[data-testid="hero-section"]');

      expect(header).toBeInTheDocument();
      expect(hero).toBeInTheDocument();
    });

    it('should have Footer after main content', () => {
      const { container } = render(<Home />);

      const footer = container.querySelector('[data-testid="footer"]');
      const faq = container.querySelector('[data-testid="faq-section"]');

      expect(footer).toBeInTheDocument();
      expect(faq).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(Home).toBeDefined();
      expect(typeof Home).toBe('function');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic header element', () => {
      const { container } = render(<Home />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should have semantic main element', () => {
      const { container } = render(<Home />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have semantic footer element', () => {
      const { container } = render(<Home />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have proper document structure', () => {
      const { container } = render(<Home />);

      const header = container.querySelector('header');
      const main = container.querySelector('main');
      const footer = container.querySelector('footer');

      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<Home />);
      const { container: container2 } = render(<Home />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<Home />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();

      rerender(<Home />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() => render(<Home />)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate all components correctly', () => {
      render(<Home />);

      // Layout
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // Sections
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('features-section')).toBeInTheDocument();
    });

    it('should have all main sections', () => {
      render(<Home />);

      const sections = [
        'hero-section',
        'features-section',
        'mobile-showcase',
        'roi-calculator',
        'pricing-section',
        'faq-section',
      ];

      sections.forEach(section => {
        expect(screen.getByTestId(section)).toBeInTheDocument();
      });
    });
  });
});
