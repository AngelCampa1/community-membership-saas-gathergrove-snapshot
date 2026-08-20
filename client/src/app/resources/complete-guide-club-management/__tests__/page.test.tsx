import React from 'react';
import { render, screen } from '@testing-library/react';
import CompleteGuideClubManagement from '../page';

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
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-left-icon"><path /></svg>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-right-icon"><path /></svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="clock-icon"><path /></svg>
  ),
  BookOpen: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="book-open-icon"><path /></svg>
  ),
  Download: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="download-icon"><path /></svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="users-icon"><path /></svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="calendar-icon"><path /></svg>
  ),
  CreditCard: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="credit-card-icon"><path /></svg>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="message-square-icon"><path /></svg>
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="lightbulb-icon"><path /></svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="check-circle-icon"><path /></svg>
  ),
}));

jest.mock('@/lib/data/resources', () => ({
  RESOURCES: [],
  getResourceBySlug: (slug: string) => ({
    slug,
    title: `Resource: ${slug}`,
    description: 'Test description',
    category: 'Test',
    dateModified: '2025-12-01',
    readTime: '30 min read',
    datePublished: '2024-01-01',
    keywords: ['test'],
    relatedSlugs: slug === 'complete-guide-club-management'
      ? ['member-retention-strategies', 'event-planning-mastery', 'financial-management-for-small-clubs']
      : [],
  }),
  getAllResourceSlugs: () => [],
  getFeaturedResource: () => null,
}));

