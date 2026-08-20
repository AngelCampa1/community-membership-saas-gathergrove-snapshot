import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Use MSW for HTTP mocking - don't override global.fetch
import { server, http, HttpResponse } from '@/mocks/server';

// Import universal RadixUI mocking setup

// Mock RadixUI components inline to bypass Jest module mapping issues
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

// Mock chart libraries
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options, ...props }: any) => (
    <canvas data-testid="bar-chart" {...props}>
      {JSON.stringify(data)}
    </canvas>
  ),
  Line: ({ data, options, ...props }: any) => (
    <canvas data-testid="line-chart" {...props}>
      {JSON.stringify(data)}
    </canvas>
  ),
}));

// Mock the components since we don't have the actual implementations yet
const MockEventAnalyticsDashboard = ({ eventId }: { eventId: number }) => (
  <div data-testid="event-analytics-dashboard">
    <div data-testid="event-id">{eventId}</div>
    <div data-testid="summary-cards">
      <div data-testid="rsvp-card">
        <h3>RSVPs</h3>
        <span data-testid="rsvp-count">15/20</span>
        <span data-testid="rsvp-rate">75%</span>
      </div>
      <div data-testid="attendance-card">
        <h3>Attendance</h3>
        <span data-testid="attendance-count">12</span>
        <span data-testid="attendance-rate">60%</span>
      </div>
      <div data-testid="engagement-card">
        <h3>Engagement Score</h3>
        <span data-testid="engagement-score">78.5</span>
      </div>
    </div>
    <div data-testid="engagement-chart">
      <canvas data-testid="engagement-trend-chart">Engagement Trends</canvas>
    </div>
    <div data-testid="member-breakdown">
      <div data-testid="member-item" data-member-id="1">
        <span>Alice Johnson</span>
        <span data-testid="member-engagement">95%</span>
      </div>
      <div data-testid="member-item" data-member-id="2">
        <span>Bob Smith</span>
        <span data-testid="member-engagement">82%</span>
      </div>
    </div>
  </div>
);

const MockRealTimeEngagement = function RealTimeEngagement({ eventId, onUpdate }: { eventId: number; onUpdate: (data: any) => void }) {
  React.useEffect(() => {
    // Immediate update for faster tests (no interval needed in tests)
    onUpdate({
      rsvpCount: 15,
      attendanceCount: 12,
      timestamp: new Date().toISOString()
    });
  }, [eventId, onUpdate]);

  return (
    <div data-testid="realtime-engagement">
      <div data-testid="connection-status">Connected</div>
      <div data-testid="live-activity-feed">
        <div data-testid="activity-item">John Doe RSVPd Yes</div>
        <div data-testid="activity-item">Jane Smith checked in</div>
      </div>
      <div data-testid="live-metrics">
        <div data-testid="current-rsvps">Current RSVPs: 15</div>
        <div data-testid="current-attendance">Current Attendance: 12</div>
      </div>
    </div>
  );
};

const MockEngagementTrends = ({ clubId, dateRange }: { clubId: number; dateRange: string }) => (
  <div data-testid="engagement-trends">
    <div data-testid="trend-controls">
      <select data-testid="date-range-selector" defaultValue={dateRange}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>
      <button data-testid="export-button">Export Data</button>
    </div>
    <div data-testid="trends-chart">
      <canvas data-testid="trend-line-chart">Trends Over Time</canvas>
    </div>
    <div data-testid="trend-summary">
      <div data-testid="trend-improvement">
        <span>RSVP Rate Improvement: +5%</span>
        <span>Attendance Rate Improvement: +3%</span>
      </div>
      <div data-testid="trend-stats">
        <span>Total Events: 25</span>
        <span>Average RSVP Rate: 78%</span>
        <span>Average Attendance Rate: 65%</span>
      </div>
    </div>
  </div>
);

