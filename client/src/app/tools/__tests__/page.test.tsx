import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ToolsPage from '../page';

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );
  MockImage.displayName = 'MockImage';
  return MockImage;
});

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

jest.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right" />,
}));

describe('ToolsPage', () => {
  it('renders the main heading', () => {
    render(<ToolsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Free Club Management Tools');
  });

  it('renders the subtitle text', () => {
    render(<ToolsPage />);
    expect(
      screen.getByText(/Practical calculators for club admins\. No signup, no email required/)
    ).toBeInTheDocument();
  });

  it('renders all three tool card names', () => {
    render(<ToolsPage />);
    expect(screen.getByText('Club Dues Calculator')).toBeInTheDocument();
    expect(screen.getByText('Tool Stack Cost Calculator')).toBeInTheDocument();
    expect(screen.getByText('Event Budget Planner')).toBeInTheDocument();
  });

  it('each tool card has a "Try it free" link to the correct URL', () => {
    render(<ToolsPage />);

    const links = screen.getAllByRole('link', { name: /try it free/i });
    expect(links).toHaveLength(3);

    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/tools/club-dues-calculator');
    expect(hrefs).toContain('/tools/tool-stack-cost-calculator');
    expect(hrefs).toContain('/tools/event-budget-planner');
  });

  it('renders the Club Dues Calculator card linking to the correct URL', () => {
    render(<ToolsPage />);
    const link = screen.getAllByRole('link', { name: /try it free/i }).find(
      (l) => l.getAttribute('href') === '/tools/club-dues-calculator'
    );
    expect(link).toBeInTheDocument();
  });

  it('renders the Tool Stack Cost Calculator card linking to the correct URL', () => {
    render(<ToolsPage />);
    const link = screen.getAllByRole('link', { name: /try it free/i }).find(
      (l) => l.getAttribute('href') === '/tools/tool-stack-cost-calculator'
    );
    expect(link).toBeInTheDocument();
  });

  it('renders the Event Budget Planner card linking to the correct URL', () => {
    render(<ToolsPage />);
    const link = screen.getAllByRole('link', { name: /try it free/i }).find(
      (l) => l.getAttribute('href') === '/tools/event-budget-planner'
    );
    expect(link).toBeInTheDocument();
  });
});
