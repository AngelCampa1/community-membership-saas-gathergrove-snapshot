import React from 'react';
import { render, screen } from '@testing-library/react';
import AnnualPlanningPage from '../page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('AnnualPlanningPage', () => {
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
    render(<AnnualPlanningPage />);
    const backLink = screen.getByRole('link', { name: /back to resources/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/resources');
  });

  it('should render page title', () => {
    render(<AnnualPlanningPage />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should render page content', () => {
    const { container } = render(<AnnualPlanningPage />);
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement?.textContent).toBeTruthy();
  });

  it('should render quick navigation or sections', () => {
    const { container } = render(<AnnualPlanningPage />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(1);
  });

  it('should have proper heading hierarchy', () => {
    render(<AnnualPlanningPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should render in a container with proper spacing', () => {
    const { container } = render(<AnnualPlanningPage />);
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('container');
    expect(mainElement).toHaveClass('py-8');
  });
});
