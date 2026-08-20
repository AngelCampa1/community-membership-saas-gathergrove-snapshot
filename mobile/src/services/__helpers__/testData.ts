/**
 * Test Data Factories
 * Helper functions to create consistent test data
 */

import type { EventResponse } from '@/types';
import type {
  EventEngagementAnalytics,
  MemberEngagementInsights,
  EventPerformanceAnalysis,
  EventROIMetrics,
  BasicEventAnalytics,
} from '../analyticsService';
import type {
  EventAttendee,
  CheckInResult,
  WaitlistStatus,
  WaitlistResult,
  FeedbackForm,
  FeedbackFormField,
  FeedbackSubmission,
  FeedbackResult,
  EventSeries,
  EventSeriesEvent,
  BulkRegistrationResult,
} from '../eventService';

/**
 * Create mock event data
 */
export function createMockEvent(overrides?: Partial<EventResponse>): EventResponse {
  return {
    id: 1,
    clubId: 1,
    name: 'Test Event',
    eventDateTime: '2025-12-20T19:00:00Z',
    location: 'Test Venue',
    description: '<p>Test event description</p>',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    attendeeCount: 10,
    totalRsvpCount: 12,
    ...overrides,
  };
}

/**
 * Create mock event engagement analytics
 */
export function createMockEventEngagementAnalytics(
  overrides?: Partial<EventEngagementAnalytics>
): EventEngagementAnalytics {
  return {
    eventId: 1,
    clubId: 1,
    totalRsvps: 50,
    totalAttended: 42,
    attendanceRate: 0.84,
    engagementScore: 8.5,
    noShowRate: 0.16,
    averageFeedbackRating: 4.5,
    feedbackCount: 35,
    trends: [],
    topMembers: [],
    atRiskMembers: [],
    ...overrides,
  };
}

/**
 * Create mock member engagement insights
 */
export function createMockMemberEngagementInsights(
  overrides?: Partial<MemberEngagementInsights>
): MemberEngagementInsights {
  return {
    memberId: 1,
    clubId: 1,
    periodDays: 90,
    totalEventsInPeriod: 20,
    eventsRsvped: 18,
    eventsAttended: 15,
    rsvpRate: 0.9,
    attendanceRate: 0.83,
    averageEngagementScore: 8.2,
    noShowCount: 3,
    consecutiveNoShows: 0,
    lastEventDate: '2025-01-15',
    engagementTrend: 'stable',
    riskLevel: 'low',
    recommendations: ['Keep up the great engagement!'],
    ...overrides,
  };
}

/**
 * Create mock event performance analysis
 */
export function createMockEventPerformanceAnalytics(
  overrides?: Partial<EventPerformanceAnalysis>
): EventPerformanceAnalysis {
  return {
    eventId: 1,
    eventName: 'Test Event',
    eventDate: '2025-01-15T19:00:00Z',
    performanceScore: 8.7,
    attendanceAnalysis: {
      totalRsvps: 50,
      totalAttended: 45,
      attendanceRate: 0.9,
      noShowRate: 0.1,
    },
    engagementBreakdown: {
      socialMediaShares: 12,
      feedbackSubmissions: 38,
    },
    comparisonToAverage: {
      attendanceRateVsAverage: 0.15,
      engagementScoreVsAverage: 1.2,
    },
    improvementSuggestions: ['Consider sending reminder emails 24h before event'],
    ...overrides,
  };
}

/**
 * Create mock ROI metrics
 */
export function createMockROIMetrics(
  overrides?: Partial<EventROIMetrics>
): EventROIMetrics {
  return {
    clubId: 1,
    periodMonths: 6,
    totalEvents: 24,
    totalRevenue: 50000,
    totalCosts: 30000,
    netROI: 20000,
    roiPercentage: 66.67,
    averageRevenuePerEvent: 2083.33,
    averageCostPerEvent: 1250,
    averageAttendancePerEvent: 45,
    costPerAttendee: 27.78,
    revenuePerAttendee: 46.3,
    topPerformingEvents: [],
    ...overrides,
  };
}

/**
 * Create mock basic event analytics
 */
export function createMockBasicEventAnalytics(
  overrides?: Partial<BasicEventAnalytics>
): BasicEventAnalytics {
  return {
    eventId: 1,
    clubId: 1,
    attendance: {
      total: 45,
      rsvps: 50,
      checkIns: 45,
      attendanceRate: 0.9,
    },
    performanceScore: 8.5,
    comparisonToAverage: {
      attendanceRateVsAverage: 0.1,
      engagementScoreVsAverage: 0.5,
    },
    ...overrides,
  };
}

/**
 * Create mock event attendee
 */
export function createMockEventAttendee(
  overrides?: Partial<EventAttendee>
): EventAttendee {
  return {
    id: 1,
    memberId: 1,
    memberName: 'Test Member',
    email: 'member@example.com',
    checkedIn: false,
    checkInTime: undefined,
    registrationDate: '2025-01-01T00:00:00Z',
    guestCount: 0,
    ...overrides,
  };
}

