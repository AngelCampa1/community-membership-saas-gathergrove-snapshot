import React from 'react';
import { render, screen } from '@testing-library/react';
import EventPlanningMastery from '../page';

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
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="calendar-icon"><path /></svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="check-circle-icon"><path /></svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="users-icon"><path /></svg>
  ),
  Target: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="target-icon"><path /></svg>
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="lightbulb-icon"><path /></svg>
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
    readTime: '12 min read',
    datePublished: '2024-01-01',
    keywords: ['test'],
    relatedSlugs: ['volunteer-management-and-leadership-development', 'community-building-strategies', 'digital-communication-tools'],
  }),
  getAllResourceSlugs: () => [],
  getFeaturedResource: () => null,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

describe('EventPlanningMastery', () => {
  describe('Navigation', () => {
    it('should render back to resources link', () => {
      render(<EventPlanningMastery />);

      const links = screen.getAllByTestId('next-link');
      const resourcesLink = links.find(link => link.textContent?.includes('Resources'));
      expect(resourcesLink).toBeInTheDocument();
    });

    it('should render Home breadcrumb link', () => {
      render(<EventPlanningMastery />);

      const homeLinks = screen.getAllByRole('link', { name: /^home$/i });
      expect(homeLinks.length).toBeGreaterThan(0);
    });

    it('should render read time', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('15 min read')).toBeInTheDocument();
    });

    it('should render event planning topic', () => {
      render(<EventPlanningMastery />);

      const eventPlanningElements = screen.getAllByText('Event Planning');
      expect(eventPlanningElements.length).toBeGreaterThan(0);
    });

    it('should render ArrowRight icon in CTA', () => {
      render(<EventPlanningMastery />);

      expect(screen.getAllByTestId('arrow-right-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Header', () => {
    it('should render event planning badge', () => {
      render(<EventPlanningMastery />);

      const badges = screen.getAllByText('Event Planning');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render updated date from resource data', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Last updated:.*December 2025/)).toBeInTheDocument();
    });

    it('should render main heading', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Event Planning Mastery for Club Administrators')).toBeInTheDocument();
    });

    it('should render comprehensive description', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Complete guide to planning, promoting, and executing/i)).toBeInTheDocument();
    });

    it('should render what you will master section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText("What You'll Master")).toBeInTheDocument();
    });

    it('should list mastery topics with checkmarks', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Strategic event planning and goal setting/i)).toBeInTheDocument();
      expect(screen.getByText(/Audience engagement and attendance optimization/i)).toBeInTheDocument();
      const budgetElements = screen.getAllByText(/Budget management and resource allocation/i);
      expect(budgetElements.length).toBeGreaterThan(0);
    });

    it('should render CheckCircle icons', () => {
      render(<EventPlanningMastery />);

      const checkIcons = screen.getAllByTestId('check-circle-icon');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Section 1: Strategic Planning Foundation', () => {
    it('should render strategic planning section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Strategic Event Planning Foundation')).toBeInTheDocument();
    });

    it('should render success statistics', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/2024 Event Planning Success Statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/Audience engagement is one of the biggest factors/i)).toBeInTheDocument();
    });

    it('should render event purpose framework', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('The Event Purpose Framework')).toBeInTheDocument();
    });

    it('should render event categories', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Primary Event Categories')).toBeInTheDocument();
      expect(screen.getByText(/Educational Events:/i)).toBeInTheDocument();
      expect(screen.getByText(/Community Building:/i)).toBeInTheDocument();
      expect(screen.getByText(/Showcase Events:/i)).toBeInTheDocument();
    });

    it('should render strategic objectives', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Strategic Objectives')).toBeInTheDocument();
      expect(screen.getByText(/Member Retention:/i)).toBeInTheDocument();
      expect(screen.getByText(/Skill Development:/i)).toBeInTheDocument();
    });
  });

  describe('Section 2: Attendance Optimization', () => {
    it('should render attendance section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Attendance Optimization and Engagement Strategies')).toBeInTheDocument();
    });

    it('should render psychology of attendance', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('The Psychology of Event Attendance')).toBeInTheDocument();
    });

    it('should render attendance motivators', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Primary Attendance Motivators')).toBeInTheDocument();
      const learningElements = screen.getAllByText(/Learning Opportunity/i);
      expect(learningElements.length).toBeGreaterThan(0);
      const socialElements = screen.getAllByText(/Social Connection/i);
      expect(socialElements.length).toBeGreaterThan(0);
    });

    it('should render attendance barriers', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Common Attendance Barriers')).toBeInTheDocument();
      expect(screen.getByText(/Scheduling Conflicts/i)).toBeInTheDocument();
    });

    it('should render promotion timeline', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Promotion Timeline')).toBeInTheDocument();
      expect(screen.getByText(/8 weeks before:/i)).toBeInTheDocument();
      expect(screen.getByText(/Day of:/i)).toBeInTheDocument();
    });

    it('should render RSVP management best practices', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/RSVP Best Practices for Higher Attendance/i)).toBeInTheDocument();
    });

    it('should mention GatherGrove event management', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/How GatherGrove Streamlines Event Management/i)).toBeInTheDocument();
    });
  });

  describe('Section 3: Budget Management', () => {
    it('should render budget management section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Budget Management and Resource Allocation')).toBeInTheDocument();
    });

    it('should render budget categories', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Budget Categories')).toBeInTheDocument();
      const venueElements = screen.getAllByText(/Venue Costs/i);
      expect(venueElements.length).toBeGreaterThan(0);
      const speakerElements = screen.getAllByText(/Speaker\/Content/i);
      expect(speakerElements.length).toBeGreaterThan(0);
    });

    it('should render cost optimization strategies', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Cost Optimization Strategies')).toBeInTheDocument();
      expect(screen.getByText(/Member Expertise:/i)).toBeInTheDocument();
    });

    it('should render tiered pricing strategies', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Tiered Pricing Strategies')).toBeInTheDocument();
      const membersElements = screen.getAllByText(/Members:/i);
      expect(membersElements.length).toBeGreaterThan(0);
      const nonMembersElements = screen.getAllByText(/Non-Members:/i);
      expect(nonMembersElements.length).toBeGreaterThan(0);
    });

    it('should render financial metrics to track', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Key Financial Metrics to Track')).toBeInTheDocument();
      expect(screen.getByText(/Cost Per Attendee:/i)).toBeInTheDocument();
    });
  });

  describe('Section 4: Logistics and Risk Management', () => {
    it('should render logistics section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Logistics Coordination and Risk Management')).toBeInTheDocument();
    });

    it('should render pre-event logistics', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Pre-Event Logistics/i)).toBeInTheDocument();
    });

    it('should render day-of-event execution', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Day-of-Event Execution')).toBeInTheDocument();
    });

    it('should render post-event wrap-up', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Post-Event Wrap-up')).toBeInTheDocument();
    });

    it('should render common event risks', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Common Event Risks')).toBeInTheDocument();
      expect(screen.getByText(/Weather:/i)).toBeInTheDocument();
      expect(screen.getByText(/Technology:/i)).toBeInTheDocument();
    });

    it('should render emergency response protocol', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Emergency Response Protocol')).toBeInTheDocument();
    });
  });

  describe('Section 5: Post-Event Evaluation', () => {
    it('should render evaluation section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Post-Event Evaluation and Continuous Improvement')).toBeInTheDocument();
    });

    it('should render feedback collection methods', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Attendee Feedback Methods')).toBeInTheDocument();
      expect(screen.getByText('Key Evaluation Metrics')).toBeInTheDocument();
    });

    it('should render performance trend analysis', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Performance Trend Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Attendance Patterns:/i)).toBeInTheDocument();
    });

    it('should render improvement implementation framework', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Improvement Implementation Framework')).toBeInTheDocument();
    });

    it('should mention GatherGrove analytics', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/GatherGrove's Event Analytics and Feedback Systems/i)).toBeInTheDocument();
    });
  });

  describe('Summary Section', () => {
    it('should render roadmap section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Your Event Planning Excellence Roadmap')).toBeInTheDocument();
    });

    it('should render 90-day implementation plan', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('90-Day Implementation Plan')).toBeInTheDocument();
      expect(screen.getByText('Month 1: Foundation')).toBeInTheDocument();
      expect(screen.getByText('Month 2: Systems')).toBeInTheDocument();
      expect(screen.getByText('Month 3: Optimization')).toBeInTheDocument();
    });

    it('should render success principle', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Success Principle: Member-Centric Excellence/i)).toBeInTheDocument();
    });
  });

  describe('Footer Links', () => {
    it('should render related resources section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText('Related Articles')).toBeInTheDocument();
    });

    it('should render related resource links', () => {
      render(<EventPlanningMastery />);

      // Related resources come from mocked getResourceBySlug
      expect(screen.getByText('Resource: volunteer-management-and-leadership-development')).toBeInTheDocument();
      expect(screen.getByText('Resource: community-building-strategies')).toBeInTheDocument();
      expect(screen.getByText('Resource: digital-communication-tools')).toBeInTheDocument();
    });

    it('should render funnel CTA section', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/Ready to put these strategies into practice/i)).toBeInTheDocument();
    });

    it('should have CTA buttons', () => {
      render(<EventPlanningMastery />);

      expect(screen.getByText(/See How GatherGrove Helps/i)).toBeInTheDocument();
    });

    it('should have links to features page from CTA', () => {
      render(<EventPlanningMastery />);

      const links = screen.getAllByTestId('next-link');
      const featuresLinks = links.filter(link => link.getAttribute('href') === '/features');
      expect(featuresLinks.length).toBeGreaterThan(0);
    });

    it('should render last updated date', () => {
      render(<EventPlanningMastery />);

      const updateElements = screen.getAllByText(/Last updated:.*December 2025/);
      expect(updateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('should have min-h-screen class', () => {
      const { container } = render(<EventPlanningMastery />);

      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have sticky navigation', () => {
      const { container } = render(<EventPlanningMastery />);

      const nav = container.querySelector('.sticky');
      expect(nav).toBeInTheDocument();
    });

    it('should have prose formatting', () => {
      const { container } = render(<EventPlanningMastery />);

      const prose = container.querySelector('.prose');
      expect(prose).toBeInTheDocument();
    });

    it('should have article tag', () => {
      const { container } = render(<EventPlanningMastery />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });

    it('should have max-width container', () => {
      const { container } = render(<EventPlanningMastery />);

      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(EventPlanningMastery).toBeDefined();
      expect(typeof EventPlanningMastery).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <EventPlanningMastery />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<EventPlanningMastery />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<EventPlanningMastery />);
      const { container: container2 } = render(<EventPlanningMastery />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<EventPlanningMastery />);

      expect(screen.getByText('Event Planning Mastery for Club Administrators')).toBeInTheDocument();

      rerender(<EventPlanningMastery />);

      expect(screen.getByText('Event Planning Mastery for Club Administrators')).toBeInTheDocument();
    });
  });
});
