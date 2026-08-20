import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FAQSection } from '../FAQSection';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
}));

describe('FAQSection', () => {
  it('renders without crashing', () => {
    expect(() => render(<FAQSection />)).not.toThrow();
  });

  it('renders FAQ questions', () => {
    render(<FAQSection />);
    expect(screen.getByText(/How much does GatherGrove cost\?/i)).toBeInTheDocument();
  });

  it('pricing answer mentions plan prices', () => {
    render(<FAQSection />);
    // Click the question button to expand the accordion
    const pricingButton = screen.getByRole('button', { name: /How much does GatherGrove cost\?/i });
    fireEvent.click(pricingButton);
    // Now the answer region should be visible with all three plans
    expect(screen.getByText(/\$9/)).toBeInTheDocument();
    expect(screen.getByText(/\$29/)).toBeInTheDocument();
    expect(screen.getByText(/Grow/)).toBeInTheDocument();
  });

  it('collapses an open FAQ item when clicked again', () => {
    render(<FAQSection />);
    const pricingButton = screen.getByRole('button', { name: /How much does GatherGrove cost\?/i });
    // Open
    fireEvent.click(pricingButton);
    expect(screen.getByText(/\$29/)).toBeInTheDocument();
    // Close
    fireEvent.click(pricingButton);
    expect(screen.queryByText(/\$29/)).not.toBeInTheDocument();
  });

  it('pricing answer mentions plan tiers', () => {
    render(<FAQSection />);
    const pricingButton = screen.getByRole('button', { name: /How much does GatherGrove cost\?/i });
    fireEvent.click(pricingButton);
    // All three plan tiers must be visible after expanding
    expect(screen.getByText(/Seed/)).toBeInTheDocument();
    expect(screen.getByText(/Grow/)).toBeInTheDocument();
    expect(screen.getByText(/Expand/)).toBeInTheDocument();
  });
});
