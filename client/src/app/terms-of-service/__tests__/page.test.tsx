import React from 'react';
import { render, screen } from '@testing-library/react';
import TermsOfServicePage, { metadata } from '../page';

describe('TermsOfServicePage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Terms of Service');
    });
    it('should export correct metadata description', () => {
      expect(metadata.description).toContain('GatherGrove');
    });
  });

  describe('Page Rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<TermsOfServicePage />)).not.toThrow();
    });
    it('should render Terms of Service heading', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /terms of service/i, level: 1 })).toBeInTheDocument();
    });
    it('should render last updated date', () => {
      render(<TermsOfServicePage />);
      const text = document.body.textContent ?? '';
      expect(text).toMatch(/last updated/i);
    });
  });

  describe('Content Sections', () => {
    it('should render Agreement to Terms section', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /agreement to terms/i })).toBeInTheDocument();
    });
    it('should render Description of Service section', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /description of service/i })).toBeInTheDocument();
    });
    it('should render Acceptable Use section', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /acceptable use/i })).toBeInTheDocument();
    });
    it('should render Payment and Subscriptions section', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /payment and subscriptions/i })).toBeInTheDocument();
    });
    it('should render Limitation of Liability section', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { name: /limitation of liability/i })).toBeInTheDocument();
    });
  });

  describe('Page Purpose', () => {
    it('should not contain fabricated social proof', () => {
      const { container } = render(<TermsOfServicePage />);
      const text = container.textContent ?? '';
      expect(text).not.toMatch(/thousands of/i);
      expect(text).not.toMatch(/\d+\+\s*(users|clubs|members)/i);
    });
  });
});
