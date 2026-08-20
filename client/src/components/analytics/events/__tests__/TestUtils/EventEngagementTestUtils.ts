// Test utilities for Event Engagement Analytics
// Using Jest mocks instead of MSW for better compatibility

// Types for test data
export interface TestEvent {
  id: number;
  name: string;
  description: string;
  eventDateTime: string;
  location: string;
  maxCapacity: number;
  isFeatured: boolean;
  rsvpCount?: number;
  attendanceCount?: number;
  averageRating?: number;
}

export interface TestMember {
  id: number;
  fullName: string;
  email: string;
  joinDate: string;
  status: string;
}

export interface TestRsvp {
  id: number;
  eventId: number;
  memberId: number;
  rsvpStatus: 'Attending' | 'NotAttending' | 'Maybe';
  createdAt: string;
}

export interface TestAttendance {
  id: number;
  eventId: number;
  memberId: number;
  attendedAt: string;
}

export interface TestFeedback {
  id: number;
  eventId: number;
  memberId: number;
  rating: number;
  comments?: string;
  createdAt: string;
}

export interface TestAnalytics {
  totalEvents: number;
  totalRsvps: number;
  totalAttendance: number;
  averageRating: number;
  engagementTrend: 'improving' | 'declining' | 'stable';
  topEvents: TestEvent[];
  recentActivity: any[];
}

// Test data generators
export class EventEngagementTestDataGenerator {
  private static eventIdCounter = 1;
  private static memberIdCounter = 1;
  private static rsvpIdCounter = 1;
  private static attendanceIdCounter = 1;
  private static feedbackIdCounter = 1;

  static generateTestEvent(overrides: Partial<TestEvent> = {}): TestEvent {
    const id = this.eventIdCounter++;
    return {
      id,
      name: `Test Event ${id}`,
      description: `Description for test event ${id}`,
      eventDateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: `Test Location ${id}`,
      maxCapacity: 50 + Math.floor(Math.random() * 50),
      isFeatured: Math.random() > 0.7,
      rsvpCount: Math.floor(Math.random() * 40),
      attendanceCount: Math.floor(Math.random() * 30),
      averageRating: 3 + Math.random() * 2,
      ...overrides
    };
  }

  static generateTestMember(overrides: Partial<TestMember> = {}): TestMember {
    const id = this.memberIdCounter++;
    return {
      id,
      fullName: `Test Member ${id}`,
      email: `member${id}@test.com`,
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
      ...overrides
    };
  }

  static generateTestRsvp(eventId: number, memberId: number, overrides: Partial<TestRsvp> = {}): TestRsvp {
    const statuses: TestRsvp['rsvpStatus'][] = ['Attending', 'NotAttending', 'Maybe'];
    return {
      id: this.rsvpIdCounter++,
      eventId,
      memberId,
      rsvpStatus: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides
    };
  }

  static generateTestAttendance(eventId: number, memberId: number, overrides: Partial<TestAttendance> = {}): TestAttendance {
    return {
      id: this.attendanceIdCounter++,
      eventId,
      memberId,
      attendedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides
    };
  }

  static generateTestFeedback(eventId: number, memberId: number, overrides: Partial<TestFeedback> = {}): TestFeedback {
    const comments = [
      'Great event!',
      'Really enjoyed it.',
      'Could be better.',
      'Excellent organization.',
      'Good networking opportunity.',
      null
    ];

    return {
      id: this.feedbackIdCounter++,
      eventId,
      memberId,
      rating: Math.floor(Math.random() * 5) + 1,
      comments: comments[Math.floor(Math.random() * comments.length)] || undefined,
      createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides
    };
  }

  static generateCompleteEventData(eventCount: number = 5, memberCount: number = 20) {
    const events: TestEvent[] = [];
    const members: TestMember[] = [];
    const rsvps: TestRsvp[] = [];
    const attendances: TestAttendance[] = [];
    const feedbacks: TestFeedback[] = [];

    // Generate members
    for (let i = 0; i < memberCount; i++) {
      members.push(this.generateTestMember());
    }

    // Generate events with engagement data
    for (let i = 0; i < eventCount; i++) {
      const event = this.generateTestEvent();
      events.push(event);

      // Generate RSVPs for random subset of members
      const participatingMembers = members
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(memberCount * (0.4 + Math.random() * 0.4))); // 40-80% participation

      participatingMembers.forEach(member => {
        const rsvp = this.generateTestRsvp(event.id, member.id);
        rsvps.push(rsvp);

        // 70% of attending RSVPs actually attend
        if (rsvp.rsvpStatus === 'Attending' && Math.random() > 0.3) {
          const attendance = this.generateTestAttendance(event.id, member.id);
          attendances.push(attendance);

          // 50% of attendees provide feedback
          if (Math.random() > 0.5) {
            const feedback = this.generateTestFeedback(event.id, member.id);
            feedbacks.push(feedback);
          }
        }
      });

      // Update event counts
      event.rsvpCount = rsvps.filter(r => r.eventId === event.id).length;
      event.attendanceCount = attendances.filter(a => a.eventId === event.id).length;
      const eventFeedbacks = feedbacks.filter(f => f.eventId === event.id);
      event.averageRating = eventFeedbacks.length > 0 
        ? eventFeedbacks.reduce((sum, f) => sum + f.rating, 0) / eventFeedbacks.length
        : 0;
    }

