import React from 'react';
import { render, screen } from '@testing-library/react';
import PricingPage, { metadata } from '../page';

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/shared/PricingSection', () => ({
  PricingSection: () => <div data-testid="pricing-section">PricingSection</div>,
}));

jest.mock('@/components/shared/FAQSection', () => ({
  FAQSection: () => <div data-testid="faq-section">FAQSection</div>,
}));

describe('PricingPage', () => {
  describe('Metadata', () => {
    it('should have correct title', () => {
      expect(metadata.title).toEqual({ absolute: 'Club Management Software Pricing | Plans from $9/mo | GatherGrove' });
    });

    it('should have correct description', () => {
      expect(metadata.description).toContain('pricing');
    });

    it('should have OpenGraph metadata', () => {
      expect(metadata.openGraph).toBeDefined();
    });

    it('has pricing-specific twitter card metadata', () => {
      const tw = metadata.twitter as Record<string, unknown>;
      expect(tw).toBeDefined();
      expect(tw.card).toBe('summary_large_image');
      expect((tw.title as string).toLowerCase()).toContain('pricing');
      expect((tw.description as string).toLowerCase()).toContain('$9');
    });
  });

  describe('Rendering', () => {
    it('should render the page', () => {
      const { container } = render(<PricingPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render Header', () => {
      render(<PricingPage />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Footer', () => {
      render(<PricingPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render PricingSection', () => {
      render(<PricingPage />);
      expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    });

    it('should render FAQSection', () => {
      render(<PricingPage />);
      expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    });

    it('should have semantic main element', () => {
      const { container } = render(<PricingPage />);
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should render the Learn More section heading', () => {
      render(<PricingPage />);
      expect(screen.getByText(/learn more/i)).toBeInTheDocument();
    });

    it('should have a "Compare Alternatives" link to /compare', () => {
      render(<PricingPage />);
      const link = screen.getByRole('link', { name: /compare alternatives/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/compare');
    });

    it('should have a link to /features', () => {
      render(<PricingPage />);
      const link = screen.getByRole('link', { name: /all features/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/features');
    });

    it('should have a link to /resources', () => {
      render(<PricingPage />);
      const link = screen.getByRole('link', { name: /resource library/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/resources');
    });

    it('should have a "Solutions by Club Type" link to /for', () => {
      render(<PricingPage />);
      const link = screen.getByRole('link', { name: /solutions by club type/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/for');
    });
  });
});
