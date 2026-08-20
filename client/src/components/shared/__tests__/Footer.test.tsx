import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from '../Footer';
import apiClient from '@/services/apiClient';

// Mock ONLY the HTTP boundary (apiClient). The real marketingService runs, so
// these tests exercise the actual NewsletterSignup -> marketingService ->
// apiClient wiring (W-018: the footer previously used a raw fetch to a relative
// /api/v1 URL that resolved to the Next.js origin instead of the backend).
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

// Universal RadixUI mocks loaded via setupTests.ts for systematic test scaling across 81+ files

// Mock next/image
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, width, height, className, priority, ...props }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} {...props} />
  );
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // TurnstileWidget fetches its site key on mount via apiClient.get; give it a
    // resolved default so its .then() doesn't throw and break the render.
    mockApiClient.get.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the GatherGrove logo and brand name', () => {
    render(<Footer />);

    expect(screen.getByAltText('GatherGrove')).toBeInTheDocument();
  });

  it('renders the company description', () => {
    render(<Footer />);

    const description = screen.getByText(/Simple, affordable membership and event management/);
    expect(description).toBeInTheDocument();
  });

  it('renders product navigation links as proper anchor elements', () => {
    render(<Footer />);

    expect(screen.getByText('Product')).toBeInTheDocument();

    const featuresLink = screen.getByText('Features').closest('a');
    const pricingLink = screen.getByText('Pricing').closest('a');

    expect(featuresLink).toHaveAttribute('href', '/features');
    expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  it('renders About and Club Types links in product section', () => {
    render(<Footer />);

    const aboutLink = screen.getByText('About').closest('a');
    const clubTypesLink = screen.getByText('Club Types').closest('a');

    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(clubTypesLink).toHaveAttribute('href', '/for');
  });

  it('renders Learn column with all content hub links', () => {
    render(<Footer />);

    expect(screen.getByText('Learn')).toBeInTheDocument();

    const resourcesLink = screen.getByText('Resource Library').closest('a');
    const glossaryLink = screen.getByText('Glossary').closest('a');
    const formationLink = screen.getByText('Formation Guides').closest('a');
    const compareLink = screen.getByText('Compare Platforms').closest('a');
    const faqLink = screen.getByText('FAQ').closest('a');
    const blogLink = screen.getByText('Blog').closest('a');

    expect(resourcesLink).toHaveAttribute('href', '/resources');
    expect(glossaryLink).toHaveAttribute('href', '/glossary');
    expect(formationLink).toHaveAttribute('href', '/how-to-start');
    expect(compareLink).toHaveAttribute('href', '/compare');
    expect(faqLink).toHaveAttribute('href', '/faq');
    expect(blogLink).toHaveAttribute('href', '/blog');
  });

  it('renders legal links', () => {
    render(<Footer />);

    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer />);

    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('has correct links for legal and support pages', () => {
    render(<Footer />);

    const termsLink = screen.getByText('Terms of Service').closest('a');
    const privacyLink = screen.getByText('Privacy Policy').closest('a');
    const supportLink = screen.getByText('Help & Support').closest('a');

    expect(termsLink).toHaveAttribute('href', '/terms-of-service');
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    expect(supportLink).toHaveAttribute('href', '/support');
  });

  it('renders copyright information', () => {
    render(<Footer />);

    expect(screen.getByText(`© ${new Date().getFullYear()} GatherGrove. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders the newsletter signup form', () => {
    render(<Footer />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    expect(screen.getByText(/Weekly club management tips/)).toBeInTheDocument();
  });

  it('newsletter form posts to the backend marketing endpoint via apiClient', async () => {
    // Real marketingService runs; apiClient is the mocked HTTP boundary. This
    // proves the request reaches the backend path (/marketing/leads -> apiClient
    // baseURL :8050) instead of a raw fetch to a relative Next.js origin URL.
    mockApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'Thanks!', leadId: 'lead-1' },
    });

    render(<Footer />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          email: 'test@example.com',
          source: 'newsletter',
          companyWebsite: '',
          turnstileToken: '',
          userAgent: expect.any(String),
          currentUrl: expect.any(String),
        })
      );
    });
  });

  it('newsletter form shows success message after API success', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'Thanks!' },
    });

    render(<Footer />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thanks for subscribing/)).toBeInTheDocument();
    });
  });

  it('newsletter form shows an honest error when the backend reports failure', async () => {
    // Backend-reported failure: the real marketingService returns
    // { success: false, message }. The form must surface the error, NOT a
    // dishonest "subscribed" confirmation (W-018: previously it always claimed
    // success and silently stored to localStorage).
    mockApiClient.post.mockResolvedValueOnce({
      data: { success: false, message: 'This email is already subscribed.' },
    });

    render(<Footer />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('This email is already subscribed.')).toBeInTheDocument();
    });

    // Must NOT show a fake success message
    expect(screen.queryByText(/Thanks for subscribing/)).not.toBeInTheDocument();
    // Form is still visible so the user can retry
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('newsletter form shows an honest error on network failure', async () => {
    // apiClient rejects -> real marketingService catches and returns
    // { success: false, message: technical-difficulties }. No fake success.
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

    render(<Footer />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'offline@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/technical difficulties/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Thanks for subscribing/)).not.toBeInTheDocument();
  });

  it('newsletter form does not submit with invalid email', async () => {
    render(<Footer />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(submitButton);

    // No request should be made for an invalid email
    expect(mockApiClient.post).not.toHaveBeenCalled();
    // Form should still be visible (not replaced by success message)
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-muted/50', 'border-t');
  });

  it('renders get started section with CTA links', () => {
    render(<Footer />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();

    const trialLink = screen.getByText('Start Free Trial').closest('a');
    expect(trialLink).toHaveAttribute('href', '/register');

    const learnMoreLink = screen.getByText('See All Features').closest('a');
    expect(learnMoreLink).toHaveAttribute('href', '/features');
  });
});
