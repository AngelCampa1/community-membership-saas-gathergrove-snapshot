import React from 'react';
import { render, screen } from '@testing-library/react';
import SupportPage, { metadata } from '../page';

describe('SupportPage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Help & Support');
    });
    it('should export correct metadata description', () => {
      expect(metadata.description).toContain('GatherGrove');
    });
    it('should have canonical URL', () => {
      expect(metadata.alternates?.canonical).toBe('/support');
    });
  });

  describe('Page Rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<SupportPage />)).not.toThrow();
    });
    it('should render the main heading', () => {
      render(<SupportPage />);
      expect(screen.getByRole('heading', { name: /help & support/i, level: 1 })).toBeInTheDocument();
    });
    it('should render the page subtitle', () => {
      render(<SupportPage />);
      expect(screen.getByText(/we're here to help/i)).toBeInTheDocument();
    });
  });

  describe('Support Options', () => {
    it('should render Documentation card', () => {
      render(<SupportPage />);
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });
    it('should render Quick Setup card', () => {
      render(<SupportPage />);
      expect(screen.getByText('Quick Setup')).toBeInTheDocument();
    });
    it('should render View Documentation link to /resources', () => {
      render(<SupportPage />);
      const link = screen.getByRole('link', { name: /view documentation/i });
      expect(link).toHaveAttribute('href', '/resources');
    });
    it('should render Contact Support link to email', () => {
      render(<SupportPage />);
      const link = screen.getByRole('link', { name: /contact support/i });
      expect(link).toHaveAttribute('href', 'mailto:support@gathergrove.club');
    });
    it('should render Start Setup Guide link to /register', () => {
      render(<SupportPage />);
      const link = screen.getByRole('link', { name: /start setup guide/i });
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  describe('FAQ Section', () => {
    it('should render FAQ heading', () => {
      render(<SupportPage />);
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    });
    it('should render getting started FAQ', () => {
      render(<SupportPage />);
      expect(screen.getByText(/how do i get started with gathergrove/i)).toBeInTheDocument();
    });
    it('should render data security FAQ', () => {
      render(<SupportPage />);
      expect(screen.getByText(/is my club data secure/i)).toBeInTheDocument();
    });
    it('should render member data import FAQ', () => {
      render(<SupportPage />);
      expect(screen.getByText(/can i import my existing member data/i)).toBeInTheDocument();
    });
    it('should render cancellation FAQ', () => {
      render(<SupportPage />);
      expect(screen.getByText(/can i cancel my subscription anytime/i)).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('should render Still need help section', () => {
      render(<SupportPage />);
      expect(screen.getByText(/still need help/i)).toBeInTheDocument();
    });
    it('should render email support link in contact section', () => {
      render(<SupportPage />);
      const emailLink = screen.getByRole('link', { name: /email support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@gathergrove.club');
    });
    it('should render Start Free Trial link to /register', () => {
      render(<SupportPage />);
      const links = screen.getAllByRole('link', { name: /start free trial/i });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute('href', '/register');
    });
  });

  describe('Page Purpose', () => {
    it('should not contain fabricated social proof', () => {
      const { container } = render(<SupportPage />);
      const text = container.textContent ?? '';
      expect(text).not.toMatch(/thousands of/i);
      expect(text).not.toMatch(/\d+\+\s*(users|clubs|members)/i);
    });
  });
});
