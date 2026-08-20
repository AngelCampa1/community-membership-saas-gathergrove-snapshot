/**
 * Tests for LoginActivityDashboard.tsx - Login activity analytics dashboard
 *
 * Boundary mocking: the real useLoginActivity hook runs; only the
 * LoginActivityService HTTP boundary and the external Recharts library are
 * mocked. Charts are stubbed because Recharts does not render in jsdom.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LoginActivityDashboard from '../LoginActivityDashboard';
import { LoginActivityService } from '@/services/loginActivityService';
import { LoginActivityStats } from '@/types/loginActivity';

jest.mock('@/services/loginActivityService', () => ({
  LoginActivityService: {
    getLoginStats: jest.fn(),
    calculateEngagementScores: jest.fn(() => Promise.resolve()),
  },
}));

// Recharts is an external rendering library that does not work in jsdom.
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

const mockService = LoginActivityService as jest.Mocked<typeof LoginActivityService>;

const mockStats: LoginActivityStats = {
  clubId: 1,
  periodDays: 30,
  totalMembers: 100,
  membersWithLogins: 75,
  totalLogins: 500,
  averageLoginsPerMember: 5,
  dailyActiveUsers: 20,
  weeklyActiveUsers: 55,
  monthlyActiveUsers: 70,
  inactiveMembers: 25,
  loginTrends: [
    { date: '2025-01-01', totalLogins: 50, uniqueUsers: 30, webLogins: 35, mobileLogins: 15 },
  ],
};

describe('LoginActivityDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getLoginStats.mockResolvedValue(mockStats);
  });

  describe('Tier gating', () => {
    it('shows upgrade gate for non-Unlimited tiers and does not fetch data', () => {
      render(<LoginActivityDashboard clubId={1} clubTier="Basic" />);

      expect(screen.getByText('Expand Tier Required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade to Expand/i })).toBeInTheDocument();
    });
  });

  describe('Unlimited tier rendering', () => {
    it('renders real login stats once data loads', async () => {
      render(<LoginActivityDashboard clubId={1} clubTier="Unlimited" data-testid="dashboard" />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Real values sourced from LoginActivityStats
      expect(screen.getByText('500')).toBeInTheDocument(); // total logins
      expect(screen.getByText('75')).toBeInTheDocument(); // active members
      expect(screen.getByText('70')).toBeInTheDocument(); // monthly active
      expect(screen.getByText('25')).toBeInTheDocument(); // inactive members
      expect(screen.getByText(/Avg: 5.0 per member/)).toBeInTheDocument();
      expect(screen.getByText(/75.0% of 100 members/)).toBeInTheDocument();
    });

    it('renders both real-data charts', async () => {
      render(<LoginActivityDashboard clubId={1} clubTier="Unlimited" />);

      await waitFor(() => {
        expect(screen.getByText('Daily Login Activity')).toBeInTheDocument();
      });

      expect(screen.getByText('Web vs Mobile Logins')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('does not render fabricated metrics (avg session, peak hour, geographic)', async () => {
      render(<LoginActivityDashboard clubId={1} clubTier="Unlimited" />);

      await waitFor(() => {
        expect(screen.getByText('Daily Login Activity')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Avg Session/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Peak Hour/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Geographic Distribution/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Hourly Login Distribution/)).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders an error message and retry button when the fetch fails', async () => {
      mockService.getLoginStats.mockRejectedValue(new Error('boom'));

      render(<LoginActivityDashboard clubId={1} clubTier="Unlimited" />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});