/**
 * Create mock check-in result
 */
export function createMockCheckInResult(
  overrides?: Partial<CheckInResult>
): CheckInResult {
  return {
    success: true,
    checkInTime: new Date().toISOString(),
    message: 'Check-in successful',
    attendeeId: 1,
    ...overrides,
  };
}

/**
 * Create array of mock events
 */
export function createMockEvents(count: number): EventResponse[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      id: i + 1,
      name: `Test Event ${i + 1}`,
    })
  );
}

/**
 * Create array of mock attendees
 */
export function createMockAttendees(count: number): EventAttendee[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEventAttendee({
      id: i + 1,
      memberId: i + 1,
      memberName: `Member ${i + 1}`,
      email: `member${i + 1}@example.com`,
    })
  );
}

// ========== Waitlist Factories ==========

/**
 * Create mock waitlist status
 */
export function createMockWaitlistStatus(
  overrides?: Partial<WaitlistStatus>
): WaitlistStatus {
  return {
    isOnWaitlist: false,
    position: undefined,
    totalWaitlisted: 0,
    eventCapacity: 50,
    currentAttendees: 30,
    canJoinWaitlist: true,
    estimatedWaitTime: undefined,
    joinedAt: undefined,
    ...overrides,
  };
}

/**
 * Create mock waitlist result
 */
export function createMockWaitlistResult(
  overrides?: Partial<WaitlistResult>
): WaitlistResult {
  return {
    success: true,
    position: 1,
    message: 'Successfully joined waitlist',
    ...overrides,
  };
}

// ========== Feedback Factories ==========

/**
 * Create mock feedback form field
 */
export function createMockFeedbackFormField(
  overrides?: Partial<FeedbackFormField>
): FeedbackFormField {
  return {
    id: 'field-1',
    type: 'text',
    label: 'How was the event?',
    required: true,
    options: undefined,
    ...overrides,
  };
}

/**
 * Create mock feedback form
 */
export function createMockFeedbackForm(
  overrides?: Partial<FeedbackForm>
): FeedbackForm {
  return {
    id: 1,
    eventId: 1,
    title: 'Event Feedback',
    description: 'Please share your thoughts about the event',
    fields: [
      createMockFeedbackFormField(),
      createMockFeedbackFormField({
        id: 'field-2',
        type: 'rating',
        label: 'Rate this event',
      }),
    ],
    isActive: true,
    deadline: '2025-12-31T23:59:59Z',
    ...overrides,
  };
}

/**
 * Create mock feedback submission
 */
export function createMockFeedbackSubmission(
  overrides?: Partial<FeedbackSubmission>
): FeedbackSubmission {
  return {
    responses: {
      'field-1': 'Great event!',
      'field-2': 5,
    },
    rating: 5,
    comment: 'Excellent organization and content',
    anonymous: false,
    memberId: 1,
    ...overrides,
  };
}

/**
 * Create mock feedback result
 */
export function createMockFeedbackResult(
  overrides?: Partial<FeedbackResult>
): FeedbackResult {
  return {
    success: true,
    feedbackId: 1,
    message: 'Feedback submitted successfully',
    ...overrides,
  };
}

// ========== Event Series Factories ==========

/**
 * Create mock event series event
 */
export function createMockEventSeriesEvent(
  overrides?: Partial<EventSeriesEvent>
): EventSeriesEvent {
  return {
    id: 1,
    title: 'Weekly Meetup #1',
    name: 'Weekly Meetup #1',
    startDate: '2025-12-20T19:00:00Z',
    endDate: '2025-12-20T21:00:00Z',
    eventDateTime: '2025-12-20T19:00:00Z',
    location: 'Community Center',
    registrationStatus: 'open',
    attendeeCount: 15,
    maxAttendees: 50,
    isUpcoming: true,
    ...overrides,
  };
}

/**
 * Create mock event series
 */
export function createMockEventSeries(
  overrides?: Partial<EventSeries>
): EventSeries {
  return {
    id: 1,
    name: 'Weekly Book Club',
    description: 'Weekly book discussion meetings',
    recurrencePattern: 'weekly',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    location: 'Library Room A',
    maxAttendees: 50,
    events: [
      createMockEventSeriesEvent(),
      createMockEventSeriesEvent({ id: 2, title: 'Weekly Meetup #2', name: 'Weekly Meetup #2' }),
    ],
    totalEvents: 52,
    upcomingEvents: 2,
    ...overrides,
  };
}

/**
 * Create mock bulk registration result
 */
export function createMockBulkRegistrationResult(
  overrides?: Partial<BulkRegistrationResult>
): BulkRegistrationResult {
  return {
    success: true,
    registeredCount: 5,
    failedCount: 0,
    results: [
      { eventId: 1, success: true },
      { eventId: 2, success: true },
      { eventId: 3, success: true },
      { eventId: 4, success: true },
      { eventId: 5, success: true },
    ],
    ...overrides,
  };
}
