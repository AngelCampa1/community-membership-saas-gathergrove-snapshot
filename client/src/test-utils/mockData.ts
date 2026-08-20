// Centralized mock data generators for consistent testing

export interface MockUser {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  clubId: number;
  clubName: string;
  clubTier: string;
  isOnboardingCompleted: boolean;
}

export interface MockEvent {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  attendeeCount: number;
  totalRsvpCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockEventAttendanceData {
  eventId: number;
  eventName: string;
  eventDate: string;
  expectedAttendance: number;
  actualAttendance: number;
  attendanceRate: number;
  category: string;
  eventType: string;
  duration: number;
  location: string;
}

export interface MockMemberEventEngagement {
  memberId: number;
  memberName: string;
  eventsAttended: number;
  totalEventsInvited: number;
  attendanceRate: number;
  averageRating: number;
  preferredEventTypes: string[];
  lastEventAttended: string;
  engagementTrend: string;
}

// User Mock Data
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  userId: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'Member',
  clubId: 1,
  clubName: 'Test Club',
  clubTier: 'Grow',
  isOnboardingCompleted: true,
  ...overrides,
});

export const createMockAdminUser = (): MockUser => 
  createMockUser({
    userId: 999,
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'Admin',
  });

// Event Mock Data
export const createMockEvent = (overrides: Partial<MockEvent> = {}): MockEvent => {
  const baseDate = new Date();
  const futureDate = new Date(baseDate.getTime() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000);
  
  return {
    id: Math.floor(Math.random() * 10000) + 1,
    clubId: 1,
    name: 'Test Event',
    eventDateTime: futureDate.toISOString(),
    location: 'Test Location',
    description: 'Test Description for the event',
    attendeeCount: Math.floor(Math.random() * 30) + 5,
    totalRsvpCount: Math.floor(Math.random() * 40) + 10,
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
    ...overrides,
  };
};

export const createMockEvents = (count: number): MockEvent[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockEvent({
      id: index + 1,
      name: `Test Event ${index + 1}`,
      eventDateTime: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    })
  );
};

// Event Analytics Mock Data
export const createMockEventAttendanceData = (overrides: Partial<MockEventAttendanceData> = {}): MockEventAttendanceData => {
  const expectedAttendance = Math.floor(Math.random() * 40) + 20;
  const actualAttendance = Math.floor(expectedAttendance * (0.6 + Math.random() * 0.4));
  const attendanceRate = Math.round((actualAttendance / expectedAttendance) * 100 * 10) / 10;
  
  return {
    eventId: Math.floor(Math.random() * 10000) + 1,
    eventName: 'Sample Event',
    eventDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    expectedAttendance,
    actualAttendance,
    attendanceRate,
    category: ['Meeting', 'Workshop', 'Social', 'Training'][Math.floor(Math.random() * 4)],
    eventType: ['meeting', 'workshop', 'social', 'training'][Math.floor(Math.random() * 4)],
    duration: [60, 90, 120, 150, 180][Math.floor(Math.random() * 5)],
    location: 'Test Location',
    ...overrides,
  };
};

export const createMockEventAttendanceDataList = (count: number): MockEventAttendanceData[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockEventAttendanceData({
      eventId: index + 1,
      eventName: `Event ${index + 1}`,
      location: `Location ${index + 1}`,
    })
  );
};

// Member Engagement Mock Data
export const createMockMemberEventEngagement = (overrides: Partial<MockMemberEventEngagement> = {}): MockMemberEventEngagement => {
  const eventsInvited = Math.floor(Math.random() * 15) + 5;
  const eventsAttended = Math.floor(eventsInvited * (0.4 + Math.random() * 0.5));
  const attendanceRate = Math.round((eventsAttended / eventsInvited) * 100 * 10) / 10;
  
  return {
    memberId: Math.floor(Math.random() * 1000) + 1,
    memberName: 'Test Member',
    eventsAttended,
    totalEventsInvited: eventsInvited,
    attendanceRate,
    averageRating: Math.round((3 + Math.random() * 2) * 10) / 10,
    preferredEventTypes: ['meeting', 'workshop'],
    lastEventAttended: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
    engagementTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)],
    ...overrides,
  };
};

export const createMockMemberEventEngagementList = (count: number): MockMemberEventEngagement[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockMemberEventEngagement({
      memberId: index + 1,
      memberName: `Member ${index + 1}`,
    })
  );
};