    return { events, members, rsvps, attendances, feedbacks };
  }

  static generateAnalyticsData(events: TestEvent[], rsvps: TestRsvp[], attendances: TestAttendance[], feedbacks: TestFeedback[]): TestAnalytics {
    const totalEvents = events.length;
    const totalRsvps = rsvps.length;
    const totalAttendance = attendances.length;
    const averageRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;

    // Simple trend calculation based on recent vs older events
    const recentEvents = events.filter(e => new Date(e.eventDateTime) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const olderEvents = events.filter(e => new Date(e.eventDateTime) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    const recentAvgAttendance = recentEvents.length > 0 ? recentEvents.reduce((sum, e) => sum + (e.attendanceCount || 0), 0) / recentEvents.length : 0;
    const olderAvgAttendance = olderEvents.length > 0 ? olderEvents.reduce((sum, e) => sum + (e.attendanceCount || 0), 0) / olderEvents.length : 0;
    
    let engagementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvgAttendance > olderAvgAttendance * 1.1) {
      engagementTrend = 'improving';
    } else if (recentAvgAttendance < olderAvgAttendance * 0.9) {
      engagementTrend = 'declining';
    }

    const topEvents = events
      .sort((a, b) => (b.attendanceCount || 0) - (a.attendanceCount || 0))
      .slice(0, 5);

    const recentActivity = [
      ...rsvps.slice(-10).map(r => ({ type: 'rsvp', data: r, timestamp: r.createdAt })),
      ...attendances.slice(-10).map(a => ({ type: 'attendance', data: a, timestamp: a.attendedAt })),
      ...feedbacks.slice(-10).map(f => ({ type: 'feedback', data: f, timestamp: f.createdAt }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

    return {
      totalEvents,
      totalRsvps,
      totalAttendance,
      averageRating,
      engagementTrend,
      topEvents,
      recentActivity
    };
  }

  static resetCounters() {
    this.eventIdCounter = 1;
    this.memberIdCounter = 1;
    this.rsvpIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.feedbackIdCounter = 1;
  }
}

// Mock API setup using Jest mocks instead of MSW
export function createMockEngagementData(testData?: ReturnType<typeof EventEngagementTestDataGenerator.generateCompleteEventData>) {
  const data = testData || EventEngagementTestDataGenerator.generateCompleteEventData();
  const analytics = EventEngagementTestDataGenerator.generateAnalyticsData(
    data.events, 
    data.rsvps, 
    data.attendances, 
    data.feedbacks
  );

  return { data, analytics };
}

// Jest mock setup helper
export function setupMockApiResponses(mockData?: ReturnType<typeof createMockEngagementData>) {
  const { data, analytics } = mockData || createMockEngagementData();

  // Mock fetch implementation
  const mockFetch = global.fetch as jest.Mock;
  
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    
    // Parse URL to extract route and parameters
    const urlObj = new URL(url, 'http://localhost');
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Events endpoints
    if (pathname === '/api/v1/events' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: data.events })
      });
    }
    
    const eventIdMatch = pathname.match(/^\/api\/v1\/events\/(\d+)$/);
    if (eventIdMatch && method === 'GET') {
      const eventId = parseInt(eventIdMatch[1]);
      const event = data.events.find(e => e.id === eventId);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: event })
      });
    }
    
    // RSVPs endpoints
    const rsvpMatch = pathname.match(/^\/api\/v1\/events\/(\d+)\/rsvps$/);
    if (rsvpMatch) {
      const eventId = parseInt(rsvpMatch[1]);
      if (method === 'GET') {
        const eventRsvps = data.rsvps.filter(r => r.eventId === eventId);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: eventRsvps })
        });
      }
      if (method === 'POST') {
        const newRsvp = EventEngagementTestDataGenerator.generateTestRsvp(eventId, 1);
        data.rsvps.push(newRsvp);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: newRsvp })
        });
      }
    }
    
    // Attendance endpoints
    const attendanceMatch = pathname.match(/^\/api\/v1\/events\/(\d+)\/attendances$/);
    if (attendanceMatch) {
      const eventId = parseInt(attendanceMatch[1]);
      if (method === 'GET') {
        const eventAttendances = data.attendances.filter(a => a.eventId === eventId);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: eventAttendances })
        });
      }
      if (method === 'POST') {
        const newAttendance = EventEngagementTestDataGenerator.generateTestAttendance(eventId, 1);
        data.attendances.push(newAttendance);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: newAttendance })
        });
      }
    }
    
    // Feedback endpoints
    const feedbackMatch = pathname.match(/^\/api\/v1\/events\/(\d+)\/feedbacks$/);
    if (feedbackMatch) {
      const eventId = parseInt(feedbackMatch[1]);
      if (method === 'GET') {
        const eventFeedbacks = data.feedbacks.filter(f => f.eventId === eventId);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: eventFeedbacks })
        });
      }
      if (method === 'POST') {
        const newFeedback = EventEngagementTestDataGenerator.generateTestFeedback(eventId, 1);
        data.feedbacks.push(newFeedback);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: newFeedback })
        });
      }
    }
    
    // Analytics endpoints
    if (pathname === '/api/v1/analytics/events/engagement' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: analytics })
      });
    }
    
    if (pathname === '/api/v1/analytics/events/trends' && method === 'GET') {
      const trendData = {
        labels: Array.from({ length: 10 }, (_, i) => `Week ${i + 1}`),
        datasets: [{
          label: 'Event Attendance',
          data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 50) + 10)
        }]
      };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: trendData })
      });
    }
    
    // Members endpoint
    if (pathname === '/api/v1/members' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: data.members })
      });
    }
    
    // Real-time updates simulation
    const realtimeMatch = pathname.match(/^\/api\/v1\/events\/(\d+)\/real-time-update$/);
    if (realtimeMatch && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { message: 'Real-time update sent' } })
      });
    }
    
    // Default fallback
    return Promise.resolve({
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: 'Not found' })
    });
  });
  
  return { data, analytics };
}

