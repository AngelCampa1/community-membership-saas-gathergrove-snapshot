// CRITICAL: Apply EXACT proven RadixUI inline mocking pattern
// Import React at the top for use in mocks
import React from 'react';

// Mock Radix UI Slot component - REQUIRED for button component
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/hooks/useGoogleAnalytics', () => ({
  useGoogleAnalytics: () => ({
    trackHeroInteraction: jest.fn(),
    trackFunnel: jest.fn(),
    trackPricingInteraction: jest.fn(),
  }),
}));

// Mock lucide-react icons used in PricingSection
jest.mock('lucide-react', () => ({
  Check: (props: any) => <svg data-testid="check-icon" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="trending-up-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
  ChevronUp: (props: any) => <svg data-testid="chevron-up-icon" {...props} />,
  Shield: (props: any) => <svg data-testid="shield-icon" {...props} />,
  Lock: (props: any) => <svg data-testid="lock-icon" {...props} />,
}));

// Mock framer-motion with proper motion components
jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      return React.forwardRef(({ children, initial, animate, transition, whileHover, ...rest }: any, ref: any) => {
        const Element = prop as string;
        return React.createElement(Element, { ref, ...rest }, children);
      });
    }
  });

  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const Link = React.forwardRef(({ children, href, ...props }: any, ref: any) =>
    <a ref={ref} href={href} {...props}>{children}</a>
  );
  Link.displayName = 'Link';
  return {
    __esModule: true,
    default: Link,
  };
});

// Note: free-forever-badge was removed in pricing restructure

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock UI button with buttonVariants - using proven pattern
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={`button ${className || ''}`} data-testid="button" {...props}>{children}</button>
  ),
  buttonVariants: ({ variant = 'default', size = 'default' }: any = {}) => `button-${variant}-${size}`,
}));

// Mock UI card components - using proven pattern
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

// Import testing utilities (React already imported at top)
import { render, fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/dom';

// Now import the component after all mocks
// Component is exported as named export 'PricingSection'
import { PricingSection } from '../PricingSection';

describe('PricingSection', () => {
  it('renders pricing section with heading', () => {
    render(<PricingSection />);

    const heading = screen.getByRole('heading', { name: /simple pricing that fits your club/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders all pricing tiers', () => {
    render(<PricingSection />);

    // 3-tier model: Seed, Grow, and Expand
    expect(screen.getAllByText(/seed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/grow/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/expand/i).length).toBeGreaterThan(0);
    // Sprout should not appear
    expect(screen.queryByText(/sprout/i)).toBeNull();
  });

  it('renders pricing amounts', () => {
    render(<PricingSection />);

    // Default view is monthly: Seed=$9, Grow=$29, Unlimited=$200
    expect(screen.getAllByText(/\$9/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$29/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$200/).length).toBeGreaterThan(0);
  });

  it('renders Seed plan with correct features', () => {
    render(<PricingSection />);

    expect(screen.getAllByText(/up to 100 members/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,000 emails\/month/i).length).toBeGreaterThan(0);
  });

  it('renders Seed plan CTA with correct href', () => {
    render(<PricingSection />);

    // In monthly mode, the Seed CTA should link to /register?plan=seed&billing=monthly
    const links = screen.getAllByRole('link');
    const seedLink = links.find(l => l.getAttribute('href')?.includes('plan=seed'));
    expect(seedLink).toBeDefined();
    expect(seedLink!.getAttribute('href')).toBe('/register?plan=seed&billing=monthly');
  });

  it('renders Seed CTA button text as Start Free Trial', () => {
    render(<PricingSection />);

    // Find the Seed plan CTA link
    const links = screen.getAllByRole('link');
    const seedLink = links.find(l => l.getAttribute('href')?.includes('plan=seed'));
    expect(seedLink).toBeDefined();
    expect(seedLink!.textContent).toContain('Start Free Trial');
  });

  it('renders feature lists with check icons', () => {
    render(<PricingSection />);

    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons.length).toBeGreaterThan(10); // Multiple features across plans
  });

  it('renders CTA buttons for each plan', () => {
    render(<PricingSection />);

    const ctaButtons = screen.getAllByRole('link');  // Links, not buttons since using next/link
    expect(ctaButtons.length).toBeGreaterThanOrEqual(2); // At least one per tier shown
  });

  it('handles plan selection interactions', () => {
    render(<PricingSection />);

    // Default view is monthly; CTAs show "Start Free Trial" or "⚡ Start Monthly"
    const ctaLinks = screen.getAllByRole('link');
    expect(ctaLinks.length).toBeGreaterThanOrEqual(2); // at least one per tier
    fireEvent.click(ctaLinks[0]);

    // Link should be clickable without errors
    expect(ctaLinks[0]).toBeInTheDocument();
  });

  it('displays member limits for each tier', () => {
    render(<PricingSection />);

    // 3-tier model: Seed=100 members, Grow=200 members, Expand=2,000 members
    expect(screen.getAllByText(/up to 100 members/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/up to 200 members/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/up to 2,000 members/i).length).toBeGreaterThan(0);
    // Sprout's 50-member limit should not appear
    expect(screen.queryByText(/up to 50 members/i)).toBeNull();
  });

  it('shows annual prices when annual billing is toggled', () => {
    render(<PricingSection />);

    // The billing toggle is a div with onClick, sibling to "Pay Annually" span
    // Monthly prices should show by default
    expect(screen.getAllByText(/\$29/).length).toBeGreaterThan(0);

    // Find the toggle div (sits between "Pay Monthly" and "Pay Annually" spans)
    const payMonthlySpan = screen.getByText(/pay monthly/i);
    const toggleDiv = payMonthlySpan.nextElementSibling;
    expect(toggleDiv).not.toBeNull();
    fireEvent.click(toggleDiv!);
    expect(screen.getAllByText(/\$290/).length).toBeGreaterThan(0);
    // Seed annual price should also show
    expect(screen.getAllByText(/\$90/).length).toBeGreaterThan(0);
  });

  it('renders Seed annual CTA with correct href when annual billing is active', () => {
    render(<PricingSection />);

    const payMonthlySpan = screen.getByText(/pay monthly/i);
    const toggleDiv = payMonthlySpan.nextElementSibling;
    fireEvent.click(toggleDiv!);

    const links = screen.getAllByRole('link');
    const seedAnnualLink = links.find(l => l.getAttribute('href')?.includes('plan=seed&billing=annual'));
    expect(seedAnnualLink).toBeDefined();
  });

  it('renders comparison table with Seed column', () => {
    render(<PricingSection />);

    // Table header should include Seed
    const tableHeaders = screen.getAllByRole('columnheader');
    const headerTexts = tableHeaders.map(h => h.textContent);
    expect(headerTexts.some(t => /seed/i.test(t || ''))).toBe(true);
  });

  it('renders Compare Plans heading', () => {
    render(<PricingSection />);
    expect(screen.getByRole('heading', { name: /compare plans/i })).toBeInTheDocument();
  });
});
