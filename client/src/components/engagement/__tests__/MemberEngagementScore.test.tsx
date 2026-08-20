import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberEngagementScore from '../MemberEngagementScore';
import apiClient from '@/services/apiClient';
import type { MemberEngagementScoreResponse } from '@/services/memberEngagementService';

// Mock ONLY the HTTP boundary. The real memberEngagementService runs so its
// response-mapping is exercised, and the real UI primitives render.
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

const buildScore = (
  overrides: Partial<MemberEngagementScoreResponse> = {}
): MemberEngagementScoreResponse => ({
  memberId: 123,
  memberName: 'Jane Smith',
  memberEmail: 'jane@example.com',
  overallScore: 72.8,
  communicationScore: 68,
  eventParticipationScore: 85,
  featureUsageScore: 55,
  activityFrequencyScore: 92,
  engagementLevel: 'Yellow',
  engagementColor: '#eab308',
  messagesCount: 12,
  eventsAttended: 4,
  uniqueFeatures: 6,
  activeDays: 18,
  lastActivity: '2024-10-28T00:00:00Z',
  calculatedAt: '2024-11-01T00:00:00Z',
  trend: 'up',
  trendPercentage: 4.3,
  recentActivity: {
    totalSessions: 20,
    averageSessionDuration: 15,
    topFeatureCategory: 'Events',
    daysSinceLastLogin: 2,
    peakActivityDay: 'Monday',
    peakActivityHour: 19,
  },
  categoryScores: [
    { category: 'eventParticipation', score: 85, weight: 0.3, contribution: 25.5, trend: 'up' },
    { category: 'communication', score: 68, weight: 0.25, contribution: 17, trend: 'stable' },
  ],
  recommendations: ['Invite to an upcoming event', 'Share a feature usage guide'],
  isAtRisk: false,
  needsAttention: true,
  isHighlyEngaged: false,
  ...overrides,
});

describe('MemberEngagementScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inline (bulk) compact score', () => {
    it('renders a precomputed score without issuing a request', () => {
      render(<MemberEngagementScore memberId="123" score={45} isCompact />);

      expect(screen.getByText('45.0%')).toBeInTheDocument();
      expect(screen.getByText('Low Activity')).toBeInTheDocument();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('classifies a high precomputed score as highly active', () => {
      render(<MemberEngagementScore memberId="9" score={88} isCompact />);

      expect(screen.getByText('88.0%')).toBeInTheDocument();
      expect(screen.getByText('Highly Active')).toBeInTheDocument();
    });
  });

  describe('Fetched data', () => {
    it('fetches and renders the real engagement score', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/123');
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('72.8%')).toBeInTheDocument();
      // overallScore 72.8 -> "Active" badge
      expect(screen.getByText('Active')).toBeInTheDocument();
      // trend up with 4.3% change
      expect(screen.getByText('4.3%')).toBeInTheDocument();
    });

    it('renders the real category breakdown', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" showDetailed />);

      await waitFor(() => {
        expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      });

      expect(screen.getByText('Event Participation')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Contributes 25.5 points to overall score')).toBeInTheDocument();
      expect(screen.getByText('Contributes 17.0 points to overall score')).toBeInTheDocument();
    });

    it('renders real activity counts', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" showDetailed />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity (last 30 days)')).toBeInTheDocument();
      });

      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Events attended')).toBeInTheDocument();
      expect(screen.getByText('Active days')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('renders backend recommendations', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" showDetailed />);

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });

      expect(screen.getByText('Invite to an upcoming event')).toBeInTheDocument();
      expect(screen.getByText('Share a feature usage guide')).toBeInTheDocument();
    });

    it('hides detailed sections when showDetailed is false', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" showDetailed={false} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(screen.queryByText('Score Breakdown')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });

    it('does not render fabricated gamification sections', async () => {
      mockGet.mockResolvedValueOnce({ data: buildScore() });

      render(<MemberEngagementScore memberId="123" showDetailed />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(screen.queryByText('Engagement Achievements')).not.toBeInTheDocument();
      expect(screen.queryByText('Score History')).not.toBeInTheDocument();
      expect(screen.queryByText('Recent Activity Impact')).not.toBeInTheDocument();
    });

    it('shows a downward trend indicator', async () => {
      mockGet.mockResolvedValueOnce({
        data: buildScore({ trend: 'down', trendPercentage: -6.2, overallScore: 35 }),
      });

      render(<MemberEngagementScore memberId="123" />);

      await waitFor(() => {
        expect(screen.getByText('6.2%')).toBeInTheDocument();
      });

      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
  });

  describe('Empty / error states', () => {
    it('renders an em dash in compact mode when the member has no score (404)', async () => {
      mockGet.mockRejectedValueOnce({ response: { status: 404 } });

      render(<MemberEngagementScore memberId="123" isCompact />);

      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });

    it('renders an unavailable message in detailed mode when there is no score', async () => {
      mockGet.mockRejectedValueOnce({ response: { status: 404 } });

      render(<MemberEngagementScore memberId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Member engagement data not available')).toBeInTheDocument();
      });
    });

    it('does not fetch when memberId is null', () => {
      render(<MemberEngagementScore memberId={null} />);

      expect(mockGet).not.toHaveBeenCalled();
      expect(screen.getByText('Member engagement data not available')).toBeInTheDocument();
    });

    it('does not fetch when memberId is an empty string', () => {
      render(<MemberEngagementScore memberId="" />);

      expect(mockGet).not.toHaveBeenCalled();
      expect(screen.getByText('Member engagement data not available')).toBeInTheDocument();
    });

    it('handles a network error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce(new Error('network down'));

      render(<MemberEngagementScore memberId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Member engagement data not available')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
