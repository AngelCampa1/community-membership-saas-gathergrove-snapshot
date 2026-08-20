import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { HeroSection } from '../HeroSection';

// Universal RadixUI mocks loaded via setupTests.ts for systematic test scaling across 81+ files

// Mock Google Analytics hook
jest.mock('@/hooks/useGoogleAnalytics', () => ({
  useGoogleAnalytics: () => ({
    trackHeroInteraction: jest.fn(),
    trackFunnel: jest.fn(),
    trackPricingInteraction: jest.fn(),
  }),
}));

// Mock UI components - using correct path
jest.mock('@/components/ui/free-trial-badge', () => ({
  FreeTrialBadge: ({ size }: { size?: string }) => <div data-testid="free-trial-badge">30-Day Free Trial {size}</div>,
}));

jest.mock('@/components/ui/trust-symbols', () => ({
  TrustSymbols: () => <div data-testid="trust-symbols">Trust Symbols</div>,
}));

jest.mock('@/components/features/AnimatedPlatformPreview', () => ({
  AnimatedPlatformPreview: () => <div data-testid="animated-platform-preview">Platform Preview</div>,
}));

// Mock performance hook
jest.mock('@/hooks/useRenderPerformance', () => ({
  useRenderPerformance: jest.fn(),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    h1: ({ children, className, ...props }: any) => (
      <h1 className={className} {...props}>{children}</h1>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} {...props}>{children}</p>
    ),
    section: ({ children, className, ...props }: any) => (
      <section className={className} {...props}>{children}</section>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => true,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
}));

describe('HeroSection', () => {
  it('renders hero section with main heading', () => {
    render(<HeroSection />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Stop Juggling Spreadsheets/i);
  });

  it('renders CTA buttons', () => {
    render(<HeroSection />);

    const primaryCTA = screen.getByText(/Start Free Trial/i);
    expect(primaryCTA).toBeInTheDocument();
  });

  it('renders feature highlights badge', () => {
    render(<HeroSection />);

    const badgeElement = screen.getByText(/Replace 5\+ tools with one dashboard/i);
    expect(badgeElement).toBeInTheDocument();
  });

  it('renders static trust indicators', () => {
    render(<HeroSection />);

    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('Free Trial')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('Setup Time')).toBeInTheDocument();
    expect(screen.getByText('5+')).toBeInTheDocument();
    expect(screen.getByText('Tools Replaced')).toBeInTheDocument();
  });

  it('renders hero description text', () => {
    render(<HeroSection />);

    const description = screen.getByText(/Members, events, dues collection, and communications/i);
    expect(description).toBeInTheDocument();
  });

  it('renders credit card notice separately from trial info', () => {
    render(<HeroSection />);

    expect(screen.getByText(/30-day free trial/)).toBeInTheDocument();
    expect(screen.getByText(/Credit card required to start your trial/)).toBeInTheDocument();
  });

  it('renders trust symbols section', () => {
    render(<HeroSection />);

    expect(screen.getByTestId('trust-symbols')).toBeInTheDocument();
  });

  it('renders animated platform preview', () => {
    render(<HeroSection />);

    expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();
  });
});