jest.mock('@/lib/data/content-links', () => ({
  getRelatedContent: () => [],
  getNextFunnelContent: () => [],
  getFunnelStageForType: () => 'tofu',
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

describe('CompleteGuideClubManagement', () => {
  describe('Navigation', () => {
    it('should render back to resources link', () => {
      render(<CompleteGuideClubManagement />);

      const links = screen.getAllByTestId('next-link');
      const resourcesLink = links.find(link => link.textContent?.includes('Resources'));
      expect(resourcesLink).toBeInTheDocument();
    });

    it('should render read time', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('30 min read')).toBeInTheDocument();
    });

    it('should render word count', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('8,000+ words')).toBeInTheDocument();
    });

    it('should render clock and book icons', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getAllByTestId('clock-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('book-open-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Header', () => {
    it('should render ultimate guide badge', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Ultimate Guide')).toBeInTheDocument();
    });

    it('should render updated date from resource data', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Last updated:.*December 2025/)).toBeInTheDocument();
    });

    it('should render main heading', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/The Complete Guide to Club Management/i)).toBeInTheDocument();
    });

    it('should render comprehensive description', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/comprehensive 8,000\+ word guide/i)).toBeInTheDocument();
    });

    it('should render what you will learn section', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText("What You'll Learn in This Guide")).toBeInTheDocument();
    });

    it('should list key learning topics', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Member management and retention strategies/i)).toBeInTheDocument();
      const duesElements = screen.getAllByText(/Modern dues collection/i);
      expect(duesElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Event planning and community engagement/i)).toBeInTheDocument();
    });
  });

  describe('Table of Contents', () => {
    it('should render table of contents heading', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    });

    it('should render all chapter links', () => {
      render(<CompleteGuideClubManagement />);

      const introElements = screen.getAllByText(/1\. Introduction: The Modern Club Challenge/i);
      expect(introElements.length).toBeGreaterThan(0);
      const memberElements = screen.getAllByText(/2\. Member Management Excellence/i);
      expect(memberElements.length).toBeGreaterThan(0);
      const financialElements = screen.getAllByText(/3\. Financial Management and Dues Collection/i);
      expect(financialElements.length).toBeGreaterThan(0);
    });
  });

  describe('Chapter 1: Introduction', () => {
    it('should render introduction section', () => {
      render(<CompleteGuideClubManagement />);

      const introElements = screen.getAllByText('1. Introduction: The Modern Club Challenge');
      expect(introElements.length).toBeGreaterThan(0);
    });

    it('should render key statistics', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/many clubs report spending 10\+ hours monthly/i)).toBeInTheDocument();
    });

    it('should mention GatherGrove solution', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/How GatherGrove Addresses Modern Club Challenges/i)).toBeInTheDocument();
    });
  });

  describe('Chapter 2: Member Management', () => {
    it('should render member management section', () => {
      render(<CompleteGuideClubManagement />);

      const memberElements = screen.getAllByText('2. Member Management Excellence');
      expect(memberElements.length).toBeGreaterThan(0);
    });

    it('should render member journey stages', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Initial Contact')).toBeInTheDocument();
      expect(screen.getByText('Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
      expect(screen.getByText('Advocacy')).toBeInTheDocument();
    });

    it('should render 30-60-90 day framework', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Days 1-30: Welcome and Integration/i)).toBeInTheDocument();
      expect(screen.getByText(/Days 31-60: Engagement Building/i)).toBeInTheDocument();
      expect(screen.getByText(/Days 61-90: Long-term Connection/i)).toBeInTheDocument();
    });
  });

  describe('Chapter 3: Financial Management', () => {
    it('should render financial management section', () => {
      render(<CompleteGuideClubManagement />);

      const financialElements = screen.getAllByText('3. Financial Management and Dues Collection');
      expect(financialElements.length).toBeGreaterThan(0);
    });

    it('should render pricing models', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Cost-Plus Pricing Model')).toBeInTheDocument();
      expect(screen.getByText('Value-Based Pricing Model')).toBeInTheDocument();
    });

    it('should mention GatherGrove payment solutions', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/GatherGrove's Flexible Payment Solutions/i)).toBeInTheDocument();
    });
  });

  describe('Chapter 4: Communication', () => {
    it('should render communication section', () => {
      render(<CompleteGuideClubManagement />);

      const commElements = screen.getAllByText('4. Communication That Connects');
      expect(commElements.length).toBeGreaterThan(0);
    });

    it('should render communication channels', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Email Communication')).toBeInTheDocument();
      expect(screen.getByText('Push Alerts')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Notifications')).toBeInTheDocument();
      expect(screen.getByText('Group Chat')).toBeInTheDocument();
    });

    it('should mention GatherGrove communication platform', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/GatherGrove's Integrated Communication Platform/i)).toBeInTheDocument();
    });
  });

  describe('Chapter 8: Implementation', () => {
    it('should render implementation section', () => {
      render(<CompleteGuideClubManagement />);

      const implElements = screen.getAllByText('8. Implementation and Next Steps');
      expect(implElements.length).toBeGreaterThan(0);
    });

    it('should render 90-day roadmap', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Days 1-30: Foundation and Planning/i)).toBeInTheDocument();
      expect(screen.getByText(/Days 31-60: Member Transition and Engagement/i)).toBeInTheDocument();
      expect(screen.getByText(/Days 61-90: Optimization and Advanced Features/i)).toBeInTheDocument();
    });

    it('should render success metrics', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Operational Efficiency Metrics')).toBeInTheDocument();
      expect(screen.getByText('Member Experience Metrics')).toBeInTheDocument();
    });

    it('should render call to action', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Ready to Transform Your Club Management/i)).toBeInTheDocument();
    });
  });

  describe('Footer Links', () => {
    it('should render related resources section', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Related Articles')).toBeInTheDocument();
    });

    it('should render related resource links', () => {
      render(<CompleteGuideClubManagement />);

      // Related resources come from mocked getResourceBySlug
      expect(screen.getByText('Resource: member-retention-strategies')).toBeInTheDocument();
      expect(screen.getByText('Resource: event-planning-mastery')).toBeInTheDocument();
      expect(screen.getByText('Resource: financial-management-for-small-clubs')).toBeInTheDocument();
    });

    it('should render funnel CTA section', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/Ready to put these strategies into practice/i)).toBeInTheDocument();
    });

    it('should have CTA buttons', () => {
      render(<CompleteGuideClubManagement />);

      expect(screen.getByText(/See How GatherGrove Helps/i)).toBeInTheDocument();
    });

    it('should have links to register page', () => {
      render(<CompleteGuideClubManagement />);

      const links = screen.getAllByTestId('next-link');
      const registerLinks = links.filter(link => link.getAttribute('href') === '/register');
      expect(registerLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('should have min-h-screen class', () => {
      const { container } = render(<CompleteGuideClubManagement />);

      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have sticky navigation', () => {
      const { container } = render(<CompleteGuideClubManagement />);

      const nav = container.querySelector('.sticky');
      expect(nav).toBeInTheDocument();
    });

    it('should have prose formatting', () => {
      const { container } = render(<CompleteGuideClubManagement />);

      const prose = container.querySelector('.prose');
      expect(prose).toBeInTheDocument();
    });

    it('should have article tag', () => {
      const { container } = render(<CompleteGuideClubManagement />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(CompleteGuideClubManagement).toBeDefined();
      expect(typeof CompleteGuideClubManagement).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <CompleteGuideClubManagement />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<CompleteGuideClubManagement />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<CompleteGuideClubManagement />);
      const { container: container2 } = render(<CompleteGuideClubManagement />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<CompleteGuideClubManagement />);

      expect(screen.getByText('Ultimate Guide')).toBeInTheDocument();

      rerender(<CompleteGuideClubManagement />);

      expect(screen.getByText('Ultimate Guide')).toBeInTheDocument();
    });
  });

  describe('Year Currency', () => {
    it('page title references current year 2026, not stale 2025', () => {
      render(<CompleteGuideClubManagement />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).not.toContain('2025');
      expect(heading.textContent).toContain('2026');
    });
  });
});
