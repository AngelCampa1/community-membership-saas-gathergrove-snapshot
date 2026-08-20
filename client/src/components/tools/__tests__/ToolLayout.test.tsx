import React from 'react';
import { render, screen } from '@testing-library/react';
import ToolLayout from '../ToolLayout';

describe('ToolLayout', () => {
  const defaultProps = {
    title: 'Club Dues Calculator',
    description: 'Calculate your club dues and generate a proposal template.',
    children: <div data-testid="tool-content">Calculator goes here</div>,
  };

  it('renders breadcrumb with Home link', () => {
    render(<ToolLayout {...defaultProps} />);
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders breadcrumb with Free Tools link', () => {
    render(<ToolLayout {...defaultProps} />);
    const links = screen.getAllByRole('link', { name: /free tools/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders breadcrumb with the title as current page', () => {
    render(<ToolLayout {...defaultProps} />);
    // The title appears in breadcrumb as non-link text
    const breadcrumbTitle = screen.getAllByText('Club Dues Calculator');
    expect(breadcrumbTitle.length).toBeGreaterThanOrEqual(1);
  });

  it('renders title as h1', () => {
    render(<ToolLayout {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Club Dues Calculator', level: 1 })).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ToolLayout {...defaultProps} />);
    expect(
      screen.getByText('Calculate your club dues and generate a proposal template.')
    ).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ToolLayout {...defaultProps} />);
    expect(screen.getByTestId('tool-content')).toBeInTheDocument();
    expect(screen.getByText('Calculator goes here')).toBeInTheDocument();
  });

  it('renders related links when provided', () => {
    render(
      <ToolLayout
        {...defaultProps}
        relatedLinks={[
          { label: 'Event Budget Planner', href: '/tools/event-budget' },
          { label: 'Pricing Plans', href: '/pricing' },
        ]}
      />
    );
    expect(screen.getByText(/related resources/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Event Budget Planner' })).toHaveAttribute(
      'href',
      '/tools/event-budget'
    );
    expect(screen.getByRole('link', { name: 'Pricing Plans' })).toHaveAttribute(
      'href',
      '/pricing'
    );
  });

  it('does not render related links section when not provided', () => {
    render(<ToolLayout {...defaultProps} />);
    expect(screen.queryByText(/related resources/i)).not.toBeInTheDocument();
  });

  it('does not render related links section when empty array provided', () => {
    render(<ToolLayout {...defaultProps} relatedLinks={[]} />);
    expect(screen.queryByText(/related resources/i)).not.toBeInTheDocument();
  });
});