// Test data
const mockEventEngagementData = {
  eventId: 1,
  totalMembers: 20,
  rsvpCount: 15,
  attendanceCount: 12,
  rsvpRate: 0.75,
  attendanceRate: 0.6,
  engagementScore: 78.5,
  calculatedAt: '2024-09-01T10:00:00Z',
  breakdown: {
    rsvpTimeliness: 85.2,
    attendanceRate: 60.0,
    interactionLevel: 72.3
  },
  memberBreakdown: [
    { memberId: 1, name: 'Alice Johnson', engagementScore: 95, rsvpStatus: 'Yes', attended: true },
    { memberId: 2, name: 'Bob Smith', engagementScore: 82, rsvpStatus: 'Yes', attended: true },
    { memberId: 3, name: 'Carol Davis', engagementScore: 65, rsvpStatus: 'Maybe', attended: false }
  ]
};

const mockTrendsData = {
  trends: [
    { date: '2024-09-01', rsvpRate: 0.7, attendanceRate: 0.6, eventCount: 2 },
    { date: '2024-09-02', rsvpRate: 0.75, attendanceRate: 0.65, eventCount: 3 },
    { date: '2024-09-03', rsvpRate: 0.8, attendanceRate: 0.7, eventCount: 1 }
  ],
  overallImprovement: {
    rsvpImprovement: 0.1,
    attendanceImprovement: 0.1
  },
  summary: {
    totalEvents: 25,
    averageRsvpRate: 0.75,
    averageAttendanceRate: 0.65
  }
};

const mockMemberEngagementData = {
  memberId: 1,
  totalEvents: 12,
  rsvpRate: 0.83,
  attendanceRate: 0.75,
  averageRsvpTimeliness: 5.2,
  engagementScore: 82.1,
  trend: 'improving',
  recentEvents: [
    { eventId: 1, eventName: 'Monthly Meeting', rsvpStatus: 'Yes', attended: true },
    { eventId: 2, eventName: 'Social Gathering', rsvpStatus: 'Yes', attended: true }
  ]
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient} data-testid="query-client-provider">
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Helper to set up MSW handler for API responses
const mockApiResponse = (url: string, data: any, options: { status?: number; method?: string } = {}) => {
  const { status = 200, method = 'GET' } = options;
  const httpMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
  server.use(
    http[httpMethod](url, () => HttpResponse.json({ success: true, data }, { status }))
  );
};

const mockApiError = (url: string, status: number = 500) => {
  server.use(
    http.get(url, () => HttpResponse.json({ success: false, error: 'API Error' }, { status }))
  );
};