// Test helpers
export const EventEngagementTestHelpers = {
  // Wait for real-time updates
  waitForRealTimeUpdate: (timeout: number = 3000): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  },

  // Simulate user interaction
  simulateUserInteraction: async (action: 'rsvp' | 'attend' | 'feedback', eventId: number) => {
    switch (action) {
      case 'rsvp':
        return fetch(`/api/v1/events/${eventId}/rsvps`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rsvpStatus: 'Attending' })
        });
      case 'attend':
        return fetch(`/api/v1/events/${eventId}/attendances`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      case 'feedback':
        return fetch(`/api/v1/events/${eventId}/feedbacks`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: 5, comments: 'Great event!' })
        });
    }
  },

  // Generate performance test data
  generatePerformanceTestData: (eventCount: number = 100, memberCount: number = 500) => {
    return EventEngagementTestDataGenerator.generateCompleteEventData(eventCount, memberCount);
  },

  // Validate test data structure
  validateTestData: (data: ReturnType<typeof EventEngagementTestDataGenerator.generateCompleteEventData>): boolean => {
    const { events, members, rsvps, attendances, feedbacks } = data;
    
    // Basic validation
    if (events.length === 0 || members.length === 0) return false;
    
    // Validate relationships
    const eventIds = events.map(e => e.id);
    const memberIds = members.map(m => m.id);
    
    const invalidRsvps = rsvps.some(r => !eventIds.includes(r.eventId) || !memberIds.includes(r.memberId));
    const invalidAttendances = attendances.some(a => !eventIds.includes(a.eventId) || !memberIds.includes(a.memberId));
    const invalidFeedbacks = feedbacks.some(f => !eventIds.includes(f.eventId) || !memberIds.includes(f.memberId));
    
    return !invalidRsvps && !invalidAttendances && !invalidFeedbacks;
  },

  // Create test scenarios
  createTestScenarios: () => ({
    highEngagement: EventEngagementTestDataGenerator.generateCompleteEventData(10, 50),
    lowEngagement: EventEngagementTestDataGenerator.generateCompleteEventData(3, 15),
    noEngagement: {
      events: [EventEngagementTestDataGenerator.generateTestEvent()],
      members: [EventEngagementTestDataGenerator.generateTestMember()],
      rsvps: [],
      attendances: [],
      feedbacks: []
    },
    largeDataset: EventEngagementTestDataGenerator.generateCompleteEventData(50, 200)
  })
};

// Custom test matchers
export const customMatchers = {
  toHaveValidEngagementData(data: any) {
    const isValid = EventEngagementTestHelpers.validateTestData(data);
    return {
      pass: isValid,
      message: () => isValid ? 'Expected invalid engagement data' : 'Expected valid engagement data'
    };
  }
};

// Legacy export for compatibility
export const mockEventEngagementResponse = createMockEngagementData;
export const createMockEngagementData_alias = createMockEngagementData;