import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberDashboard from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('sonner');

const mockPush = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="loader-icon"><path /></svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="user-icon"><path /></svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="calendar-icon"><path /></svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="users-icon"><path /></svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="settings-icon"><path /></svg>
  ),
  Bell: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="bell-icon"><path /></svg>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MemberDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockAuth.mockReturnValue({
        user: null,
        loading: true,
      } as any);

      render(<MemberDashboard />);

      expect(screen.getByText('Loading your member dashboard...')).toBeInTheDocument();
    });

    it('should render loading spinner', () => {
      mockAuth.mockReturnValue({
        user: null,
        loading: true,
      } as any);

      render(<MemberDashboard />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('should redirect to login if no user', async () => {
      mockAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any);

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect admin to admin dashboard', async () => {
      mockAuth.mockReturnValue({
        user: { role: 'Admin', fullName: 'Admin User', clubName: 'Test Club', clubTier: 'Premium' },
        loading: false,
      } as any);

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should allow member access', async () => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);

      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Header', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'John Doe',
          clubName: 'Adventure Club',
          clubTier: 'Gold'
        },
        loading: false,
      } as any);
    });

    it('should render welcome message with user name', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, John Doe/i)).toBeInTheDocument();
      });
    });

    it('should render club name', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Member of Adventure Club/i)).toBeInTheDocument();
      });
    });

    it('should render club tier', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const tierElements = screen.getAllByText(/Gold Tier/i);
        expect(tierElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Quick Actions Cards', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should render My Profile card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText('View and update your profile information')).toBeInTheDocument();
      });
    });

    it('should render Upcoming Events card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('View events and manage your RSVPs')).toBeInTheDocument();
      });
    });

    it('should render Member Directory card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Member Directory')).toBeInTheDocument();
        expect(screen.getByText('Connect with other club members')).toBeInTheDocument();
      });
    });

    it('should render Settings card', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const settingsElements = screen.getAllByText('Settings');
        expect(settingsElements.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to profile on My Profile card click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const profileCard = screen.getByText('My Profile').closest('.glass');
      if (profileCard) {
        await user.click(profileCard);
        expect(mockPush).toHaveBeenCalledWith('/app/profile');
      }
    });

    it('should navigate to events on Upcoming Events card click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      });

      const eventsCard = screen.getByText('Upcoming Events').closest('.glass');
      if (eventsCard) {
        await user.click(eventsCard);
        expect(mockPush).toHaveBeenCalledWith('/app/events');
      }
    });

    it('should navigate to directory on Member Directory card click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Member Directory')).toBeInTheDocument();
      });

      const directoryCard = screen.getByText('Member Directory').closest('.glass');
      if (directoryCard) {
        await user.click(directoryCard);
        expect(mockPush).toHaveBeenCalledWith('/app/directory');
      }
    });
  });

  describe('Club Information Card', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should render Club Information heading', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Club Information')).toBeInTheDocument();
      });
    });

    it('should render club name', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        const clubNameElements = screen.getAllByText('Test Club');
        expect(clubNameElements.length).toBeGreaterThan(0);
      });
    });

    it('should render membership status', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Membership Status')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should render member since placeholder', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Member Since')).toBeInTheDocument();
        expect(screen.getByText('Available after profile completion')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity Card', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should render Recent Activity heading', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });

    it('should render welcome message', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Test Club/i)).toBeInTheDocument();
      });
    });

    it('should render profile completion prompt', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Complete your profile to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Links Card', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should render Quick Links heading', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Links')).toBeInTheDocument();
      });
    });

    it('should render Complete Profile button', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Complete Profile')).toBeInTheDocument();
      });
    });

    it('should render View Events button', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('View Events')).toBeInTheDocument();
      });
    });

    it('should render Browse Directory button', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Browse Directory')).toBeInTheDocument();
      });
    });

    it('should navigate to profile on Complete Profile click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Complete Profile')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Profile'));
      expect(mockPush).toHaveBeenCalledWith('/app/profile');
    });

    it('should navigate to events on View Events click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('View Events')).toBeInTheDocument();
      });

      await user.click(screen.getByText('View Events'));
      expect(mockPush).toHaveBeenCalledWith('/app/events');
    });

    it('should navigate to directory on Browse Directory click', async () => {
      const user = userEvent.setup();
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Browse Directory')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Browse Directory'));
      expect(mockPush).toHaveBeenCalledWith('/app/directory');
    });
  });

  describe('Icons', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should render User icons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getAllByTestId('user-icon').length).toBeGreaterThan(0);
      });
    });

    it('should render Calendar icons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });

    it('should render Users icons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
      });
    });

    it('should render Settings icons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      });
    });

    it('should render Bell icons', async () => {
      render(<MemberDashboard />);

      await waitFor(() => {
        expect(screen.getAllByTestId('bell-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);
    });

    it('should have min-h-screen class', async () => {
      const { container } = render(<MemberDashboard />);

      await waitFor(() => {
        const mainDiv = container.querySelector('.min-h-screen');
        expect(mainDiv).toBeInTheDocument();
      });
    });

    it('should have gradient background', async () => {
      const { container } = render(<MemberDashboard />);

      await waitFor(() => {
        const gradient = container.querySelector('.bg-gradient-to-br');
        expect(gradient).toBeInTheDocument();
      });
    });

    it('should have glass effect cards', async () => {
      const { container } = render(<MemberDashboard />);

      await waitFor(() => {
        const glassCards = container.querySelectorAll('.glass');
        expect(glassCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(MemberDashboard).toBeDefined();
      expect(typeof MemberDashboard).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <MemberDashboard />;
      expect(typeof component.type).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should integrate with useAuth', async () => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);

      render(<MemberDashboard />);

      expect(mockAuth).toHaveBeenCalled();
    });

    it('should integrate with router', async () => {
      mockAuth.mockReturnValue({
        user: {
          role: 'Member',
          fullName: 'Test User',
          clubName: 'Test Club',
          clubTier: 'Premium'
        },
        loading: false,
      } as any);

      render(<MemberDashboard />);

      expect(mockUseRouter).toHaveBeenCalled();
    });
  });
});
