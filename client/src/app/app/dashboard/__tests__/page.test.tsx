// Universal RadixUI mocks loaded via setupTests.ts for systematic test scaling across 81+ files

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MemberDashboard from '../page';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// CRITICAL: Apply EXACT proven RadixUI React.forwardRef pattern for 100% success
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return React.createElement('div', props, children);
  },
  Slottable: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/ui/card', () => ({
  Card: React.forwardRef<HTMLDivElement, any>(function Card({ children, className, onClick, ...props }, ref) {
    return React.createElement('div', { ref, className: `card ${className || ''}`, onClick, 'data-testid': 'card', ...props }, children);
  }),
  CardHeader: React.forwardRef<HTMLDivElement, any>(function CardHeader({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-header ${className || ''}`, 'data-testid': 'card-header', ...props }, children);
  }),
  CardTitle: React.forwardRef<HTMLHeadingElement, any>(function CardTitle({ children, className, ...props }, ref) {
    return React.createElement('h3', { ref, className: `card-title ${className || ''}`, 'data-testid': 'card-title', ...props }, children);
  }),
  CardDescription: React.forwardRef<HTMLParagraphElement, any>(function CardDescription({ children, className, ...props }, ref) {
    return React.createElement('p', { ref, className: `card-description ${className || ''}`, 'data-testid': 'card-description', ...props }, children);
  }),
  CardContent: React.forwardRef<HTMLDivElement, any>(function CardContent({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-content ${className || ''}`, 'data-testid': 'card-content', ...props }, children);
  }),
  CardFooter: React.forwardRef<HTMLDivElement, any>(function CardFooter({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-footer ${className || ''}`, 'data-testid': 'card-footer', ...props }, children);
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, asChild, ...props }, ref) {
    if (asChild && children) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement('button', { 
      ref, 
      className: `button ${variant || ''} ${size || ''} ${className || ''}`, 
      'data-testid': 'button', 
      ...props 
    }, children);
  })
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: React.forwardRef<HTMLSpanElement, any>(function Badge({ children, variant, className, ...props }, ref) {
    return React.createElement('span', { 
      ref, 
      className: `badge ${variant || ''} ${className || ''}`, 
      'data-testid': 'badge', 
      ...props 
    }, children);
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: React.forwardRef<SVGSVGElement, any>(function Loader2({ className, ...props }, ref) {
    return React.createElement('div', { ref, 'data-testid': 'loader2-icon', className: `lucide-loader2 ${className || ''}`, ...props });
  }),
  User: (props: any) => React.createElement('div', { 'data-testid': 'user-icon', ...props }),
  Calendar: (props: any) => React.createElement('div', { 'data-testid': 'calendar-icon', ...props }),
  Users: (props: any) => React.createElement('div', { 'data-testid': 'users-icon', ...props }),
  Settings: (props: any) => React.createElement('div', { 'data-testid': 'settings-icon', ...props }),
  Bell: (props: any) => React.createElement('div', { 'data-testid': 'bell-icon', ...props }),
  Zap: (props: any) => React.createElement('div', { 'data-testid': 'zap-icon', ...props }),
  Activity: (props: any) => React.createElement('div', { 'data-testid': 'activity-icon', ...props }),
  Clock: (props: any) => React.createElement('div', { 'data-testid': 'clock-icon', ...props }),
  ArrowRight: (props: any) => React.createElement('div', { 'data-testid': 'arrow-right-icon', ...props }),
  Check: (props: any) => React.createElement('div', { 'data-testid': 'check-icon', ...props }),
  // Icons needed by PaidEventsSection
  MapPin: (props: any) => React.createElement('div', { 'data-testid': 'map-pin-icon', ...props }),
  CreditCard: (props: any) => React.createElement('div', { 'data-testid': 'credit-card-icon', ...props }),
  ExternalLink: (props: any) => React.createElement('div', { 'data-testid': 'external-link-icon', ...props }),
}));

// Mock services used by PaidEventsSection
jest.mock('@/services/eventService', () => ({
  eventService: {
    getEvents: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handle: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('MemberDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      });

      render(<MemberDashboard />);

      expect(screen.getByText('Loading your member dashboard...')).toBeInTheDocument();
    });


  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects admin users to admin dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        },
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Access denied. This page is for members only.');
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('renders dashboard when member user is authenticated', async () => {
      const mockUser = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        tier: 'Grow',
        role: 'Member',
        isOnboardingCompleted: true,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Member of Test Club • Grow Tier/)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Content', () => {
    const mockUser = {
      userId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      tier: 'Grow',
      role: 'Member',
      isOnboardingCompleted: true,
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });
    });

    it('displays welcome message with user name and club name', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Member of Test Club • Grow Tier/)).toBeInTheDocument();
      });
    });

    it('displays quick action cards', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('Member Directory')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('displays club information card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Club Information')).toBeInTheDocument();
        expect(screen.getByText('Your membership details')).toBeInTheDocument();
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Grow Tier')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('displays recent activity card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('Your latest interactions')).toBeInTheDocument();
        expect(screen.getByText(/Welcome to Test Club!/)).toBeInTheDocument();
      });
    });

    it('displays quick links card with buttons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Links')).toBeInTheDocument();
        expect(screen.getByText('Frequently used features')).toBeInTheDocument();
        expect(screen.getByText('Complete Profile')).toBeInTheDocument();
        expect(screen.getByText('View Events')).toBeInTheDocument();
        expect(screen.getByText('Browse Directory')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    const mockUser = {
      userId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      tier: 'Grow',
      role: 'Member',
      isOnboardingCompleted: true,
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });
    });

    it('navigates to profile when My Profile card is clicked', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const profileCard = screen.getByText('My Profile').closest('.cursor-pointer');
        expect(profileCard).toBeInTheDocument();
      });
    });

    it('navigates to events when Events card is clicked', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const eventsCard = screen.getByText('Upcoming Events').closest('.cursor-pointer');
        expect(eventsCard).toBeInTheDocument();
      });
    });

    it('navigates to directory when Directory card is clicked', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const directoryCard = screen.getByText('Member Directory').closest('.cursor-pointer');
        expect(directoryCard).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      render(<MemberDashboard />);

      // Component should not crash and should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('handles invalid user role gracefully', async () => {
      // Create a user with invalid role for testing error handling
      const userWithInvalidRole = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        tier: 'Grow',
        role: 'InvalidRole' as string,
        isOnboardingCompleted: true,
      };

      mockUseAuth.mockReturnValue({
        user: userWithInvalidRole,
        loading: false,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Access denied. This page is for members only.');
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });
}); 