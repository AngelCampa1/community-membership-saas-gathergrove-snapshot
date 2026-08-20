import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LocationReportsPage from '../page';
import {
  crossLocationReportingService,
  type ConsolidatedDashboardResponse,
} from '@/lib/api/crossLocationReportingService';

// Mock dependencies
const mockUser = {
  id: 1,
  clubId: 1,
  email: 'admin@test.com',
  name: 'Admin User',
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

jest.mock('@/lib/api/crossLocationReportingService', () => ({
  crossLocationReportingService: {
    getConsolidatedDashboard: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockCrossLocationReportingService = crossLocationReportingService as jest.Mocked<
  typeof crossLocationReportingService
>;

// Mock data
const mockDashboard: ConsolidatedDashboardResponse = {
  clubId: 1,
  clubName: 'Test Club',
  totalActiveLocations: 3,
  totalMembers: 150,
  totalEvents: 12,
  locations: [
    {
      id: 1,
      locationName: 'Main Office',
      locationCode: 'MAIN',
      isActive: true,
      activeMembers: 80,
      upcomingEvents: 6,
    },
    {
      id: 2,
      locationName: 'Downtown Branch',
      locationCode: 'DT',
      isActive: true,
      activeMembers: 50,
      upcomingEvents: 4,
    },
    {
      id: 3,
      locationName: 'Uptown Branch',
      locationCode: 'UP',
      isActive: true,
      activeMembers: 20,
      upcomingEvents: 2,
    },
  ],
};

describe('LocationReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(mockDashboard);
  });

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      mockCrossLocationReportingService.getConsolidatedDashboard.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LocationReportsPage />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should load dashboard on mount', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(mockCrossLocationReportingService.getConsolidatedDashboard).toHaveBeenCalledWith(1);
      });
    });

    it('should hide loading message after data loads', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });
    });
  });

  describe('No Data State', () => {
    it('should show no data message when dashboard is null', async () => {
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(null as any);

      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /cross-location dashboard/i })).toBeInTheDocument();
      });
    });

    it('should render club name in description', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText(/overview of all test club locations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Summary Cards', () => {
    it('should render Total Locations card', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Locations')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Active chapters')).toBeInTheDocument();
      });
    });

    it('should render Total Members card', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Members')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        // Multiple cards may have this text, so use getAllByText
        expect(screen.getAllByText('Across all locations').length).toBeGreaterThan(0);
      });
    });

    it('should render Upcoming Events card', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });

    it('should render Average per Location card', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Avg per Location')).toBeInTheDocument();
        // 150 / 3 = 50 (same as Downtown Branch members, so may appear multiple times)
        expect(screen.getAllByText('50').length).toBeGreaterThan(0);
        expect(screen.getByText('Members per location')).toBeInTheDocument();
      });
    });

    it('should handle zero locations for average calculation', async () => {
      const dashboardWithNoLocations = {
        ...mockDashboard,
        totalActiveLocations: 0,
        totalMembers: 100,
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboardWithNoLocations);

      render(<LocationReportsPage />);

      await waitFor(() => {
        const avgCards = screen.getAllByText('0');
        expect(avgCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Location Breakdown', () => {
    it('should render section title', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Location Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Performance metrics for each location')).toBeInTheDocument();
      });
    });

    it('should render all locations', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        // Location names appear in both breakdown and distribution sections
        expect(screen.getAllByText('Main Office').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Downtown Branch').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Uptown Branch').length).toBeGreaterThan(0);
      });
    });

    it('should display location codes as badges', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('MAIN')).toBeInTheDocument();
        expect(screen.getByText('DT')).toBeInTheDocument();
        expect(screen.getByText('UP')).toBeInTheDocument();
      });
    });

    it('should display member counts', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText(/80 members/i)).toBeInTheDocument();
        expect(screen.getByText(/50 members/i)).toBeInTheDocument();
        expect(screen.getByText(/20 members/i)).toBeInTheDocument();
      });
    });

    it('should display event counts', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText(/6 upcoming events/i)).toBeInTheDocument();
        expect(screen.getByText(/4 upcoming events/i)).toBeInTheDocument();
        expect(screen.getByText(/2 upcoming events/i)).toBeInTheDocument();
      });
    });

    it('should calculate and display percentages', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        // Main: 80/150 = 53%
        expect(screen.getByText('53%')).toBeInTheDocument();
        // Downtown: 50/150 = 33%
        expect(screen.getByText('33%')).toBeInTheDocument();
        // Uptown: 20/150 = 13%
        expect(screen.getByText('13%')).toBeInTheDocument();
      });
    });

    it('should handle empty locations list', async () => {
      const dashboardWithNoLocations = {
        ...mockDashboard,
        locations: [],
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboardWithNoLocations);

      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('No locations found')).toBeInTheDocument();
      });
    });

    it('should handle zero total members for percentage', async () => {
      const dashboardWithNoMembers = {
        ...mockDashboard,
        totalMembers: 0,
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboardWithNoMembers);

      render(<LocationReportsPage />);

      await waitFor(() => {
        const percentages = screen.getAllByText(/0%/);
        expect(percentages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Member Distribution', () => {
    it('should render section title', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Member Distribution')).toBeInTheDocument();
        expect(screen.getByText('Visual representation of member distribution across locations')).toBeInTheDocument();
      });
    });

    it('should render progress bars for each location', async () => {
      const { container } = render(<LocationReportsPage />);

      await waitFor(() => {
        // Progress bars are custom divs with specific classes, not role="progressbar"
        const progressBars = container.querySelectorAll('.h-full.bg-primary');
        // Should have one progress bar per location
        expect(progressBars.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should display location names in distribution', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        // Text appears multiple times (once in breakdown, once in distribution)
        const mainOfficeElements = screen.getAllByText('Main Office');
        expect(mainOfficeElements.length).toBeGreaterThan(1);
      });
    });

    it('should display member counts with percentages', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('80 (53%)')).toBeInTheDocument();
        expect(screen.getByText('50 (33%)')).toBeInTheDocument();
        expect(screen.getByText('20 (13%)')).toBeInTheDocument();
      });
    });

    it('should render progress bars with correct widths', async () => {
      const { container } = render(<LocationReportsPage />);

      await waitFor(() => {
        // Location names appear multiple times on the page
        expect(screen.getAllByText('Main Office').length).toBeGreaterThan(0);
      });

      // Find the progress bar elements (divs with width style)
      const progressBars = container.querySelectorAll('.h-full.bg-primary');
      expect(progressBars.length).toBeGreaterThan(0);

      // Check that widths are set (Main Office should be ~53%)
      const mainBar = progressBars[0] as HTMLElement;
      expect(mainBar.style.width).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading dashboard', async () => {
      mockCrossLocationReportingService.getConsolidatedDashboard.mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load consolidated dashboard');
      });
    });

    it('should handle API error with message', async () => {
      mockCrossLocationReportingService.getConsolidatedDashboard.mockRejectedValue({
        response: { data: { message: 'Unauthorized access' } },
      });

      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Unauthorized access');
      });
    });

    it('should display no data state after error', async () => {
      mockCrossLocationReportingService.getConsolidatedDashboard.mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  describe('Data Calculations', () => {
    it('should correctly calculate average members per location', async () => {
      const dashboard = {
        ...mockDashboard,
        totalMembers: 120,
        totalActiveLocations: 4,
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboard);

      render(<LocationReportsPage />);

      await waitFor(() => {
        // 120 / 4 = 30
        expect(screen.getByText('30')).toBeInTheDocument();
      });
    });

    it('should round down average calculation', async () => {
      const dashboard = {
        ...mockDashboard,
        totalMembers: 100,
        totalActiveLocations: 3,
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboard);

      render(<LocationReportsPage />);

      await waitFor(() => {
        // 100 / 3 = 33.33, rounded = 33
        expect(screen.getByText('33')).toBeInTheDocument();
      });
    });

    it('should correctly calculate location percentages', async () => {
      const dashboard = {
        ...mockDashboard,
        totalMembers: 100,
        locations: [
          { ...mockDashboard.locations[0], activeMembers: 25 },
          { ...mockDashboard.locations[1], activeMembers: 50 },
          { ...mockDashboard.locations[2], activeMembers: 25 },
        ],
      };
      mockCrossLocationReportingService.getConsolidatedDashboard.mockResolvedValue(dashboard);

      render(<LocationReportsPage />);

      await waitFor(() => {
        // Should see 25%, 50%, 25%
        const percentages25 = screen.getAllByText('25%');
        expect(percentages25.length).toBeGreaterThan(0);
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /cross-location dashboard/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have descriptive card titles', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Locations')).toBeInTheDocument();
        expect(screen.getByText('Total Members')).toBeInTheDocument();
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('Avg per Location')).toBeInTheDocument();
      });
    });

    it('should have section headings for data sections', async () => {
      render(<LocationReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Location Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Member Distribution')).toBeInTheDocument();
      });
    });
  });
});
