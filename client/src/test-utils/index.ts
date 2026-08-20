/**
 * Test utilities export
 */

export { TestWrapper, createTestQueryClient, mockUnlimitedUser, mockClubData } from './TestWrapper';

// Mock implementations for testing
export const mockAnalyticsData = {
  totalMembers: 150,
  activeMembers: 120,
  newMembers: 15,
  memberGrowth: 12.5,
  eventAttendance: 85,
  engagementRate: 78.5,
  revenue: 25000,
  expenses: 18000,
  roi: 38.9,
};

export const mockRealTimeData = {
  timestamp: new Date(),
  activeUsers: 23,
  liveEvents: 2,
  recentEngagement: 87,
  alerts: [],
};

export const mockChartData = [
  { date: '2024-01-01', value: 45, label: 'January' },
  { date: '2024-01-02', value: 52, label: 'February' },
  { date: '2024-01-03', value: 48, label: 'March' },
  { date: '2024-01-04', value: 61, label: 'April' },
];