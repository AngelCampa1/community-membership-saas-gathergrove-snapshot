import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage, { metadata } from '../page';

describe('PrivacyPolicyPage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Privacy Policy');
    });
    it('should export correct metadata description', () => {
      expect(metadata.description).toContain('GatherGrove');
    });
  });

  describe('Page Rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<PrivacyPolicyPage />)).not.toThrow();
    });
    it('should render Privacy Policy heading', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /privacy policy/i, level: 1 })).toBeInTheDocument();
    });
    it('should render effective date', () => {
      render(<PrivacyPolicyPage />);
      const text = document.body.textContent ?? '';
      expect(text).toMatch(/effective date/i);
    });
  });

  describe('Content Sections', () => {
    it('should render Information We Collect section', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /information we collect/i })).toBeInTheDocument();
    });
    it('should render how/why we use information section', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /how .* use information/i })).toBeInTheDocument();
    });
    it('should render Security section', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /^\s*\d+\.\s*security\s*$/i })).toBeInTheDocument();
    });
    it('should render Sub-Processors section', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /sub-processors/i })).toBeInTheDocument();
    });
    it('should render Your Privacy Rights section', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { name: /your privacy rights/i })).toBeInTheDocument();
    });
  });

  describe('Page Purpose', () => {
    it('should not contain fabricated social proof', () => {
      const { container } = render(<PrivacyPolicyPage />);
      const text = container.textContent ?? '';
      expect(text).not.toMatch(/thousands of/i);
      expect(text).not.toMatch(/\d+\+\s*(users|clubs|members)/i);
    });
    it('should mention Stripe for payment security', () => {
      const { container } = render(<PrivacyPolicyPage />);
      const text = container.textContent ?? '';
      expect(text).toContain('Stripe');
    });
  });
});