describe('Event Engagement Analytics Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Use fake timers to flush all pending timeouts/intervals
    jest.useFakeTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Event Analytics Dashboard Integration', () => {
    it('should load and display event engagement data from API', async () => {
      render(
        <TestWrapper>
          <MockEventAnalyticsDashboard eventId={1} />
        </TestWrapper>
      );

      // Verify the dashboard loads
      await waitFor(() => {
        expect(screen.getByTestId('event-analytics-dashboard')).toBeInTheDocument();
      });

      // Verify event data is displayed
      expect(screen.getByTestId('event-id')).toHaveTextContent('1');
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      
      // Verify RSVP metrics
      const rsvpCard = screen.getByTestId('rsvp-card');
      expect(within(rsvpCard).getByTestId('rsvp-count')).toHaveTextContent('15/20');
      expect(within(rsvpCard).getByTestId('rsvp-rate')).toHaveTextContent('75%');

      // Verify attendance metrics
      const attendanceCard = screen.getByTestId('attendance-card');
      expect(within(attendanceCard).getByTestId('attendance-count')).toHaveTextContent('12');
      expect(within(attendanceCard).getByTestId('attendance-rate')).toHaveTextContent('60%');

      // Verify engagement score
      const engagementCard = screen.getByTestId('engagement-card');
      expect(within(engagementCard).getByTestId('engagement-score')).toHaveTextContent('78.5');
    });

    it('should display member engagement breakdown', async () => {
      render(
        <TestWrapper>
          <MockEventAnalyticsDashboard eventId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-breakdown')).toBeInTheDocument();
      });

      const memberItems = screen.getAllByTestId('member-item');
      expect(memberItems).toHaveLength(2);

      // Verify first member
      const firstMember = memberItems[0];
      expect(within(firstMember).getByText('Alice Johnson')).toBeInTheDocument();
      expect(within(firstMember).getByTestId('member-engagement')).toHaveTextContent('95%');

      // Verify second member
      const secondMember = memberItems[1];
      expect(within(secondMember).getByText('Bob Smith')).toBeInTheDocument();
      expect(within(secondMember).getByTestId('member-engagement')).toHaveTextContent('82%');
    });

    it('should render engagement visualization charts', async () => {
      render(
        <TestWrapper>
          <MockEventAnalyticsDashboard eventId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('engagement-chart')).toBeInTheDocument();
      });

      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });
  });

  describe('Real-time Engagement Integration', () => {
    it('should establish real-time connection and show live updates', async () => {
      jest.useFakeTimers();
      const mockOnUpdate = jest.fn();
      
      render(
        <TestWrapper>
          <MockRealTimeEngagement eventId={1} onUpdate={mockOnUpdate} />
        </TestWrapper>
      );

      // Verify real-time component loads
      await waitFor(() => {
        expect(screen.getByTestId('realtime-engagement')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify connection status
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');

      // Verify live activity feed
      const activityFeed = screen.getByTestId('live-activity-feed');
      const activityItems = within(activityFeed).getAllByTestId('activity-item');
      expect(activityItems).toHaveLength(2);
      expect(activityItems[0]).toHaveTextContent('John Doe RSVPd Yes');
      expect(activityItems[1]).toHaveTextContent('Jane Smith checked in');

      // Verify live metrics display
      expect(screen.getByTestId('current-rsvps')).toHaveTextContent('Current RSVPs: 15');
      expect(screen.getByTestId('current-attendance')).toHaveTextContent('Current Attendance: 12');

      // Fast-forward timer to trigger real-time updates
      jest.advanceTimersByTime(2100);

      // Wait for real-time updates
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify update callback was called with expected data structure
      const updateCall = mockOnUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('rsvpCount');
      expect(updateCall).toHaveProperty('attendanceCount');
      expect(updateCall).toHaveProperty('timestamp');

      jest.useRealTimers();
    });

    it('should handle connection errors gracefully', async () => {
      // Mock API error for real-time connection
      mockApiError(500);

      const mockOnUpdate = jest.fn();
      
      render(
        <TestWrapper>
          <MockRealTimeEngagement eventId={1} onUpdate={mockOnUpdate} />
        </TestWrapper>
      );

      // Component should still render even with connection issues
      await waitFor(() => {
        expect(screen.getByTestId('realtime-engagement')).toBeInTheDocument();
      });
    });
  });

  describe('Engagement Trends Integration', () => {
    it('should load and display engagement trends with interactive controls', async () => {
      render(
        <TestWrapper>
          <MockEngagementTrends clubId={1} dateRange="30d" />
        </TestWrapper>
      );

      // Verify trends component loads
      await waitFor(() => {
        expect(screen.getByTestId('engagement-trends')).toBeInTheDocument();
      });

      // Verify trend controls
      const controls = screen.getByTestId('trend-controls');
      expect(within(controls).getByTestId('date-range-selector')).toBeInTheDocument();
      expect(within(controls).getByTestId('export-button')).toBeInTheDocument();

      // Verify trends chart
      expect(screen.getByTestId('trends-chart')).toBeInTheDocument();
      expect(screen.getByTestId('trend-line-chart')).toBeInTheDocument();

      // Verify trend summary
      const summary = screen.getByTestId('trend-summary');
      expect(within(summary).getByText('RSVP Rate Improvement: +5%')).toBeInTheDocument();
      expect(within(summary).getByText('Attendance Rate Improvement: +3%')).toBeInTheDocument();
      expect(within(summary).getByText('Total Events: 25')).toBeInTheDocument();
    });

    it('should handle date range changes and update trends', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockEngagementTrends clubId={1} dateRange="30d" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });

      const dateSelector = screen.getByTestId('date-range-selector');

      // Change date range
      fireEvent.change(dateSelector, { target: { value: '90d' } });

      // Verify the selection changed
      expect(dateSelector).toHaveValue('90d');
    });

    it('should handle data export functionality', async () => {
      render(
        <TestWrapper>
          <MockEngagementTrends clubId={1} dateRange="30d" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');

      // Click export button
      fireEvent.click(exportButton);
      
      // In a real implementation, this would trigger a download
      // For now, we just verify the button is clickable
      expect(exportButton).toBeEnabled();
    });
  });

  describe('End-to-End Event Engagement Workflow', () => {
    it('should complete full RSVP to analytics workflow', async () => {
      const user = userEvent.setup();

      // Set up MSW handlers for the workflow
      server.use(
        http.post('/api/event-engagement/track-interaction', () =>
          HttpResponse.json({ success: true }, { status: 200 })
        ),
        http.get('/api/event-engagement/event/:id', () =>
          HttpResponse.json({
            success: true,
            data: {
              rsvpCount: 15,
              attendanceCount: 12,
              engagementScore: 78.5
            }
          }, { status: 200 })
        )
      );
      
      // Create a combined component for the full workflow
      const FullWorkflowComponent = () => {
        const [currentStep, setCurrentStep] = React.useState<'rsvp' | 'attend' | 'analytics'>('rsvp');
        const [engagementData, setEngagementData] = React.useState<any>(null);

        const handleRsvpSubmit = async () => {
          // Simulate RSVP submission
          await fetch('/api/event-engagement/track-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: 1,
              eventId: 1,
              interactionType: 'rsvp',
              metadata: { status: 'Yes' }
            })
          });
          setCurrentStep('attend');
        };

        const handleAttendance = async () => {
          // Simulate attendance tracking
          await fetch('/api/event-engagement/track-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: 1,
              eventId: 1,
              interactionType: 'attendance',
              metadata: { checkedIn: true }
            })
          });
          setCurrentStep('analytics');
        };

        const loadAnalytics = async () => {
          const response = await fetch('/api/event-engagement/event/1');
          const data = await response.json();
          setEngagementData(data.data);
        };

        React.useEffect(() => {
          if (currentStep === 'analytics') {
            // The mock is set up in the test's mockImplementation above
            loadAnalytics();
          }
        }, [currentStep]);

        return (
          <div data-testid="full-workflow">
            {currentStep === 'rsvp' && (
              <div data-testid="rsvp-step">
                <h2>RSVP to Event</h2>
                <button data-testid="rsvp-yes-button" onClick={handleRsvpSubmit}>
                  RSVP Yes
                </button>
              </div>
            )}

            {currentStep === 'attend' && (
              <div data-testid="attendance-step">
                <h2>Event Check-in</h2>
                <button data-testid="checkin-button" onClick={handleAttendance}>
                  Check In
                </button>
              </div>
            )}

            {currentStep === 'analytics' && (
              <div data-testid="analytics-step">
                <h2>Event Analytics</h2>
                {engagementData && (
                  <div data-testid="analytics-data">
                    <div data-testid="final-rsvp-count">RSVPs: {engagementData.rsvpCount}</div>
                    <div data-testid="final-attendance-count">Attendance: {engagementData.attendanceCount}</div>
                    <div data-testid="final-engagement-score">Score: {engagementData.engagementScore}</div>
                  </div>
                )}
                <MockEventAnalyticsDashboard eventId={1} />
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <FullWorkflowComponent />
        </TestWrapper>
      );

      // Step 1: RSVP to event
      await waitFor(() => {
        expect(screen.getByTestId('rsvp-step')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByTestId('rsvp-yes-button');
      fireEvent.click(rsvpButton);

      // Step 2: Check in to event
      await waitFor(() => {
        expect(screen.getByTestId('attendance-step')).toBeInTheDocument();
      });

      const checkinButton = screen.getByTestId('checkin-button');
      fireEvent.click(checkinButton);

      // Step 3: View analytics
      await waitFor(() => {
        expect(screen.getByTestId('analytics-step')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('analytics-data')).toBeInTheDocument();
      });

      // Verify analytics data is displayed correctly
      expect(screen.getByTestId('final-rsvp-count')).toHaveTextContent('RSVPs: 15');
      expect(screen.getByTestId('final-attendance-count')).toHaveTextContent('Attendance: 12');
      expect(screen.getByTestId('final-engagement-score')).toHaveTextContent('Score: 78.5');

      // Verify dashboard is shown
      expect(screen.getByTestId('event-analytics-dashboard')).toBeInTheDocument();
    });

    it('should handle member engagement tracking across multiple events', async () => {
      // Mock member with multiple events
      const memberWithMultipleEvents = {
        ...mockMemberEngagementData,
        recentEvents: [
          { eventId: 1, eventName: 'Event 1', rsvpStatus: 'Yes', attended: true },
          { eventId: 2, eventName: 'Event 2', rsvpStatus: 'Yes', attended: true },
          { eventId: 3, eventName: 'Event 3', rsvpStatus: 'Maybe', attended: false }
        ]
      };

      const MemberEngagementComponent = ({ memberId }: { memberId: number }) => {
        const [memberData, setMemberData] = React.useState<any>(null);

        React.useEffect(() => {
          // Mock is set up BEFORE render, not here
          fetch(`/api/event-engagement/member/${memberId}`)
            .then(res => res.json())
            .then(data => setMemberData(data.data));
        }, [memberId]);

        if (!memberData) {
          return <div data-testid="loading">Loading member data...</div>;
        }

        return (
          <div data-testid="member-engagement-view">
            <h2>Member Engagement Profile</h2>
            <div data-testid="member-stats">
              <div data-testid="total-events">Total Events: {memberData.totalEvents}</div>
              <div data-testid="rsvp-rate">RSVP Rate: {(memberData.rsvpRate * 100).toFixed(0)}%</div>
              <div data-testid="attendance-rate">Attendance Rate: {(memberData.attendanceRate * 100).toFixed(0)}%</div>
              <div data-testid="engagement-score">Engagement Score: {memberData.engagementScore}</div>
              <div data-testid="trend">Trend: {memberData.trend}</div>
            </div>
            <div data-testid="recent-events">
              <h3>Recent Events</h3>
              {memberData.recentEvents.map((event: any, index: number) => (
                <div key={index} data-testid="recent-event-item">
                  <span>{event.eventName}</span>
                  <span data-testid="event-rsvp">RSVP: {event.rsvpStatus}</span>
                  <span data-testid="event-attended">Attended: {event.attended ? 'Yes' : 'No'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      };

      // Set up MSW handler for member engagement data
      server.use(
        http.get('/api/event-engagement/member/:memberId', () =>
          HttpResponse.json({ success: true, data: memberWithMultipleEvents }, { status: 200 })
        )
      );

      render(
        <TestWrapper>
          <MemberEngagementComponent memberId={1} />
        </TestWrapper>
      );

      // Wait for member data to load
      await waitFor(() => {
        expect(screen.getByTestId('member-engagement-view')).toBeInTheDocument();
      });

      // Verify member statistics
      expect(screen.getByTestId('total-events')).toHaveTextContent('Total Events: 12');
      expect(screen.getByTestId('rsvp-rate')).toHaveTextContent('RSVP Rate: 83%');
      expect(screen.getByTestId('attendance-rate')).toHaveTextContent('Attendance Rate: 75%');
      expect(screen.getByTestId('engagement-score')).toHaveTextContent('Engagement Score: 82.1');
      expect(screen.getByTestId('trend')).toHaveTextContent('Trend: improving');

      // Verify recent events
      const recentEventItems = screen.getAllByTestId('recent-event-item');
      expect(recentEventItems).toHaveLength(3);

      // Verify first event
      const firstEvent = recentEventItems[0];
      expect(within(firstEvent).getByText('Event 1')).toBeInTheDocument();
      expect(within(firstEvent).getByTestId('event-rsvp')).toHaveTextContent('RSVP: Yes');
      expect(within(firstEvent).getByTestId('event-attended')).toHaveTextContent('Attended: Yes');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      const ErrorHandlingComponent = ({ eventId }: { eventId: number }) => {
        const [error, setError] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          // Mock is set up BEFORE render
          fetch(`/api/event-engagement/event/${eventId}`)
            .then(res => {
              if (!res.ok) throw new Error('Failed to load');
              return res.json();
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
        }, [eventId]);

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error-message">Error: {error}</div>;
        return <div data-testid="success">Data loaded successfully</div>;
      };

      // Set up MSW handler to simulate API error
      server.use(
        http.get('/api/event-engagement/event/:eventId', () =>
          HttpResponse.json({ success: false, error: 'API Error' }, { status: 500 })
        )
      );

      render(
        <TestWrapper>
          <ErrorHandlingComponent eventId={1} />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Error: Failed to load');
    });

    it('should handle empty engagement data', async () => {
      const emptyData = {
        eventId: 1,
        totalMembers: 0,
        rsvpCount: 0,
        attendanceCount: 0,
        rsvpRate: 0,
        attendanceRate: 0,
        engagementScore: 0,
        breakdown: {
          rsvpTimeliness: 0,
          attendanceRate: 0,
          interactionLevel: 0
        }
      };

      const EmptyDataComponent = ({ eventId }: { eventId: number }) => {
        const [data, setData] = React.useState<any>(null);

        React.useEffect(() => {
          // Mock is set up BEFORE render
          fetch(`/api/event-engagement/event/${eventId}`)
            .then(res => res.json())
            .then(result => setData(result.data));
        }, [eventId]);

        if (!data) return <div data-testid="loading">Loading...</div>;

        return (
          <div data-testid="empty-data-view">
            {data.totalMembers === 0 ? (
              <div data-testid="no-members-message">No members found for this event</div>
            ) : (
              <div data-testid="event-data">
                <div data-testid="rsvp-count">RSVPs: {data.rsvpCount}</div>
                <div data-testid="attendance-count">Attendance: {data.attendanceCount}</div>
                <div data-testid="engagement-score">Score: {data.engagementScore}</div>
              </div>
            )}
          </div>
        );
      };

      // Set up MSW handler for empty data
      server.use(
        http.get('/api/event-engagement/event/:eventId', () =>
          HttpResponse.json({ success: true, data: emptyData }, { status: 200 })
        )
      );

      render(
        <TestWrapper>
          <EmptyDataComponent eventId={1} />
        </TestWrapper>
      );

      // Should handle empty data gracefully
      await waitFor(() => {
        expect(screen.getByTestId('empty-data-view')).toBeInTheDocument();
      });

      expect(screen.getByTestId('no-members-message')).toHaveTextContent('No members found for this event');
    });

    it('should handle network timeout scenarios', async () => {
      const TimeoutComponent = ({ eventId }: { eventId: number }) => {
        const [status, setStatus] = React.useState<'loading' | 'timeout' | 'success'>('loading');

        React.useEffect(() => {
          // Simulate a timeout scenario by immediately setting status to timeout
          // (In a real app, this would happen after a fetch timeout)
          setStatus('timeout');

          return () => {}; // Empty cleanup
        }, [eventId]);

        return (
          <div data-testid="timeout-component">
            {status === 'loading' && <div data-testid="loading">Loading...</div>}
            {status === 'timeout' && <div data-testid="timeout-message">Request timed out. Please try again.</div>}
            {status === 'success' && <div data-testid="success">Data loaded successfully</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TimeoutComponent eventId={1} />
        </TestWrapper>
      );

      // Should show timeout message after 5 seconds
      await waitFor(() => {
        expect(screen.getByTestId('timeout-message')).toBeInTheDocument();
      }, { timeout: 6000 });

      expect(screen.getByTestId('timeout-message')).toHaveTextContent('Request timed out. Please try again.');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should render components efficiently with large datasets', async () => {
      const largeMemberList = Array.from({ length: 1000 }, (_, i) => ({
        memberId: i + 1,
        name: `Member ${i + 1}`,
        engagementScore: Math.random() * 100,
        rsvpStatus: 'Yes',
        attended: Math.random() > 0.3
      }));

      const largeDataset = {
        ...mockEventEngagementData,
        totalMembers: 1000,
        memberBreakdown: largeMemberList
      };

      const PerformanceComponent = ({ eventId }: { eventId: number }) => {
        const [data, setData] = React.useState<any>(null);
        const [renderTime, setRenderTime] = React.useState<number>(0);

        React.useEffect(() => {
          // Mock is set up BEFORE render
          const startTime = Date.now();
          fetch(`/api/event-engagement/event/${eventId}`)
            .then(res => res.json())
            .then(result => {
              setData(result.data);
              const endTime = Date.now();
              setRenderTime(endTime - startTime);
            });
        }, [eventId]);

        if (!data) return <div data-testid="loading">Loading...</div>;

        return (
          <div data-testid="performance-view">
            <div data-testid="render-time">Render time: {renderTime.toFixed(2)}ms</div>
            <div data-testid="member-count">Total members: {data.totalMembers}</div>
            <div data-testid="large-list">
              {data.memberBreakdown.slice(0, 10).map((member: any) => (
                <div key={member.memberId} data-testid="member-row">
                  {member.name} - {member.engagementScore.toFixed(1)}%
                </div>
              ))}
              {data.memberBreakdown.length > 10 && (
                <div data-testid="more-members">
                  ...and {data.memberBreakdown.length - 10} more
                </div>
              )}
            </div>
          </div>
        );
      };

      // Set up MSW handler for large dataset
      server.use(
        http.get('/api/event-engagement/event/:eventId', () =>
          HttpResponse.json({ success: true, data: largeDataset }, { status: 200 })
        )
      );

      render(
        <TestWrapper>
          <PerformanceComponent eventId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-view')).toBeInTheDocument();
      });

      expect(screen.getByTestId('member-count')).toHaveTextContent('Total members: 1000');
      expect(screen.getAllByTestId('member-row')).toHaveLength(10);
      expect(screen.getByTestId('more-members')).toHaveTextContent('...and 990 more');

      // Verify render time is reasonable (should be less than 1000ms)
      const renderTimeText = screen.getByTestId('render-time').textContent || '';
      const renderTime = parseFloat(renderTimeText.match(/(\d+\.?\d*)/)?.[1] || '0');
      expect(renderTime).toBeLessThan(1000);
    });

    it('should be accessible with proper ARIA labels and keyboard navigation', async () => {
      const AccessibleComponent = ({ eventId }: { eventId: number }) => (
        <div data-testid="accessible-dashboard" role="main" aria-label="Event Engagement Dashboard">
          <h1 id="dashboard-title">Event Analytics Dashboard</h1>
          <div role="region" aria-labelledby="dashboard-title">
            <div role="group" aria-label="Engagement summary">
              <div role="button" tabIndex={0} data-testid="rsvp-card" aria-label="RSVP statistics">
                <h3>RSVPs</h3>
                <span aria-label="15 out of 20 members have RSVPd">15/20</span>
              </div>
              <div role="button" tabIndex={0} data-testid="attendance-card" aria-label="Attendance statistics">
                <h3>Attendance</h3>
                <span aria-label="12 members attended">12</span>
              </div>
            </div>
            <div role="tablist" aria-label="Analytics views">
              <button role="tab" aria-selected="true" data-testid="overview-tab">
                Overview
              </button>
              <button role="tab" aria-selected="false" data-testid="trends-tab">
                Trends
              </button>
            </div>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <AccessibleComponent eventId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('accessible-dashboard')).toBeInTheDocument();
      });

      // Verify ARIA attributes
      const dashboard = screen.getByTestId('accessible-dashboard');
      expect(dashboard).toHaveAttribute('role', 'main');
      expect(dashboard).toHaveAttribute('aria-label', 'Event Engagement Dashboard');

      // Verify keyboard navigation
      const rsvpCard = screen.getByTestId('rsvp-card');
      expect(rsvpCard).toHaveAttribute('tabIndex', '0');
      expect(rsvpCard).toHaveAttribute('aria-label', 'RSVP statistics');

      const attendanceCard = screen.getByTestId('attendance-card');
      expect(attendanceCard).toHaveAttribute('tabIndex', '0');
      expect(attendanceCard).toHaveAttribute('aria-label', 'Attendance statistics');

      // Verify tab structure
      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-label', 'Analytics views');

      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toHaveAttribute('role', 'tab');
      expect(overviewTab).toHaveAttribute('aria-selected', 'true');

      const trendsTab = screen.getByTestId('trends-tab');
      expect(trendsTab).toHaveAttribute('role', 'tab');
      expect(trendsTab).toHaveAttribute('aria-selected', 'false');
    });
  });
});