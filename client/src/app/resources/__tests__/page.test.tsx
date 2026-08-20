import React from 'react';
import { render, screen } from '@testing-library/react';
import ResourcesPage from '../page';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="download-icon">
      <path />
    </svg>
  ),
  FileText: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="file-text-icon">
      <path />
    </svg>
  ),
  BookOpen: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="book-open-icon">
      <path />
    </svg>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-left-icon">
      <path />
    </svg>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-right-icon">
      <path />
    </svg>
  ),
  Star: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="star-icon">
      <path />
    </svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="clock-icon">
      <path />
    </svg>
  ),
}));

// Mock components
jest.mock('@/components/shared/MinimalistHeader', () => ({
  MinimalistHeader: () => <header data-testid="minimalist-header">MinimalistHeader</header>,
}));

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('ResourcesPage', () => {
  describe('Page Rendering', () => {
    it('should render the page component', () => {
      const { container } = render(<ResourcesPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have min-h-screen class', () => {
      const { container } = render(<ResourcesPage />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should render MinimalistHeader', () => {
      render(<ResourcesPage />);
      expect(screen.getByTestId('minimalist-header')).toBeInTheDocument();
    });

    it('should render Footer', () => {
      render(<ResourcesPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('should render hero badge', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Free Club Management Resources')).toBeInTheDocument();
    });

    it('should render main heading', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Everything You Need to Run a Successful Club')).toBeInTheDocument();
    });

    it('should render hero description', () => {
      render(<ResourcesPage />);
      expect(screen.getByText(/Comprehensive guides, proven strategies/i)).toBeInTheDocument();
    });

    it('should render BookOpen icon in badge', () => {
      render(<ResourcesPage />);
      const icons = screen.getAllByTestId('book-open-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have link to featured guide', () => {
      render(<ResourcesPage />);
      const link = screen.getByText('Start with Our Complete Guide').closest('a');
      expect(link).toHaveAttribute('href', '#featured-guide');
    });

    it('should have link back to home', () => {
      render(<ResourcesPage />);
      const link = screen.getByText('Back to GatherGrove').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });

    it('should render stats', () => {
      render(<ResourcesPage />);
      // Honesty rule (J-001): no fabricated "40,000+ Words of Content" claim.
      // "4+ Hours of Expert Reading" is verifiable from the per-guide readTime data.
      expect(screen.getByText('4+ Hours')).toBeInTheDocument();
      expect(screen.getByText('of Expert Reading')).toBeInTheDocument();
      expect(screen.queryByText('40,000+')).not.toBeInTheDocument();
      expect(screen.queryByText('Words of Content')).not.toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Expert Guides')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
      expect(screen.getByText('After Free Trial')).toBeInTheDocument();
    });
  });

  describe('Featured Guide Section', () => {
    it('should render featured guide heading', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Featured Resource')).toBeInTheDocument();
    });

    it('should render featured guide title', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('The Complete Guide to Club Management')).toBeInTheDocument();
    });

    it('should render featured guide description', () => {
      render(<ResourcesPage />);
      expect(screen.getByText(/Our flagship 8,000\+ word comprehensive guide/i)).toBeInTheDocument();
    });

    it('should render featured guide category', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Ultimate Guide')).toBeInTheDocument();
    });

    it('should render featured guide read time', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('30 min read')).toBeInTheDocument();
    });

    it('should render what you will learn section', () => {
      render(<ResourcesPage />);
      expect(screen.getByText(/What you'll learn:/i)).toBeInTheDocument();
      expect(screen.getByText(/Member recruitment and retention strategies/i)).toBeInTheDocument();
      expect(screen.getByText(/Modern dues collection and financial management/i)).toBeInTheDocument();
    });

    it('should have link to complete guide', () => {
      render(<ResourcesPage />);
      const link = screen.getByText('Read the Complete Guide').closest('a');
      expect(link).toHaveAttribute('href', '/resources/complete-guide-club-management');
    });

    it('should render 5 star rating', () => {
      render(<ResourcesPage />);
      const stars = screen.getAllByTestId('star-icon');
      expect(stars.length).toBe(5);
    });

    it('should render guide stats', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('8,000+ words')).toBeInTheDocument();
      expect(screen.getByText('30 minutes')).toBeInTheDocument();
      expect(screen.getByText('8 detailed sections')).toBeInTheDocument();
      expect(screen.getByText('Beginner to Advanced')).toBeInTheDocument();
    });

    it('should not render a fabricated updated date', () => {
      // Honesty rule (J-002): there is no last-updated data source, so any
      // hardcoded "Updated <month year>" is fabricated and must not appear.
      render(<ResourcesPage />);
      expect(screen.queryByText(/Updated January 2026/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Updated .*20\d\d/i)).not.toBeInTheDocument();
    });
  });

  describe('Available Resources Section', () => {
    it('should render available resources heading', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Available Resources')).toBeInTheDocument();
    });

    it('should render member retention guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Member Retention Strategies That Actually Work')).toBeInTheDocument();
    });

    it('should render modern dues collection guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Modern Dues Collection Best Practices')).toBeInTheDocument();
    });

    it('should render event planning guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Event Planning Mastery for Club Administrators')).toBeInTheDocument();
    });

    it('should render digital communication guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Digital Communication Tools for Clubs')).toBeInTheDocument();
    });

    it('should render leadership guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Leadership and Governance Frameworks')).toBeInTheDocument();
    });

    it('should render onboarding guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('New Member Onboarding Best Practices')).toBeInTheDocument();
    });

    it('should render community building guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Community Building Strategies')).toBeInTheDocument();
    });

    it('should render financial management guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Financial Management for Small Clubs')).toBeInTheDocument();
    });

    it('should render crisis management guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Crisis Management and Emergency Planning')).toBeInTheDocument();
    });

    it('should render technology integration guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Technology Integration Best Practices')).toBeInTheDocument();
    });

    it('should render volunteer management guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Volunteer Management and Leadership Development')).toBeInTheDocument();
    });

    it('should render annual planning guide', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Annual Planning and Strategic Goal Setting')).toBeInTheDocument();
    });

    it('should render template library', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Club Management Template Library')).toBeInTheDocument();
    });

    it('should render all 15 resource cards', () => {
      const { container } = render(<ResourcesPage />);
      const resourceCards = container.querySelectorAll('.bg-card.rounded-lg.border');
      expect(resourceCards.length).toBe(15);
    });

    it('should render download button for templates', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Browse Templates')).toBeInTheDocument();
    });

    it('should render read article buttons', () => {
      render(<ResourcesPage />);
      const readButtons = screen.getAllByText('Read Article');
      expect(readButtons.length).toBe(14);
    });
  });

  describe('CTA Section', () => {
    it('should render CTA heading', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument();
    });

    it('should render CTA description', () => {
      render(<ResourcesPage />);
      expect(screen.getByText(/Start with a 30-day free trial on any plan/i)).toBeInTheDocument();
    });

    it('should have a primary CTA link', () => {
      render(<ResourcesPage />);
      const link = screen.getByRole('link', { name: /See How GatherGrove Helps/i });
      expect(link).toHaveAttribute('href', '/features');
    });

    it('should have a secondary CTA link', () => {
      render(<ResourcesPage />);
      const link = screen.getByText('Learn More About GatherGrove').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });

    it('should render value props', () => {
      render(<ResourcesPage />);
      expect(screen.getAllByText(/30-day free trial/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Plans from \$9\/month/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Cancel anytime/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Resource Links', () => {
    it('should have correct href for member retention', () => {
      render(<ResourcesPage />);
      const card = screen.getByText('Member Retention Strategies That Actually Work').closest('.bg-card');
      const link = card?.querySelector('a');
      expect(link).toHaveAttribute('href', '/resources/member-retention-strategies');
    });

    it('should have correct href for dues collection', () => {
      render(<ResourcesPage />);
      const card = screen.getByText('Modern Dues Collection Best Practices').closest('.bg-card');
      const link = card?.querySelector('a');
      expect(link).toHaveAttribute('href', '/resources/modern-dues-collection-best-practices');
    });

    it('should have correct href for event planning', () => {
      render(<ResourcesPage />);
      const card = screen.getByText('Event Planning Mastery for Club Administrators').closest('.bg-card');
      const link = card?.querySelector('a');
      expect(link).toHaveAttribute('href', '/resources/event-planning-mastery');
    });

    it('should have correct href for template library', () => {
      render(<ResourcesPage />);
      const card = screen.getByText('Club Management Template Library').closest('.bg-card');
      const link = card?.querySelector('a');
      expect(link).toHaveAttribute('href', '/resources/template-library');
    });
  });

  describe('Layout and Styling', () => {
    it('should have main element', () => {
      const { container } = render(<ResourcesPage />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have hero with gradient background', () => {
      const { container } = render(<ResourcesPage />);
      const hero = container.querySelector('.bg-gradient-to-br.from-primary\\/5');
      expect(hero).toBeInTheDocument();
    });

    it('should have featured guide section', () => {
      const { container } = render(<ResourcesPage />);
      const featured = container.querySelector('#featured-guide');
      expect(featured).toBeInTheDocument();
    });

    it('should have grid layout for resources', () => {
      const { container } = render(<ResourcesPage />);
      const grid = container.querySelector('.grid.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render Clock icons for read times', () => {
      render(<ResourcesPage />);
      const clocks = screen.getAllByTestId('clock-icon');
      expect(clocks.length).toBeGreaterThan(0);
    });

    it('should render ArrowRight icon in featured guide CTA', () => {
      render(<ResourcesPage />);
      const icons = screen.getAllByTestId('arrow-right-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render ArrowLeft icon in back button', () => {
      render(<ResourcesPage />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('should render Download icon for templates', () => {
      render(<ResourcesPage />);
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('should render FileText icons for articles', () => {
      render(<ResourcesPage />);
      const fileIcons = screen.getAllByTestId('file-text-icon');
      expect(fileIcons.length).toBe(14);
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(ResourcesPage).toBeDefined();
      expect(typeof ResourcesPage).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <ResourcesPage />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<ResourcesPage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<ResourcesPage />);
      const { container: container2 } = render(<ResourcesPage />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<ResourcesPage />);

      expect(screen.getByText('Everything You Need to Run a Successful Club')).toBeInTheDocument();

      rerender(<ResourcesPage />);

      expect(screen.getByText('Everything You Need to Run a Successful Club')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic main element', () => {
      const { container } = render(<ResourcesPage />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have semantic header element', () => {
      const { container } = render(<ResourcesPage />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should have semantic footer element', () => {
      const { container } = render(<ResourcesPage />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      render(<ResourcesPage />);

      const links = screen.getAllByTestId('next-link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should have section with id for anchor link', () => {
      const { container } = render(<ResourcesPage />);
      const section = container.querySelector('section#featured-guide');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate all components correctly', () => {
      render(<ResourcesPage />);

      // Header and Footer
      expect(screen.getByTestId('minimalist-header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // Hero
      expect(screen.getByText('Everything You Need to Run a Successful Club')).toBeInTheDocument();

      // Featured Guide
      expect(screen.getByText('The Complete Guide to Club Management')).toBeInTheDocument();

      // Resources
      expect(screen.getByText('Available Resources')).toBeInTheDocument();

      // CTA
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument();
    });

    it('should have complete user flow', () => {
      render(<ResourcesPage />);

      // User can navigate from hero to featured guide
      expect(screen.getByText('Start with Our Complete Guide')).toBeInTheDocument();

      // User can browse resources
      expect(screen.getByText('Member Retention Strategies That Actually Work')).toBeInTheDocument();

      // User can go back
      const backLinks = screen.getAllByText('Back to GatherGrove');
      expect(backLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Content Structure', () => {
    it('should have at least 4 main sections', () => {
      const { container } = render(<ResourcesPage />);

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(4);
    });

    it('should render sections in order', () => {
      render(<ResourcesPage />);

      expect(screen.getByText('Everything You Need to Run a Successful Club')).toBeInTheDocument();
      expect(screen.getByText('Featured Resource')).toBeInTheDocument();
      expect(screen.getByText('Available Resources')).toBeInTheDocument();
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument();
    });
  });

  describe('Page Purpose', () => {
    it('should be a resources hub', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Free Club Management Resources')).toBeInTheDocument();
    });

    it('should feature comprehensive guides', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('4+ Hours')).toBeInTheDocument();
      expect(screen.getByText('of Expert Reading')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Expert Guides')).toBeInTheDocument();
    });

    it('should offer free content', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
      expect(screen.getByText('After Free Trial')).toBeInTheDocument();
    });

    it('should drive conversion to platform', () => {
      render(<ResourcesPage />);
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See How GatherGrove Helps/i })).toBeInTheDocument();
    });
  });
});
