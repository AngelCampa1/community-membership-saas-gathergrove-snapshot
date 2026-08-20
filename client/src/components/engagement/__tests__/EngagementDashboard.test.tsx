import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EngagementDashboard from '../EngagementDashboard';
import apiClient from '@/services/apiClient';
import type { EngagementOverviewResponse } from '@/services/memberEngagementService';

// Boundary mocks only:
//  - apiClient: the HTTP boundary. The real memberEngagementService runs so its
//    403 tier-gate handling is exercised, and the real UI primitives render.
//  - react-chartjs-2: an external rendering library backed by <canvas>, which
//    jsdom does not implement. Rendered as lightweight stand-ins.
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="pie-chart">Pie</div>,
  Bar: () => <div data-testid="bar-chart">Bar</div>,
  Line: () => <div data-testid="line-chart">Line</div>,
}));

const mockGet = apiClient.get as jest.Mock;

const buildOverview = (
  overrides: Partial<EngagementOverviewResponse> = {}
): EngagementOverviewResponse => ({
  totalMembers: 120,
  averageScore: 64.5,
  highlyEngaged: 40,
  moderatelyEngaged: 55,
  atRisk: 25,
  activeAlerts: 6,
  criticalAlerts: 2,
  scoreTrend: 3.4,
  lastCalculated: '2026-05-01T12:00:00Z',
  componentBreakdown: {
    communication: 70,
    eventParticipation: 58,
    featureUsage: 45,
  },
  ...overrides,
});

describe('EngagementDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful load', () => {
    it('fetches the real overview and renders the key stats', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/club/123/overview');
      expect(screen.getByText('Member Engagement Dashboard')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument(); // total members
      expect(screen.getByText('Total Members')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Members')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      // averageScore 64.5 is in the 40-69 band → "Good".
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('3.4%')).toBeInTheDocument();
    });

    it('renders the real engagement distribution on the distribution tab', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('tab', { name: /distribution/i }));

      await waitFor(() => {
        expect(screen.getByText('Engagement Level Distribution')).toBeInTheDocument();
      });
      expect(screen.getByText('Highly Engaged')).toBeInTheDocument();
      expect(screen.getByText('Moderately Engaged')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('renders the real component breakdown on the components tab', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('tab', { name: /components/i }));

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });
      expect(screen.getByText('Event Participation')).toBeInTheDocument();
      expect(screen.getByText('Feature Usage')).toBeInTheDocument();
      expect(screen.getByText('70.0%')).toBeInTheDocument();
    });

    it('does not render fabricated sections', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      // None of the old invented shapes should appear.
      expect(screen.queryByText('Monthly Engagement Trends')).not.toBeInTheDocument();
      expect(screen.queryByText('Member Segmentation')).not.toBeInTheDocument();
      expect(screen.queryByText('Veteran')).not.toBeInTheDocument();
      expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('New Members')).not.toBeInTheDocument();
      expect(screen.queryByText(/Active Members/)).not.toBeInTheDocument();
    });
  });

  describe('Tier-gated (403) state', () => {
    it('shows an honest upgrade prompt instead of fabricated metrics', async () => {
      mockGet.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Member engagement analytics requires Expand tier subscription' },
        },
      });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('engagement-upgrade-required')).toBeInTheDocument();
      });

      expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
      expect(screen.getByText(/requires Expand tier subscription/i)).toBeInTheDocument();
      expect(screen.queryByText('64.5%')).not.toBeInTheDocument();
    });
  });

  describe('Error / empty states', () => {
    it('renders an honest unavailable message on a server error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce({ response: { status: 500 } });

      render(<EngagementDashboard clubId="123" />);

      await waitFor(() => {
        expect(
          screen.getByText('Engagement metrics are currently unavailable.')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('does not fetch when clubId is empty', async () => {
      render(<EngagementDashboard clubId="" />);

      await waitFor(() => {
        expect(screen.getByText('Club ID is required')).toBeInTheDocument();
      });

      expect(mockGet).not.toHaveBeenCalled();
    });
  });
});