// Feedback Mock Data
export const createMockEventFeedbackData = (eventId: number) => ({
  eventId,
  eventName: `Event ${eventId}`,
  eventDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  totalResponses: Math.floor(Math.random() * 20) + 10,
  overallRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
  ratings: {
    organization: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    content: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    venue: Math.round((3.0 + Math.random() * 2.0) * 10) / 10,
    timing: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    value: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
  },
  feedback: {
    positive: ['Great event', 'Well organized', 'Informative'],
    negative: ['Could be better', 'Too long'],
    suggestions: ['More time for Q&A', 'Better venue'],
  },
  npsScore: Math.round((6 + Math.random() * 4) * 10) / 10,
  responseRate: Math.round((60 + Math.random() * 30) * 10) / 10,
});

// Engagement Analytics Mock Data
export const createMockEngagementAnalytics = () => ({
  clubSummary: {
    averageEngagementScore: Math.round((70 + Math.random() * 20) * 10) / 10,
    totalMembers: Math.floor(Math.random() * 200) + 50,
    highlyActiveMembers: Math.floor(Math.random() * 50) + 20,
    moderateMembers: Math.floor(Math.random() * 80) + 30,
    inactiveMembers: Math.floor(Math.random() * 30) + 5,
    newMembers: Math.floor(Math.random() * 20) + 5,
    retentionRate: Math.round((75 + Math.random() * 20) * 10) / 10,
  },
  distribution: {
    highlyActive: Math.floor(Math.random() * 30) + 30,
    active: Math.floor(Math.random() * 20) + 25,
    moderate: Math.floor(Math.random() * 15) + 15,
    lowEngagement: Math.floor(Math.random() * 10) + 5,
    inactive: Math.floor(Math.random() * 8) + 2,
  },
  memberAnalytics: [
    {
      memberId: 'member-123',
      memberName: 'John Doe',
      email: 'john.doe@example.com',
      engagementScore: Math.round((60 + Math.random() * 30) * 10) / 10,
      activityLevel: 'moderate',
    },
  ],
});

// At Risk Members Mock Data
export const createMockAtRiskMembers = () => [
  {
    memberId: 1,
    memberName: 'At Risk Member',
    lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: Math.floor(Math.random() * 30) + 20,
    daysSinceLastLogin: Math.floor(Math.random() * 20) + 10,
    scoreBreakdown: {
      loginScore: Math.floor(Math.random() * 30) + 15,
      eventScore: Math.floor(Math.random() * 40) + 10,
      communicationScore: Math.floor(Math.random() * 50) + 25,
    },
  },
  {
    memberId: 2,
    memberName: 'Another At Risk Member',
    lastActivity: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: Math.floor(Math.random() * 25) + 15,
    daysSinceLastLogin: Math.floor(Math.random() * 25) + 15,
    scoreBreakdown: {
      loginScore: Math.floor(Math.random() * 25) + 10,
      eventScore: Math.floor(Math.random() * 20) + 5,
      communicationScore: Math.floor(Math.random() * 45) + 20,
    },
  },
];

// Trend Data Mock
export const createMockTrendData = () => [
  {
    month: '2023-10',
    eventsHeld: Math.floor(Math.random() * 5) + 3,
    totalAttendance: Math.floor(Math.random() * 50) + 60,
    averageRating: Math.round((3.8 + Math.random() * 0.6) * 10) / 10,
    memberEngagement: Math.floor(Math.random() * 15) + 70,
    revenueGenerated: Math.floor(Math.random() * 500) + 800,
  },
  {
    month: '2023-11',
    eventsHeld: Math.floor(Math.random() * 5) + 4,
    totalAttendance: Math.floor(Math.random() * 50) + 80,
    averageRating: Math.round((4.0 + Math.random() * 0.5) * 10) / 10,
    memberEngagement: Math.floor(Math.random() * 15) + 75,
    revenueGenerated: Math.floor(Math.random() * 600) + 1000,
  },
  {
    month: '2023-12',
    eventsHeld: Math.floor(Math.random() * 4) + 2,
    totalAttendance: Math.floor(Math.random() * 40) + 50,
    averageRating: Math.round((3.7 + Math.random() * 0.7) * 10) / 10,
    memberEngagement: Math.floor(Math.random() * 15) + 70,
    revenueGenerated: Math.floor(Math.random() * 400) + 700,
  },
  {
    month: '2024-01',
    eventsHeld: Math.floor(Math.random() * 6) + 5,
    totalAttendance: Math.floor(Math.random() * 60) + 100,
    averageRating: Math.round((4.1 + Math.random() * 0.4) * 10) / 10,
    memberEngagement: Math.floor(Math.random() * 15) + 80,
    revenueGenerated: Math.floor(Math.random() * 700) + 1300,
  },
];

