import React from 'react';
import { render, screen } from '@testing-library/react';
import ToolResultCard from '../ToolResultCard';
import { TrendingUp } from 'lucide-react';

describe('ToolResultCard', () => {
  it('renders label and value', () => {
    render(<ToolResultCard label="Annual Revenue" value="$12,000" />);
    expect(screen.getByText('Annual Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,000')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ToolResultCard
        label="Annual Revenue"
        value="$12,000"
        description="Total revenue collected from member dues"
      />
    );
    expect(screen.getByText('Total revenue collected from member dues')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(
      <ToolResultCard label="Annual Revenue" value="$12,000" />
    );
    // Should not have a description paragraph
    expect(container.querySelector('[data-slot="description"]')).not.toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    const { container } = render(
      <ToolResultCard label="Annual Revenue" value="$12,000" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-variant', 'default');
  });

  it('applies highlight variant styling', () => {
    const { container } = render(
      <ToolResultCard label="Annual Revenue" value="$12,000" variant="highlight" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-variant', 'highlight');
  });

  it('applies success variant styling', () => {
    const { container } = render(
      <ToolResultCard label="Annual Revenue" value="$12,000" variant="success" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-variant', 'success');
  });

  it('renders icon when provided', () => {
    render(
      <ToolResultCard
        label="Annual Revenue"
        value="$12,000"
        icon={TrendingUp}
      />
    );
    // The icon should be rendered — Lucide icons render as SVG
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render icon container when icon not provided', () => {
    const { container } = render(
      <ToolResultCard label="Annual Revenue" value="$12,000" />
    );
    expect(container.querySelector('[data-slot="icon"]')).not.toBeInTheDocument();
  });
});
