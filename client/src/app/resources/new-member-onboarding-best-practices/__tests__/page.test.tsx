import React from 'react';
import { render, screen } from '@testing-library/react';
import NewMemberOnboardingBestPracticesPage from '../page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('NewMemberOnboardingBestPracticesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.matchMedia for Header component
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('should render back to resources link', () => {
    render(<NewMemberOnboardingBestPracticesPage />);
    const resourceLinks = screen.getAllByRole('link', { name: /^Resources$/i });
    const backLink = resourceLinks.find(l => l.getAttribute('href') === '/resources');
    expect(backLink).toBeTruthy();
  });

  it('should render page title', () => {
    render(<NewMemberOnboardingBestPracticesPage />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should render page content', () => {
    const { container } = render(<NewMemberOnboardingBestPracticesPage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toBeInTheDocument();
    expect(articleElement?.textContent).toBeTruthy();
  });

  it('should render quick navigation or sections', () => {
    const { container } = render(<NewMemberOnboardingBestPracticesPage />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(1);
  });

  it('should have proper heading hierarchy', () => {
    render(<NewMemberOnboardingBestPracticesPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should render in a container with proper spacing', () => {
    const { container } = render(<NewMemberOnboardingBestPracticesPage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toHaveClass('container');
    expect(articleElement).toHaveClass('py-12');
  });
});
