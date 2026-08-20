/**
 * Tests for RealTimeEventEngagementDemo.tsx - Real-time event engagement dashboard (smoke tests)
 * Note: This component has complex real-time SignalR integration and engagement metrics
 * Full real-time testing deferred due to SignalR complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import RealTimeEventEngagementDemo from '../RealTimeEventEngagementDemo';

// Mock hooks
jest.mock('@/hooks/useRealTimeEventEngagement', () => ({
  useRealTimeEventEngagement: () => ({
    isConnected: true,
    attendanceData: [],
    engagementScores: [],
    recentFeedback: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon">Users</div>,
  TrendingUp: () => <div data-testid="trendingup-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trendingdown-icon">TrendingDown</div>,
  MessageSquare: () => <div data-testid="messagesquare-icon">MessageSquare</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  WifiOff: () => <div data-testid="wifioff-icon">WifiOff</div>,
}));

describe('RealTimeEventEngagementDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('exports the RealTimeEventEngagementDemo component', () => {
      expect(RealTimeEventEngagementDemo).toBeDefined();
      expect(typeof RealTimeEventEngagementDemo).toBe('function');
    });

    it('has correct displayName', () => {
      expect(RealTimeEventEngagementDemo.displayName || RealTimeEventEngagementDemo.name).toBe('RealTimeEventEngagementDemo');
    });
  });
});
