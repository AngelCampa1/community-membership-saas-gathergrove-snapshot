/**
 * Tests for Header.tsx - Main header with scroll effects
 * Covers: crawlable nav links, ROI removal, pathname-conditional scroll behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

// Mock next/navigation — default to homepage
const mockUsePathname = jest.fn(() => '/');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => mockUsePathname(),
}));

// Mock ThemeToggle
jest.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
}));

// Mock next/link — render as <a> so href assertions work
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick, className, ...props }: any) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
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

    // Mock scrollTo
    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: jest.fn(),
    });
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<Header />)).not.toThrow();
    });

    it('renders header element', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Crawlable nav links (SEO)', () => {
    it('renders a Features link with href="/features" in the desktop nav', () => {
      render(<Header />);
      // There may be multiple (desktop + mobile hidden), find at least one with correct href
      const featuresLinks = screen.getAllByRole('link', { name: /features/i });
      const hasFeaturesHref = featuresLinks.some(
        (link) => link.getAttribute('href') === '/features'
      );
      expect(hasFeaturesHref).toBe(true);
    });

    it('renders a Pricing link with href="/pricing" in the desktop nav', () => {
      render(<Header />);
      const pricingLinks = screen.getAllByRole('link', { name: /^pricing$/i });
      const hasPricingHref = pricingLinks.some(
        (link) => link.getAttribute('href') === '/pricing'
      );
      expect(hasPricingHref).toBe(true);
    });

    it('renders an ROI Calculator link with href="/#roi" in the desktop nav', () => {
      render(<Header />);
      const roiLinks = screen.getAllByRole('link', { name: /roi calculator/i });
      const hasRoiHref = roiLinks.some(
        (link) => link.getAttribute('href') === '/#roi'
      );
      expect(hasRoiHref).toBe(true);
    });

    it('Features <a> element has href="/features"', () => {
      const { container } = render(<Header />);
      const featuresAnchors = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.textContent?.trim() === 'Features' && a.getAttribute('href') === '/features'
      );
      expect(featuresAnchors.length).toBeGreaterThan(0);
    });

    it('Pricing <a> element has href="/pricing"', () => {
      const { container } = render(<Header />);
      const pricingAnchors = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.textContent?.trim() === 'Pricing' && a.getAttribute('href') === '/pricing'
      );
      expect(pricingAnchors.length).toBeGreaterThan(0);
    });

    it('ROI Calculator <a> element has href="/#roi"', () => {
      const { container } = render(<Header />);
      const roiAnchors = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.textContent?.trim() === 'ROI Calculator' && a.getAttribute('href') === '/#roi'
      );
      expect(roiAnchors.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile menu nav links', () => {
    it('mobile menu Features link has href="/features"', async () => {
      render(<Header />);
      // Open mobile menu
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await userEvent.click(menuButton);

      const featuresLinks = screen.getAllByRole('link', { name: /features/i });
      const hasFeaturesHref = featuresLinks.some(
        (link) => link.getAttribute('href') === '/features'
      );
      expect(hasFeaturesHref).toBe(true);
    });

    it('mobile menu Pricing link has href="/pricing"', async () => {
      render(<Header />);
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await userEvent.click(menuButton);

      const pricingLinks = screen.getAllByRole('link', { name: /^pricing$/i });
      const hasPricingHref = pricingLinks.some(
        (link) => link.getAttribute('href') === '/pricing'
      );
      expect(hasPricingHref).toBe(true);
    });

    it('mobile menu includes ROI Calculator with href="/#roi"', async () => {
      render(<Header />);
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await userEvent.click(menuButton);

      const roiLinks = screen.getAllByRole('link', { name: /roi calculator/i });
      const hasRoiHref = roiLinks.some(
        (link) => link.getAttribute('href') === '/#roi'
      );
      expect(hasRoiHref).toBe(true);
    });
  });

  describe('Scroll behavior on homepage (pathname = "/")', () => {
    it('clicking Features on homepage calls scrollToSection (getElementById)', async () => {
      mockUsePathname.mockReturnValue('/');
      const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(null);

      render(<Header />);
      const featuresLinks = screen.getAllByRole('link', { name: /features/i });
      // Click the first Features link (desktop nav)
      await userEvent.click(featuresLinks[0]);

      // scrollToSection calls document.getElementById with "features"
      expect(mockGetElementById).toHaveBeenCalledWith('features');
      mockGetElementById.mockRestore();
    });

    it('clicking Pricing on homepage calls scrollToSection (getElementById)', async () => {
      mockUsePathname.mockReturnValue('/');
      const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(null);

      render(<Header />);
      const pricingLinks = screen.getAllByRole('link', { name: /^pricing$/i });
      await userEvent.click(pricingLinks[0]);

      expect(mockGetElementById).toHaveBeenCalledWith('pricing');
      mockGetElementById.mockRestore();
    });
  });

  describe('Navigation behavior on non-homepage routes', () => {
    it('clicking Features on /about does NOT call window.scrollTo', async () => {
      mockUsePathname.mockReturnValue('/about');
      const mockScrollTo = jest.fn();
      Object.defineProperty(window, 'scrollTo', { writable: true, value: mockScrollTo });

      render(<Header />);
      const featuresLinks = screen.getAllByRole('link', { name: /features/i });
      await userEvent.click(featuresLinks[0]);

      // scrollToSection calls window.scrollTo — if not on homepage, it should not be called
      expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('clicking Pricing on /about does NOT call window.scrollTo', async () => {
      mockUsePathname.mockReturnValue('/about');
      const mockScrollTo = jest.fn();
      Object.defineProperty(window, 'scrollTo', { writable: true, value: mockScrollTo });

      render(<Header />);
      const pricingLinks = screen.getAllByRole('link', { name: /^pricing$/i });
      await userEvent.click(pricingLinks[0]);

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('Existing functionality preserved', () => {
    it('renders logo link to "/"', () => {
      const { container } = render(<Header />);
      const logoAnchor = container.querySelector('a[href="/"]');
      expect(logoAnchor).toBeInTheDocument();
    });

    it('renders Login and Start Free Trial links', () => {
      render(<Header />);
      const loginLinks = screen.getAllByRole('link', { name: /login/i });
      expect(loginLinks.length).toBeGreaterThan(0);

      const signupLinks = screen.getAllByRole('link', { name: /start free trial/i });
      expect(signupLinks.length).toBeGreaterThan(0);
    });

    it('renders Resources link', () => {
      render(<Header />);
      const resourcesLinks = screen.getAllByRole('link', { name: /resources/i });
      const hasResourcesHref = resourcesLinks.some(
        (link) => link.getAttribute('href') === '/resources'
      );
      expect(hasResourcesHref).toBe(true);
    });

    it('renders theme toggle', () => {
      render(<Header />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('mobile menu opens and closes on toggle', async () => {
      render(<Header />);
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);

      // Menu starts closed — no mobile login link
      expect(screen.queryByTestId('link-login-mobile')).not.toBeInTheDocument();

      await userEvent.click(menuButton);
      expect(screen.getByTestId('link-login-mobile')).toBeInTheDocument();

      await userEvent.click(menuButton);
      expect(screen.queryByTestId('link-login-mobile')).not.toBeInTheDocument();
    });
  });
});