// Service Mock Helpers
export const createMockServiceResponse = <T>(data: T, delay: number = 100): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const createMockServiceError = (message: string, delay: number = 100): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Additional mock data creators for member segmentation
export const createMockSegmentCriteriaTemplates = () => [
  {
    id: 'template-1',
    name: 'Active Members',
    type: 'behavior',
    description: 'Members with high activity levels',
    fields: ['lastLoginDate', 'eventAttendance'],
    defaultConfig: { minActivity: 5 },
    icon: 'users'
  },
  {
    id: 'template-2',
    name: 'New Members',
    type: 'filter',
    description: 'Recently joined members',
    fields: ['joinDate'],
    defaultConfig: { daysAgo: 30 },
    icon: 'user-plus'
  }
];

export const createMockSegmentPreview = () => ({
  count: 42,
  members: [
    {
      id: 'preview-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      membershipType: 'Premium',
      status: 'active' as const,
      joinDate: '2023-01-15',
      lastLoginDate: '2024-01-15',
      tags: ['active'],
      customFields: {},
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ],
  criteria: [],
  estimatedRefreshTime: '2024-01-15T12:00:00Z'
});

export const createMockValidationResult = () => ({
  isValid: true,
  errors: {},
  warnings: {}
});

export const createMockSegmentInsights = () => ({
  id: 'insight-1',
  segmentId: 'segment-1',
  memberCount: 125,
  growth: { current: 125, previous: 120, percentage: 4.2 },
  engagement: { score: 78.5, trend: 'up' as const },
  demographics: {
    ageDistribution: [{ range: '25-34', count: 45, percentage: 36 }],
    genderDistribution: [{ gender: 'Male', count: 60, percentage: 48 }],
    locationDistribution: [{ location: 'US', count: 100, percentage: 80 }],
    membershipTypeDistribution: [{ type: 'Premium', count: 75, percentage: 60 }]
  },
  behavior: {
    eventAttendance: 82.5,
    communicationEngagement: 65.3,
    featureUsage: { calendar: 45, directory: 78 },
    activityTrends: [{ date: '2024-01-01', activity: 65 }]
  },
  recommendations: [],
  lastUpdated: '2024-01-15T12:00:00Z'
});

export const createMockPresetSegments = () => [
  {
    id: 'preset-1',
    name: 'Recent Members',
    description: 'Members who joined recently',
    criteria: [],
    isActive: true,
    memberCount: 23
  },
  {
    id: 'preset-2',
    name: 'Inactive Members',
    description: 'Members who have not logged in recently',
    criteria: [],
    isActive: true,
    memberCount: 45
  },
  {
    id: 'preset-3',
    name: 'VIP Members',
    description: 'High-value members with premium status',
    criteria: [],
    isActive: true,
    memberCount: 12
  }
];

// Default export with all generators
export const mockData = {
  user: createMockUser,
  adminUser: createMockAdminUser,
  event: createMockEvent,
  events: createMockEvents,
  eventAttendanceData: createMockEventAttendanceData,
  eventAttendanceDataList: createMockEventAttendanceDataList,
  memberEventEngagement: createMockMemberEventEngagement,
  memberEventEngagementList: createMockMemberEventEngagementList,
  eventFeedbackData: createMockEventFeedbackData,
  engagementAnalytics: createMockEngagementAnalytics,
  atRiskMembers: createMockAtRiskMembers,
  trendData: createMockTrendData,
  segmentCriteriaTemplates: createMockSegmentCriteriaTemplates,
  segmentPreview: createMockSegmentPreview,
  validationResult: createMockValidationResult,
  segmentInsights: createMockSegmentInsights,
  presetSegments: createMockPresetSegments,
  serviceResponse: createMockServiceResponse,
  serviceError: createMockServiceError,
};

export default mockData;