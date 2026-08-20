import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventAnalyticsReports } from '../EventAnalyticsReports';
import { eventService } from '@/services/eventService';

// Mock dependencies
jest.mock('@/services/eventService');
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart3-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Download: () => <div data-testid="download-icon" />,
  RefreshCw: (props: any) => <div data-testid="refresh-icon" {...props} />,
  Target: () => <div data-testid="target-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  // Icons used by shadcn Select component
  ChevronDownIcon: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
  ChevronUpIcon: (props: any) => <svg data-testid="chevron-up-icon" {...props} />,
  CheckIcon: (props: any) => <svg data-testid="check-icon" {...props} />,
}));

const mockEventService = eventService as jest.Mocked<typeof eventService>;

const mockMetrics = {
  totalEvents: 15,
  totalAttendees: 380,
  avgAttendanceRate: 84.4,
  totalRevenue: 5000,
  avgRating: 4.5,
  totalFeedback: 120,
  repeatAttendeeRate: 65.2,
  noShowRate: 15.6,
  registrationConversionRate: 72.5,
  waitlistConversionRate: 45.0,
};

const mockAnalytics = [
  {
    eventId: 1,
    eventName: 'React Workshop',
    eventDate: '2024-02-01T14:00:00Z',
    registrations: 50,
    attendees: 48,
    noShows: 2,
    attendanceRate: 96,
    revenue: 2400,
    avgRating: 4.8,
    feedbackCount: 45,
    npsScore: 85,
    checkInTimes: [],
    demographicBreakdown: {
      ageGroups: {},
      memberTypes: {},
      locations: {},
    },
    engagementMetrics: {
      avgSessionDuration: 120,
      interactionRate: 85,
      shareCount: 25,
      questionCount: 40,
    },
  },
  {
    eventId: 2,
    eventName: 'Team Building Event',
    eventDate: '2024-02-08T16:00:00Z',
    registrations: 35,
    attendees: 32,
    noShows: 3,
    attendanceRate: 91.4,
    revenue: 1600,
    avgRating: 4.2,
    feedbackCount: 30,
    npsScore: 75,
    checkInTimes: [],
    demographicBreakdown: {
      ageGroups: {},
      memberTypes: {},
      locations: {},
    },
    engagementMetrics: {
      avgSessionDuration: 90,
      interactionRate: 75,
      shareCount: 15,
      questionCount: 20,
    },
  },
];

const mockComparative = {
  currentPeriod: mockMetrics,
  previousPeriod: {
    ...mockMetrics,
    totalEvents: 12,
    avgAttendanceRate: 78.2,
  },
  growthRates: {
    totalEvents: 25.0,
    avgAttendanceRate: 8.0,
  },
  trends: [
    {
      metric: 'totalEvents',
      trend: 'up' as const,
      change: 25.0,
      significance: 'high' as const,
    },
    {
      metric: 'avgAttendanceRate',
      trend: 'up' as const,
      change: 8.0,
      significance: 'medium' as const,
    },
  ],
};

const mockInsights = {
  recommendedCapacity: 50,
  expectedAttendance: 45,
  confidence: 85,
  optimalTiming: {
    dayOfWeek: 'Wednesday',
    timeOfDay: '2:00 PM',
    reasoning: 'Based on historical attendance patterns',
  },
  pricingRecommendation: {
    suggestedPrice: 50,
    priceElasticity: 1.2,
    demandForecast: 'High demand expected',
  },
  riskFactors: [
    {
      factor: 'Weather conditions',
      impact: 'medium' as const,
      mitigation: 'Have indoor backup option',
    },
  ],
};

const mockBenchmarks = [
  {
    metric: 'avgAttendanceRate',
    currentValue: 84.4,
    industryAverage: 75.0,
    topPerformers: 92.0,
    clubAverage: 80.0,
    percentile: 75,
    status: 'good' as const,
  },
];

describe('EventAnalyticsReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    mockEventService.getEventMetrics = jest.fn().mockResolvedValue(mockMetrics);
    mockEventService.getEventAnalytics = jest.fn().mockResolvedValue(mockAnalytics);
    mockEventService.getComparativeAnalysis = jest.fn().mockResolvedValue(mockComparative);
    mockEventService.getPredictiveInsights = jest.fn().mockResolvedValue(mockInsights);
    mockEventService.getPerformanceBenchmarks = jest.fn().mockResolvedValue(mockBenchmarks);
  });

  test('renders analytics dashboard with loading state', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    // Should show loading initially
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Event Analytics Reports')).toBeInTheDocument();
    });
  });

  test('loads and displays key metrics', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Event Analytics Reports')).toBeInTheDocument();
    });

    expect(mockEventService.getEventMetrics).toHaveBeenCalledWith(1, {
      timeRange: '30d',
      eventId: undefined,
    });
    expect(mockEventService.getEventAnalytics).toHaveBeenCalled();
    expect(mockEventService.getComparativeAnalysis).toHaveBeenCalled();
    expect(mockEventService.getPredictiveInsights).toHaveBeenCalled();
    expect(mockEventService.getPerformanceBenchmarks).toHaveBeenCalled();
  });

  test('displays tabs for different views', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Benchmarks')).toBeInTheDocument();
  });

  test('displays top performing events', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Top Performing Events')).toBeInTheDocument();
    });

    // There might be multiple instances due to the table
    const reactWorkshopElements = screen.getAllByText('React Workshop');
    expect(reactWorkshopElements.length).toBeGreaterThan(0);

    const teamBuildingElements = screen.getAllByText('Team Building Event');
    expect(teamBuildingElements.length).toBeGreaterThan(0);
  });

  test('handles error states gracefully', async () => {
    mockEventService.getEventMetrics = jest.fn().mockRejectedValue(new Error('Load failed'));
    mockEventService.getEventAnalytics = jest.fn().mockRejectedValue(new Error('Load failed'));
    mockEventService.getComparativeAnalysis = jest.fn().mockRejectedValue(new Error('Load failed'));
    mockEventService.getPredictiveInsights = jest.fn().mockRejectedValue(new Error('Load failed'));
    mockEventService.getPerformanceBenchmarks = jest.fn().mockRejectedValue(new Error('Load failed'));

    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
    });
  });

  test('shows export button', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('export-report')).toBeInTheDocument();
    });
  });

  test('displays time range selector', async () => {
    render(<EventAnalyticsReports clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Event Analytics Reports')).toBeInTheDocument();
    });

    // Time range selector should be present - Select triggers have role="combobox"
    const selectTriggers = screen.getAllByRole('combobox');
    expect(selectTriggers.length).toBeGreaterThan(0);
  });
});
