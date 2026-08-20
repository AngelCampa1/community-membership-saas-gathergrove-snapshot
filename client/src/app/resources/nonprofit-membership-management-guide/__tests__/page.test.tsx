import React from 'react';
import { render, screen } from '@testing-library/react';
import NonprofitMembershipManagementGuidePage from '../page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('NonprofitMembershipManagementGuidePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('renders without crashing', () => {
    const { container } = render(<NonprofitMembershipManagementGuidePage />);
    expect(container).toBeTruthy();
  });

  it('renders back to resources link', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    const backLink = screen.getByRole('link', { name: /resources/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/resources');
  });

  it('renders H1 heading about nonprofit membership management', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent(/nonprofit membership/i);
  });

  it('renders the article element', () => {
    const { container } = render(<NonprofitMembershipManagementGuidePage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toBeInTheDocument();
    expect(articleElement?.textContent).toBeTruthy();
  });

  it('renders the article with proper container class', () => {
    const { container } = render(<NonprofitMembershipManagementGuidePage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toHaveClass('container');
    expect(articleElement).toHaveClass('py-12');
  });

  it('renders QuickAnswer for nonprofit membership management definition', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(
      screen.getByRole('region', { name: /quick answer.*what is nonprofit membership management/i })
    ).toBeInTheDocument();
  });

  it('renders QuickAnswer for best membership software for nonprofits', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(
      screen.getByRole('region', { name: /quick answer.*best membership software for nonprofits/i })
    ).toBeInTheDocument();
  });

  it('renders the members vs donors section', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(screen.getByRole('heading', { name: /members vs.*donors/i })).toBeInTheDocument();
  });

  it('renders the dues collection section', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    const duesHeadings = screen.getAllByRole('heading', { name: /dues collection/i });
    expect(duesHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the member onboarding section', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(screen.getByRole('heading', { name: /onboarding new/i })).toBeInTheDocument();
  });

  it('renders the choosing software section', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(screen.getByRole('heading', { name: /choosing membership software/i })).toBeInTheDocument();
  });

  it('renders 501(c)(3) compliance section', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    expect(screen.getByRole('heading', { name: /501|compliance/i })).toBeInTheDocument();
  });

  it('renders definition box for member lifecycle', () => {
    const { container } = render(<NonprofitMembershipManagementGuidePage />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/member lifecycle/i);
  });

  it('renders multiple section headings', () => {
    render(<NonprofitMembershipManagementGuidePage />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(4);
  });

  it('does not contain fabricated user counts', () => {
    const { container } = render(<NonprofitMembershipManagementGuidePage />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/thousands of/i);
    expect(text).not.toMatch(/join \d+\+/i);
  });
});
