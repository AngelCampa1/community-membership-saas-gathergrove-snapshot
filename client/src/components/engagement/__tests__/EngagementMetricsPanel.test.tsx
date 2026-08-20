import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EngagementMetricsPanel from '../EngagementMetricsPanel';
import apiClient from '@/services/apiClient';
import type { EngagementOverviewResponse } from '@/services/memberEngagementService';

// Mock ONLY the HTTP boundary. The real memberEngagementService runs so its
// response handling (including the 403 tier-gate path) is exercised, and the
// real UI primitives render.
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
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

describe('EngagementMetricsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Compact (dashboard) mode', () => {
    it('fetches the real overview and renders the key stats', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementMetricsPanel clubId="123" isCompact />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/club/123/overview');
      expect(screen.getByText('120')).toBeInTheDocument(); // total members
      expect(screen.getByText('40')).toBeInTheDocument(); // highly engaged
      expect(screen.getByText('25')).toBeInTheDocument(); // at risk
      expect(screen.getByText('3.4% vs. previous period')).toBeInTheDocument();
    });

    it('shows a critical-alert banner when there are critical alerts', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview({ criticalAlerts: 3 }) });

      render(<EngagementMetricsPanel clubId="123" isCompact />);

      await waitFor(() => {
        expect(screen.getByText('3 critical alerts need attention')).toBeInTheDocument();
      });
    });

    it('hides the critical-alert banner when there are none', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview({ criticalAlerts: 0 }) });

      render(<EngagementMetricsPanel clubId="123" isCompact />);

      await waitFor(() => {
        expect(screen.getByText('64.5%')).toBeInTheDocument();
      });

      expect(screen.queryByText(/critical alert/)).not.toBeInTheDocument();
    });
  });

  describe('Full mode', () => {
    it('renders overview cards and the real component breakdown', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementMetricsPanel clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
      });

      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Total Members')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Members')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();

      // Real component breakdown formatted from backend keys.
      expect(screen.getByText('Score Component Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Event Participation')).toBeInTheDocument();
      expect(screen.getByText('Feature Usage')).toBeInTheDocument();
    });

    it('does not render fabricated sections', async () => {
      mockGet.mockResolvedValueOnce({ data: buildOverview() });

      render(<EngagementMetricsPanel clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
      });

      // None of the old invented sections/data should appear.
      expect(screen.queryByText('Login Activity Summary')).not.toBeInTheDocument();
      expect(screen.queryByText('Communication Engagement')).not.toBeInTheDocument();
      expect(screen.queryByText('Feature Usage Breakdown')).not.toBeInTheDocument();
      expect(screen.queryByText('Overall Health Metrics')).not.toBeInTheDocument();
      expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('NPS Score')).not.toBeInTheDocument();
    });
  });

  describe('Tier-gated (403) state', () => {
    it('shows an honest upgrade message instead of fabricated metrics', async () => {
      mockGet.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Member engagement analytics requires Expand tier subscription' },
        },
      });

      render(<EngagementMetricsPanel clubId="123" isCompact />);

      await waitFor(() => {
        expect(screen.getByTestId('engagement-upgrade-required')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/requires Expand tier subscription/i)
      ).toBeInTheDocument();
      // No fabricated numbers leak through.
      expect(screen.queryByText('64.5%')).not.toBeInTheDocument();
    });
  });

  describe('Error / empty states', () => {
    it('renders an honest unavailable message on a server error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce({ response: { status: 500 } });

      render(<EngagementMetricsPanel clubId="123" />);

      await waitFor(() => {
        expect(
          screen.getByText('Engagement metrics are currently unavailable.')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('does not fetch when clubId is empty', async () => {
      render(<EngagementMetricsPanel clubId="" />);

      await waitFor(() => {
        expect(screen.getByText('Club ID is required')).toBeInTheDocument();
      });

      expect(mockGet).not.toHaveBeenCalled();
    });
  });
});
