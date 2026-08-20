import React from 'react';
import { render, screen } from '@testing-library/react';
import VolunteerHourTrackingGuidePage from '../page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('VolunteerHourTrackingGuidePage', () => {
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
    const { container } = render(<VolunteerHourTrackingGuidePage />);
    expect(container).toBeTruthy();
  });

  it('renders back to resources link', () => {
    render(<VolunteerHourTrackingGuidePage />);
    const backLink = screen.getByRole('link', { name: /resources/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/resources');
  });

  it('renders H1 heading', () => {
    render(<VolunteerHourTrackingGuidePage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent(/volunteer hour/i);
  });

  it('renders the article element', () => {
    const { container } = render(<VolunteerHourTrackingGuidePage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toBeInTheDocument();
    expect(articleElement?.textContent).toBeTruthy();
  });

  it('renders the article with proper container class', () => {
    const { container } = render(<VolunteerHourTrackingGuidePage />);
    const articleElement = container.querySelector('article');
    expect(articleElement).toHaveClass('container');
    expect(articleElement).toHaveClass('py-12');
  });

  it('renders multiple section headings', () => {
    render(<VolunteerHourTrackingGuidePage />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(3);
  });

  it('renders section about grant reporting', () => {
    render(<VolunteerHourTrackingGuidePage />);
    const grantHeadings = screen.getAllByRole('heading', { name: /grant/i });
    expect(grantHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders QuickAnswer for how to track volunteer hours', () => {
    render(<VolunteerHourTrackingGuidePage />);
    expect(
      screen.getByRole('region', { name: /quick answer.*how do i track volunteer hours/i })
    ).toBeInTheDocument();
  });

  it('renders QuickAnswer for volunteer hours as in-kind donations', () => {
    render(<VolunteerHourTrackingGuidePage />);
    expect(
      screen.getByRole('region', { name: /quick answer.*do volunteer hours count/i })
    ).toBeInTheDocument();
  });

  it('renders a definition box', () => {
    const { container } = render(<VolunteerHourTrackingGuidePage />);
    // DefinitionBox renders a dt/dd or similar definition element
    const hasDtOrDl = container.querySelector('dt, dl, [class*="definition"]');
    const hasDefText = (container.textContent ?? '').includes('Volunteer Hour Equivalent Value');
    expect(hasDtOrDl || hasDefText).toBeTruthy();
  });

  it('renders key takeaways section', () => {
    render(<VolunteerHourTrackingGuidePage />);
    // KeyTakeaways component renders key insights
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/key takeaway|grant report|in-kind/i);
  });

  it('renders IRS compliance content', () => {
    render(<VolunteerHourTrackingGuidePage />);
    const irsHeadings = screen.getAllByRole('heading', { name: /irs/i });
    expect(irsHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the tracking template section', () => {
    render(<VolunteerHourTrackingGuidePage />);
    expect(screen.getByRole('heading', { name: /template/i })).toBeInTheDocument();
  });

  it('does not contain fabricated user counts or statistics', () => {
    const { container } = render(<VolunteerHourTrackingGuidePage />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/thousands of/i);
    expect(text).not.toMatch(/join \d+\+/i);
  });
});
